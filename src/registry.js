const UniswapFactory = require("@uniswap/v2-core/build/IUniswapV2Factory");
const UniswapV2Pair = require("@uniswap/v2-core/build/IUniswapV2Pair");
const UniswapRouter = require("../build/contracts/IUniswapV2Router02.json");
const IERC20 = require("../build/contracts/IERC20.json");
const crowSwapFactory = require("../build/contracts/CrowSwapFactory.json");
const crowSwapRouter = require("../build/contracts/CrowDefiSwapPair.json");
const shibaswapFactory = require("../build/contracts/ShibaSwapFactory.json");
const FlashBotContract = require("../build/contracts/TestUniswapFlashSwap.json");
const MaximumProfit = require("../build/contracts/MaximumProfit.json")
const ERC20PresetMinterPauser = require('@openzeppelin/contracts/build/contracts/ERC20PresetMinterPauser.json')

const Web3 = require("web3");
const provider = new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws/v3/ba5ee6592e68419cab422190121eca4c")
web3 = new Web3(provider);

module.exports = class Registry {

    constructor() {

        this.DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
        this.WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
        this.Link = "0x514910771af9ca656af840dff83e8264ecf986ca"
        this.SushiSwapFactoryAddress = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";
        this.SushiSwapRouterAddress = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
        this.UniswapFactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
        this.UniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
        this.sakeswapFactoryAddress = "0x75e48C954594d64ef9613AeEF97Ad85370F13807";
        this.sakeswapRouterAddress = "0x9C578b573EdE001b95d51a55A3FAfb45f5608b1f";
        this.crowswapFactoryAddress = "0x9DEB29c9a4c7A88a3C0257393b7f3335338D9A9D";
        this.crowSwapRouterAddress = "0xa856139af24e63cc24d888728cd5eef574601374";
        this.shibaSwapFactoryAddress = "0x115934131916C8b277DD010Ee02de363c09d037c";

        this.flashBotAddress = "0xc10dc1c7C1B2637f57b16BC726C7232008c28F0c";
        this.maximumProfitContract = "0xEf49F69d97166a8f5e9F95AB860AF4Ca15C81EBc";

        this.UniswapV2Pair = UniswapV2Pair;
        this.IERC20 = IERC20;
        this.ERC20PresetMinterPauser = ERC20PresetMinterPauser;
        this.FlashBotContract = FlashBotContract;
        this.MaximumProfitAddress = MaximumProfit;

        this.uniswapFactoryContract = new web3.eth.Contract(UniswapFactory.abi, this.UniswapFactoryAddress);
        this.uniswapRouterContract = new web3.eth.Contract(UniswapRouter.abi, this.UniswapRouterAddress);
        this.sushiswapFactoryContract = new web3.eth.Contract(UniswapFactory.abi, this.SushiSwapFactoryAddress);
        this.sushiswapRouterContract = new web3.eth.Contract(UniswapRouter.abi, this.SushiSwapRouterAddress);
        this.sakeswapFactoryContract = new web3.eth.Contract(UniswapFactory.abi, this.sakeswapFactoryAddress);
        this.sakeswapRouterContract = new web3.eth.Contract(UniswapRouter.abi, this.sakeswapRouterAddress);
        this.crowswapFactoryContract = new web3.eth.Contract(crowSwapFactory, this.crowswapFactoryAddress);
        this.crowswapRouterContract = new web3.eth.Contract(crowSwapRouter, this.crowSapRouterAddress);
        this.shibaswapFactoryContract = new web3.eth.Contract(shibaswapFactory, this.shibaSwapFactoryAddress);
        this.flashBot = new web3.eth.Contract(FlashBotContract.abi, "0xc10dc1c7C1B2637f57b16BC726C7232008c28F0c");
        this.maximumProfit = new web3.eth.Contract(MaximumProfit.abi, this.maximumProfitAddress)

        this.allFactoryAddresses = {"SushiSwapFactoryAddress": this.SushiSwapFactoryAddress, "UniswapFactoryAddress": this.UniswapFactoryAddress, "sakeswapFactoryAddress": this.sakeswapFactoryAddress, "crowswapFactoryAddress": this.crowswapFactoryAddress, "shibaSwapFactoryAddress": this.shibaSwapFactoryAddress};
        this.allRouterAddresses = {"SushiSwapRouterAddress": this.SushiSwapRouterAddress, "UniswapRouterAddress": this.UniswapRouterAddress, "sakeswapRouterAddress": this.sakeswapRouterAddress, "crowswapRouterAddress": this.crowswapRouterAddress,};
        this.allRouterContracts = {"sushiswapRouterContract": this.sushiswapRouterContract, "uniswapRouterContract": this.uniswapRouterContract, "sakeswapRouterContract": this.sakeswapRouterContract, "crowswapRouterContract": this.crowswapRouterContract};
        this.allFactoryContracts = {"sushiswapFactoryContract": this.sushiswapFactoryContract, "uniswapFactoryContract": this.uniswapFactoryContract, "sakeswapFactoryContract": this.sakeswapFactoryContract, "crowswapFactoryContract": this.crowswapFactoryContract, "shibaswapFactoryContract": this.shibaswapFactoryContract};

        // this.allFactoryAddresses = [this.SushiSwapRouterAddress, this.UniswapRouterAddress, this.sakeswapRouterAddress, this.crowSwapRouterAddress];
    }

    //getter Functions
    getAllFactoryAddress() {

    
        return this.allFactoryAddresses;
    }

    getRouterAddress() {

        return this.allRouterAddresses;
    }

    getAllFactoryContracts() {

        return this.allFactoryContracts
    }

    getAllFactoryContracts() {

        return this.allRouterContracts
    }
}