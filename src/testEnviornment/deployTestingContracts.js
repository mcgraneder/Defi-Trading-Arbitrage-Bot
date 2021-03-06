//this script uses ganach-cli to also fork the mainnet enviornemnt. Here we use the 
//ERC20 library to create two token, mint them both and create a pairs on uniswap and
//sushi swap. Here we add liquidty such that on uniswap TK0/TK1 => 2:1 and on sushiswap
//TK1/TK0 => 10:1. This effectivelu allws us to write a test script tesing our flashbot
//contract with these two dummy tokens

const Web3 = require('web3');
const Registry = require("../registry.js");
let = registry = new Registry()
const MP = require("../../build/contracts/TradeOrder.json")
const arb1 = require("../../build/contracts/FlashSwap.json");
var web3, myAccount, token0, token1, gasLimit, receipt, aux, token0Name, token0Symbol, token1Name, token1Symbol;
var uniswapRouterAbi, sushiswapRouterContract, uniswapRouterContract, arbitrage, maximumProfit;

async function createDummyTokenPools(amount0,amount1,amount2,amount3,amount4) {

    //load web3 and assign our account to ganache accountlist of 0
    loadWeb3();
    myAccount = (await web3.eth.getAccounts())[0]

    //call functions to deploy two tokens and mint 100000 of each to
    //our account
    await deployDummyTokens();
    await mintDummyTokens(amount0,amount1,amount2,amount3,amount4)

    //convert the amounts we pass in to Wei usingBig number to prevent BN error
    amount0 = web3.utils.toWei(web3.utils.toBN(amount0),'ether')
    amount1 = web3.utils.toWei(web3.utils.toBN(amount1),'ether')
    amount2 = web3.utils.toWei(web3.utils.toBN(amount2),'ether')
    amount3 = web3.utils.toWei(web3.utils.toBN(amount3),'ether')
    //specify deadline for uniswap functions
    const deadline = Math.round(Date.now()/1000)+60*60 

    //here we create token pairs on uniswap and sushiswap and add liqudity to both pools
    await addLiquidity(amount0,amount1, deadline, uniswapRouterContract, token0Symbol, token1Symbol);
    await addLiquidity(amount2,amount3, deadline, sushiswapRouterContract, token1Symbol, token0Symbol);

    //lastly we deploy the flashbot contract
    gasLimit = await arbitrage.deploy({arguments: [myAccount]}).estimateGas()
    receipt = await arbitrage.deploy({arguments: [myAccount]}).send({from: myAccount,gas: gasLimit})
    arbitrage.options.address = receipt._address


    gasLimit = await maximumProfit.deploy().estimateGas()
    receipt = await maximumProfit.deploy().send({from: myAccount,gas: gasLimit})
    maximumProfit.options.address = receipt._address

    console.log("arbitrage contract deployed at " + arbitrage.options.address)
    console.log("maximumProfit contract deployed at " + maximumProfit.options.address)

    return [ token0.options.address, token1.options.address ]
}

async function loadWeb3() {

    const localProviderUrl = 'http://127.0.0.1:8545'
    const localProvider = new Web3.providers.WebsocketProvider(localProviderUrl)
    web3 = new Web3(localProvider)

    //initilaise the uniswap and sushiawap router/factory contracts
    uniswapRouterAbi = require('@uniswap/v2-periphery/build/IUniswapV2Router02.json')
    uniswapRouterContract = new web3.eth.Contract(uniswapRouterAbi.abi,'0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D')
    sushiswapRouterContract = new web3.eth.Contract(uniswapRouterAbi.abi,'0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F')
    arbitrage = new web3.eth.Contract(registry.FlashBotContract.abi,'',{data: registry.FlashBotContract.bytecode})
    maximumProfit = new web3.eth.Contract(registry.MaximumProfitAddress.abi, '', {data: registry.MaximumProfitAddress.bytecode});
    

}

async function deployDummyTokens() {

    gasLimit, receipt, aux

    //create two new toen contracts using ERC20PResetMinterPauser so that we have minter role
    token0 = new web3.eth.Contract(registry.ERC20PresetMinterPauser.abi,'',{data:registry.ERC20PresetMinterPauser.bytecode})
    token1 = new web3.eth.Contract(registry.ERC20PresetMinterPauser.abi,'',{data:registry.ERC20PresetMinterPauser.bytecode})

    //deploy token 0 we estimate the gas first then deploy and set address
    gasLimit = await token0.deploy({arguments: ['DummyToken0', 'DMYTKN0']}).estimateGas()
    receipt = await token0.deploy({arguments: ['DummyToken0', 'DMYTKN0']}).send({from: myAccount,gas: gasLimit})
    token0.options.address = receipt._address
    registry.token0 = receipt._address

    //deploying token1
    gasLimit = await token1.deploy({arguments: ['DummyToken1', 'DMYTKN1']}).estimateGas()
    receipt = await token1.deploy({arguments: ['DummyToken1', 'DMYTKN1']}).send({from: myAccount,gas: gasLimit})
    token1.options.address = receipt._address
    registry.token1 = receipt._address;

    //here we need to order the tokens by size fo rthe uniswap liquidity function
    //this is a requirement by uniswao
    if (token0.options.address>token1.options.address) {aux=token0; token0=token1; token1=aux}
    
    //prints token ifno
    token0Name = await token0.methods.name().call()
    token0Symbol = await token0.methods.symbol().call()
    token1Name = await token1.methods.name().call()
    token1Symbol = await token1.methods.symbol().call()
    console.log(
        `\n${token0Name} (${token0Symbol}) {token0}\n`+
        `Deployed at ${token0.options.address}\n\n`+
        `${token1Name} (${token1Symbol}) {token1}\n`+
        `Deployed at ${ token1.options.address}\n`
    )
}

async function mintDummyTokens(amount0,amount1,amount2,amount3,amount4) {

    //minting token0 again we specify the stimated gas for doing so
    //then minting 100000 token0
    amount4 = web3.utils.toWei(web3.utils.toBN(amount4))
    gasLimit = await token0.methods.mint(myAccount, BigInt(amount4 * 3)).estimateGas()
    await token0.methods.mint(myAccount, BigInt(amount4 * 3)).send({from:myAccount, gas:gasLimit})
    console.log(`${web3.utils.fromWei(amount4)} ${token0Symbol} minted`)
    
    //minting token1 on sushiswap, minting 100000
    gasLimit = await token1.methods.mint(myAccount, BigInt(amount4 * 3)).estimateGas()
    await token1.methods.mint(myAccount, BigInt(amount4 * 3)).send({from:myAccount, gas:gasLimit})
    console.log(`${web3.utils.fromWei(amount4)} ${token1Symbol} minted\n`)
}

async function addLiquidity(amount0,amount1, deadline, exchange, token0Symbol, token1Symbol, ) {

    //here we create the token pairs. thuis is a genral function so we call this and specifiy the
    //exchange address we want to mint on. we need to approve the exchange to sepnd token on
    //our behalf before we can add liquidity. 
    gasLimit = await token0.methods.approve(exchange.options.address,amount0).estimateGas()
    await token0.methods.approve(exchange.options.address,amount0).send({from:myAccount, gas:gasLimit})
    gasLimit = await token1.methods.approve(exchange.options.address,amount1).estimateGas()
    await token1.methods.approve(exchange.options.address,amount1).send({from:myAccount, gas:gasLimit})

    //add liquidiyt for both tokens in this example sushi has 10:1 and uni has 2:1 
    gasLimit = await exchange.methods.addLiquidity(token0.options.address, token1.options.address, amount0, amount1, 0, 0, myAccount, deadline).estimateGas()
    await exchange.methods.addLiquidity( token0.options.address,  token1.options.address, amount0,  amount1, 0, 0, myAccount, deadline).send({from:myAccount,gas:gasLimit})
    
    console.log(
        `Uniswap ${token0Symbol}/${token1Symbol} pair created\n`+
        `Reserves: ${web3.utils.fromWei(amount0)} ${token0Symbol} | ${web3.utils.fromWei(amount1)} ${token1Symbol}\n`+
        `Price: ${(amount0/amount1).toFixed(2)} ${token0Symbol}/${token1Symbol}\n`
    )
}


//we can choose to deply this script two ways, the first is the case where
//token 0 is cheaper on sushiswap
if (process.argv[2]=='-TK0/TK1'){ 

    createDummyTokenPools(10e2,5e2,1e4,10e4,1e6).then(async function(res) {

        //here we have to aqctually ad the basetoken to our flashbot contract
        //so that we can order the reserves in the bot script
        gasLimit = await arbitrage.methods.addBaseToken(res[1]).estimateGas()
        await arbitrage.methods.addBaseToken(res[1]).send({from: myAccount})
        console.log(await arbitrage.methods.getBaseTokens().call())
        console.log("base token added to flashbot contract");
        
    }).then(()=>{process.exit(0)});

//the second is the case where token 1 is cheaper on uniswap
} else if(process.argv[2] == "-TK1/TK0") { //case B: token1 cheaper on uniswap

    createDummyTokenPools(1e2,10e2,3e4,10e4,1e6).then(async function(res) {

        gasLimit = await arbitrage.methods.addBaseToken(res[0]).estimateGas()
        await arbitrage.methods.addBaseToken(res[0]).send({from: myAccount})
        console.log(await arbitrage.methods.getBaseTokens().call())
        console.log("base token added to flashbot contract");
        
    }).then(()=>{process.exit(0)});

//exit script if user specifys an non-option
} else {

    console.log("invalid option");
    process.exit(0);
}

