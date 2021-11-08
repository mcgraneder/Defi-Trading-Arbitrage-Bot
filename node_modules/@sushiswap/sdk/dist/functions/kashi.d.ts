import { BigNumber } from '@ethersproject/bignumber';
export declare function accrue(pair: any, amount: BigNumber, includePrincipal?: boolean): BigNumber;
export declare function accrueTotalAssetWithFee(pair: any): {
    elastic: BigNumber;
    base: BigNumber;
};
export declare function interestAccrue(pair: any, interest: BigNumber): BigNumber;
export declare function takeFee(amount: BigNumber): BigNumber;
export declare function addBorrowFee(amount: BigNumber): BigNumber;
