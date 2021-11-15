This repo containes a DEFI arbitrage bot which implements flashloans to maximize arbitrage profitability between the uniswapV2 exchange along with some of its forks such as sushiswap, crowswap, sakeswap and shibaswap. This read me contains some theoretical information around aribtrage, flashbots and some of the mathematics involved aswell as detailed instructions on how to clone this repo and set up the installation in order to run the bot yourself with no coding required

# Automated Market Maker Arbitrage
An arbitrageur contract can be used to argitrage between Uniswap V2 like AMMs

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



