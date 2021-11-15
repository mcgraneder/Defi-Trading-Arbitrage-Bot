// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import './utils/UniswapV2Library.sol';
import './interfaces/IUniswapV2Router02.sol';
import './interfaces/IUniswapV2Pair.sol';
import './interfaces/IUniswapV2Factory.sol';
import "./interfaces/IERC20.sol";
import "../node_modules//@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../contracts/utils/SafeMathCopy.sol";
import "./TradeOrder.sol";

//this is the flashsswap contract. I ended up writing another contract TradeOrder.sol which orders the reserves
//in such a way so that we are always borrowing from the lower reserve pool and selling to the higher reserve pool
//this saves us from having to tun the bot script twice where we check arb for TOKEN0/TOKEN1 and TOKEN1/TOKEN0 on
//both exchnages simultaneusly.
contract FlashSwap is TradeOrder {

    using SafeMath for uint256;

    address owner;

    //here we add the contract deploy and assign him to the owner only the owner can withdraw
    constructor(address _owner) {

        owner == _owner;
    }
    
    //struct for the srbitrage info such as the base token qoute token etc..
    struct ArbitrageInfo {

        address baseToken;
        address quoteToken;
        bool baseTokenSmaller;
        address lowerPool;
        address higherPool;
    }

    //this struct allows us to store data which we can query whenever uniswap
    //calls back the uniswapV2Call function. we can store the amountIn amountOut and ehich pool we botrrow from etc
    struct CallbackData {

        address debtPool;
        address targetPool;
        bool debtTokenSmaller;
        address borrowedToken;
        address debtToken;
        uint256 debtAmount;
        uint256 debtTokenOutAmount;
    }

    modifier onlyOwner() {

        require(msg.sender == owner, "only the FlashBot owner can withdraw funds");
        _;
    }

    function withdraw(uint256 amount) public {

        require(amount > 0, "cannot withdraw a 0 value");
        payable(msg.sender).transfer(amount);
    }


   
    function testFlashSwap(address pool0, address pool1, uint256 borrowAmount) external {

        //here we make and instance of the info struct
        ArbitrageInfo memory info;
        //we then call a function called isBaseTokenSmaller. this function will change the order of the trade
        //so that we are alwsys borrowing from the base token reserve
        (info.baseTokenSmaller, info.baseToken, info.quoteToken) = isbaseTokenSmaller(pool0, pool1);

        //here we make an instance of the reserve struct
        orderedReserves memory orderedReserves;
        (info.lowerPool, info.higherPool, orderedReserves) = getOrderedReserves(pool0, pool1, info.baseTokenSmaller);

        // permissionedPairAddress  = info.lowerPool;

        //check balance before the loan
        uint256 balanceBefore = IERC20(info.baseToken).balanceOf(address(this));

        {
            // uint256 borrowAmount = 10**18;
            //here we need to set ether amont1 = 0 or amount0 = 0 depending on which pool where gonna borrow from
            (uint256 amount0Out, uint256 amount1Out) = info.baseTokenSmaller ? (uint256(0), borrowAmount) : (borrowAmount, uint256(0));

            uint256 debtAmount = getAmountIn(borrowAmount, orderedReserves.a1, orderedReserves.b1);

            uint256 baseTokenOutAmount = getAmountOut(borrowAmount, orderedReserves.b2, orderedReserves.a2);
            require(baseTokenOutAmount> debtAmount, "Arbitrage failed, no profit");


            //here we assign the callback data so we can query it when uniswap calls the V2Call function
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

    }

    // called by pair contract
    //callback function from uniswap. largely the same only minor cistimisations made
    function uniswapV2Call( address sender, uint amount0, uint amount1, bytes calldata data ) external {
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
        function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) internal pure returns (uint256 amountIn) {
            require(amountOut > 0, 'UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT');
            require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
            uint256 numerator = reserveIn.mul(amountOut).mul(1000);
            uint256 denominator = reserveOut.sub(amountOut).mul(997);
            amountIn = (numerator / denominator).add(1);
        }

        // copy from UniswapV2Library
        // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
        function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) internal pure returns (uint256 amountOut) {
            require(amountIn > 0, 'UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
            require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
            uint256 amountInWithFee = amountIn.mul(997);
            uint256 numerator = amountInWithFee.mul(reserveOut);
            uint256 denominator = reserveIn.mul(1000).add(amountInWithFee);
            amountOut = numerator / denominator;
        }

}
