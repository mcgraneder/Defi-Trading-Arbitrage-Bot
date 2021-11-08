import { Struct, StructResult, StructFailure, StructContext } from './struct';
export declare type StructRecord<T> = Record<string, Struct<T>>;
export declare type StructTuple<T> = {
    [K in keyof T]: Struct<T[K]>;
};
/**
 * Convert a validation result to an iterable of failures.
 */
export declare function toFailures(result: StructResult, context: StructContext): IterableIterator<StructFailure>;
/**
 * Shifts (removes and returns) the first value from the `input` iterator.
 * Like `Array.prototype.shift()` but for an `Iterator`.
 */
export declare function iteratorShift<T>(input: Iterator<T>): T | undefined;
//# sourceMappingURL=utils.d.ts.map