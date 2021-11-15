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
   
    const provider = new Web3.providers.WebsocketProvider("http://127.0.0.1:8545")
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
    flashBot = new web3.eth.Contract(registry.FlashBotContract.abi, registry.flashBotAddress)
    // maximumPofit = new web3.eth.Contract(registry)

    //get all DAI/WETH pair addresses on all required exchanges
    uniswapPair = await registry.uniswapFactoryContract.methods.getPair(registry.DAI, registry.WETH).call();
    sushiswapPair = await registry.sushiswapFactoryContract.methods.getPair(registry.DAI, registry.WETH ).call();
    sakeswapPair = await registry.sakeswapFactoryContract.methods.getPair(registry.DAI, registry.WETH ).call();
    crowswapPair = await registry.crowswapFactoryContract.methods.getPair(registry.DAI, registry.WETH).call();
    shibaswapPair = await registry.shibaswapFactoryContract.methods.getPair(registry.DAI, registry.WETH).call();

    //initialise DAI/WETH pair contracts on all required exchanges
    uniswapPairContract= new web3.eth.Contract(registry.UniswapV2Pair.abi, uniswapPair);
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
   
        try {

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


            var exchange1ETHPrice = (sushiswapReserve0 / sushiswapReserve1);
            var exchange1DAIRate = (1 / exchange1ETHPrice);

            //now that we have the prices of registry.DAI/WETH on the different exchanges we can calculate
            //the pair price difference between each exchange and take the most profitiable to make
            //our trade.
            const returnValues = await getBuySellQuotes(uniswapPair, sushiswapPair);
            var outAmount = returnValues[0];
            var debt = returnValues[1];
            console.log("base token, lowerPool, higherPool: " + returnValues[2], returnValues[3], returnValues[4])
            var amountIn = web3.utils.toWei("1", "Ether")
        
            var totalDifference, deadline, estimatedGasForApproval, estimatedGasForFlashLoan, totalEstimatedGas, gasCost;
            const gasPrice = await web3.eth.getGasPrice();

            var exchange0Exchange1PriceDifference = (outAmount / amountIn) - (debt/amountIn);

            if (exchange0Exchange1PriceDifference <= 0) {

                console.log(`No flashBot exists for this current trade`);
                console.log(exchange0Exchange1PriceDifference)
                return                        
            } 

            totalDifference = exchange0Exchange1PriceDifference * web3.utils.fromWei(amountIn.toString(), "Ether");
            deadline = Math.round(Date.now() /  1000 + validPeriod * 60);

            // to estimate the gas we can quote the expected gas that the flashwap loan will cost. howeecr
            //we also need to call the approve function so we need to estimate gas for this too
            // estimatedGasForApproval = await token0.methods.approve(UniswapRouterAddress, amountIn).estimateGas();
            estimatedGasForApproval = 2 * (29209)

            // const estimatedGasForFlashLoan = await contract.methods.executeFlashSwap(...args).estimateGas();
            estimatedGasForFlashLoan = 2 * (221815) 
            // estimatedGasForFlashLoan = await flashBot.methods.testFlashSwap("0x657a19606aa8e29Ae9E6540f725b97DA82cF39Ab", "0x84752f7d32664468868E05Bd263F463f56801EDa", amountIn).estimateGas();
        
            totalEstimatedGas = estimatedGasForApproval + estimatedGasForFlashLoan;

            //now that we have the estimated gas amonnt we need to query the current gas cost and multiply
            //this by the estimated amount to get the final estimated gas price
            gasCost = totalEstimatedGas //in token0
            // console.log("gas cost", web3.utils.fromWei(gasCost.toString(), "Ether"))

            console.log(`
                \nThe estimated gas amount for calling the approve function is ${web3.utils.fromWei(estimatedGasForApproval.toString(), "Gwei")},` +
                `The estimated gas amount for executing the flashswap is ${web3.utils.fromWei(estimatedGasForFlashLoan.toString(), "Gwei")} Gwei` +
                `The current gas price on the ethereum mainnet is ${web3.utils.fromWei(totalEstimatedGas.toString(), "Gwei")}` +
                `Hence the total estimated gas cost for this flashBot swap is ${web3.utils.fromWei(totalEstimatedGas.toString(), "Gwei")}`
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

            try {

                let balancefore = await token0.methods.balanceOf(arbitrage.options.address).call()
                balancefore = balancefore / 10 ** 18;
                console.log("Token balance before arb: " + balancefore);
    
    
                const transaction0 = {from: WHALE, to: token0.options.address, gas: estimatedGasForApproval, data: token0.methods.approve(uniswapRouterContract.options.address, amountIn).encodeABI()}
                const signedTX0 = await web3.eth.sendTransaction(transaction0);
                const receiptTX0 = signedTX0.transactionHash;
               
    
                console.log("approval receipt", receiptTX0);
    
                const tx = await arbitrage.methods.testFlashSwap(uniswapPair1, sushiswapPair, amountIn).send({ from: WHALE, gas: gasCost}).then(async function(res) {
                    console.log(res)
                })
    
                let balanceAfter = await token0.methods.balanceOf(arbitrage.options.address).call()
                balanceAfter = balanceAfter / 10 ** 18;
                console.log("Token balance before arb: " + balanceAfter);
    
            } catch (err) {
    
                console.error(err);
            }
        
        }catch (error) {

            console.error(error);
        }
    
}

async function getBuySellQuotes(uniswapPair, sushiswapPair) {

    var baseTokenSmaller = await flashBot.methods.isbaseTokenSmaller(uniswapPair, sushiswapPair).call();
    baseTokenSmaller = baseTokenSmaller[0]

    var baseToken;
    
    if (baseTokenSmaller) {

        baseToken = await uniswapPairContract.methods.token0().call()
    } else {

        baseToken = await uniswapPairContract.methods.token1().call();
    }
    var orderedReserves = await flashBot.methods.getOrderedReserves(uniswapPair, sushiswapPair, baseTokenSmaller).call();
    orderedReserves = orderedReserves[2];
    const lowerPricePool = orderedReserves[0];
    const higherPricePool = orderedReserves[1];

    // borrow quote token on lower price pool, // sell borrowed quote token on higher price pool
    var borrowAmount = web3.utils.toWei(amountToTradeInEth.toString(), "Ether");
    var debtAmount = await registry.uniswapRouterContract.methods.getAmountIn(borrowAmount, orderedReserves[0], orderedReserves[1]).call();
    var baseTokenOutAmount = await registry.uniswapRouterContract.methods.getAmountOut(borrowAmount, orderedReserves[3], orderedReserves[2]).call();
    
    
    return [ baseTokenOutAmount, debtAmount, baseToken, lowerPricePool, higherPricePool];
}

// FindArbitrageOpportunity("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F");

const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 10000 // 8 Seconds
priceMonitor = setInterval(async () => { await FindArbitrageOpportunity("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F") }, POLLING_INTERVAL)