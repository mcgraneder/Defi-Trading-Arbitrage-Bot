import { Fee } from '../enums';
import { Token } from '../entities';
export declare const computeConstantProductPoolAddress: ({ factoryAddress, tokenA, tokenB, fee, twap }: {
    factoryAddress: string;
    tokenA: Token;
    tokenB: Token;
    fee: Fee;
    twap: boolean;
}) => string;
