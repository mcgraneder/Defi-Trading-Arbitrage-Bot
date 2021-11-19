import type * as Format from "../format";
import type { Case, Uint8ArrayLike } from "./types";
export declare const bytesCases: Case<Format.Types.BytesType, Format.Values.BytesValue, never>[];
export declare function validateUint8ArrayLike(input: Uint8ArrayLike, dataType: Format.Types.Type, //for error information
name: string): void;
