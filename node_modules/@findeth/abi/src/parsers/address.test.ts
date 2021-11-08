import { toHex } from '../utils/buffer';
import { encodeAddress } from './address';

describe('encodeAddress', () => {
  it('encodes an address', () => {
    expect(toHex(encodeAddress(Buffer.alloc(0), '0x4bbeEB066eD09B7AEd07bF39EEe0460DFa261520', 'address'))).toBe(
      '0000000000000000000000004bbeeb066ed09b7aed07bf39eee0460dfa261520'
    );
  });
});
