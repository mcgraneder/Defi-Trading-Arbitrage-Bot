import { BigNumber } from '@ethersproject/bignumber';
export interface AccrueInfo {
    interestPerSecond: BigNumber;
    lastAccrued: BigNumber;
    feesEarnedFraction: BigNumber;
}
