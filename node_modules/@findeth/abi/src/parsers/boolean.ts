import { decodeNumber, encodeNumber } from './number';
import { DecodeFunction, EncodeFunction } from './parser';

export const encodeBoolean: EncodeFunction = (buffer: Uint8Array, value: boolean | string): Uint8Array => {
  return encodeNumber(buffer, value ? 1n : 0n, 'uint256');
};

export const decodeBoolean: DecodeFunction = (value: Uint8Array, buffer: Uint8Array): boolean => {
  return decodeNumber(value, buffer, 'uint256') === 1n;
};
