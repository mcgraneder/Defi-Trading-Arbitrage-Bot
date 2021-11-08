import { concat, toHex } from '../utils/buffer';
import { DecodeFunction, EncodeFunction } from './parser';

export const encodeAddress: EncodeFunction = (buffer: Uint8Array, value: string): Uint8Array => {
  if (value.length !== 42) {
    throw new Error('Invalid address length');
  }

  const addressBuffer = Buffer.alloc(32);
  addressBuffer.write(value.substring(2), 12, 'hex');

  return concat(buffer, addressBuffer);
};

export const decodeAddress: DecodeFunction = (value: Uint8Array): string => {
  const addressBuffer = value.subarray(-20);
  return `0x${toHex(addressBuffer)}`;
};
