const BUFFER_WIDTH = 32;

/**
 * Concatenate two buffers. If a position is specified, `value` will be put in `target` at the specified position. All
 * bytes after that will be moved to the end of the buffer.
 *
 * @param {Uint8Array} target
 * @param {Uint8Array} value
 * @param {number} [position]
 * @return {Uint8Array}
 */
export const concat = (target: Uint8Array, value: Uint8Array, position?: number): Uint8Array => {
  return new Uint8Array([
    ...target.subarray(0, position ?? target.length),
    ...value,
    ...target.subarray(position ?? target.length)
  ]);
};

/**
 * Concatenates multiple buffers, compatible with Uint8Arrays of browsers.
 *
 * @param {Uint8Array[]} buffers
 * @return {Uint8Array}
 */
export const concatMultiple = (buffers: Uint8Array[]): Uint8Array => {
  return buffers.reduce((target, buffer) => {
    const array = new Uint8Array(target.length + buffer.length);
    array.set(target, 0);
    array.set(buffer, target.length);
    return array;
  }, new Uint8Array(0));
};

/**
 * Add padding to a buffer. If the buffer is larger than `length`, this function won't do anything. If it's smaller, the
 * buffer will be padded to the specified length, with extra zeroes at the end.
 *
 * @param {Uint8Array} buffer
 * @param {number} [length]
 * @return {Uint8Array}
 */
export const addPadding = (buffer: Uint8Array, length = 32): Uint8Array => {
  const padding = Buffer.alloc(Math.max(length - buffer.length, 0), 0);
  return concat(buffer, padding);
};

/**
 * Get a value as buffer. The value can be a string, number, bigint or buffer. If the value is a string, it is assumed
 * that it is a hexadecimal value.
 *
 * @param {string | number | bigint | Uint8Array} value
 * @return {Uint8Array}
 */
export const toBuffer = (value: string | number | bigint | Uint8Array): Uint8Array => {
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return value;
  }

  if (typeof value === 'string') {
    const stringValue = value.startsWith('0x') ? value.substring(2) : value;
    return Buffer.from(stringValue, 'hex');
  }

  const hex = value.toString(16);
  return Buffer.from(hex.padStart(BUFFER_WIDTH * 2, '0').slice(0, BUFFER_WIDTH * 2), 'hex');
};

/**
 * Get a UTF-8 encodes buffer as string.
 *
 * @param {Uint8Array} value
 * @return {string}
 */
export const toString = (value: Uint8Array): string => {
  if (typeof window !== 'undefined' && window.TextDecoder) {
    return new TextDecoder('utf-8').decode(value);
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return new (require('util').TextDecoder)('utf-8').decode(value);
};

/**
 * Get a number from a buffer.
 *
 * @param {Uint8Array} buffer
 */
export const toNumber = (buffer: Uint8Array): bigint => {
  const hex = toHex(buffer);
  if (hex.length === 0) {
    return BigInt(0);
  }

  return BigInt(`0x${hex}`);
};

const numberToHex = (value: number): string => {
  return ('0' + value.toString(16)).slice(-2);
};

/**
 * Get a buffer as hexadecimal string.
 *
 * @param {Uint8Array} buffer
 * @return {string}
 */
export const toHex = (buffer: Uint8Array): string => {
  return Array.from(buffer).map(numberToHex).join('');
};
