# Read me incomplete installatuon guide coming soon need to tie up some final bits

# Repo Contents
This repo containes a DEFI arbitrage bot which implements flashloans to maximize arbitrage profitability between the uniswapV2 exchange along with some of its forks such as sushiswap, crowswap, sakeswap and shibaswap. This read me contains some theoretical information around aribtrage, flashbots and some of the mathematics involved aswell as detailed instructions on how to clone this repo and set up the installation in order to run the bot yourself with no coding required.

1) A bot written in JS that observe the prices changes on a pre user-defined liquidity pools at Uniswap V2 / Sushiswap crowswap, sakeswap and shibaswap to determine if its possible to make a profit buying tokens cheaper at one exchange to selling them after for a bigger amount in the other, keeping the difference (profit).

2) A demo that you can easily run to see the bots in action in a fixed setup where arbitrage will always work (local development). Basically consist of forking ethereum mainnet locally, run the demo script that do the set ups for you and execute the bots.

3) Theory of Arbitrage and some proposed improvements for possible production stage of this bort.


# Instillation
to use this code follow the detailed guide below. I have went the extra mile here to really explain eveeything so that anyone can run this code error free regardless of experience.

## (1) Software requirements
Before you can actually run the code there is two pieces of sogtware that you are required to install on your mchine. Those are

**1) Node.js**

**(2) Truffle suite**

The first is Node.js. Node js is a javascript backend runtime enviornemt and we need it to run our arbitrage bot script. The second is the truffle suite. This pretty much is a bundle of packages for blockhain development. It comes with solidity, the truffle testing enviornment and a python for running simple web servers. To install Node.js go to https://nodejs.org/en/ and install the `Current Build`. A screenshot of the correct site is shown below

<img src="https://github.com/mcgraneder/Defi-Trading-Arbitrage-Bot/blob/main/images/tempsnip.png"/>

Once you have downloaded node and carried out the installation process you can check to see if you have installed it correctly by opening up a terminal and executing the following command
```bash
node -v

//output should be in the form of
v14.17.6
```
Once you have installed node.js the next thing you will need is the truffle suite. Unlike node we do not directly download this onto our machine but rather we use node's package manager to install truffle. to install it execute the following command
```bash
npm install truffle
```
The installation might take a few minutes but again, yu can check to see if you installed truffle correctly by running
```bash
truffle version
//output should be in the form of
Truffle v5.4.19 (core: 5.4.19)
Solidity - ^0.7.0 (solc-js)
Node v14.17.6
Web3.js v1.5.3
```

## (2) cloning the repo and installing dependancies
Once you have these two project dependancies we are set to begin the installation of this code. In order to get this code on your machine click the green boc that says code in the top right hand corner. copy an dpast the url here. Then go to you comuter and make a new directory somewhere. Once you do open up a new terminal in this folder and execute the following command to clone the repo
```bash
git clone https://github.com/mcgraneder/Defi-Trading-Arbitrage-Bot.git
```
once the code finishes installing on your machine change into the project folder by running
```bash
cd Defi-Trading-Arbitrage-Bot
```
then open the it in VS code with
```bash
code .
```
In order fo ryou to be able to run the code without an errors we need to first install all of the project dependancies required. We can again use nodes pacakge manager to do this. simply run
```bash
npm install
```
This installation might take a minute or two but if your curious at to what all of these dependancies are navigate to the package.json file and look under `dependancies`. We are nearly there in terms of running the code but we still need one main thing and that is a way to establish a connection to the ethereum blockchain so that we can access and execute smart contract functions in all of the contracts used in this project. We can establish a connection to the ethereum blockhain in different ways such as running our own node. But that is out of the scop of this project so what we will be using is a provider and connecting via an RPC node.

## (3) establishing a connection to the ethereum blockhain
### Ganache
To do this we will be using ganache-cli. Ganache CLI is part of the Truffle suite of Ethereum development tools, is the command line version of Ganache, which is a like your personal blockchain for Ethereum development. Ganache CLI uses ethereumjs to simulate full client behavior and make developing Ethereum applications faster, easier, and safer. We will then be useing Infura who are an RPC Node provider so that we can use ganache to connect to an infura node ultimately allowing us to connect to the ethereum blockchain. So this step of the installation comes in two parts. We first will install ganche and then we will connect to an RPC node using Infura. To install ganche-cli open your terminal and run
```bash
npm install -g ganache-cli
```
### Infura
While ganche is installing we can make out way over to the inufra website. The link is https://infura.io/. In order to get access to a free infura node we need to first make an account. When you make an account navigate to the main dashboard and click on the `create new project` button. This will creat for us anew project and and we can now connet to one of infuras nodes. To do so however we need the endpoint link. Grab the websocket endpoint shown in the snippet below. dont grab the http one as we need to use wesockt in order to get updating price feeds later on. http is not as good for this.

<img src="https://github.com/mcgraneder/Defi-Trading-Arbitrage-Bot/blob/main/images/infura2.png"/>

Before you run ganache first make a new folder somewhere on your machine it dosn have to be in the projet filder. name it `ganache-BC-DB` naviagte into this foldr and make a new folder called `db`. We are going to need his so that we can save the sate of our ganache blockhain so that we have access to the deployed smart contracts each time we close ganache and restart it. Now open up a terminal just make sure that its open somewhere in your project folder and then we are going to ganache aswell as this infura endpoint to connect to ethereum and simulate the mainnet enviornemtn by forking it so run the following command to do so.
```bash
ganache-cli -f https://eth-mainnet.alchemyapi.io/v2/INFURA_PROJECT_ID -d --db PATH_TO_DB -i 1 --deterministic --mnemonic="add you mnenomic here you can get it from just running ganache cli and pything th eone it gives you" -u 0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE -l 999999999
```
Ok so ther eis a few things here. Basically `-f` means we are forking mainnet enviornemt. forking mainnet allow sus to simulate the exact ethereum enviornemt but the great thing is we can get the address of any account on ethereum such as a whale who has lots of ether and we can use that account to send transactions. this i svery useful when you dont want to risk losing your own money by testing on the real mainnet but still wasnt the feel of the mainnet enviornemnt. then we specify `-u` to unlock the whale account we wsnt to use. the account i have included above has plenty of WETH, DAI, ETH and more but you can find your own account by going to ethploer.io and exploring. Lastly we set the gas limit using `-l`. I picked a realkly high value so we dont run into any gas problems. The other oprions used here are mor complex and i have taken the definitions from the documentation

#### **-d, --deterministic**
Generate deterministic addresses based on a pre-defined mnemonic. [boolean]
this will generate the same addresses anytime.

#### **-m, --mnemonic**
bip39 mnemonic phrase for generating a PRNG seed, which is in turn used for hierarchical deterministic (HD) account generation [string]
This is mandatory while using --deterministic option, you have to supply the same mnemonic each time you start.

#### **--db**
Directory of chain database; creates one if it doesn't exist [string] [default: null]
You can add parameter db, to save/persist the chain data (with all the transactions) so you can load same contracts state again in the next executions

#### **-i, --networkId**
The Network ID ganache-cli will use to identify itself. [number] [default: System time at process start or Network ID of forked blockchain if configured.]
this make sure that random networkID is not selected everytime you restart ganache

## (4) deploying the contracts and running the Bot
Now that we have our hanache server up and running establishing a connection to the ethereum blockhain we can finally run both the real maiine bot script AND the test enivornment script i made to test the credibility of my flashswap smart contract. On mainnet it is hard to find arbitrage for reasons explained in the sections below so i made a testing enviornemt that fixed to always be arbitragable. To run either script we first need to deploy our smart contratcs. Naviagte to the test enviornment folder. to do this open a terminal in the main project folder and type
```bash
cd ./src/test/
```
once here run the deployment script. We can run it two ways. the first deploys the script so that our pair is in the form `TOKENX/TOKENY` and the second deploys the script such that our tokens are in the form `TOKENY/TOKENX`. To run either execute one of the following commands
```bash
node deployTestingContracts.js -TK0/TK1  //TOKENX/TOKENY

//or

node deployTestingContracts.js -TH1/TK0  //TOKENY/TOKENX
```
The only thing that we need to do now is to copy the contract addresses for token0, token1 and the flashbot contract and past them into the resgitry file wehre i have defined the address names but left them blank for this very purpose for people installing this code. when you run the deploy script your rsult will look lik ethis

<img src="https://github.com/mcgraneder/Defi-Trading-Arbitrage-Bot/blob/main/images/test2.PNG"/>

Copy all of these addresses one by one and past them into their respective loaction sin the registry.js file as shown below. Thiswill the the only time you have to do this because remember that we set up ganaxhe cli to save our blockhain instance in a directory on our computer that way each new time we close ganache if we restart it using

<img src="https://github.com/mcgraneder/Defi-Trading-Arbitrage-Bot/blob/main/images/test.PNG"/>

```bash
 ganache-cli --db ../../ganacheCLIBCdata/db --u 0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE
 ```
 then all our our previous deployments will get saved and there will be no need to deploy again and copy over the addressed every time. However if you make a change to the smart contratts, then you will have to copy over but otherwise you only have to do it this once when your first install my code.
 
## (5) Running the bots
after the deployment finsihes we can run both the test script and the main bot. to run the test script stay in the current directory and run
```bash
node arbitrageBotTest.js
```
and enjoy this script will always return a profut bcause it is a fixed test. if you would like to run the main bot move back into the src directory. so run both of these commands
```bash
cd ../

node index.js
```
more than likely you will not get an arbitrage because the price differences between exchanges is much closer. however i have gotten one real arbitrage on forked mainnet since i have started this project. ive been building it for two weeks so once out of running it for days and days is not that consistent but this bot is not a production bot at all not by any strecth it is more of s proof of concept.  I have made a logger using mongoDB which logs various information such as price data and tranactions and other information to a mongo databsse. In this repo i commented out the mongoDB bcause it takes too long for me to explain the setup but the logs instead go to files in the logs folder. you can run the script and keep track of any arbs you get with the logs. they are very useful.Read the sections below to lesrn about how we could improve this script further and why arbitrage is profitable. I hope you are able to get thing srunning. If you cant feel free to email me with your questions at evan.mcgrane5@mail.dcu.ie. Enjoy.

# Automated Market Maker Arbitrage
**The current DEX ecosystem is mainly under one AMM family called constant function market makers** 
As a market maker, providing liquidity is a tedious task, it often involves locking up significant capital, programming a trading bot and building up a feasible strategy. It is often in the hands of institutional providers where they have the capability and incentives to build such initiatives. 

The AMM structure creates possible ways for any individual to become passive market makers without worrying about the technical details for market makings.

There are a few different strategies in creating that AMM structure, we call it the constant function market makers (CFMMs), under the CFMMs, there are a few different substructures with their unique characteristics.

1. Constant product market makers (CPMMs) - Uniswap
      
      X * Y = K

2. Constant mean market makers (Generalised CPMMs) - Banlancer Protocol

<img src="https://cdn.substack.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2F8b2f3800-d13b-4cbf-80d9-e01e1edc51ee_254x105.png" />

3. Constant sum market makers (CSMMs) - Unfit for the decenralised exchange use case

<img src="https://cdn.substack.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2F8b2f3800-d13b-4cbf-80d9-e01e1edc51ee_254x105.png" />

4. Hybrid CFMMs - Curve finance, Bancor V2, MCDex

- Curve Finance Amm 
<img src="https://cdn.substack.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2F8b2f3800-d13b-4cbf-80d9-e01e1edc51ee_254x105.png" />

- MCDex amm
- P = i + Beta * i * E

Total return = trading fees + impermanent loss/gain.

Locking up capital and thus by providing liquidity to the pool, the liquidity providers (LPs) need some incentive to do so. Under the current incentivised structure, the LPs will get reimbursed for their capital lock-up via trading fees generated by the traders and arbitrageurs. However, with the design of AMM structure, the LPs can generate a gain/loss called impermanent gain/loss which at the most of time would be a loss and significantly reduce their overall returns.

The initial AMM structure does generate sufficient liquidity in the DEX ecosystem, however, due to the design and actual implementation, LPs sometimes would generate negative overall return due to impermeant loss.

For example, if LPs started to provide liquidity on DAI in the beginning of the year, LPs made +10.42% return to date netting impermanent loss. However, if instead LPs chose HEX trading pairs to provide liquidity, the LPs would suffer a net loss of -55.14%. This shows how impermanent loss can greatly affect the LPs’ overall return.

There are a few proposals to reduce or theoretically eliminate the impermanent losses and, in the meantime, further reduce slippages. For example, Curve is using hybrid CFMMs targeting stablecoins or wrapped assets to provide significantly better liquidity for stablecoins. Bancor V2 and MCDex also proposed their own solutions to counteract the issues with impermanent loss.








## The rationale
Suppose that we want to do arbitrage transactions on a token pair in the form of TokenX/WETH. The TokenX/WETH pair first of all needs to exist on at least two exchanges in order for us to be able to arbitrage. In this case WETH is known as the base token. Note that the base token can be any token some common base tokens are USDT/USDC/DAI etc. Howeevr this bot impleemnts DAI/WETH with WETH being the base token

TokenX in this case is called the quote token. After we preform the arbitrage the quote tokens wont be reserved.Instead the base token is reserved this means that our profit is denominated in the base token. In the case where a token pair consists of two base tokens either can be reserved. See the TradeOrder.sol smart contract logic for this.

The profitability of arbitrage can be maximized by using a `flashloan` on the uniswap exchange or sushiswap exchaneg for that matter.Lets suppose that pair0 and pair1 are two pairs of the same tokens on different exchanges (DEXES). Once the price diverges between the exchanges we can in theory, preform optimistic arbitrage. We can call index.js to start the arbitrage. The contract script uses the uniswapv2 contracts, namely the V2Factory and V2Router to calculate the price of the pairs denominated in the quote token on the different exchanges. If the script successfully finds a price mismatch then we carry on to calculate an estimation of the gas fees required for doing a flaswap. here we also take into consideration the 0.03% fee which we must pay to uniswap. If anfter all of these calculations a profitable trade still remaisn then we call the SlashBot.sol contract. This contract allows us to borrow some quote tokens from pair0. We can let the borowed amount be x. The contract will neeed to repay the debt to pair0. The debt can be denominated in the baseToken. This is actually a very useful functionality of uniswap which saves us having to develop the logic ourselves. When we take the loan we sell all of the borrowed tokens on pair1. The contract gets base tokens ofamount y2. We then immediately pay back the uniswap contract to pay off the loan and our flashswap contract gets to keep an amount of y2-y1.

## Closer look at the Maths
Before i explain the instillation lets look at some of the fiancial maths. We can actually write an algorithm that can calculate the amount of x so we can get as much profit as possible. Consider the formulae below

Consider the initial state of pair0 and pair1
|                     | Pair0 | Pair1 |
| :-------------------| :-----| :-----|
| Base Token Amount   |  a1   |  b1   |
| Quote Token Amount  |  a2   |  b2   |

In this case we can caluate the amoutn to borrow to maximise our proft as:

<img src="https://latex.codecogs.com/svg.image?\Delta&space;a_1&space;=&space;\frac{\Delta&space;b_1&space;\cdot&space;a_1}{b_1&space;-&space;\Delta&space;b_1}&space;\&space;\&space;\&space;\Delta&space;a_2&space;=&space;\frac{\Delta&space;b_2&space;\cdot&space;a_2}{b_2&space;&plus;&space;\Delta&space;b_2}" title="\Delta a_1 = \frac{\Delta b_1 \cdot a_1}{b_1 - \Delta b_1} \ \ \ \Delta a_2 = \frac{\Delta b_2 \cdot a_2}{b_2 + \Delta b_2}" />

The amount borrowed Quote Token are some, so `Delta b1` = `Delta b2`, let `x = \Delta b`, then the profit as a function of x is:

<img src="https://latex.codecogs.com/svg.image?f(x)&space;=&space;\Delta&space;a_2&space;-&space;\Delta&space;a_1&space;=&space;\frac&space;{a_2&space;\cdot&space;x}{b_2&plus;x}&space;-&space;\frac&space;{a_1&space;\cdot&space;x}{b_1-x}" title="f(x) = \Delta a_2 - \Delta a_1 = \frac {a_2 \cdot x}{b_2+x} - \frac {a_1 \cdot x}{b_1-x}" />

We wanna calculate the x value when the function get a maximum value. First we need to get the derivative of function:

<img src="https://latex.codecogs.com/svg.image?f'(x)&space;=&space;\frac{a_2b_2}{(b_2&plus;x)^2}&space;-&space;&space;\frac{a_1b_1}{(b_1-x)^2}" title="f'(x) = \frac{a_2b_2}{(b_2+x)^2} - \frac{a_1b_1}{(b_1-x)^2}" />

When the derivative function is 0, the function has a maximum/minimum value, and we can set some conditions to ignore the solution at the minimum. It is possible to solve

<img src="https://latex.codecogs.com/svg.image?\frac{a_2b_2}{(b_2&plus;x)^2}&space;-&space;&space;\frac{a_1b_1}{(b_1-x)^2}&space;=&space;0&space;" title="\frac{a_2b_2}{(b_2+x)^2} - \frac{a_1b_1}{(b_1-x)^2} = 0 " />

<img src="https://latex.codecogs.com/svg.image?(a_1b_1-a_2b_2)x^2&space;&plus;&space;2b_1b_2(a_1&plus;a_2)x&space;&plus;&space;b_1b_2(a_1b_2&space;-&space;a_2b_1)&space;=&space;0&space;" title="(a_1b_1-a_2b_2)x^2 + 2b_1b_2(a_1+a_2)x + b_1b_2(a_1b_2 - a_2b_1) = 0 " />

Let：

<img src="https://latex.codecogs.com/svg.image?\begin{cases}a&space;=&space;a_1b_1&space;-&space;a_2b_2&space;\\b&space;=&space;2b_1b_2(a_1&space;&plus;&space;a_2)&space;\\c&space;=&space;b_1b_2(a_1b_2&space;-&space;a_2b_1)\end{cases}&space;" title="\begin{cases}a = a_1b_1 - a_2b_2 \\b = 2b_1b_2(a_1 + a_2) \\c = b_1b_2(a_1b_2 - a_2b_1)\end{cases} " />

The previous equation is reduced to a general quadratic equation:

<img src="https://latex.codecogs.com/svg.image?ax^2&plus;bx&plus;c=0&space;" title="ax^2+bx+c=0 " />

We can get the solution:

<img src="https://latex.codecogs.com/svg.image?\begin{cases}x=\displaystyle&space;\frac{-b&space;\pm&space;\sqrt{b^2-4ac}}{2a}&space;\\0&space;<&space;x&space;<&space;b_1&space;\\x&space;<&space;b_2\end{cases}" title="\begin{cases}x=\displaystyle \frac{-b \pm \sqrt{b^2-4ac}}{2a} \\0 < x < b_1 \\x < b_2\end{cases}" />

The solution x is the amount we need to borrow from Pair0.

# Considerations, Reflections & Imporvement Proposals

## Using cenralised exchanges and Aave
I think, it would have been using a CEX (Centralized EXchange) like Binance or Coinbase as off-chain oracle to get price feeds.This is much easier and IMO much more efficent as some of the centralised exchanges have incredible APIs that are getting updated by the second Then to use Avee (lending platform) flashloans (similar to how flashswaps works) to arbitrage whatever DEX (Decentralized EXchanges) I wished. The only 'drawback' that I can see with this approach is that you must pay back the flashloan in the same asset you borrow so you probably need and extra trade.

## Using Flashbots MEV (Miner Extractable Value)
<<<<<<< HEAD
=======



>>>>>>> ce77bcfd507b263720a31c3bc39c42a77fad8c7e
