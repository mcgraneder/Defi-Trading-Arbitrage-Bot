// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EncodeFunction = (buffer: Uint8Array, value: any, type: string) => Uint8Array;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DecodeFunction = (value: Uint8Array, buffer: Uint8Array, type: string) => any;

export interface Parser {
  dynamic?: true;
  encode: EncodeFunction;
  decode: DecodeFunction;
}
