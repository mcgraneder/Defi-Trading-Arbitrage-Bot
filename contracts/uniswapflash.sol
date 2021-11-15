// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import './utils/UniswapV2Library.sol';
import './interfaces/IUniswapV2Router02.sol';
import './interfaces/IUniswapV2Pair.sol';
import './interfaces/IUniswapV2Factory.sol';
import "./interfaces/IERC20.sol";
// import "./interfaces/Uniswap.sol";
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
// import 'hardhat/console.sol';
import "../node_modules//@openzeppelin/contracts/utils/math/SafeMath.sol";
import './utils/Decimal.sol';
import "../contracts/utils/SafeMathCopy.sol";

interface IUniswapV2Callee {
  function uniswapV2Call(
    address sender,
    uint amount0,
    uint amount1,
    bytes calldata data
  ) external;
}


// https://uniswap.org/docs/v2/smart-contracts



contract TestUniswapFlashSwap is IUniswapV2Callee {

    // address permissionedPairAddress  = address(1);
    using Decimal for Decimal.D256;
    using SafeMath for uint256;
    // using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct ArbitrageInfo {

        address baseToken;
        address quoteToken;
        bool baseTokenSmaller;
        address lowerPool;
        address higherPool;
    }

    struct CallbackData {

        address debtPool;
        address targetPool;
        bool debtTokenSmaller;
        address borrowedToken;
        address debtToken;
        uint256 debtAmount;
        uint256 debtTokenOutAmount;
    }

    struct OrderedReserves {
        uint256 a1; // base asset
        uint256 b1;
        uint256 a2;
        uint256 b2;
    }

    address[] baseTokens = [0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, 0x8A71fF29c3b1B38A4Df5aE4DF0948822c94AbfB2, 0xECdEEded52Ca09b1d5fb81070882ED3A8AD99138];

    // permissionedPairAddress = address(1);
  // Uniswap V2 router
  // 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
  address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
  // Uniswap V2 factory
  address private constant FACTORY = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;

  event Log(string message, uint val);

  function baseTokensContains(address token) public view returns (bool hasBeenFound) {
        
        bool hasbeenFound = false;
        for (uint i = 0; i < baseTokens.length; i++) {

            if(baseTokens[i] == token) {

                hasbeenFound = true;
                break;
            }
        }

        if (hasBeenFound) {

            return true;
        }

        return hasbeenFound;
    }

    function isbaseTokenSmaller(address pool0, address pool1)
        public
        view
        returns (
            bool baseSmaller,
            address baseToken,
            address quoteToken
        )
    {
        require(pool0 != pool1, 'Same pair address');
        (address pool0Token0, address pool0Token1) = (IUniswapV2Pair(pool0).token0(), IUniswapV2Pair(pool0).token1());
        (address pool1Token0, address pool1Token1) = (IUniswapV2Pair(pool1).token0(), IUniswapV2Pair(pool1).token1());
        require(pool0Token0 < pool0Token1 && pool1Token0 < pool1Token1, 'Non standard uniswap AMM pair');
        require(pool0Token0 == pool1Token0 && pool0Token1 == pool1Token1, 'Require same token pair');
        require(baseTokensContains(pool0Token0) || baseTokensContains(pool0Token1), 'No base token in pair');

        (baseSmaller, baseToken, quoteToken) = baseTokensContains(pool0Token0)
            ? (true, pool0Token0, pool0Token1)
            : (false, pool0Token1, pool0Token0);
    }

    /// We borrow base token by using flash swap from lower price pool and sell them to higher price pool
    function getOrderedReserves(
        address pool0,
        address pool1,
        bool baseTokenSmaller
    )
        public
        returns (
            address lowerPool,
            address higherPool,
            OrderedReserves memory orderedReserves
        )
    {
        (uint256 pool0Reserve0, uint256 pool0Reserve1, ) = IUniswapV2Pair(pool0).getReserves();
        (uint256 pool1Reserve0, uint256 pool1Reserve1, ) = IUniswapV2Pair(pool1).getReserves();

        // Calculate the price denominated in quote asset token
        (Decimal.D256 memory price0, Decimal.D256 memory price1) =
            baseTokenSmaller
                ? (Decimal.from(pool0Reserve0).div(pool0Reserve1), Decimal.from(pool1Reserve0).div(pool1Reserve1))
                : (Decimal.from(pool0Reserve1).div(pool0Reserve0), Decimal.from(pool1Reserve1).div(pool1Reserve0));

        // get a1, b1, a2, b2 with following rule:
        // 1. (a1, b1) represents the pool with lower price, denominated in quote asset token
        // 2. (a1, a2) are the base tokens in two pools
        if (price0.lessThan(price1)) {
            (lowerPool, higherPool) = (pool0, pool1);
            (orderedReserves.a1, orderedReserves.b1, orderedReserves.a2, orderedReserves.b2) = baseTokenSmaller
                ? (pool0Reserve0, pool0Reserve1, pool1Reserve0, pool1Reserve1)
                : (pool0Reserve1, pool0Reserve0, pool1Reserve1, pool1Reserve0);
        } else {
            (lowerPool, higherPool) = (pool1, pool0);
            (orderedReserves.a1, orderedReserves.b1, orderedReserves.a2, orderedReserves.b2) = baseTokenSmaller
                ? (pool1Reserve0, pool1Reserve1, pool0Reserve0, pool0Reserve1)
                : (pool1Reserve1, pool1Reserve0, pool0Reserve1, pool0Reserve0);
        }
        // console.log('Borrow from pool:', lowerPool);
        // console.log('Sell to pool:', higherPool);
    }

  function testFlashSwap(address pool0, address pool1, uint256 borrowAmount) external {
    ArbitrageInfo memory info;
    (info.baseTokenSmaller, info.baseToken, info.quoteToken) = isbaseTokenSmaller(pool0, pool1);

    OrderedReserves memory orderedReserves;
    (info.lowerPool, info.higherPool, orderedReserves) = getOrderedReserves(pool0, pool1, info.baseTokenSmaller);

    // permissionedPairAddress  = info.lowerPool;

    uint256 balanceBefore = IERC20(info.baseToken).balanceOf(address(this));

    {
        // uint256 borrowAmount = 10**18;
        (uint256 amount0Out, uint256 amount1Out) = info.baseTokenSmaller ? (uint256(0), borrowAmount) : (borrowAmount, uint256(0));

        uint256 debtAmount = getAmountIn(borrowAmount, orderedReserves.a1, orderedReserves.b1);

        uint256 baseTokenOutAmount = getAmountOut(borrowAmount, orderedReserves.b2, orderedReserves.a2);
        require(baseTokenOutAmount> debtAmount, "Arbitrage failed, no profit");


        CallbackData memory callbackData;
        callbackData.debtPool = info.lowerPool;
        callbackData.targetPool = info.higherPool;
        callbackData.debtTokenSmaller = info.baseTokenSmaller;
        callbackData.borrowedToken = info.quoteToken;
        callbackData.debtToken = info.baseToken;
        callbackData.debtAmount = debtAmount;
        callbackData.debtTokenOutAmount = baseTokenOutAmount;

        bytes memory data = abi.encode(callbackData);
        IUniswapV2Pair(info.lowerPool).swap(amount0Out, amount1Out, address(this), data);
    }

    uint256 balanceAfter = IERC20(info.baseToken).balanceOf(address(this));
    require(balanceAfter > balanceBefore, "Trade will loose you money reverting");

    // if (info.baseToken == WETH) {

    //     IWETH(info.baseToken).withdraw(balanceAfter);
    // }

    // permissionedPairAddress = address(1)
  }

  // called by pair contract
  function uniswapV2Call(
    address sender,
    uint amount0,
    uint amount1,
    bytes calldata data
  ) external override {
    // require(msg.sender == permissionedPairAddress, "Non permissioned address call");
    require(sender == address(this), "Not being sent from ths contract");

    uint256 borrowedAmount = amount0 > 0 ? amount0 : amount1;
    CallbackData memory info = abi.decode(data, (CallbackData));

    IERC20(info.borrowedToken).transfer(info.targetPool, borrowedAmount);

    (uint256 amount0Out, uint256 amount1Out) = info.debtTokenSmaller ? (info.debtTokenOutAmount, uint256(0)) : (uint256(0), info.debtTokenOutAmount);
    IUniswapV2Pair(info.targetPool).swap(amount0Out, amount1Out, address(this), new bytes(0));

    IERC20(info.debtToken).transfer(info.debtPool, info.debtAmount);
  }

    // copy from UniswapV2Library
    // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut
    ) internal pure returns (uint256 amountIn) {
        require(amountOut > 0, 'UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        uint256 numerator = reserveIn.mul(amountOut).mul(1000);
        uint256 denominator = reserveOut.sub(amountOut).mul(997);
        amountIn = (numerator / denominator).add(1);
    }

    // copy from UniswapV2Library
    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) internal pure returns (uint256 amountOut) {
        require(amountIn > 0, 'UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        uint256 amountInWithFee = amountIn.mul(997);
        uint256 numerator = amountInWithFee.mul(reserveOut);
        uint256 denominator = reserveIn.mul(1000).add(amountInWithFee);
        amountOut = numerator / denominator;
    }

}
