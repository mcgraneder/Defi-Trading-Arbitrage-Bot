import createKeccakHash from 'keccak';

/**
 * Returns the Keccak-256 hash of a string, as a hexadecimal string.
 *
 * @param {string} input
 * @return {string}
 */
export const keccak256 = (input: string): string => {
  return createKeccakHash('keccak256').update(input).digest().toString('hex');
};
