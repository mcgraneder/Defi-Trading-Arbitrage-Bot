const Web3 = require("web3");
var web3;

//ABIS
const UniswapFactory = require("../node_modules/@uniswap/v2-core/build/IUniswapV2Factory.json");
const UniswapV2Pair = require("../node_modules/@uniswap/v2-core/build/IUniswapV2Pair.json");
const UniswapRouter = require("./contractBuilds/IUniswapV2Router02.json");
const Utils = require("./contractBuilds/Utils.json");
const IERC20 = require("./contractBuilds/IERC20.json");
const crowSwapFactory = require("./contractBuilds/CrowSwapFactory.json");
const crowSwapRouter = require("./contractBuilds/CrowDefiSwapPair.json");
const shibaswapFactory = require("./contractBuilds/ShibaSwapFactory.json");
const { sqrt, Rounding } = require("@sushiswap/sdk");
// const { utils } = require("ethers");

//defining address parameters. 
const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
const WETH1 = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const SushiSwapFactoryAddress = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";
const SushiSwapRouterAddress = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
const UniswapFactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const UniswapRouterAddress = "0xf164fC0Ec4E93095b804a4795bBe1e041497b92a";
const sakeswapFactoryAddress = "0x75e48C954594d64ef9613AeEF97Ad85370F13807";
const sakeswapRouterAddress = "0x9C578b573EdE001b95d51a55A3FAfb45f5608b1f";
const crowswapFactoryAddress = "0x9DEB29c9a4c7A88a3C0257393b7f3335338D9A9D";
const crowSapRouterAddress = "0xa856139af24e63cc24d888728cd5eef574601374";
const shibaSwapFactoryAddress = "0x115934131916C8b277DD010Ee02de363c09d037c";

const token01 = "0x514910771af9ca656af840dff83e8264ecf986ca"; //Link
const token0 = "0x6b175474e89094c44da98b954eedeac495271d0f"; //Link
const token1 = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" //WETH
const tokenAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
const pairName = "ETH/DAI";
var amountToTradeInEth = 1;
const validPeriod = 5;
var eth;
var link;

//here we will initialise the needed smart contracts aswell as some vars
//PAIR CONTRACTS
var uniswapPairContract, sushiSwapPairContract, sushiSwapPairContract1, sakeswapPairContract, crowswapPairContract, shibaswapPairContract, utils;
//FACTORY CONTRACTS
var uniswapFactoryContract, sushiswapFactoryContract, sakeswapFactoryContract, crowswapFactoryContract, shibaswapFactoryContract;
//ROUTER CONTRACTS
var uniswapRouterContract, sushiswapRouterContract, akeswapRouterContract;
//TOKEN PAIRS ACROSS LISTED EXCHANGES
var uniswapPair0, uniswapPair1, sushiswapPair, sakeswapPair, crowswapPair, shibaswapPair;
//HELPER VARS
var userAccount, tokenName0, tokenName1, tokenSymbol0, tokenSymbol1;

//initialise web3

async function loadWeb3() {
   
    const provider = "wss://mainnet.infura.io/ws/v3/ba5ee6592e68419cab422190121eca4c"
    web3 = new Web3(provider);
   
    const accounts = await web3.eth.getAccounts()
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

async function FindArbitrageOpportunity() {

    const newBlockEvent = web3.eth.subscribe("newBlockHeaders");
    newBlockEvent.on("connected", () => {console.log("/nArbitrage bot listening/n");});

    let skip = true;
    newBlockEvent.on("data", async function(blockHeader) {

        skip != skip;
        if (!skip) return;

        try {
           
            // const[ uniswapWETHDaiReserve0, uniswapWETHDaiReserve1, uniswapWETHDaiPrice ] = await getExchangesReserves(uniswapPairContract1);
            var [uniswapReserve0, uniswapReserve1, uniswapPrice] = await getExchangesReserves(uniswapPairContract);
            var [sushiswapReserve0, sushiswapReserve1,sushiswapPrice] = await getExchangesReserves(sushiSwapPairContract);
            var [sakeswapReserve0, sakeswapReserve1,sakeswapPrice] = await getExchangesReserves(sakeswapPairContract);
            var [crowswapReserve0, crowswapReserve1,crowswapPrice] = await getExchangesReserves(crowswapPairContract);
            var [shibaswapReserve0, shibaswapReserve1,shibaswapPrice] = await getExchangesReserves(shibaswapPairContract);

            console.log("Uniswap reserves: " + uniswapReserve0, uniswapReserve1);           
            console.log("sushiswap reserves: " + sushiswapReserve0, sushiswapReserve1);
            console.log("sakeswap reserves: " + sakeswapReserve0, sakeswapReserve1);
            console.log("crowswap reserves: " + crowswapReserve0, crowswapReserve1);
            console.log("shibaswap reserves: " + shibaswapReserve0, shibaswapReserve1+ "\n")

            console.log("The uniswap price is: " + uniswapPrice);
            console.log("The sushiswap price is: " + sushiswapPrice);
            console.log("The sakeswap price is: " + sakeswapPrice);
            console.log("The crowswap price is: " + crowswapPrice);
            console.log("The shibaswap price is: " + shibaswapPrice + "\n");

            const amountIn = web3.utils.toWei(amountToTradeInEth.toString(), "Ether");
            var uniAmountOut = await getExpectedReturnOnUniswap(amountIn, uniswapReserve0, uniswapReserve1);
            var sushiAmountIn = await getMinimumRequiredTradeAmount(amountIn, sushiswapRouterContract, sushiswapReserve1, sushiswapReserve0);
            var sakeAmountIn = await getMinimumRequiredTradeAmount(amountIn, sakeswapRouterContract, sakeswapReserve1, sakeswapReserve0);
            var crowAmountIn = await getMinimumRequiredTradeAmount(amountIn, uniswapRouterContract, crowswapReserve1, crowswapReserve0);
            var shibaAmountIn = await getMinimumRequiredTradeAmount(amountIn, uniswapRouterContract, shibaswapReserve1, shibaswapReserve0);

            const sushiPrice = 1 / (sushiAmountIn / amountIn);
            const sakePrice = 1 / (sakeAmountIn / amountIn);
            const crowPrice = 1 / (crowAmountIn / amountIn);
            const shibaPrice = 1 / (shibaAmountIn / amountIn);

            const sushiDifference = uniAmountOut - sushiPrice;
            const sakeDifference = uniAmountOut - sakePrice;
            const crowDifference = uniAmountOut - crowPrice;
            const shibaDifference = uniAmountOut - shibaPrice;
          
            const sushiTotalDifference = sushiDifference * Math.round(amountIn / 10 ** 18);
            const sakeTotalDifference = sakeDifference * Math.round(amountIn / 10 ** 18);
            const crowTotalDifference = crowDifference * Math.round(amountIn / 10 ** 18);
            const shibaTotalDifference = shibaDifference * Math.round(amountIn / 10 ** 18);

            const tokenPath = [token0, token1];
            const deadline = Math.round(Date.now() /  1000 + validPeriod * 60);

            // const gasNeeded0 = (0.03 * 10 ** 6) * 2;
            const gasNeeded0 = await link.methods.approve(UniswapRouterAddress, amountIn).estimateGas();
            console.log("Required gas is: " + gasNeeded0);
            const gasNeeded1 = (0.15 * 10 ** 6) * 2;
            // await eth.methods.approve(UniswapRouterAddress, amountIn).send({from: userAccount});
            // const gasNeeded1 = await uniswapRouterContract.methods.swapExactTokensForTokens(amountIn, 0, tokenPath, userAccount, deadline).estimateGas();
            // console.log("Required1 gas is: " + gasNeeded1)

            const gasNeeded = gasNeeded0 + gasNeeded1;
            const gasPrice = await web3.eth.getGasPrice();
            const gasCost = Number(gasPrice) * gasNeeded / 10 ** 18;

            // const price = (uniswapReserve0 / uniswapReserve1);
            const sushiProfit = (sushiTotalDifference * uniswapPrice) - gasCost;
            const sakeProfit = (sakeTotalDifference * uniswapPrice) - gasCost;
            const crowProfit = (crowTotalDifference * uniswapPrice) - gasCost;
            const shibaProfit = (shibaTotalDifference * uniswapPrice) - gasCost;
            const profitArray = [sushiProfit, sakeProfit, crowProfit, shibaProfit];
            const bestProfit = Math.max(...profitArray);
           
            console.log("your expected Sushi profit after gas Consideration is: " + web3.utils.fromWei(sushiProfit.toString(), "Ether"));
            console.log("your expected sake profit after gas Consideration is: " + web3.utils.fromWei(sakeProfit.toString(), "Ether"));
            console.log("your expected crow profit after gas Consideration is: " + web3.utils.fromWei(crowProfit.toString(), "Ether"));
            console.log("your expected Sushi shiba after gas Consideration is: " + web3.utils.fromWei(shibaProfit.toString(), "Ether") + "\n");

            console.log("The best trade is " + web3.utils.fromWei(bestProfit.toString(), "Ether"));

            

        }catch (error) {

            console.error(error);
        }
    })

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

async function getExchangeTokenPairPrice() {

    uniswapPair0 = await uniswapFactoryContract.methods.getPair(WETH1, DAI ).call();
    uniswapPair1 = await uniswapFactoryContract.methods.getPair(token0, token1 ).call();
    sushiswapPair = await sushiswapFactoryContract.methods.getPair(token0, token1 ).call();
    sakeswapPair = await sakeswapFactoryContract.methods.getPair(token1, token0 ).call();
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
async function getExchangesReserves(contractName) {

    //next we use the reserves to obtain the price data
    var reserve = await contractName.methods.getReserves().call();
    var reserve0 = reserve[0];
    var reserve1 = reserve[1];

    var assetPrice = (reserve0 / reserve1);

    console.log(reserve0);

    return [reserve.reserve0, reserve.reserve1, assetPrice];

}

async function getExpectedReturnOnUniswap(amountIn, uniswapReserve0, uniswapReserve1) {

    var expectedReturnAmount = await uniswapRouterContract.methods.getAmountOut(BigInt(amountIn), uniswapReserve0, uniswapReserve1).call();

    return expectedReturnAmount;
}

async function getMinimumRequiredTradeAmount(amountIn, contractName, reserve1, reserve0) {

    var minimumAmountIn = await contractName.methods.getAmountOut(BigInt(amountIn), reserve1, reserve0).call();

    return minimumAmountIn;
}

// function calculateExchangePriceData()
// const uniAmountOut = await uRouter.methods.getAmountOut(amountIn,uReserve0 ,uReserve1).call()


loadWeb3();
loadBlockchainData();
FindArbitrageOpportunity()