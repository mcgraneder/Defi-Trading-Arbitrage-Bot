import { CurrencyAmount, Price, Token } from './entities';
import { Message } from './entities';
import { BigNumber } from '@ethersproject/bignumber';
import { ChainId } from './enums';
import { NonceManager } from '@ethersproject/experimental';
import { Signer } from '@ethersproject/abstract-signer';
import { Transaction } from '@ethersproject/transactions';
import { Web3Provider } from '@ethersproject/providers';
export interface ILimitOrderData {
    maker: string;
    tokenIn: string;
    tokenOut: string;
    tokenInDecimals: number;
    tokenOutDecimals: number;
    tokenInSymbol: string;
    tokenOutSymbol: string;
    amountIn: string;
    amountOut: string;
    recipient: string;
    startTime: string | number;
    endTime: string | number;
    stopPrice?: string;
    oracleAddress?: string;
    oracleData?: string;
    v: number;
    r: string;
    s: string;
    chainId: ChainId;
    orderTypeHash?: string;
}
export declare class LimitOrder {
    readonly maker: string;
    readonly amountIn: CurrencyAmount<Token>;
    readonly amountOut: CurrencyAmount<Token>;
    readonly recipient: string;
    readonly startTime: string;
    readonly endTime: string;
    readonly stopPrice: string;
    readonly oracleAddress: string;
    readonly oracleData: string;
    v: number;
    r: string;
    s: string;
    static getLimitOrder(data: ILimitOrderData): LimitOrder;
    constructor(maker: string, amountIn: CurrencyAmount<Token>, amountOut: CurrencyAmount<Token>, recipient: string, startTime: string | number, endTime: string | number, stopPrice?: string, oracleAddress?: string, oracleData?: string, v?: number, r?: string, s?: string);
    get amountInRaw(): string;
    get amountOutRaw(): string;
    get tokenInAddress(): string;
    get tokenOutAddress(): string;
    get tokenInDecimals(): number;
    get tokenOutDecimals(): number;
    get tokenInSymbol(): string;
    get tokenOutSymbol(): string;
    get chainId(): ChainId;
    usePrice(price: Price<Token, Token>): LimitOrder;
    signdOrderWithPrivatekey(chainId: ChainId, privateKey: string): {
        v: number;
        r: string;
        s: string;
    };
    signOrderWithProvider(chainId: ChainId, provider: Web3Provider): Promise<{
        v: number;
        r: string;
        s: string;
    }>;
    getTypedData(): {
        types: {
            EIP712Domain: {
                name: string;
                type: string;
            }[];
            LimitOrder: {
                name: string;
                type: string;
            }[];
        };
        primaryType: string;
        domain: import("./entities").Domain;
        message: Message;
    };
    getTypeHash(): string;
    send(): Promise<any>;
}
export declare class FillLimitOrder {
    readonly order: LimitOrder;
    readonly path: string[];
    readonly amountExternal: BigNumber;
    readonly amountToFill: BigNumber;
    readonly limitOrderReceiver: string;
    readonly to: string;
    readonly tokenIn: string;
    readonly tokenOut: string;
    readonly limitOrderReceiverData: string;
    constructor(order: LimitOrder, path: string[], amountExternal: BigNumber, amountToFill: BigNumber, limitOrderReceiver: string, to: string, keepTokenIn?: boolean);
    fillOrderOpen(signer: Signer, extra: {
        forceExecution?: boolean;
        gasPrice?: BigNumber;
        nonce?: number;
        debug?: boolean;
        open?: boolean;
    }): Promise<{
        executed: boolean;
        transaction?: Transaction | undefined;
    }>;
    fillOrder(signer: Signer | NonceManager, extra: {
        debug?: boolean;
        forceExecution?: boolean;
        gasPrice?: BigNumber;
        open?: boolean;
        nonce?: number;
    }): Promise<{
        executed: boolean;
        transaction?: Transaction;
    }>;
}
