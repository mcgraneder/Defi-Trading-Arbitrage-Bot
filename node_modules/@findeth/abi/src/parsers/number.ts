import { concat, toBuffer, toNumber } from '../utils/buffer';
import { fromTwosComplement, toTwosComplement } from '../utils/twos-complement';
import { DecodeFunction, EncodeFunction } from './parser';

const NUMBER_REGEX = /^u?int([0-9]*)?$/;

const isSigned = (type: string): boolean => {
  return type.startsWith('i');
};

export const isNumber = (type: string): boolean => {
  return NUMBER_REGEX.test(type);
};

export const getBitLength = (type: string): number => {
  const rawBits = type.match(NUMBER_REGEX)?.[1] ?? '256';
  return Number(rawBits);
};

export const inRange = (value: bigint, type: string): boolean => {
  const bits = BigInt(getBitLength(type));

  if (isSigned(type)) {
    const maxSignedValue = 2n ** (bits - 1n) - 1n;
    return value >= -maxSignedValue - 1n && value <= maxSignedValue;
  }

  const maxValue = 2n ** bits - 1n;
  return value >= 0n && value <= maxValue;
};

const asNumber = (value: string | bigint): bigint => {
  if (typeof value === 'bigint') {
    return value;
  }

  return BigInt(value);
};

export const encodeNumber: EncodeFunction = (buffer: Uint8Array, value: string | bigint, type: string): Uint8Array => {
  const numberValue = asNumber(value);

  if (!inRange(numberValue, type)) {
    throw new Error(`Cannot encode number: value is out of range for type ${type}`);
  }

  if (isSigned(type)) {
    return concat(buffer, toTwosComplement(numberValue, 32));
  }

  return concat(buffer, toBuffer(numberValue));
};

export const decodeNumber: DecodeFunction = (value: Uint8Array, _, type: string): bigint => {
  if (isSigned(type)) {
    return fromTwosComplement(value);
  }

  return toNumber(value);
};
