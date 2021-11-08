import { decodeFixedBytes, encodeFixedBytes } from './fixed-bytes';
import { DecodeFunction, EncodeFunction } from './parser';

/**
 * Encode a function type to a Buffer. This is equivalent to the `bytes24` type.
 *
 * @param {Uint8Array} buffer
 * @param {string | Uint8Array} value
 * @return {Uint8Array}
 */
export const encodeFunction: EncodeFunction = (buffer: Uint8Array, value: string | Uint8Array): Uint8Array => {
  return encodeFixedBytes(buffer, value, 'bytes24');
};

/**
 * Decode a function type from a Buffer. This is equivalent to the `bytes24` type.
 *
 * @param {Uint8Array} buffer
 * @param {string | Uint8Array} value
 * @return {Uint8Array}
 */
export const decodeFunction: DecodeFunction = (value: Uint8Array, buffer: Uint8Array): Uint8Array => {
  return decodeFixedBytes(value, buffer, 'bytes24');
};
