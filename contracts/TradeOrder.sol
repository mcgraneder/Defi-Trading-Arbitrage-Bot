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

    //array of basetokens weth is added by standard and the other one is hard coded from my test script.
    //however we also have a function to let users add their own basetoken so it is dynamic
    address[] baseTokens = [WETH, 0xe96580FED107064e74A1C65530BBc8D9D9E8bECF];

    //function which determines if a given base token is a member of the above array
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

    function deleteBaseToken() public {

        baseTokens.pop();
    }

    function getBaseTokens() public returns(address[] memory) {

        return baseTokens;
    }

    //here we check is the base token of our pair smaller than the qoute token. Namely in pait TK0/TK1, is TK1 smaller? 
    //we nned to determine this in order to correctly sort the reservee below from lowerp to higherp
    function isbaseTokenSmaller(address pool0, address pool1) public view returns (bool baseSmaller, address baseToken, address quoteToken) {

        //standard checks,require pool1 and pool0 are not the same pairs
        require(pool0 != pool1, 'Same pair address');

        //then we fetch the toekn1 and token 0 addresses for both dex pools that we pass in
        (address pool0Token0, address pool0Token1) = (IUniswapV2Pair(pool0).token0(), IUniswapV2Pair(pool0).token1());
        (address pool1Token0, address pool1Token1) = (IUniswapV2Pair(pool1).token0(), IUniswapV2Pair(pool1).token1());

        //these are further checks if the token addresses are not ordered we no the pair is no a uniswap pair
        //also we need to require that the tokens in the pairs are the same on both dexes. lastly we need
        //to make sure that the base token already exists in our global base token array above
        require(pool0Token0 < pool0Token1 && pool1Token0 < pool1Token1, 'Non standard uniswap AMM pair');
        require(pool0Token0 == pool1Token0 && pool0Token1 == pool1Token1, 'Require same token pair');
        require(baseTokensContains(pool0Token0) || baseTokensContains(pool0Token1), 'No base token in pair');

        //if the basetokens contain the token0 from pool0 then we set the basetokensamller to try and order our pair like so
        //=> TK0 / TK1 -> BASETOKEN / QUOTETOKEN. In the case where the basetoke array does not containe pool0token0 then
        //we set the basetokensmaller to flase and the pair gets ordered as => TK1 / TK0 -> BASETOKEN/QUOTETOKEN, effictively
        //the pair is reversed
        (baseSmaller, baseToken, quoteToken) = baseTokensContains(pool0Token0) ? (true, pool0Token0, pool0Token1) : (false, pool0Token1, pool0Token0);
        

    }   
    /// We borrow base token by using flash swap from lower price pool and sell them to higher price pool
    function getOrderedReserves(address pool0, address pool1, bool baseTokenSmaller) public returns (address lowerPool, address higherPool, orderedReserves memory orderedReserve ) {

        //we first get the pool reserves on both dexes so we can order them
        (uint256 pool0Reserve0, uint256 pool0Reserve1, ) = IUniswapV2Pair(pool0).getReserves();
        (uint256 pool1Reserve0, uint256 pool1Reserve1, ) = IUniswapV2Pair(pool1).getReserves();

        // Calculate the price denominated in quote asset token
        //here if the basetoken is smaller, namely if we have TK0 / TK1, then we get the dex pair prices by reserve0 / reserve1 for TK0
        //on the furst pool and reserve0 / reserve1 on the second pool respectively. Howeevr if the basetoken is not smaller then we reverse this order
        //since the pair is also reversed,namely price = reserve1 / reserve0 (inverse)
        (Decimal.D256 memory price0, Decimal.D256 memory price1) =
            baseTokenSmaller ? (Decimal.from(pool0Reserve0).div(pool0Reserve1), Decimal.from(pool1Reserve0).div(pool1Reserve1)) : (Decimal.from(pool0Reserve1).div(pool0Reserve0), Decimal.from(pool1Reserve1).div(pool1Reserve0));

        
        // // get a1, b1, a2, b2 with following rule:
        // 1. (a1, b1) represents the pool with lower price, denominated in quote asset token
        // 2. (a1, a2) are the base tokens in two pools
        //In the case where
        if (price0.lessThan(price1)) {
            //if the pricefor token0 is less than token 1 meaning the pair is cheaper on exchange0
        //then we order the reserves in the following way. the lowerpirce pool then goes to pool0
        //and the higher pricepool is pool1. the reserves are orderd such that we have 
        //[[POOL0 RESERVE0, POOL0 RESERVE1 POOL1 RESERVE0, POOL1 RESERVE1]] when the pair is ordered as TK0/TK1
        //and [[POOL0 RESERVE1, POOL0 RESERVE0 POOL1 RESERVE1, POOL1 RESERVE0]] when the pair is ordered as TK0/TK1
            (lowerPool, higherPool) = (pool0, pool1);
            (orderedReserve.a1, orderedReserve.b1, orderedReserve.a2, orderedReserve.b2) = baseTokenSmaller ? (pool0Reserve0, pool0Reserve1, pool1Reserve0, pool1Reserve1) : (pool0Reserve1, pool0Reserve0, pool1Reserve1, pool1Reserve0);
           

        } else {

            //in the case where price1 is less that price zero then we know that pool1 is the cheaper pool. so we
            //set lower pool to pool one. we then order the reserves in th eopposite order to above so we have that
            //[[POOL1 RESERVE0, POOL1 RESERVE1, POOL0 RESERVE0, POOL0 RESERVE1]] when the pair is ordered as TK0/TK1
            //and [[POOL1 RESERVE1, POOL1 RESERVE0, POOL0 RESERVE1, POOL0 RESERVE0]] when the pair is ordered as TK1/TK0
            (lowerPool, higherPool) = (pool1, pool0);
            (orderedReserve.a1, orderedReserve.b1, orderedReserve.a2, orderedReserve.b2) = baseTokenSmaller ? (pool1Reserve0, pool1Reserve1, pool0Reserve0, pool0Reserve1) : (pool1Reserve1, pool1Reserve0, pool0Reserve1, pool0Reserve0);
        }

        //the effect of this is that we are always borrowing form the lower price pool no matter what the order of the pair is 
        //on what exchange. this is very effecive and saves us having to run the bot for say UNI/SUSHI and for SUSHI/UNI. by employing
        //this ordering method our both will just order sand always run with the most likely to be profitable option.
    }

}