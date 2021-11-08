import { toHex } from '../utils/buffer';
import { decodeBoolean, encodeBoolean } from './boolean';

describe('encodeBoolean', () => {
  it('encodes a boolean as a uint256 number', () => {
    const buffer = Buffer.alloc(0);
    expect(toHex(encodeBoolean(buffer, true, 'bool'))).toBe(
      '0000000000000000000000000000000000000000000000000000000000000001'
    );
    expect(toHex(encodeBoolean(buffer, false, 'bool'))).toBe(
      '0000000000000000000000000000000000000000000000000000000000000000'
    );
  });
});

describe('decodeBoolean', () => {
  it('decodes a boolean as a uint256 number', () => {
    const trueValue = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');
    expect(decodeBoolean(trueValue, trueValue, 'bool')).toBe(true);

    const falseValue = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
    expect(decodeBoolean(falseValue, falseValue, 'bool')).toBe(false);
  });
});
