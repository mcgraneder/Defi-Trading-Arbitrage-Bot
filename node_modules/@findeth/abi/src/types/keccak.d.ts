/**
 * Declarations for keccak module.
 */
declare module 'keccak' {
  import { Hash } from 'crypto';

  type Algorithm =
    | 'keccak224'
    | 'keccak256'
    | 'keccak384'
    | 'keccak512'
    | 'sha3-224'
    | 'sha3-256'
    | 'sha3-384'
    | 'sha3-512'
    | 'shake128'
    | 'shake256';

  export default function createKeccakHash(algorithm: Algorithm): Hash;
}
