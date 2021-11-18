//THIS IS THE TEST SCRIPT TO TEST THE BOT WORKS IN AN ARBITRAGE OPORTUNITY. WE MAINLY NEED THIS
//TO TEST THE FLASHSWAP. SEE deployTestingContracts.js. IN THAT FILE WE CREATE TWO FAKE TOKENS 
//AND MINT 100000 OF EACH WE THEN CREATE PAIRS OF THE TOKENS ON UNISWAP AND SUSHISAP AND ADD
//LIQUIDITY SOUCH THAT THEIR IS A LARG PRICE DIFF BETWEEN UNI AND SUSHI. THAT WASY WE CAN USE
//THSE TOKENS HERE TO TEST THE CASE OF PROFITABLE ARB.  SINCE THIS IS A TEST SCRIPT IT IS NOT AS REFINED AS THE
//MAIN BOT AND MORE THINGS ARE HARDCODED FOR CLSARITY. THIS SCRIPT PRINTS MORE LOGS TO THE CONSOLE
//IN ORDER TO SEE EXCSTLY WHAT THE OUTPUT OF THE MAIN ACLULATIONS ARE. THIS IS NOT DONE IN THE MAIN
//BOT TO SAVE NEEDLEDSS RUNTIME

const express = require("express");
const Web3 = require("web3");
const axios = require('axios');
const path = require("path");
const app = express();
var web3;
require('colors');

//ABIS
const MP = require("../../build/contracts/TradeOrder.json")
const UniswapFactory = require("@uniswap/v2-core/build/IUniswapV2Factory");
const UniswapV2Pair = require("@uniswap/v2-core/build/IUniswapV2Pair");
const UniswapRouter = require("../../build/contracts/IUniswapV2Router02.json");
// const Utils = require("../build/contracts/Utils.json");
const IERC20 = require("../../build/contracts/IERC20.json");
const crowSwapFactory = require("../../build/contracts/CrowSwapFactory.json");
const crowSwapRouter = require("../../build/contracts/CrowDefiSwapPair.json");
const shibaswapFactory = require("../../build/contracts/ShibaSwapFactory.json");
const Registry = require("../registry");
const arb1 = require("../../build/contracts/FlashSwap.json");

//defining address parameters. 
const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
const WETH1 = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const SushiSwapFactoryAddress = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";
const SushiSwapRouterAddress = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
const UniswapFactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const UniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const token0Addr = "0x2882272d0B7F60B0faE2C96bEF3594112431f073" //Link
const token1Addr = "0xe61dB86500d9C404031Cc60eDFEAD33188a83695" //WETH1
var amountToTradeInEth = 1;
const validPeriod = 5;

//here we will initialise the needed smart contracts aswell as some vars
//PAIR CONTRACTSiswapPairContract, 0, sushiSwapPairContract, sakeswapPairContract, crowswapPairContract, shibaswapPairContract;Y CONTRACTS
var uniswapFactoryContract, sushiswapFactoryContract, sakeswapFactoryContract, crowswapFactoryContract, shibaswapFactoryContract;
//ROUTER CONTRACTS
var uniswapRouterContract, sushiswapRouterContract;
//TOKEN PAIRS ACROSS LISTED EXCHANGES
var uniswapPair0, uniswapPair1, sushiswapPair, sakeswapPair, crowswapPair, shibaswapPair;
//HELPER VARS
var userAccount;
var account;
        // this.uniswapFactoryContract = new web3.eth.Contract(UniswapFactory.abi, this.UniswapFactoryAddress);
var arbitrage;
const WHALE = "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE"
// console.log(registry.uniswapFactoryContract)
async function loadWeb3() {
   
    const provider = new Web3.providers.WebsocketProvider("http://127.0.0.1:8545")
    web3 = new Web3(provider);
   
    const accounts = await web3.eth.getAccounts()
    account = accounts[0]
    console.log(accounts)
    
    const netId = await web3.eth.net.getId()
    console.log("The network id is:" + netId);
    
    userAccount = "0xf60c2Ea62EDBfE808163751DD0d8693DCb30019c";
    const balance = await web3.eth.getBalance(userAccount);
    console.log("Your balance is: " + balance);
}
var flashBot
async function loadBlockchainData() {

    //sort tokens uniswap uses sorted tokens
    if (token0Addr > token1Addr) {

        aux = token0Addr;
        token0Addr = token1Addr;
        token1 = aux;
    }

    initialiseFactoryContracts();
    getExchangeTokenPairPrice();
}

function initialiseFactoryContracts() {

    uniswapFactoryContract = new web3.eth.Contract(UniswapFactory.abi, UniswapFactoryAddress);
    uniswapRouterContract = new web3.eth.Contract(UniswapRouter.abi, UniswapRouterAddress);
    sushiswapFactoryContract = new web3.eth.Contract(UniswapFactory.abi, SushiSwapFactoryAddress);
    sushiswapRouterContract = new web3.eth.Contract(UniswapRouter.abi, SushiSwapRouterAddress);
    max = new web3.eth.Contract(MP.abi, "0xE186Ee4fB53B9a6DF5c58a3FEC9Bffd1c30857A7")
    arbitrage = new web3.eth.Contract(arb1.abi, "0xa3643b4edA7Edb00c373FA2575a500A772836939")


    
    token0 = new web3.eth.Contract(IERC20.abi, token0Addr);
    token1 = new web3.eth.Contract(IERC20.abi, token1Addr);

}

async function getExchangeTokenPairPrice() {

    // uniswapPair0 = await uniswapFactoryContract.methods.getPair(DAI, WETH1).call();
    uniswapPair1 = await uniswapFactoryContract.methods.getPair(token0Addr, token1Addr ).call();
    // console.log(uniswapPair0, uniswapPair1)
    sushiswapPair = await sushiswapFactoryContract.methods.getPair(token0Addr, token1Addr).call();
    console.log(sushiswapPair)

    uniswapPairContract= new web3.eth.Contract(UniswapV2Pair.abi, uniswapPair1);
    sushiSwapPairContract = new web3.eth.Contract(UniswapV2Pair.abi, sushiswapPair);
}


loadWeb3();
initialiseFactoryContracts()
loadBlockchainData();


//we will look for profit every two blockss because (two transactions made)
async function FindArbitrageOpportunity(exchange0RouterAddress, exchange1RouterAddress) {

    let skip = true;
    console.log("hey")
    const newBlockEvent = web3.eth.subscribe("newBlockHeaders");
    newBlockEvent.on('connected', () =>{console.log('\nBot listening!\n')})

//look up for a profit whenever a new block is minned
    
    try {

        const p0 = await uniswapPairContract.methods.token0().call();
        const p1 = await uniswapPairContract.methods.token1().call();

        var pair0Reserve, pair1Reserve, sakeswapReserve, crowswapReserve, shibaswapReserve, crowswapReserve0, crowswapReserve1;
        var pair0Reserve1, upair0eserve1, sushiswapReserve0, sushiswapReserve1, sakeswapReserve0, sakeswapReserve1, shibaswapReserve0, shibaswapReserve1;

        //get the reserves for supported exchanges
        pair0Reserve = await uniswapPairContract.methods.getReserves().call();
        pair1Reserve = await sushiSwapPairContract.methods.getReserves().call();

        //tuple unpack the token reserves reserve[0] == DAI, reserve[1] ==token0
        var pair0Reserve0 = pair0Reserve[0];
        var pair0Reserve1 = pair0Reserve[1];

        var pair1Reserve0 = pair1Reserve[0];
        var pair1Reserve1 = pair1Reserve[1];
 
        //calculate token0 and token0 prices from exchange reserves
        var PriceEth = (pair0Reserve1 / pair0Reserve1);
        var exchange0ETHPrice = (pair0Reserve1 / pair0Reserve1);
        var uniswapDAIRate = (1 / exchange0ETHPrice);

        var exchange1ETHPrice = (sushiswapReserve0 / sushiswapReserve1);
        var exchange1DAIRate = (1 / exchange1ETHPrice);

        //Calculate how much profit we can by arbitraging between two pools
        const returnValues = await getBuySellQuotes(uniswapPair1, sushiswapPair);
        var outAmount = returnValues[0];
        var debt = returnValues[1];
        // console.log("base token, lowerPool, higherPool: " + returnValues[2], returnValues[3], returnValues[4])
        var amountIn = web3.utils.toWei(amountToTradeInEth.toString(), "Ether")
        var totalDifference, deadline, estimatedGasForApproval, estimatedGasForFlashLoan, combinedGas, totalEstimatedGas;

        var exchange0Exchange1PriceDifference = (outAmount / 10**18) - (debt/10**18);

        if (exchange0Exchange1PriceDifference <= 0) {

            console.log(`No arbitrage exists for this current trade`);
            console.log(exchange0Exchange1PriceDifference)
            return                        
        } 

        totalDifference = exchange0Exchange1PriceDifference * web3.utils.fromWei(amountIn.toString(), "Ether");
        deadline = Math.round(Date.now() /  1000 + validPeriod * 60);

        // to estimate the gas we can quote the expected gas that the flashwap loan will cost. howeecr
        //we also need to call the approve function so we need to estimate gas for this too. calling the gas
        //estimation takes too long so we will just set the gas two two times the returned value of the estimate gas call
        // estimatedGasForApproval = await dai.methods.approve(UniswapRouterAddress, amountIn).estimateGas();
        // estimatedGasForFlashLoan = await flashBot.methods.testFlashSwap("0x657a19606aa8e29Ae9E6540f725b97DA82cF39Ab", "0x84752f7d32664468868E05Bd263F463f56801EDa", amountIn).estimateGas();
        estimatedGasForApproval = 2 * (0.03 *10**6)
        estimatedGasForFlashLoan = 2 * (0.15 *10**6) 
        const gasPrice = await web3.eth.getGasPrice()
        combinedGas = estimatedGasForApproval + estimatedGasForFlashLoan;
        totalEstimatedGas = Number(gasPrice) * combinedGas / 10**18

        console.log(`
            \nThe estimated gas amount for calling the approve function is ` + ` ${estimatedGasForApproval / 10 ** 6} Gwei,`.blue +
            `The estimated gas amount for executing the flashswap is ` + ` ${estimatedGasForFlashLoan / 10 ** 6} Gwei`.blue +
            `The current gas price on the ethereum mainnet is ${combinedGas}` +
            `\nHence the total estimated gas cost for this flashBot swap is ` + `${totalEstimatedGas} ETH`.green
        )
            
        //now that we have estimated the gas that it will cost for us to execute the trades on both exchanges we simly
        //subtract this from our total difference above to get the final expected profit from the trade if any.
        var totalProfit = (totalDifference) -  totalEstimatedGas;       
        if (totalProfit < 0) {

            console.log(`\nThere is no profit to be made form this trade after the cost of gas and slippage your loss is ` + `${Math.abs(totalProfit)}`.red + `\nTry increasing your trade amount`);
            return;

        } else {
            
            console.log(`\nThe total estimated profit is ${totalDifference} - ${totalEstimatedGas} =` + ` ${totalProfit} ETH`.green);
            console.log(`\n...Estimated profit expected. Preparing to execute flashloan. preparing to execute flashloan..`);
        }

        try {

            let balancefore = await token1.methods.balanceOf(arbitrage.options.address).call()
            balancefore = balancefore / 10 ** 18;
            
            const transaction0 = {from: WHALE, to: token0.options.address, gas: estimatedGasForApproval, data: token0.methods.approve(uniswapRouterContract.options.address, amountIn).encodeABI()}
            const signedTX0 = await web3.eth.sendTransaction(transaction0);
            const receiptTX0 = signedTX0.transactionHash;
           
            console.log(`\nERC20 Approval transaction successful here is your receipt: ` + `\n\nApproval Receipt: ` + `${receiptTX0}\n`.green);

            const tx = await arbitrage.methods.testFlashSwap(uniswapPair1, sushiswapPair, amountIn).send({ from: WHALE, gas: estimatedGasForFlashLoan})
            console.log(tx)

            let balanceAfter = await token1.methods.balanceOf(arbitrage.options.address).call()
            balanceAfter = balanceAfter / 10 ** 18;
            console.log(`\n\nFlashswap successful your token balance before the trade was: ` + `${balancefore}`.green + ` your token balance after the trade is now: ${balanceAfter}`.green);

        } catch (err) {

            console.log(`\n\nThe flashswap failed unexpectedly. This may be due to a price change in between the time of your qoute and the time it took to execute the trade`.red);
            console.error(err);
            
        }

    }catch (error) {

        console.error(error);
    }
}

async function getBuySellQuotes(uniswapPair1, sushiswapPair) {

    var baseTokenSmaller = await arbitrage.methods.isbaseTokenSmaller(uniswapPair1, sushiswapPair).call();
    baseTokenSmaller = baseTokenSmaller[0]

    var baseToken;
    
    if (baseTokenSmaller) {

        baseToken = await uniswapPairContract.methods.token0().call()
    } else {

        baseToken = await uniswapPairContract.methods.token1().call();
    }
    var orderedReserves = await arbitrage.methods.getOrderedReserves(uniswapPair1, sushiswapPair, baseTokenSmaller).call();
    orderedReserves = orderedReserves[2];
    const lowerPricePool = orderedReserves[0];
    const higherPricePool = orderedReserves[1];

    // borrow quote token on lower price pool, // sell borrowed quote token on higher price pool
    var borrowAmount = web3.utils.toWei(amountToTradeInEth.toString(), "Ether");
    var debtAmount = await uniswapRouterContract.methods.getAmountIn(borrowAmount, orderedReserves[0], orderedReserves[1]).call();
    var baseTokenOutAmount = await uniswapRouterContract.methods.getAmountOut(borrowAmount, orderedReserves[3], orderedReserves[2]).call();
    
    
    return [ baseTokenOutAmount, debtAmount, baseToken, lowerPricePool, higherPricePool];
}

const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 10000 // 8 Seconds
priceMonitor = setInterval(async () => { await FindArbitrageOpportunity("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F");
}, POLLING_INTERVAL)