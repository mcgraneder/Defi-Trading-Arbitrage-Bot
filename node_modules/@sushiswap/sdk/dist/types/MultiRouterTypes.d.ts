import { BigNumber } from '@ethersproject/bignumber';
export interface RToken {
    name: string;
    address: string;
}
export declare enum PoolType {
    ConstantProduct = "ConstantProduct",
    Weighted = "Weighted",
    Hybrid = "Hybrid",
    ConcentratedLiquidity = "ConcentratedLiquidity"
}
export interface PoolInfo {
    address: string;
    token0: RToken;
    token1: RToken;
    type: PoolType;
    reserve0: BigNumber;
    reserve1: BigNumber;
    fee: number;
    minLiquidity: number;
    swapGasCost: number;
}
declare type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
declare type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
declare type PoolInfoWithDefaults = PartialBy<PoolInfo, 'minLiquidity' | 'swapGasCost'>;
export declare class Pool {
    address: string;
    token0: RToken;
    token1: RToken;
    type: PoolType;
    reserve0: BigNumber;
    reserve1: BigNumber;
    fee: number;
    minLiquidity: number;
    swapGasCost: number;
    constructor(_info: PoolInfoWithDefaults);
}
declare type PoolInfoNoType = Omit<PoolInfoWithDefaults, 'type'>;
export declare class RConstantProductPool extends Pool {
    constructor(info: PoolInfoNoType);
}
declare type HybridPoolInfo = PoolInfoNoType & {
    A: number;
};
export declare class RHybridPool extends Pool {
    A: number;
    constructor(info: HybridPoolInfo);
}
declare type WeightedPoolInfo = PoolInfoNoType & {
    weight0: number;
    weight1: number;
};
export declare class RWeightedPool extends Pool {
    weight0: number;
    weight1: number;
    constructor(info: WeightedPoolInfo);
}
export declare const CL_MIN_TICK = -887272;
export declare const CL_MAX_TICK: number;
interface CLTick {
    index: number;
    DLiquidity: number;
}
interface CLSpecific {
    liquidity: number;
    sqrtPrice: number;
    nearestTick: number;
    ticks: CLTick[];
}
declare type CLPoolInfo = Omit<PoolInfoNoType, 'reserve0' | 'reserve1'> & CLSpecific;
export declare class RConcentratedLiquidityPool extends Pool {
    liquidity: number;
    sqrtPrice: number;
    nearestTick: number;
    ticks: CLTick[];
    constructor(info: CLPoolInfo);
}
export interface RouteLeg {
    address: string;
    token: RToken;
    swapPortion: number;
    absolutePortion: number;
}
export declare enum RouteStatus {
    Success = "Success",
    NoWay = "NoWay",
    Partial = "Partial"
}
export interface MultiRoute {
    status: RouteStatus;
    amountIn: number;
    amountOut: number;
    legs: RouteLeg[];
    gasSpent: number;
    totalAmountOut: number;
}
export {};
