/**
 * `Struct` objects encapsulate the schema for a specific data type (with
 * optional coercion). You can then use the `assert`, `is` or `validate` helpers
 * to validate unknown data against a struct.
 */
declare class Struct<T, S = any> {
    type: string;
    schema: S;
    coercer: (value: unknown) => unknown;
    validator: (value: unknown, context: StructContext) => StructResult;
    refiner: (value: T, context: StructContext) => StructResult;
    constructor(props: {
        type: Struct<T>["type"];
        schema: S;
        coercer?: Struct<T>["coercer"];
        validator?: Struct<T>["validator"];
        refiner?: Struct<T>["refiner"];
    });
}
/**
 * `StructError` objects are thrown (or returned) by Superstruct when its
 * validation fails. The error represents the first error encountered during
 * validation. But they also have an `error.failures` property that holds
 * information for all of the failures encountered.
 */
declare class StructError extends TypeError {
    value: any;
    type: string;
    path: Array<number | string>;
    branch: Array<any>;
    failures: () => Array<StructFailure>;
    [key: string]: any;
    constructor(failure: StructFailure, moreFailures: IterableIterator<StructFailure>);
}
/**
 * A `StructContext` contains information about the current value being
 * validated as well as helper functions for failures and recursive validating.
 */
type StructContext = {
    value: any;
    type: string;
    branch: Array<any>;
    path: Array<string | number>;
    fail: (props?: Partial<StructFailure>) => StructFailure;
    check: (value: any, struct: Struct<any> | Struct<never>, parent?: any, key?: string | number) => IterableIterator<StructFailure>;
};
/**
 * A `StructFailure` represents a single specific failure in validation.
 */
type StructFailure = {
    value: StructContext["value"];
    type: StructContext["type"];
    branch: StructContext["branch"];
    path: StructContext["path"];
    [key: string]: any;
};
/**
 * A `StructResult` is returned from validation functions.
 */
type StructResult = boolean | Iterable<StructFailure>;
/**
 * A type utility to extract the type from a `Struct` class.
 */
type StructType<T extends Struct<any>> = Parameters<T["refiner"]>[0];
/**
 * Assert that a value passes a `Struct`, throwing if it doesn't.
 */
declare function assert<T>(value: unknown, struct: Struct<T>): value is T;
/**
 * Coerce a value with the coercion logic of `Struct` and validate it.
 */
declare function coerce<T>(value: unknown, struct: Struct<T>): T;
/**
 * Check if a value passes a `Struct`.
 */
declare function is<T>(value: unknown, struct: Struct<T>): value is T;
/**
 * Validate a value against a `Struct`, returning an error if invalid.
 */
declare function validate<T>(value: unknown, struct: Struct<T>, coercing?: boolean): [StructError, undefined] | [undefined, T];
/**
 * Augment a `Struct` to add an additional coercion step to its input.
 */
declare function coercion<T>(struct: Struct<T>, coercer: Struct<T>["coercer"]): Struct<T>;
/**
 * Augment a struct to coerce a default value for missing values.
 *
 * Note: You must use `coerce(value, Struct)` on the value before validating it
 * to have the value defaulted!
 */
declare function defaulted<T>(S: Struct<T>, fallback: any, strict?: true): Struct<T>;
/**
 * Coerce a value to mask its properties to only that defined in the struct.
 */
declare function masked<T extends {
    [key: string]: any;
}, V extends Record<string, Struct<any>>>(S: Struct<T, V>): Struct<T>;
/**
 * Augment a string or array struct to constrain its length to zero.
 */
declare function empty<T extends string | any[]>(S: Struct<T>): Struct<T>;
/**
 * Augment a string or array struct to constrain its length to being between a
 * minimum and maximum size.
 */
declare function length<T extends string | any[]>(S: Struct<T>, min: number, max: number): Struct<T>;
/**
 * Refine a string struct to match a specific regexp pattern.
 */
declare function pattern<T extends string>(S: Struct<T>, regexp: RegExp): Struct<T>;
/**
 * Augment a `Struct` to add an additional refinement to the validation.
 */
declare function refinement<T>(struct: Struct<T>, type: string, refiner: Struct<T>["refiner"]): Struct<T>;
type StructRecord<T> = Record<string, Struct<T>>;
type StructTuple<T> = {
    [K in keyof T]: Struct<T[K]>;
};
/**
 * Validate any value.
 */
declare function any(): Struct<any>;
/**
 * Validate that an array of values of a specific type.
 */
declare function array(): Struct<unknown[]>;
declare function array<T>(Element: Struct<T>): Struct<T[], Struct<T>>;
/**
 * Validate that boolean values.
 */
declare function boolean(): Struct<boolean>;
/**
 * Validate that `Date` values.
 *
 * Note: this also ensures that the value is *not* an invalid `Date` object,
 * which can occur when parsing a date fails but still returns a `Date`.
 */
declare function date(): Struct<Date>;
/**
 * Validate that a value dynamically, determing which struct to use at runtime.
 */
declare function dynamic<T>(fn: (value: unknown, ctx: StructContext) => Struct<T>): Struct<T>;
/**
 * Validate that a value against a set of potential values.
 */
declare function enums<T extends number>(values: T[]): Struct<T>;
declare function enums<T extends string>(values: T[]): Struct<T>;
/**
 * Validate that a value is a function.
 */
declare function func(): Struct<Function>;
/**
 * Validate that a value is an instance of a class.
 */
declare function instance<T extends {
    new (...args: any): any;
}>(Class: T): Struct<InstanceType<T>>;
/**
 * Validate that a value matches all of a set of structs.
 */
declare function intersection<A>(Structs: StructTuple<[A]>): Struct<A>;
declare function intersection<A, B>(Structs: StructTuple<[A, B]>): Struct<A & B>;
declare function intersection<A, B, C>(Structs: StructTuple<[A, B, C]>): Struct<A & B & C>;
declare function intersection<A, B, C, D>(Structs: StructTuple<[A, B, C, D]>): Struct<A & B & C & D>;
declare function intersection<A, B, C, D, E>(Structs: StructTuple<[A, B, C, D, E]>): Struct<A & B & C & D & E>;
declare function intersection<A, B, C, D, E, F>(Structs: StructTuple<[A, B, C, D, E, F]>): Struct<A & B & C & D & E & F>;
declare function intersection<A, B, C, D, E, F, G>(Structs: StructTuple<[A, B, C, D, E, F, G]>): Struct<A & B & C & D & E & F & G>;
declare function intersection<A, B, C, D, E, F, G, H>(Structs: StructTuple<[A, B, C, D, E, F, G, H]>): Struct<A & B & C & D & E & F & G & H>;
declare function intersection<A, B, C, D, E, F, G, H, I>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I]>): Struct<A & B & C & D & E & F & G & H & I>;
declare function intersection<A, B, C, D, E, F, G, H, I, J>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J]>): Struct<A & B & C & D & E & F & G & H & I & J>;
declare function intersection<A, B, C, D, E, F, G, H, I, J, K>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K]>): Struct<A & B & C & D & E & F & G & H & I & J & K>;
declare function intersection<A, B, C, D, E, F, G, H, I, J, K, L>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L]>): Struct<A & B & C & D & E & F & G & H & I & J & K & L>;
declare function intersection<A, B, C, D, E, F, G, H, I, J, K, L, M>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M]>): Struct<A & B & C & D & E & F & G & H & I & J & K & L & M>;
declare function intersection<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N]>): Struct<A & B & C & D & E & F & G & H & I & J & K & L & M & N>;
declare function intersection<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O]>): Struct<A & B & C & D & E & F & G & H & I & J & K & L & M & N & O>;
declare function intersection<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P]>): Struct<A & B & C & D & E & F & G & H & I & J & K & L & M & N & O & P>;
declare function intersection<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q]>): Struct<A & B & C & D & E & F & G & H & I & J & K & L & M & N & O & P & Q>;
/**
 * Validate a value lazily, by constructing the struct right before the first
 * validation. This is useful for cases where you want to have self-referential
 * structs for nested data structures.
 */
declare function lazy<T>(fn: () => Struct<T>): Struct<T>;
/**
 * Validate that a value is a specific constant.
 */
declare function literal<T extends boolean>(constant: T): Struct<T>;
declare function literal<T extends number>(constant: T): Struct<T>;
declare function literal<T extends string>(constant: T): Struct<T>;
declare function literal<T>(constant: T): Struct<T>;
/**
 * Validate that a value is a map with specific key and value entries.
 */
declare function map<K, V>(Key: Struct<K>, Value: Struct<V>): Struct<Map<K, V>>;
/**
 * Validate that a value always fails.
 */
declare function never(): Struct<never>;
/**
 * Augment a struct to make it accept `null` values.
 */
declare function nullable<T>(S: Struct<T>): Struct<T | null>;
/**
 * Validate that a value is a number.
 */
declare function number(): Struct<number>;
/**
 * Type helper to Flatten the Union of optional and required properties.
 */
type Flatten<T> = T extends infer U ? {
    [K in keyof U]: U[K];
} : never;
/**
 * Type helper to extract the optional keys of an object
 */
type OptionalKeys<T> = {
    [K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];
/**
 * Type helper to extract the required keys of an object
 */
type RequiredKeys<T> = {
    [K in keyof T]: undefined extends T[K] ? never : K;
}[keyof T];
/**
 * Type helper to create optional properties when the property value can be
 * undefined (ie. when `optional()` is used to define a type)
 */
type OptionalizeObject<T> = Flatten<{
    [K in RequiredKeys<T>]: T[K];
} & {
    [K in OptionalKeys<T>]?: T[K];
}>;
/**
 * Validate that an object with specific entry values.
 */
declare function object<V extends StructRecord<any>>(): Struct<Record<string, unknown>>;
declare function object<V extends StructRecord<any>>(Structs: V): Struct<OptionalizeObject<{
    [K in keyof V]: StructType<V[K]>;
}>, V>;
/**
 * Augment a struct to make it optionally accept `undefined` values.
 */
declare function optional<T>(S: Struct<T>): Struct<T | undefined>;
/**
 * Validate that a partial object with specific entry values.
 */
declare function partial<T, V extends StructRecord<any>>(Structs: V | Struct<T, V>): Struct<{
    [K in keyof V]?: StructType<V[K]>;
}>;
/**
 * Validate that a value is a record with specific key and
 * value entries.
 */
declare function record<K extends string | number, V>(Key: Struct<K>, Value: Struct<V>): Struct<Record<K, V>>;
/**
 * Validate that a set of values matches a specific type.
 */
declare function set<T>(Element: Struct<T>): Struct<Set<T>>;
/**
 * Validate that a value is a string.
 */
declare function string(): Struct<string>;
/**
 * Define a `Struct` instance with a type and validation function.
 */
declare function struct<T>(name: string, validator: Struct<T>["validator"]): Struct<T, null>;
/**
 * Validate that a value is a tuple with entries of specific types.
 */
declare function tuple<A>(Structs: StructTuple<[A]>): Struct<A>;
declare function tuple<A, B>(Structs: StructTuple<[A, B]>): Struct<[A, B]>;
declare function tuple<A, B, C>(Structs: StructTuple<[A, B, C]>): Struct<[A, B, C]>;
declare function tuple<A, B, C, D>(Structs: StructTuple<[A, B, C, D]>): Struct<[A, B, C, D]>;
declare function tuple<A, B, C, D, E>(Structs: StructTuple<[A, B, C, D, E]>): Struct<[A, B, C, D, E]>;
declare function tuple<A, B, C, D, E, F>(Structs: StructTuple<[A, B, C, D, E, F]>): Struct<[A, B, C, D, E, F]>;
declare function tuple<A, B, C, D, E, F, G>(Structs: StructTuple<[A, B, C, D, E, F, G]>): Struct<[A, B, C, D, E, F, G]>;
declare function tuple<A, B, C, D, E, F, G, H>(Structs: StructTuple<[A, B, C, D, E, F, G, H]>): Struct<[A, B, C, D, E, F, G, H]>;
declare function tuple<A, B, C, D, E, F, G, H, I>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I]>): Struct<[A, B, C, D, E, F, G, H, I]>;
declare function tuple<A, B, C, D, E, F, G, H, I, J>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J]>): Struct<[A, B, C, D, E, F, G, H, I, J]>;
declare function tuple<A, B, C, D, E, F, G, H, I, J, K>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K]>): Struct<[A, B, C, D, E, F, G, H, I, J, K]>;
declare function tuple<A, B, C, D, E, F, G, H, I, J, K, L>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L]>): Struct<[A, B, C, D, E, F, G, H, I, J, K, L]>;
declare function tuple<A, B, C, D, E, F, G, H, I, J, K, L, M>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M]>): Struct<[A, B, C, D, E, F, G, H, I, J, K, L, M]>;
declare function tuple<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N]>): Struct<[A, B, C, D, E, F, G, H, I, J, K, L, M, N]>;
declare function tuple<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O]>): Struct<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O]>;
declare function tuple<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P]>): Struct<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P]>;
declare function tuple<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q]>): Struct<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q]>;
/**
 * Validate that a value matches a specific strutural interface, like the
 * structural typing that TypeScript uses.
 */
declare function type<V extends StructRecord<any>>(Structs: V): Struct<{
    [K in keyof V]: StructType<V[K]>;
}>;
/**
 * Validate that a value is one of a set of types.
 */
declare function union<A>(Structs: StructTuple<[A]>): Struct<A>;
declare function union<A, B>(Structs: StructTuple<[A, B]>): Struct<A | B>;
declare function union<A, B, C>(Structs: StructTuple<[A, B, C]>): Struct<A | B | C>;
declare function union<A, B, C, D>(Structs: StructTuple<[A, B, C, D]>): Struct<A | B | C | D>;
declare function union<A, B, C, D, E>(Structs: StructTuple<[A, B, C, D, E]>): Struct<A | B | C | D | E>;
declare function union<A, B, C, D, E, F>(Structs: StructTuple<[A, B, C, D, E, F]>): Struct<A | B | C | D | E | F>;
declare function union<A, B, C, D, E, F, G>(Structs: StructTuple<[A, B, C, D, E, F, G]>): Struct<A | B | C | D | E | F | G>;
declare function union<A, B, C, D, E, F, G, H>(Structs: StructTuple<[A, B, C, D, E, F, G, H]>): Struct<A | B | C | D | E | F | G | H>;
declare function union<A, B, C, D, E, F, G, H, I>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I]>): Struct<A | B | C | D | E | F | G | H | I>;
declare function union<A, B, C, D, E, F, G, H, I, J>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J]>): Struct<A | B | C | D | E | F | G | H | I | J>;
declare function union<A, B, C, D, E, F, G, H, I, J, K>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K]>): Struct<A | B | C | D | E | F | G | H | I | J | K>;
declare function union<A, B, C, D, E, F, G, H, I, J, K, L>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L]>): Struct<A | B | C | D | E | F | G | H | I | J | K | L>;
declare function union<A, B, C, D, E, F, G, H, I, J, K, L, M>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M]>): Struct<A | B | C | D | E | F | G | H | I | J | K | L | M>;
declare function union<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N]>): Struct<A | B | C | D | E | F | G | H | I | J | K | L | M | N>;
declare function union<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O]>): Struct<A | B | C | D | E | F | G | H | I | J | K | L | M | N | O>;
declare function union<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P]>): Struct<A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P>;
declare function union<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q]>): Struct<A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q>;
export { coercion, defaulted, masked, empty, length, pattern, refinement, Struct, StructError, StructContext, StructFailure, StructResult, StructType, assert, coerce, is, validate, any, array, boolean, date, dynamic, enums, func, instance, intersection, lazy, literal, map, never, nullable, number, object, optional, partial, record, set, string, struct, tuple, type, union };
