import { addPadding, concat, toBuffer } from '../utils/buffer';
import { DecodeFunction, EncodeFunction } from './parser';

const BYTES_REGEX = /^bytes([0-9]{1,2})$/;

export const isFixedBytes = (type: string): boolean => {
  return BYTES_REGEX.test(type);
};

/**
 * Get the length of the specified type. If a length is not specified, or if the length is out of range (0 < n <= 32),
 * this will throw an error.
 *
 * @param {string} type
 * @return {number | undefined}
 */
export const getByteLength = (type: string): number => {
  const bytes = type.match(BYTES_REGEX)?.[1];

  if (bytes) {
    const length = Number(bytes);
    if (length <= 0 || length > 32) {
      throw new Error('Invalid type: length is out of range');
    }

    return length;
  }

  throw new Error('Invalid type: no length');
};

export const encodeFixedBytes: EncodeFunction = (
  buffer: Uint8Array,
  value: string | Uint8Array,
  type: string
): Uint8Array => {
  const length = getByteLength(type);
  const bufferValue = toBuffer(value);

  if (bufferValue.length > length) {
    throw new Error(`Buffer is too long, expected ${length}, got ${bufferValue.length}`);
  }

  return concat(buffer, addPadding(bufferValue));
};

export const decodeFixedBytes: DecodeFunction = (value: Uint8Array, _: Uint8Array, type: string): Uint8Array => {
  const length = getByteLength(type);

  return value.subarray(0, length);
};
