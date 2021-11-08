import { Token } from '../entities';
export declare const computePairAddress: ({ factoryAddress, tokenA, tokenB }: {
    factoryAddress: string;
    tokenA: Token;
    tokenB: Token;
}) => string;
