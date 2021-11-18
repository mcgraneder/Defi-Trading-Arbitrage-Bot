//IMPORTS 
const Web3 = require("web3");
const express = require("express");
const http = require("http");
const cors = require('cors')
const path = require("path");
const app = express();
require('colors');
const { LocalStorage } = require("node-localstorage");
var localStorage = new LocalStorage('./scratch');
const Registry = require("./registry.js");
let registry = new Registry();
require('colors');
const { transactionLogger, priceDataLogger, generalLogger } = require('./logger');

//GLOBAL VARS
var web3;
var counter = 0;
const amountToTradeInEth = 1;
const validPeriod = 5;
var uniswapPair , sushiswapPair, sakeswapPair, crowswapPair, shibaswapPair;
var server, PORT;
var pairName = "DAI/WETH";
const WHALE = "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE";

//init function loads web3.js which allows us to interact with
//solidity smart contracts
async function loadWeb3() {
   
    //connect to RPC node or whatever provider
    const provider = new Web3.providers.WebsocketProvider("http://127.0.0.1:8545")
    web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts()
    generalLogger.info(`connected to ETHEREUM blockchain using Infura mainnet connection`)

    //this account is a WHALE account nnd used for testing only
    userAccount = "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE";
    
    //establish server with express we will log information
    //to localhost at port 5000
    PORT = process.env.PORT || 5000
    server = http.createServer(app).listen(PORT, () => console.log(`Listening on ${ PORT }`))
    app.use(express.static(path.join(__dirname, 'public')))
    app.use(cors({credentials: true, origin: '*'}));
    app.get("/", function(req, res) {

        res.send({ uniswapBuy: "hello" });
    });
}

//loads all blockhain data contraxts etc
async function loadBlockchainData() {

    //sort tokens uniswap uses sorted tokens
    if (registry.DAI > registry.WETH) {

        aux = registry.DAI;
        registry.DAI = registry.WETH;
        registry.WETH = aux;
    }

    //function which gets the base DAI/WETH price
    //on all exchanges uni, sushi, crow, sake, shiba
    getExchangeTokenPairPrice();
}

async function getExchangeTokenPairPrice() {

    // initialise DAI & WETH Token interfaces to access ERC20 functions
    //also initalise the flashbot smart contract and its helper contract
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

    generalLogger.info(`initalised exchange pair contratcs`)
}

//helper function to get inital price data
async function getTokenPriceFromPoolReserves(contract, exchangeName) {

    var dai, token1, blockNumber;
    [dai, token1] = await getReserves(contract)
    blockNumber = await web3.eth.getBlockNumber();
    contract.events.Sync({}).on("data", (data) => updateState(data, exchangeName));

    console.log("Current Block: " + blockNumber + " The price of: " + pairName +  " on " + exchangeName + " is: "  + (dai / token1).toString());
    priceDataLogger.info(`${pairName} on ${exchangeName}: -> ${dai / token1}`)
}

//helper function for getTokenPriceFromPoolReserves() to get 
//token pair reserves on the exchanges
async function getReserves(contract) {

    const reserves = await contract.methods.getReserves().call();
    return [reserves.reserve0, reserves.reserve1];
}

//helper function for getTokenPriceFromPoolReserves() which
//updates the token prices
async function updateState(data, exchangeName) {

    
    var dai = data.returnValues.reserve0;
    var token1 = data.returnValues.reserve1;
    var blockNumber = data.blockNumber;

    console.log("Current Block: " + blockNumber + " The price of: " + pairName + "on" + exchangeName +  "is: " + (tojen0 / token1).toString());
}

//calli inits before starting main arb
loadWeb3();
loadBlockchainData();


//main arb function 
//we will look for profit every two blockss because (two transactions made)
async function FindArbitrageOpportunity(exchange0, exchange1, exchange0Pair, exchange1Pair) {

    let skip = true;
    console.log("hey")
    const newBlockEvent = web3.eth.subscribe("newBlockHeaders");
    newBlockEvent.on('connected', () =>{console.log('\nBot listening!\n')})
    generalLogger.info(`aribtrage bot start run`)

    //whenever i fork mainnet using either alchemy and or infura i cannot
    //detetc events so the lines commented out would be substitued on real mainnet
    //for now i just call the arb bot every 8 seconds

    //contract.events.Sync({}).on("data", (data) =>
    //newBlockEvent.on('data', async function(blockHeader) {
   
        try {

            if (counter != 0 ) {

                getTokenPriceFromPoolReserves(uniswapPairContract, "Uniswap");
                getTokenPriceFromPoolReserves(sushiSwapPairContract, "SushiSwap");
                getTokenPriceFromPoolReserves(sakeswapPairContract, "SakeSwap");
                getTokenPriceFromPoolReserves(crowswapPairContract, "CrowSwap");
                getTokenPriceFromPoolReserves(shibaswapPairContract, "ShibaSwap");
            }
            counter += 1;

            //get the reserves for supported exchanges
            pair0Reserve = await exchange0.methods.getReserves().call();
            pair1Reserve = await exchange1.methods.getReserves().call();
           
            //tuple unpack the token reserves reserve[0] == registry.DAI, reserve[1] ==weth
            var pair0Reserve0 = pair0Reserve[0];
            var pair0Reserve1 = pair0Reserve[1];

            var pair1Reserve0 = pair1Reserve[0];
            var pair1Reserve1 = pair1Reserve[1];

            //calculate dai and weth prices from exchange reserves
            var PriceEth = (pair0Reserve1 / pair0Reserve1);
            var exchange0ETHPrice = (pair0Reserve1 / pair0Reserve1);
            var exchange0ETHPrice = (1 / exchange0ETHPrice);

            //calculate dai and weth prices from exchange reserves
            var exchange1ETHPrice = (pair1Reserve0 / pair1Reserve1);
            var exchange1DAIRate = (1 / exchange1ETHPrice);

            //now that we have the prices of registry.DAI/WETH on the different exchanges we can calculate
            //the pair price difference between each exchange and take the most profitiable to make
            //our trade. we do this with the getBuySellQuote function below
            var amountIn = web3.utils.toWei("100", "Ether")
            const returnValues = await getBuySellQuotes(exchange0, exchange1, exchange0Pair, exchange1Pair, amountIn);
            var outAmount = returnValues[0];
            //how much we need to pay back flashloan
            var debt = returnValues[1];
            priceDataLogger.info(`\n\nUser requesting to borrow ${amountToTradeInEth} ETH`)
        
            //declare some helper vars that we need to calculate expected profit from arb
            var totalDifference, deadline, estimatedGasForApproval, estimatedGasForFlashLoan, totalEstimatedGas, gasCost;
            
            //if the price difference betwween the exchange we borrow from is less than the
            //price from the exchange we sell to the exit script, no arb available
            console.log((outAmount / 10**18) - (debt/10**18))
            var exchange0Exchange1PriceDifference = (outAmount / 10**18) - (debt/10**18)
            priceDataLogger.info(`Exhnage price difference -> ${(outAmount / 10**18) - (debt/10**18)} = ${exchange0Exchange1PriceDifference}`)

            if (exchange0Exchange1PriceDifference <= 0) {

                console.log(`No arbitrage exists for this current trade\n\n\n`);
                console.log(exchange0Exchange1PriceDifference)
                priceDataLogger.info(`No profit fo this trade`)
                return                        
            } 

            //the total difference is this difference times the amount we borrow
            totalDifference = exchange0Exchange1PriceDifference * web3.utils.fromWei(amountIn.toString(), "Ether");
            deadline = Math.round(Date.now() /  1000 + validPeriod * 60);
            priceDataLogger.info(`total difference before gas -> ${totalDifference}`)

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
            priceDataLogger.info(`total gas to execute trades -> ${gasCost} Wei`)
    
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

                priceDataLogger.info(`total estimated profit -> ${totalProfit}\n\n\n`)
                console.log(`\nThere is no profit to be made form this trade after the cost of gas and slippage your loss is ` + `${Math.abs(totalProfit)}`.red + `\nTry increasing your trade amount`);
                return;

            } else {
                
                priceDataLogger.info(`No profit estimated after gas  -> ${totalProfit}\n\n\n`)
                console.log(`\nThe total estimated profit is ${totalDifference} - ${totalEstimatedGas} =` + ` ${totalProfit} ETH`.green);
                console.log(`\n...Estimated profit expected. Preparing to execute flashloan. preparing to execute flashloan..`);
            }

            //if we have a profit then we can attemopt to call the flashswap and exeecute the trsade. see smart contract FlashBot.sol
            //note that we need a try catch block because our profit estimation is at best an estimation we may get frontrunned or the price
            //may change
            try {

                //get balance before
                let balancefore = await weth.methods.balanceOf(flashBot.options.address).call()
                balancefore = balancefore / 10 ** 18;
                priceDataLogger.info(`balance before trade -> ${balancefore}`)
                
                //approve the uniswap router to spend tokens on our behalf
                const transaction0 = {from: WHALE, to: dai.options.address, gas: estimatedGasForApproval, data: dai.methods.approve(registry.UniswapRouterAddress, amountIn).encodeABI()}
                const signedTX0 = await web3.eth.sendTransaction(transaction0).on("error", (error) => {

                    console.error(error);
                    transactionLogger.info(`approval failed transaction reverted`)
                });

                const receiptTX0 = signedTX0.transactionHash;
                transactionLogger.info(`approved exchange to spend users tokens (Successful) -> TX receipt -> ${receiptTX0}`)
                
                console.log(`\nERC20 Approval transaction successful here is your receipt: ` + `\n\nApproval Receipt: ` + `${receiptTX0}\n`.green);
    
                //call the flashswap
                const tx = await flashBot.methods.testFlashSwap(exchange0Pair, exchange1Pair, amountIn).send({ from: WHALE, gas: estimatedGasForFlashLoan}).on("error", (error) => {

                    console.error(error);
                    transactionLogger.info(`flashswap failed transaction reverted (price data may have changed)`)
                });
    
                //get the balance after and see if trade was successful
                let balanceAfter = await dai.methods.balanceOf(flashBot.options.address).call()
                balanceAfter = balanceAfter / 10 ** 18;
                priceDataLogger.info(`balance before trade -> ${balanceAfter}\n\n`)
                
                console.log(`\n\nFlashswap successful your token balance before the trade was: ` + `${balancefore}`.green + ` your token balance after the trade is now: ${balanceAfter}`.green);

    
            } catch (err) {
    
            console.log(`\n\nThe flashswap failed unexpectedly. This may be due to a price change in between the time of your qoute and the time it took to execute the trade`.red);

                console.error(err);
            }
        
        }catch (error) {

            console.error(error);
        }
    // });

    newBlockEvent.on('error', console.error);
}

//this function gets the buy and sell qoutes fo rth etrad
async function getBuySellQuotes(exchange0, exchange1, exchange0Pair, exchange1Pair, borrowAmount) {

    ////we need to check if our base token is smaller this lets us determine the pool t borrow from, we alsways
    //borrow from smaller pool as we see bwlo
    var baseTokenSmaller = await flashBot.methods.isbaseTokenSmaller(exchange0Pair, exchange1Pair).call();
    baseTokenSmaller = baseTokenSmaller[0]

    var baseToken;
    
    //depending on result we set the base token to etehr dai or 1 (we take the loan out in this toen)
    if (baseTokenSmaller) {
        baseToken = await exchange0.methods.dai().call()
    } else {
        baseToken = await exchange1.methods.token1().call();
    }

    //next we order our reserves again borrow from smaller pool sell on higher
    var orderedReserves = await flashBot.methods.getOrderedReserves(exchange0Pair, exchange1Pair, baseTokenSmaller).call();
    console.log(orderedReserves[0])
    orderedReserves = orderedReserves[2];
    const lowerPricePool = orderedReserves[0];
    const higherPricePool = orderedReserves[1];

    // borrow quote token on lower price pool, // sell borrowed quote token on higher price pool.
    // var borrowAmount = web3.utils.toWei(amountToTradeInEth.toString(), "Ether");
    var debtAmount = await registry.uniswapRouterContract.methods.getAmountIn(borrowAmount, orderedReserves[0], orderedReserves[1]).call();
    var baseTokenOutAmount = await registry.uniswapRouterContract.methods.getAmountOut(borrowAmount, orderedReserves[3], orderedReserves[2]).call();
    
    return [ baseTokenOutAmount, debtAmount, baseToken, lowerPricePool, higherPricePool];
}


const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 10000 // 10 Seconds

if (process.argv[2] == "uni-sushi") {

    setTimeout(function(){
        priceMonitor = setInterval(async () => { await FindArbitrageOpportunity(uniswapPairContract, sushiSwapPairContract, uniswapPair, sushiswapPair);}, POLLING_INTERVAL)
    }, 4000);//wait 2 seconds
}

if (process.argv[2] == "uni-sake") {

    setTimeout(function(){
        priceMonitor = setInterval(async () => { await FindArbitrageOpportunity(uniswapPairContract, sakeswapPairContract, uniswapPair, sakeswapPair);}, POLLING_INTERVAL)
    }, 4000);//wait 2 seconds
}


if (process.argv[2] == "uni-crow") {

    setTimeout(function(){
        priceMonitor = setInterval(async () => { await FindArbitrageOpportunity(uniswapPairContract, crowswapPairContract, uniswapPair, crowswapPair);}, POLLING_INTERVAL)
    }, 4000);//wait 2 seconds
}

if (process.argv[2] == "uni-shiba") {

    setTimeout(function(){
        priceMonitor = setInterval(async () => { await FindArbitrageOpportunity(uniswapPairContract, shibaswapPairContract, uniswapPair, shibaswapPair);}, POLLING_INTERVAL)
    }, 4000);//wait 2 seconds
}



