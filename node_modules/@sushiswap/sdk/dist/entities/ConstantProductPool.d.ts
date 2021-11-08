import { CurrencyAmount } from './CurrencyAmount';
import { Fee } from '../enums';
import { Price } from './Price';
import { Token } from './Token';
export declare class ConstantProductPool {
    readonly liquidityToken: Token;
    readonly fee: Fee;
    readonly twap: boolean;
    private readonly tokenAmounts;
    static getAddress(tokenA: Token, tokenB: Token, fee?: Fee, twap?: boolean): string;
    constructor(currencyAmountA: CurrencyAmount<Token>, currencyAmountB: CurrencyAmount<Token>, fee?: Fee, twap?: boolean);
    /**
     * Returns true if the token is either token0 or token1
     * @param token to check
     */
    involvesToken(token: Token): boolean;
    /**
     * Returns the current mid price of the pair in terms of token0, i.e. the ratio of reserve1 to reserve0
     */
    get token0Price(): Price<Token, Token>;
    /**
     * Returns the current mid price of the pair in terms of token1, i.e. the ratio of reserve0 to reserve1
     */
    get token1Price(): Price<Token, Token>;
    /**
     * Return the price of the given token in terms of the other token in the pair.
     * @param token token to return price of
     */
    priceOf(token: Token): Price<Token, Token>;
    /**
     * Returns the chain ID of the tokens in the pair.
     */
    get chainId(): number;
    get token0(): Token;
    get token1(): Token;
    get reserve0(): CurrencyAmount<Token>;
    get reserve1(): CurrencyAmount<Token>;
    reserveOf(token: Token): CurrencyAmount<Token>;
    getOutputAmount(inputAmount: CurrencyAmount<Token>): [CurrencyAmount<Token>, ConstantProductPool];
    getInputAmount(outputAmount: CurrencyAmount<Token>): [CurrencyAmount<Token>, ConstantProductPool];
    getLiquidityMinted(totalSupply: CurrencyAmount<Token>, tokenAmountA: CurrencyAmount<Token>, tokenAmountB: CurrencyAmount<Token>): CurrencyAmount<Token>;
    getLiquidityValue(token: Token, totalSupply: CurrencyAmount<Token>, liquidity: CurrencyAmount<Token>): CurrencyAmount<Token>;
}
