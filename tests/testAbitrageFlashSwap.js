const express = require("express");
const http = require("http");
const Web3 = require("web3");
const cors = require('cors')
const {LocalStorage} = require("node-localstorage");
const axios = require('axios');
const path = require("path");
const app = express();
var web3;
require('colors');


const PORT = process.env.PORT || 5000
const server = http.createServer(app).listen(PORT, () => console.log(`Listening on ${ PORT }`))
app.use(express.static(path.join(__dirname, 'public')))
app.use(cors({credentials: true, origin: '*'}));
app.get("/", function(req, res) {

    res.send({ uniswapBuy: "hello" });
})

const privateKey = "0xc51f7826f42baad15e0ab5a6d11d5c49301c7feb5c5961f857725cb8f283b4bb"
  
//ABIS
const UniswapFactory = require("../node_modules/@uniswap/v2-core/build/IUniswapV2Factory.json");
const UniswapV2Pair = require("../node_modules/@uniswap/v2-core/build/IUniswapV2Pair.json");
const UniswapRouter = require("../contractBuilds/IUniswapV2Router02.json");
const Utils = require("../contractBuilds/Utils.json");
const IERC20 = require("../contractBuilds/IERC20.json");
const crowSwapFactory = require("../contractBuilds/CrowSwapFactory.json");
const crowSwapRouter = require("../contractBuilds/CrowDefiSwapPair.json");
const shibaswapFactory = require("../contractBuilds/ShibaSwapFactory.json");


//defining address parameters. 
const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
const WETH1 = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const SushiSwapFactoryAddress = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";
const SushiSwapRouterAddress = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
const UniswapFactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const UniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

const token01 = "0x514910771af9ca656af840dff83e8264ecf986ca"; //Link
const token0Addr = "0x0440Fd561D69baF34f288dABe3dFBCd35504D0a8"; //Link
const token1Addr = "0xDA9B459dE90dcc0496fd9d29D5A7A5Fe8b83E3d8" //WETH1
const tokenAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
const pairName = "ETH/DAI";
var localStorage = new LocalStorage('./scratch');
var amountToTradeInEth = 1;
const validPeriod = 5;
var eth;
var link;

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
    
   
    token0 = new web3.eth.Contract(IERC20.abi, "0x0440Fd561D69baF34f288dABe3dFBCd35504D0a8");
    token1 = new web3.eth.Contract(IERC20.abi, "0xDA9B459dE90dcc0496fd9d29D5A7A5Fe8b83E3d8");
 
}

async function getExchangeTokenPairPrice() {

    // uniswapPair0 = await uniswapFactoryContract.methods.getPair(DAI, WETH1).call();
    uniswapPair1 = await uniswapFactoryContract.methods.getPair(token0Addr, token1Addr ).call();
    // console.log(uniswapPair0, uniswapPair1)
    sushiswapPair = await sushiswapFactoryContract.methods.getPair(token0Addr, token1Addr ).call();
    console.log(sushiswapPair)

    uniswapPairContract= new web3.eth.Contract(UniswapV2Pair.abi, uniswapPair1);
    sushiSwapPairContract = new web3.eth.Contract(UniswapV2Pair.abi, sushiswapPair);

    getTokenPriceFromPoolReserves(uniswapPairContract, "Uniswap");
    getTokenPriceFromPoolReserves(sushiSwapPairContract, "SushiSwap");

}


async function getTokenPriceFromPoolReserves(contract, exchangeName) {

    var state = { blockNumber: undefined, token0: undefined, token1: undefined};
    [state.token0, state.token1] = await getReserves(contract)
    state.blockNumber = await web3.eth.getBlockNumber();
    contract.events.Sync({}).on("data", (data) => updateState(data, exchangeName));

    console.log("Current Block: " + state.blockNumber + " The price of: " + pairName +  " on " + exchangeName 
                + " is: "  + (state.token0 / state.token1).toString());
}

async function getReserves(contract) {

    const reserves = await contract.methods.getReserves().call();
    return [reserves.reserve0, reserves.reserve1];
}

async function updateState(data, exchangeName) {

    
    state.token0 = data.returnValues.reserve0;
    state.token1 = data.returnValues.reserve1;
    state.blockNumber = data.blockNumber;

    console.log("Current Block: " + state.blockNumber + " The price of: " + pairName + "on" + exchangeName +  "is: " 
                + (state.token0 / state.token1).toString());
}


loadWeb3();
// const utils = new web3.eth.Contract(Utils.abi,'',{data:Utils.bytecode})
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

        const pairContract0 = uniswapPairContract;
        const pairContract1 = sushiSwapPairContract;
        
        
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

        console.log(pair0Reserve0 / pair0Reserve1);

        
        //calculate token0 and token0 prices from exchange reserves
        var PriceEth = (pair0Reserve1 / pair0Reserve1);
        var exchange0ETHPrice = (pair0Reserve1 / pair0Reserve1);
        var uniswapDAIRate = (1 / exchange0ETHPrice);

        var exchange1ETHPrice = (sushiswapReserve0 / sushiswapReserve1);
        var exchange1DAIRate = (1 / exchange1ETHPrice);

        //now that we have the prices of DAI/WETH on the different exchanges we can calculate
        //the pair price difference between each exchange and take the most profitiable to make
        //our trade.
        const amountIn = web3.utils.toWei(amountToTradeInEth.toString(), "Ether");

        // //use the dex router contracts to calulate the expected output and input amounts. we reverse the reserve oders bease
        // //the trades are executed on opposite sides on both dexes
        //check for arb tading DAI/ETH on uniswap/sushiswap 
        var exchange0AmountDaiForInputETH = await uniswapRouterContract.methods.getAmountIn(amountIn, pair0Reserve1, pair0Reserve0).call() //in wei
        var exchange1AmountDaiForInputETH = await sushiswapRouterContract.methods.getAmountIn(amountIn, pair1Reserve1, pair1Reserve0).call() //in wei
        
        var exchange0AmountETHForInputDAI = await uniswapRouterContract.methods.getAmountOut(amountIn, pair0Reserve0, pair0Reserve1).cpair0//in wei
        var exchange1AmountETHForInputDAI = await sushiswapRouterContract.methods.getAmountOut(amountIn, pair1Reserve0, pair1Reserve1).call(); //in wei
        

        var totalDifference, deadline, estimatedGasForApproval, estimatedGasForFlashLoan, totalEstimatedGas, gasCost;
        const gasPrice = await web3.eth.getGasPrice();

    
        var exchange0Exchange1PriceDifference = (exchange1AmountETHForInputDAI / amountIn) - (exchange0AmountDaiForInputETH/amountIn);

        if (exchange0Exchange1PriceDifference <= 0) {

            console.log(`No arbitrage exists for this current trade`);
            console.log(exchange0Exchange1PriceDifference)
            return                        
        } 

        totalDifference = exchange0Exchange1PriceDifference * web3.utils.fromWei(amountIn.toString(), "Ether");
        deadline = Math.round(Date.now() /  1000 + validPeriod * 60);

        // to estimate the gas we can quote the expected gas that the flashwap loan will cost. howeecr
        //we also need to call the approve function so we need to estimate gas for this too
        estimatedGasForApproval = await token0.methods.approve(UniswapRouterAddress, amountIn).estimateGas();
        // const estimatedGasForFlashLoan = await contract.methods.executeFlashSwap(...args).estimateGas();
        estimatedGasForFlashLoan = (0.3 * 10 ** 6) * 2;
        totalEstimatedGas = estimatedGasForApproval + estimatedGasForFlashLoan;

        //now that we have the estimated gas amonnt we need to query the current gas cost and multiply
        //this by the estimated amount to get the final estimated gas price
        gasCost = Number(gasPrice) * totalEstimatedGas * PriceEth //in token0

        console.log(`
            \nThe estimated gas amount for calling the approve function is ${web3.utils.fromWei(estimatedGasForApproval.toString(), "Gwei")},` +
            `The estimated gas amount for executing the flashswap is ${web3.utils.fromWei(estimatedGasForFlashLoan.toString(), "Gwei")} Gwei` +
            `The current gas price on the ethereum mainnet is ${web3.utils.fromWei(totalEstimatedGas.toString(), "Gwei")}` +
            `Hence the total estimated gas cost for this arbitrage swap is ${web3.utils.fromWei(totalEstimatedGas.toString(), "Gwei")}`
        )
            
        //now that we have estimated the gas that it will cost for us to execute the trades on both exchanges we simly
        //subtract this from our total difference above to get the final expected profit from the trade if any.
        var totalProfit = (totalDifference) -  web3.utils.fromWei(gasCost.toString(), "Ether");       
        if (totalProfit < 0) {

            amountToTradeInEth += 1;
            ex = "SushiSwap";
            console.log(`\nThere is no profit to be made form this trade after the cost of gas and slippage your loss is ` + `${Math.abs(totalProfit)}`.red + ` Try increasing your trade amount`);
            return;

        } else {
            
            ex = "SushiSwap";
            console.log(`\nThe total estimated profit is ${totalDifference} - ${web3.utils.fromWei(gasCost.toString(), "Ether")} =S` + `${totalProfit}`.green);
            console.log(`\n...Estimated profit expected. Preparing to execute flashloan. Note that these are only estimations the flashloan might still fail due to deylaed price feeds and market volaitity which affects the gas and slippage estimations`.green)
        }

                    
        console.log(
            `${amountToTradeInEth} WETH will buy you ${web3.utils.fromWei(exchange0AmountDaiForInputETH.toString(), "Ether")} DAI on Uniswap. ` +
            `conversley ${web3.utils.fromWei(sushiswapAmountETHForInputDAI.toString(), "Ether")} will buy us ${amountToTradeInEth} WETH on Sushiswap\n`
        );

        // // if (sushiProfit <= 0) return;


        // // // const transaction0 = {from: "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE", to: WETH1, gas: gasNeeded0, data: eth.methods.approve(uniswapRouterContract.options.address, amountIn).encodeABI()}
        // // // const transaction1 = {from: "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE", to: DAI, gas: gasNeeded0 * 5, data: eth.methods.approve(sushiswapRouterContract.options.address, amountIn).encodeABI()}
        // // // const signedTX0 = await web3.eth.sendTransaction(transaction0);
        // // // const receiptTX0 = signedTX0.transactionHash;
        // // // const signedTX1 = await web3.eth.sendTransaction(transaction1);
        // // // const receiptTX1 = signedTX1.transactionHash;

        // // // const add = uniswapRouterContract.address;
        // // // // 

        // // // const transaction2 = await uniswapRouterContract.methods.swapExactTokensForTokens(
        // // //     amountIn,
        // // //     0,
        // // //     [WETH1, DAI],
        // // //     "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE",
        // // //     deadline
        // // //     ).send({from: "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE", to: uniswapRouterContract.options.address, gas: gasNeeded1}).then(function(res) {
        // // //         console.log(res)
        // // //     })
        
        
        // // // const signedTX2 = await web3.eth.sendTransaction(transaction2);
        // // // const receiptTX2 =signedTX2.transactionHash;

        // // // const transaction3 = await sushiswapRouterContract.methods.swapExactTokensForTokens(
        // // //     amountIn,
        // // //     0,
        // // //     [DAI, WETH1],
        // // //     "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE",
        // // //     deadline
        // // //     ).send({from: "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE", to: sushiswapRouterContract.options.address, gas: gasNeeded1 * 3}).then(function(res) {
        // // //         console.log(res)
        // // //     })
        
        
        // // // const signedTX3 = await web3.eth.sendTransaction(transaction3);
        // // // const receiptTX3 =signedTX3.transactionHash;

    
        }catch (error) {

            console.error(error);
        }
    

}


const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 10000 // 8 Seconds
priceMonitor = setInterval(async () => { await FindArbitrageOpportunity("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F");
}, POLLING_INTERVAL)