//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import './interfaces/IUniswapV2Pair.sol';
import './utils/Decimal.sol';
import "../node_modules//@openzeppelin/contracts/utils/math/SafeMath.sol";

contract TradeOrder {

    using Decimal for Decimal.D256;
    using SafeMath for uint256;

    struct orderedReserves {
        uint256 a1; // base asset
        uint256 b1;
        uint256 a2;
        uint256 b2;
    }

    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    address[] baseTokens = [WETH, 0xBB91175307DD50bdebCfE82F2f343BbEf607e659, 0x7aC0F08dd5CE5098ec8e0C98a0D2464E0602A32F];


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

    function addBaseToken(address token) public {

        require(token != address(0));
        baseTokens.push(token);
    }

    function deleteBaseToken(address token) public {

        baseTokens.pop();
    }

    function getBaseTokens() public returns(address[] memory) {

        return baseTokens;
    }

    function isbaseTokenSmaller(address pool0, address pool1) public view returns (bool baseSmaller, address baseToken, address quoteToken) {
        require(pool0 != pool1, 'Same pair address');
        (address pool0Token0, address pool0Token1) = (IUniswapV2Pair(pool0).token0(), IUniswapV2Pair(pool0).token1());
        (address pool1Token0, address pool1Token1) = (IUniswapV2Pair(pool1).token0(), IUniswapV2Pair(pool1).token1());
        require(pool0Token0 < pool0Token1 && pool1Token0 < pool1Token1, 'Non standard uniswap AMM pair');
        require(pool0Token0 == pool1Token0 && pool0Token1 == pool1Token1, 'Require same token pair');
        require(baseTokensContains(pool0Token0) || baseTokensContains(pool0Token1), 'No base token in pair');

        (baseSmaller, baseToken, quoteToken) = baseTokensContains(pool0Token0) ? (true, pool0Token0, pool0Token1) : (false, pool0Token1, pool0Token0);
    }

    /// We borrow base token by using flash swap from lower price pool and sell them to higher price pool
    function getOrderedReserves(address pool0, address pool1, bool baseTokenSmaller) public returns (address lowerPool, address higherPool, orderedReserves memory orderedReserve ) {
        (uint256 pool0Reserve0, uint256 pool0Reserve1, ) = IUniswapV2Pair(pool0).getReserves();
        (uint256 pool1Reserve0, uint256 pool1Reserve1, ) = IUniswapV2Pair(pool1).getReserves();

        // Calculate the price denominated in quote asset token
        (Decimal.D256 memory price0, Decimal.D256 memory price1) =
            baseTokenSmaller ? (Decimal.from(pool0Reserve0).div(pool0Reserve1), Decimal.from(pool1Reserve0).div(pool1Reserve1)) : (Decimal.from(pool0Reserve1).div(pool0Reserve0), Decimal.from(pool1Reserve1).div(pool1Reserve0));

        // get a1, b1, a2, b2 with following rule:
        // 1. (a1, b1) represents the pool with lower price, denominated in quote asset token
        // 2. (a1, a2) are the base tokens in two pools
        if (price0.lessThan(price1)) {
            (lowerPool, higherPool) = (pool0, pool1);
            (orderedReserve.a1, orderedReserve.b1, orderedReserve.a2, orderedReserve.b2) = baseTokenSmaller ? (pool0Reserve0, pool0Reserve1, pool1Reserve0, pool1Reserve1) : (pool0Reserve1, pool0Reserve0, pool1Reserve1, pool1Reserve0);
        } else {
            (lowerPool, higherPool) = (pool1, pool0);
            (orderedReserve.a1, orderedReserve.b1, orderedReserve.a2, orderedReserve.b2) = baseTokenSmaller ? (pool1Reserve0, pool1Reserve1, pool0Reserve0, pool0Reserve1) : (pool1Reserve1, pool1Reserve0, pool0Reserve1, pool0Reserve0);
        }
    }

}