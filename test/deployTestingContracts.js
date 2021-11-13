const Web3 = require('web3');
const Registry = require("../src/registry.js");
let registry = new Registry()

var web3, myAccount, token0, token1, gasLimit, receipt, aux, token0Name, token0Symbol, token1Name, token1Symbol;
var IRouter, sRouter, uRouter, arbitrager;

async function createDummyTokenPools(amount0,amount1,amount2,amount3,amount4) {

    loadWeb3();

    myAccount = (await web3.eth.getAccounts())[0]
    await deployDummyTokens();
    await mintDummyTokens(amount0,amount1,amount2,amount3,amount4)

    amount0 = web3.utils.toWei(web3.utils.toBN(amount0),'ether')
    amount1 = web3.utils.toWei(web3.utils.toBN(amount1),'ether')
    amount2 = web3.utils.toWei(web3.utils.toBN(amount2),'ether')
    amount3 = web3.utils.toWei(web3.utils.toBN(amount3),'ether')
    const deadline = Math.round(Date.now()/1000)+60*60 

    await addLiquidity(amount0,amount1, deadline, uRouter, token0Symbol, token1Symbol);
    await addLiquidity(amount2,amount3, deadline, sRouter, token1Symbol, token0Symbol);

    gasLimit = await arbitrage.deploy({arguments: [registry.UniswapFactoryAddress, registry.SushiSwapRouterAddress]}).estimateGas()
    receipt = await arbitrage.deploy({arguments: [registry.UniswapFactoryAddress, registry.SushiSwapRouterAddress]}).send({from: myAccount,gas: gasLimit})
    // console.log(arbitrage);
    arbitrage.options.address = receipt._address

    console.log("arbitrage contract deployed at " + arbitrage.options.address)
}

async function loadWeb3() {

    const localProviderUrl = 'http://127.0.0.1:8545'
    const localProvider = new Web3.providers.WebsocketProvider(localProviderUrl)
    web3 = new Web3(localProvider)

    IRouter = require('@uniswap/v2-periphery/build/IUniswapV2Router02.json')
    uRouter = new web3.eth.Contract(IRouter.abi,'0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D')
    sRouter = new web3.eth.Contract(IRouter.abi,'0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F')
    arbitrage = new web3.eth.Contract(registry.Arbitrage.abi,'',{data: registry.Arbitrage.bytecode})
    

}

async function deployDummyTokens() {

    gasLimit, receipt, aux

    token0 = new web3.eth.Contract(registry.ERC20PresetMinterPauser.abi,'',{data:registry.ERC20PresetMinterPauser.bytecode})
    token1 = new web3.eth.Contract(registry.ERC20PresetMinterPauser.abi,'',{data:registry.ERC20PresetMinterPauser.bytecode})

    gasLimit = await token0.deploy({arguments: ['Pineapple', 'PNA']}).estimateGas()
    receipt = await token0.deploy({arguments: ['Pineapple', 'PNA']}).send({from: myAccount,gas: gasLimit})
    token0.options.address = receipt._address

    //deploying token1
    gasLimit = await token1.deploy({arguments: ['Watermelon', 'WTM']}).estimateGas()
    receipt = await token1.deploy({arguments: ['Watermelon', 'WTM']}).send({from: myAccount,gas: gasLimit})
    token1.options.address = receipt._address

    if (token0.options.address>token1.options.address) {aux=token0; token0=token1; token1=aux}
    
    //prints
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

    //minting token0
    amount4 = web3.utils.toWei(web3.utils.toBN(amount4))
    gasLimit = await token0.methods.mint(myAccount, amount4).estimateGas()
    await token0.methods.mint(myAccount, amount4).send({from:myAccount, gas:gasLimit})
    console.log(`${web3.utils.fromWei(amount4)} ${token0Symbol} minted`)
    
    //minting token1
    gasLimit = await token1.methods.mint(myAccount, amount4).estimateGas()
    await token1.methods.mint(myAccount, amount4).send({from:myAccount, gas:gasLimit})
    console.log(`${web3.utils.fromWei(amount4)} ${token1Symbol} minted\n`)
}

async function addLiquidity(amount0,amount1, deadline, exchange, token0Symbol, token1Symbol, ) {

    gasLimit = await token0.methods.approve(exchange.options.address,amount0).estimateGas()
    await token0.methods.approve(exchange.options.address,amount0).send({from:myAccount, gas:gasLimit})
    gasLimit = await token1.methods.approve(exchange.options.address,amount1).estimateGas()
    await token1.methods.approve(exchange.options.address,amount1).send({from:myAccount, gas:gasLimit})

    gasLimit = await exchange.methods.addLiquidity(token0.options.address, token1.options.address, amount0, amount1, 0, 0, myAccount, deadline).estimateGas()
    await exchange.methods.addLiquidity( token0.options.address,  token1.options.address, amount0,  amount1, 0, 0, myAccount, deadline).send({from:myAccount,gas:gasLimit})
    
    console.log(
        `Uniswap ${token0Symbol}/${token1Symbol} pair created\n`+
        `Reserves: ${web3.utils.fromWei(amount0)} ${token0Symbol} | ${web3.utils.fromWei(amount1)} ${token1Symbol}\n`+
        `Price: ${(amount0/amount1).toFixed(2)} ${token0Symbol}/${token1Symbol}\n`
    )
}

createDummyTokenPools(10e2,5e2,1e4,10e4,1e6).then(()=>{process.exit(0)});