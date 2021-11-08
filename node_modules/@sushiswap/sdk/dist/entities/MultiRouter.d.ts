import { BigNumber } from '@ethersproject/bignumber';
import { Pool, RToken, RouteLeg, MultiRoute } from '../types/MultiRouterTypes';
export declare class Edge {
    readonly GasConsumption = 40000;
    readonly MINIMUM_LIQUIDITY = 1000;
    pool: Pool;
    vert0: Vertice;
    vert1: Vertice;
    canBeUsed: boolean;
    direction: boolean;
    amountInPrevious: number;
    amountOutPrevious: number;
    bestEdgeIncome: number;
    constructor(p: Pool, v0: Vertice, v1: Vertice);
    reserve(v: Vertice): BigNumber;
    calcOutput(v: Vertice, amountIn: number): number[];
    checkMinimalLiquidityExceededAfterSwap(from: Vertice, amountOut: number): boolean;
    testApply(from: Vertice, amountIn: number, amountOut: number): boolean;
    applySwap(from: Vertice): void;
}
export declare class Vertice {
    token: RToken;
    edges: Edge[];
    price: number;
    gasPrice: number;
    bestIncome: number;
    gasSpent: number;
    bestTotal: number;
    bestSource?: Edge;
    checkLine: number;
    constructor(t: RToken);
    getNeibour(e?: Edge): Vertice | undefined;
}
export declare class Graph {
    vertices: Vertice[];
    edges: Edge[];
    tokens: Map<RToken, Vertice>;
    constructor(pools: Pool[], baseToken: RToken, gasPrice: number);
    setPrices(from: Vertice, price: number, gasPrice: number): void;
    getOrCreateVertice(token: RToken): Vertice;
    findBestPath(from: RToken, to: RToken, amountIn: number): {
        path: Edge[];
        output: number;
        gasSpent: number;
        totalOutput: number;
    } | undefined;
    addPath(from: Vertice | undefined, to: Vertice | undefined, path: Edge[]): void;
    findBestRoute(from: RToken, to: RToken, amountIn: number, mode: number | number[]): MultiRoute;
    getRouteLegs(from: Vertice, to: Vertice): [RouteLeg[], number, boolean];
    edgeFrom(e: Edge): [Vertice, number] | undefined;
    getOutputEdges(v: Vertice): Edge[];
    getInputEdges(v: Vertice): Edge[];
    calcLegsAmountOut(legs: RouteLeg[], amountIn: number, to: RToken): number;
    cleanTopology(from: Vertice, to: Vertice): [Vertice[], boolean];
    removeDeadEnds(verts: Vertice[]): void;
    removeWeakestEdge(verts: Vertice[]): void;
    topologySort(from: Vertice, to: Vertice): [number, Vertice[]];
}
export declare function findMultiRouting(from: RToken, to: RToken, amountIn: number, pools: Pool[], baseToken: RToken, gasPrice: number, steps?: number | number[]): MultiRoute;
