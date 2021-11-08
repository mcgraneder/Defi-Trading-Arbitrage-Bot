import { BigNumber } from '@ethersproject/bignumber';
import { Rebase } from '../interfaces';
export declare function rebase(value: BigNumber, from: BigNumber, to: BigNumber): BigNumber;
export declare function toElastic(total: Rebase, base: BigNumber, roundUp: boolean): BigNumber;
