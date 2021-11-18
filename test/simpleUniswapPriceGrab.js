//i used this file to sanity check the fsct that cforking mainnet prevents my scripts from
//detecing sync events from uniswap reserves and also i cannot detect ethereum new block events
//ignore this file its it was juts part of debugging

const Big = require("big.js");
const UniswapV2Pair = require("../build/contracts/IUniswapV2Pair.json");
require("dotenv").config({});
const Web3 = require('web3');

// loading env vars

const WSS_URL = "http://127.0.0.1:8545"; //doesnt work for updating prcies
const WSS_URL = "wss://mainnet.infura.io/v3/ba5ee6592e68419cab422190121eca4c"; //works for updsting prices
const HTTP_URL = "https://mainnet.infura.io/v3/ba5ee6592e68419cab422190121eca4c" //dont use http for sync events

const web3ws = new Web3(WSS_URL);
const web3http = new Web3(HTTP_URL)


module.exports = { web3http, web3ws }
// define address of Pair contract
const PAIR_ADDR = "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11";
const PAIR_NAME = "ETH/DAI";
const INTERVAL = 1000;

// create web3 contract object
const PairContractHTTP = new web3http.eth.Contract(
    UniswapV2Pair.abi,
    PAIR_ADDR
);
const PairContractWSS = new web3ws.eth.Contract(
    UniswapV2Pair.abi,
    PAIR_ADDR
);

// reserve state
const state = {
    blockNumber: undefined,
    token0: undefined,
    token1: undefined,
};

// function to get reserves
const getReserves = async (ContractObj) => {
    // call getReserves function of Pair contract
    const _reserves = await ContractObj.methods.getReserves().call();

    // return data in Big Number
    return [Big(_reserves.reserve0), Big(_reserves.reserve1)];
};


const updateState = (data) => {
    // update state
    state.token0 = Big(data.returnValues.reserve0);
    state.token1 = Big(data.returnValues.reserve1);
    state.blockNumber = data.blockNumber;

    // calculate price and print
    console.log(
        `${state.blockNumber} Price ${PAIR_NAME} : ${state.token0
            .div(state.token1)
            .toString()}`
    );
};

const mainWSS = async () => {
    // fetch current state of reserves
    [state.token0, state.token1] = await getReserves(PairContractWSS);

    // get current block number
    state.blockNumber = await web3ws.eth.getBlockNumber();

    // subscribe to Sync event of Pair
    PairContractWSS.events.Sync({}).on("data", (data) => updateState(data));

    // calculate price and print
    console.log(
        `${state.blockNumber} Price ${PAIR_NAME} : ${state.token0
            .div(state.token1)
            .toString()}`
    );
};

mainWSS();