//IMPORTS 
const Web3 = require("web3");
const express = require("express");
const http = require("http");
const cors = require('cors')
const path = require("path");
const app = express();
require('colors');
const { LocalStorage } = require("node-localstorage");
const Registry = require("./registry.js");

//GLOBAL VARS
var localStorage = new LocalStorage('./scratch');
let registry = new Registry()
var web3;
const amountToTradeInEth = 1;
const validPeriod = 5;
var uniswapPair0, uniswapPair1, sushiswapPair, sakeswapPair, crowswapPair, shibaswapPair;
var server, PORT;
var pairName = "DAI/WETH";

//I
async function loadWeb3() {
   
    const provider = new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws/v3/ba5ee6592e68419cab422190121eca4c")
    web3 = new Web3(provider);
   
    const accounts = await web3.eth.getAccounts()
    // account = accounts[0]
    console.log(accounts)
    
    const netId = await web3.eth.net.getId()
    console.log("The network id is:" + netId);
    
    userAccount = "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE";
    const balance = await web3.eth.getBalance(userAccount);
    console.log("Your balance is: " + balance);

    PORT = process.env.PORT || 5000
    server = http.createServer(app).listen(PORT, () => console.log(`Listening on ${ PORT }`))
    app.use(express.static(path.join(__dirname, 'public')))
    app.use(cors({credentials: true, origin: '*'}));
    app.get("/", function(req, res) {

        res.send({ uniswapBuy: "hello" });
    });
}

async function loadBlockchainData() {

    //sort tokens uniswap uses sorted tokens
    if (registry.DAI > registry.WETH) {

        aux = registry.DAI;
        registry.DAI = registry.WETH;
        registry.WETH = aux;
    }

    getExchangeTokenPairPrice();
}

async function getExchangeTokenPairPrice() {

    // initialise DAI & WETH Token interfaces to access ERC20 functions
    weth = new web3.eth.Contract(registry.IERC20.abi, registry.DAI);
    dai = new web3.eth.Contract(registry.IERC20.abi, registry.WETH);

    //get all DAI/WETH pair addresses on all required exchanges
    uniswapPair0 = await registry.uniswapFactoryContract.methods.getPair(registry.DAI, registry.WETH).call();
    uniswapPair1 = await registry.uniswapFactoryContract.methods.getPair(registry.DAI, registry.WETH ).call();
    console.log(uniswapPair0, uniswapPair1)
    sushiswapPair = await registry.sushiswapFactoryContract.methods.getPair(registry.DAI, registry.WETH ).call();
    sakeswapPair = await registry.sakeswapFactoryContract.methods.getPair(registry.DAI, registry.WETH ).call();
    crowswapPair = await registry.crowswapFactoryContract.methods.getPair(registry.DAI, registry.WETH).call();
    shibaswapPair = await registry.shibaswapFactoryContract.methods.getPair(registry.DAI, registry.WETH).call();

    //initialise DAI/WETH pair contracts on all required exchanges
    uniswapPairContract= new web3.eth.Contract(registry.UniswapV2Pair.abi, uniswapPair0);
    sushiSwapPairContract = new web3.eth.Contract(registry.UniswapV2Pair.abi, sushiswapPair);
    sakeswapPairContract = new web3.eth.Contract(registry.UniswapV2Pair.abi, sakeswapPair);
    crowswapPairContract = new web3.eth.Contract(registry.UniswapV2Pair.abi, crowswapPair);
    shibaswapPairContract = new web3.eth.Contract(registry.UniswapV2Pair.abi, shibaswapPair);

    //fetch DAI/WETH Price from all exchanges
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

    console.log("Current Block: " + state.blockNumber + " The price of: " + pairName +  " on " + exchangeName + " is: "  + (state.token0 / state.token1).toString());
}

async function getReserves(contract) {

    const reserves = await contract.methods.getReserves().call();
    return [reserves.reserve0, reserves.reserve1];
}

async function updateState(data, exchangeName) {

    
    state.token0 = data.returnValues.reserve0;
    state.token1 = data.returnValues.reserve1;
    state.blockNumber = data.blockNumber;

    console.log("Current Block: " + state.blockNumber + " The price of: " + pairName + "on" + exchangeName +  "is: " + (state.tojen0 / state.token1).toString());
}

loadWeb3();
loadBlockchainData();


//we will look for profit every two blockss because (two transactions made)
async function FindArbitrageOpportunity(exchange0RouterAddress, exchange1RouterAddress) {

    let skip = true;
    console.log("hey")
    const newBlockEvent = web3.eth.subscribe("newBlockHeaders");
    newBlockEvent.on('connected', () =>{console.log('\nBot listening!\n')})

//look up for a profit whenever a new block is minned
    await newBlockEvent.on('data', async function(blockHeader){
        try {

            const pairContract0 = uniswapPairContract;
            const pairContract1 = sushiSwapPairContract;
            
            var pair0Reserve, pair1Reserve, sakeswapReserve, crowswapReserve, shibaswapReserve, crowswapReserve0, crowswapReserve1;
            var pair0Reserve1, upair0eserve1, sushiswapReserve0, sushiswapReserve1, sakeswapReserve0, sakeswapReserve1, shibaswapReserve0, shibaswapReserve1;

            //get the reserves for supported exchanges
            pair0Reserve = await uniswapPairContract.methods.getReserves().call();
            pair1Reserve = await sushiSwapPairContract.methods.getReserves().call();
           
            //tuple unpack the token reserves reserve[0] == registry.DAI, reserve[1] ==weth
            var pair0Reserve0 = pair0Reserve[0];
            var pair0Reserve1 = pair0Reserve[1];

            var pair1Reserve0 = pair1Reserve[0];
            var pair1Reserve1 = pair1Reserve[1];

            //calculate dai and weth prices from exchange reserves
            var PriceEth = (pair0Reserve1 / pair0Reserve1);
            var exchange0ETHPrice = (pair0Reserve1 / pair0Reserve1);
            var uniswapDAIRate = (1 / exchange0ETHPrice);

            var exchange1ETHPrice = (sushiswapReserve0 / sushiswapReserve1);
            var exchange1DAIRate = (1 / exchange1ETHPrice);

            //now that we have the prices of registry.DAI/WETH on the different exchanges we can calculate
            //the pair price difference between each exchange and take the most profitiable to make
            //our trade.
            const amountIn = web3.utils.toWei(amountToTradeInEth.toString(), "Ether");

            // //use the dex router contracts to calulate the expected output and input amounts. we reverse the reserve oders bease
            // //the trades are executed on opposite sides on both dexes
            //check for arb tading registry.DAI/ETH on uniswap/sushiswap 
            var exchange0AmountDaiForInputETH = await registry.uniswapRouterContract.methods.getAmountIn(amountIn, pair0Reserve0, pair0Reserve1).call() //in wei
            var exchange1AmountDaiForInputETH = await registry.sushiswapRouterContract.methods.getAmountIn(amountIn, pair1Reserve0, pair1Reserve1).call() //in wei
           
            var exchange0AmountETHForInputDAI = await registry.uniswapRouterContract.methods.getAmountOut(amountIn, pair0Reserve1, pair0Reserve0).cpair0//in wei
            var exchange1AmountETHForInputDAI = await registry.sushiswapRouterContract.methods.getAmountOut(amountIn, pair1Reserve1, pair1Reserve0).call(); //in wei
           
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
            estimatedGasForApproval = await dai.methods.approve(registry.UniswapRouterAddress, amountIn).estimateGas();
            // const estimatedGasForFlashLoan = await contract.methods.executeFlashSwap(...args).estimateGas();
            estimatedGasForFlashLoan = (0.3 * 10 ** 6) * 2;
            totalEstimatedGas = estimatedGasForApproval + estimatedGasForFlashLoan;

            //now that we have the estimated gas amonnt we need to query the current gas cost and multiply
            //this by the estimated amount to get the final estimated gas price
            gasCost = Number(gasPrice) * totalEstimatedGas * PriceEth //in dai

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
                `${amountToTradeInEth} WETH will buy you ${web3.utils.fromWei(exchange0AmountDaiForInputETH.toString(), "Ether")} registry.DAI on Uniswap. ` +
                `conversley ${web3.utils.fromWei(sushiswapAmountETHForInputDAI.toString(), "Ether")} will buy us ${amountToTradeInEth} WETH on Sushiswap\n`
            );

            // // if (sushiProfit <= 0) return;

    
            // // const transaction0 = {from: "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE", to: registry.WETH1, gas: gasNeeded0, data: eth.methods.approve(registry.uniswapRouterContract.options.address, amountIn).encodeABI()}
            // // const transaction1 = {from: "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE", to: registry.DAI, gas: gasNeeded0 * 5, data: eth.methods.approve(registry.sushiswapRouterContract.options.address, amountIn).encodeABI()}
            // // const signedTX0 = await web3.eth.sendTransaction(transaction0);
            // // const receiptTX0 = signedTX0.transactionHash;
            // // const signedTX1 = await web3.eth.sendTransaction(transaction1);
            // // const receiptTX1 = signedTX1.transactionHash;

            // // const add = registry.uniswapRouterContract.address;
            // // // 

            // // const transaction2 = await registry.uniswapRouterContract.methods.swapExactTokensForTokens(
            // //     amountIn,
            // //     0,
            // //     [registry.WETH1, registry.DAI],
            // //     "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE",
            // //     deadline
            // //     ).send({from: "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE", to: registry.uniswapRouterContract.options.address, gas: gasNeeded1}).then(function(res) {
            // //         console.log(res)
            // //     })
            
           
            // // const signedTX2 = await web3.eth.sendTransaction(transaction2);
            // // const receiptTX2 =signedTX2.transactionHash;

            // // const transaction3 = await registry.sushiswapRouterContract.methods.swapExactTokensForTokens(
            // //     amountIn,
            // //     0,
            // //     [registry.DAI, registry.WETH1],
            // //     "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE",
            // //     deadline
            // //     ).send({from: "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE", to: registry.sushiswapRouterContract.options.address, gas: gasNeeded1 * 3}).then(function(res) {
            // //         console.log(res)
            // //     })
            
           
            // // const signedTX3 = await web3.eth.sendTransaction(transaction3);
            // // const receiptTX3 =signedTX3.transactionHash;

        
        }catch (error) {

            console.error(error);
        }
    });
}

FindArbitrageOpportunity("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F");

// const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 10000 // 8 Seconds
// priceMonitor = setInterval(async () => { await FindArbitrageOpportunity() }, POLLING_INTERVAL)