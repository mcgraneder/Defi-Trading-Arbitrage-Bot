const BN = require("bn.js")
const IERC20 = require("../build/contracts/IERC20.json");
const Registry = require("../src/registry");
let registry = new Registry();
const MP = require("../build/contracts/MaximumProfit.json");
const Web3 = require('web3');
var web3

async function init() {

    loadWeb3()
    accounts = await web3.eth.getAccounts()
    const WHALE = "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE"
    const TOKEN_BORROW = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
    const DECIMALS = 6
    const FUND_AMOUNT = pow(10, DECIMALS).mul(new BN(2000000))
    const BORROW_AMOUNT = web3.utils.toWei("1", "Ether");
    
    // await sendEther(web3, accounts[0], WHALE, 1)

    // send enough token to cover fe

    // await token0.methods.transfer(accounts[0], 7000010000000).send({from: WHALE});
    // await token1.methods.transfer(accounts[0], 11000010000000).send({from: WHALE});

    const bal0 = await token0.methods.balanceOf(WHALE).call()
    const bal1 = await token1.methods.balanceOf(WHALE).call()

    // 7000010000000 11000010000000
    // const rec = await token0.methods.transfer(arbitrage.options.address, FUND_AMOUNT).send( {from: WHALE})
    console.log(bal0, bal1)


    const tx = await arbitrage.methods.testFlashSwap("0x657a19606aa8e29Ae9E6540f725b97DA82cF39Ab", "0x84752f7d32664468868E05Bd263F463f56801EDa", BORROW_AMOUNT).send({ from: WHALE, gas: 999999}).then(async function(res) {
        console.log(res)
    })
   
    const bal2 = await token0.methods.balanceOf(WHALE).call()
    const bal3 = await token1.methods.balanceOf(WHALE).call()

    // 7000010000000 11000010000000
    // const rec = await token0.methods.transfer(arbitrage.options.address, FUND_AMOUNT).send( {from: WHALE})
    console.log(bal2, bal3)
}

async function loadWeb3() {

    const localProviderUrl = 'http://127.0.0.1:8545'
    const localProvider = new Web3.providers.WebsocketProvider(localProviderUrl)
    web3 = new Web3(localProvider)

    maximumProfit = new web3.eth.Contract(MP.abi, "0x878776fB12aebeE13c2fCc2A090F4d569ef40757")
    arbitrage = new web3.eth.Contract(registry.FlashBotContract.abi, "0xaA300e25e887345dD36Bc8F7Ac9D5740faDBb86F")
    token0 = new web3.eth.Contract(IERC20.abi, "0x2Ec2E579e1F418cE4Da01fD6F819eCb84ef9Ea68");
    token1 = new web3.eth.Contract(IERC20.abi, "0xAa5AEc5F10e817B8C33A2097bb95cc5983A97B48");

    console.log(arbitrage)


    

}

init()

