const Web3 = require("web3");
var web3;

//ABIS
const UniswapFactory = require("../node_modules/@uniswap/v2-core/build/IUniswapV2Factory.json");
const UniswapV2Pair = require("../node_modules/@uniswap/v2-core/build/IUniswapV2Pair.json");
const UniswapRouter = require("./contractBuilds/IUniswapV2Router02.json");
const Utils = require("./contractBuilds/Utils.json");
const IERC20 = require("../node_modules/@uniswap/v2-core/build/ERC20.json");
const crowSwapFactory = require("./contractBuilds/CrowSwapFactory.json");
const shibaswapFactory = require("./contractBuilds/ShibaSwapFactory.json");
const { sqrt } = require("@sushiswap/sdk");
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
const shibaSwapFactoryAddress = "0x115934131916C8b277DD010Ee02de363c09d037c";

const token01 = "0x514910771af9ca656af840dff83e8264ecf986ca"; //Link
const token0 = "0x6b175474e89094c44da98b954eedeac495271d0f"; //Link
const token1 = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" //WETH
const tokenAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
const pairName = "ETH/DAI";


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

var state;


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

function initialiseFactoryContracts() {

    uniswapFactoryContract = new web3.eth.Contract(UniswapFactory.abi, UniswapFactoryAddress);
    uniswapRouterContract = new web3.eth.Contract(UniswapRouter.abi, UniswapRouterAddress);
    sushiswapFactoryContract = new web3.eth.Contract(UniswapFactory.abi, SushiSwapFactoryAddress);
    sushiswapRouterContract = new web3.eth.Contract(UniswapRouter.abi, SushiSwapRouterAddress);
    sakeswapFactoryContract = new web3.eth.Contract(UniswapFactory.abi, sakeswapFactoryAddress);
    sakeswapRouterContract = new web3.eth.Contract(UniswapRouter.abi, sakeswapRouterAddress);
    crowswapFactoryContract = new web3.eth.Contract(crowSwapFactory, crowswapFactoryAddress);
    shibaswapFactoryContract = new web3.eth.Contract(shibaswapFactory, shibaSwapFactoryAddress);
    utils = new web3.eth.Contract(Utils.abi, "0xE78941610Ffef0eEA391BAe6d842175E389973E9");
}

loadWeb3();
loadBlockchainData();
FindArbitrageOpportunity()


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

    state = { blockNumber: undefined, token0: undefined, token1: undefined};

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

    const newBlockEvent = web3.eth.subscribe("newBlockHeaders");

    newBlockEvent.on("connected", () => {
        console.log("/nArbitrage bot listening/n");
    });

    let skip = true;
    newBlockEvent.on("data", async function(blockHeader) {

        skip != skip;
        if (!skip) return;

        try {
            //we need to declate some reserve variables across the exchanges
            //to calculate price data
            var uniswapReserve, sushiswapReserve, sakeswapReserve, crowswapReserve, shibaswapReserve;

            //next we use the reserves to obtain the price data
            uniswapReserve = await uniswapPairContract.methods.getReserves().call();
            uniswapReserve0 = uniswapReserve[0];
            uniswapReserve1 = uniswapReserve[1];
            var priceETH = (uniswapReserve0 / uniswapReserve1);

            uniswapReserve = await uniswapPairContract1.methods.getReserves().call();
            uniswapReserve0 = uniswapReserve[0];
            uniswapReserve1 = uniswapReserve[1];

            sushiswapReserve = await sushiSwapPairContract.methods.getReserves().call();
            sushiswapReserve0 = sushiswapReserve[0];
            sushiswapReserve1 = sushiswapReserve[1];

            const aToB =  ((uniswapReserve0 * sushiswapReserve1) /  uniswapReserve1) < sushiswapReserve0;
            const invariant = (uniswapReserve0 * uniswapReserve1);

            const leftSide = sqrt((invariant * 1000) * (aToB ? sushiswapReserve0 : sushiswapReserve1) / (aToB ? sushiswapReserve1 : sushiswapReserve0) * 997);
            const rightSide = (aToB ? uniswapReserve0 *1000 : uniswapReserve1 * 1000) / 997;

            const amountIn = leftSide - rightSide;
            console.log(amountIn);
            if (amountIn <= 0) {
                
                console.log("There is no arbitrage opportunity available");
                return;
            }
            

        }catch (error) {

            console.error(error);
        }
    })

}

