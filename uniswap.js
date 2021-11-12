// const { ChainId, Token, Fetcher, Route } =  require('@uniswap/sdk');


// function uniswapV2Factory (token1, token2) {
//     return {
//          getPrice:  async () => {
//             const t1 = await Fetcher.fetchTokenData(ChainId.MAINNET, token1);
//             const t2 = await Fetcher.fetchTokenData(ChainId.MAINNET, token2);
            
//             const pair = await Fetcher.fetchPairData(t1, t2)
//             const route = new Route([pair], t1)
//             const mid = route.midPrice.toSignificant(6);
//             const midverse = route.midPrice.invert().toSignificant(6)
//             return {
//                 mid,
//                 midverse
//             }
            
//         }
//     }


// }


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
const UniswapRouter = require("./contractBuilds/IUniswapV2Router02.json");
const Utils = require("./contractBuilds/Utils.json");
const IERC20 = require("./contractBuilds/IERC20.json");
const crowSwapFactory = require("./contractBuilds/CrowSwapFactory.json");
const crowSwapRouter = require("./contractBuilds/CrowDefiSwapPair.json");
const shibaswapFactory = require("./contractBuilds/ShibaSwapFactory.json");


// const { utils } = require("ethers");

//defining address parameters. 
const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
const WETH1 = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const SushiSwapFactoryAddress = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";
const SushiSwapRouterAddress = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
const UniswapFactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const UniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const sakeswapFactoryAddress = "0x75e48C954594d64ef9613AeEF97Ad85370F13807";
const sakeswapRouterAddress = "0x9C578b573EdE001b95d51a55A3FAfb45f5608b1f";
const crowswapFactoryAddress = "0x9DEB29c9a4c7A88a3C0257393b7f3335338D9A9D";
const crowSapRouterAddress = "0xa856139af24e63cc24d888728cd5eef574601374";
const shibaSwapFactoryAddress = "0x115934131916C8b277DD010Ee02de363c09d037c";

const token01 = "0x514910771af9ca656af840dff83e8264ecf986ca"; //Link
const token0 = "0x6b175474e89094c44da98b954eedeac495271d0f"; //Link
const token1 = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" //WETH1
const tokenAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
const pairName = "ETH/DAI";
var localStorage = new LocalStorage('./scratch');
var amountToTradeInEth = 1;
const validPeriod = 5;
var eth;
var link;

//here we will initialise the needed smart contracts aswell as some vars
//PAIR CONTRACTS
var uniswapPairContract, sushiSwapPairContract, sakeswapPairContract, crowswapPairContract, shibaswapPairContract, utils;
//FACTORY CONTRACTS
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
    if (token0 > token1) {

        aux = token0;
        token0 = token1;
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
    sakeswapFactoryContract = new web3.eth.Contract(UniswapFactory.abi, sakeswapFactoryAddress);
    sakeswapRouterContract = new web3.eth.Contract(UniswapRouter.abi, sakeswapRouterAddress);
    crowswapFactoryContract = new web3.eth.Contract(crowSwapFactory, crowswapFactoryAddress);
    crowswapRouterContract = new web3.eth.Contract(crowSwapRouter, crowSapRouterAddress);
    shibaswapFactoryContract = new web3.eth.Contract(shibaswapFactory, shibaSwapFactoryAddress);
    utils = new web3.eth.Contract(Utils.abi, "0xE78941610Ffef0eEA391BAe6d842175E389973E9");
    eth = new web3.eth.Contract(IERC20.abi, token0);
    link = new web3.eth.Contract(IERC20.abi, token1);
}

loadWeb3();
initialiseFactoryContracts()
loadBlockchainData();
FindArbitrageOpportunity()


async function getExchangeTokenPairPrice() {

    uniswapPair0 = await uniswapFactoryContract.methods.getPair(WETH1, DAI).call();
    uniswapPair1 = await uniswapFactoryContract.methods.getPair(token1, token0 ).call();
    sushiswapPair = await sushiswapFactoryContract.methods.getPair(token1, token0 ).call();
    sakeswapPair = await sakeswapFactoryContract.methods.getPair(token0, token1 ).call();
    crowswapPair = await crowswapFactoryContract.methods.getPair(token0, token1).call();
    shibaswapPair = await shibaswapFactoryContract.methods.getPair(token0, token1).call();

    uniswapPairContract= new web3.eth.Contract(UniswapV2Pair.abi, uniswapPair0);
    sushiSwapPairContract = new web3.eth.Contract(UniswapV2Pair.abi, sushiswapPair);
    sakeswapPairContract = new web3.eth.Contract(UniswapV2Pair.abi, sakeswapPair);
    crowswapPairContract = new web3.eth.Contract(UniswapV2Pair.abi, crowswapPair);
    shibaswapPairContract = new web3.eth.Contract(UniswapV2Pair.abi, shibaswapPair);

    uniswapPairContract1 = new web3.eth.Contract(UniswapV2Pair.abi, uniswapPair1);
    getTokenPriceFromPoolReserves(uniswapPairContract, "Uniswap");
    getTokenPriceFromPoolReserves(sushiSwapPairContract, "SushiSwap");
    getTokenPriceFromPoolReserves(sakeswapPairContract, "SakeSwap");
    getTokenPriceFromPoolReserves(crowswapPairContract, "CrowSwap");
    getTokenPriceFromPoolReserves(shibaswapPairContract, "ShibaSwap");
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

//we will look for profit every two blockss because (two transactions made)
async function FindArbitrageOpportunity() {

    let skip = true;
    console.log("hey")
    const newBlockEvent = web3.eth.subscribe("newBlockHeaders");
    newBlockEvent.on("connected", () => {console.log("/nArbitrage bot listening/n");});

    skip != skip;
        if (!skip) return;

        try {
            
            var uniswapReserve, sushiswapReserve, sakeswapReserve, crowswapReserve, shibaswapReserve, crowswapReserve0, crowswapReserve1;

            //next we use the reserves to obtain the price data
            // uniswapReserve = await uniswapPairContract1.methods.getReserves().call();
            // uniswapReserve0 = uniswapReserve[0];
            // uniswapReserve1 = uniswapReserve[1];
            // var priceEth = (uniswapReserve0 / uniswapReserve1);
            // var uniswapETHPrice = uniswapReserve0 / uniswapReserve1;

            // const priceToken0ETH = price

            
            // console.log("Oppsotie is"+ (uniswapReserve1 / uniswapReserve0))

            uniswapReserve = await uniswapPairContract1.methods.getReserves().call();
            uniswapReserve0 = uniswapReserve[0];
            uniswapReserve1 = uniswapReserve[1];
            var priceEth = (uniswapReserve0 / uniswapReserve1);
            console.log(priceEth);

            var uniswapETHPrice = uniswapReserve0 / uniswapReserve1; //dai per eth
            
            sushiswapReserve = await sushiSwapPairContract.methods.getReserves().call();
            sushiswapReserve0 = sushiswapReserve[0];
            sushiswapReserve1 = sushiswapReserve[1];
            console.log(sushiswapReserve0, sushiswapReserve1);
            var sushiswapPrice = sushiswapReserve0 / sushiswapReserve1;


            sakeswapReserve = await sakeswapPairContract.methods.getReserves().call();
            sakeswapReserve0 = sakeswapReserve[0];
            sakeswapReserve1 = sakeswapReserve[1];
            var sakeswapPrice = sakeswapReserve0 / sakeswapReserve1;


            crowswapReserve = await crowswapPairContract.methods.getReserves().call();
            crowswapReserve0 = crowswapReserve[0];
            crowswapReserve1 = crowswapReserve[1];
            var crowswapPrice = crowswapReserve0 / crowswapReserve1

            shibaswapReserve = await shibaswapPairContract.methods.getReserves().call();
            shibaswapReserve0 = shibaswapReserve[0];
            shibaswapReserve1 = shibaswapReserve[1];
            var shibaswapPrice = shibaswapReserve0 / shibaswapReserve1;

            const amountIn = web3.utils.toWei(amountToTradeInEth.toString(), "Ether");

            var uniAmountOut = await uniswapRouterContract.methods.getAmountOut(amountIn, uniswapReserve0, uniswapReserve1).call()
            var sushiAmountIn = await sushiswapRouterContract.methods.getAmountIn(amountIn, sushiswapReserve1, sushiswapReserve0).call();
            var sakeAmountIn = await sakeswapRouterContract.methods.getAmountOut(BigInt(amountIn), sakeswapReserve0, sakeswapReserve1).call();
            var crowAmountIn = await await uniswapRouterContract.methods.getAmountOut(BigInt(amountIn), crowswapReserve0, crowswapReserve1).call();
            var shibaAmountIn = await sushiswapRouterContract.methods.getAmountIn(BigInt(amountIn), shibaswapReserve1, shibaswapReserve0).call();

            console.log("sushiAmount in " + sushiAmountIn)
            const newUniswapReserve0 = Number(uniswapReserve0) + Number(amountIn);
            const newUniswapReserve1 = Number(uniswapReserve1) - Number(uniAmountOut);
            const newSushiswapReserve0 = Number(sushiswapReserve0) + Number(uniAmountOut);
            const newSushiwapReserve1 = Number(sushiswapReserve1) - Number(amountIn);

            const sushiPrice = 1 / (sushiAmountIn / amountIn);
            const sakePrice = 1 / (sakeAmountIn / amountIn);
            const crowPrice = 1 / (crowAmountIn / amountIn);
            const shibaPrice = 1 / (shibaAmountIn / amountIn);

            const sushiDifference =   uniAmountOut/amountIn - 1/sushiPrice ;
            console.log(uniAmountOut/amountIn, 1/sushiPrice )
            const sakeDifference = uniAmountOut - sakePrice;
            const crowDifference = uniAmountOut - crowPrice;
            const shibaDifference = uniAmountOut - shibaPrice;

            if(sushiDifference <= 0) {

                console.log("There currently exists no arbitrage oportunity for this trade");
                return
            } 

            var sushiTotalDifference = sushiDifference * Math.round(amountIn / 10 ** 18);;
            const sakeTotalDifference = sakeDifference * Math.round(amountIn / 10 ** 18);
            const crowTotalDifference = crowDifference * Math.round(amountIn / 10 ** 18);
            const shibaTotalDifference = shibaDifference * Math.round(amountIn / 10 ** 18);
            const tokenPath = [token0, token1];
            const deadline = Math.round(Date.now() /  1000 + validPeriod * 60);

            var og = (0.015* 10 ** 6) * 2;
            const gasNeeded1 = (0.15 * 10 ** 6) * 2;
            const gasNeeded0 = await link.methods.approve(UniswapRouterAddress, amountIn).estimateGas();
            const gasNeeded = gasNeeded0 + gasNeeded1;
            const gasPrice = await web3.eth.getGasPrice();
            const gasCost = Number(gasPrice) * gasNeeded;
            console.log("the gas cost is: " + gasCost)
            console.log("gas: " + web3.utils.fromWei(gasCost.toString(), "Ether"));
           
            var sushiProfit = (sushiTotalDifference * uniswapETHPrice) -  web3.utils.fromWei(gasCost.toString(), "Ether");
            const sakeProfit = (sakeTotalDifference * uniswapETHPrice);
            const crowProfit = (crowTotalDifference * uniswapETHPrice) - gasCost;
            const shibaProfit = (shibaTotalDifference * uniswapETHPrice) - gasCost;
            const profitArray = [sushiProfit, sakeProfit, crowProfit, shibaProfit];
            const bestProfit = Math.max(...profitArray);
        
            console.log(
                `Block`+`\n\n`+
                `Wrapped Ether (WETH1) {T0} | DAI Stablecoin (DAI) {T1} reserves\n\n`+
                `On Uniswap\n`+
                `WETH: ${Math.round(uniswapReserve0/10**18)} | DAI: ${Math.round(uniswapReserve1/10**18)}\n\n`+
                `On Sushiswap\n`+
                `WETH: ${Math.round(sushiswapReserve0/10**18)} | DAI: ${Math.round(sushiswapReserve1/10**18)}\n\n`+
                `Swap's direction\n`+
                `$WETH -> DAI\n\n`+
                `Uniswap's pool state\n`+
                `DAI excess/WETH shortage\n\n`+
                `On Uniswap\n`+
                `Mid price before swap: ${(uniswapReserve0/uniswapReserve1).toFixed(10)} WETH/DAI\n`+
                `Mid price after swap: ${(newUniswapReserve0/newUniswapReserve1).toFixed(10)} WETH/DAI\n`+
                `Swap ${amountIn/10**18} WETH for ${uniAmountOut/10**18} DAI\n`+
                `Trade price: ${(1/(uniAmountOut/sushiAmountIn)).toFixed(10)} ${WETH1}/${DAI} (buy price)\n\n`+
                `Sushiswap price: ${(sushiPrice).toFixed(2)} WETH/DAI (sell price)\n`+
                `Difference: ${(sushiDifference).toFixed(10)} WETH/DAI\n`+
                `Total difference: ${(sushiDifference*0.99).toFixed(10)} ETH or ${sushiDifference.toFixed(2)} DAI\n\n`+
                `Gas needed: ${gasNeeded/10**6}\n`+
                `Gas price: ${gasPrice/10**9} gwei\n`+
                `Gas cost: ${gasCost.toFixed(5)} ETH\n\n`+
                `${sushiProfit > 0 ? `Profit: ${sushiProfit.toFixed(20)} ETH or ${(sushiProfit*priceEth).toFixed(2)} DAI\n`.green: 
                `No profit! (gas cost higher than the total difference achievable)\n`.red}`
            )

            if (sushiProfit <= 0) return;

    
            const transaction0 = {from: "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE", to: WETH1, gas: gasNeeded0, data: eth.methods.approve(uniswapRouterContract.options.address, amountIn).encodeABI()}
            const transaction1 = {from: "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE", to: DAI, gas: gasNeeded0 * 5, data: eth.methods.approve(sushiswapRouterContract.options.address, amountIn).encodeABI()}
            const signedTX0 = await web3.eth.sendTransaction(transaction0);
            const receiptTX0 = signedTX0.transactionHash;
            const signedTX1 = await web3.eth.sendTransaction(transaction1);
            const receiptTX1 = signedTX1.transactionHash;

            const add = uniswapRouterContract.address;
            // 

            const transaction2 = await uniswapRouterContract.methods.swapExactTokensForTokens(
                amountIn,
                0,
                [WETH1, DAI],
                "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE",
                deadline
                ).send({from: "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE", to: uniswapRouterContract.options.address, gas: gasNeeded1}).then(function(res) {
                    console.log(res)
                })
            
           
            const signedTX2 = await web3.eth.sendTransaction(transaction2);
            const receiptTX2 =signedTX2.transactionHash;

            const transaction3 = await sushiswapRouterContract.methods.swapExactTokensForTokens(
                amountIn,
                0,
                [DAI, WETH1],
                "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE",
                deadline
                ).send({from: "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE", to: sushiswapRouterContract.options.address, gas: gasNeeded1 * 3}).then(function(res) {
                    console.log(res)
                })
            
           
            const signedTX3 = await web3.eth.sendTransaction(transaction3);
            const receiptTX3 =signedTX3.transactionHash;

        
        }catch (error) {

            console.error(error);
        }


}
// const uniAmountOut = await uRouter.methods.getAmountOut(amountIn,uniswapReserve0 ,uniswapReserve1).call()

const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 8000 // 3 Seconds
priceMonitor = setInterval(async () => { await FindArbitrageOpportunity() }, POLLING_INTERVAL)
//module.exports = {uniswapV2Factory};