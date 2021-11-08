import { toHex } from './buffer';
import { fromTwosComplement, toTwosComplement } from './twos-complement';

describe('fromTwosComplement', () => {
  it('returns the normal equivalent of a number', () => {
    expect(fromTwosComplement('01')).toBe(1n);
    expect(fromTwosComplement('0000000000000000000000000000000000000000000000000000000000000001')).toBe(1n);
    expect(fromTwosComplement('ff')).toBe(-1n);
    expect(fromTwosComplement('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')).toBe(-1n);

    expect(fromTwosComplement('3039')).toBe(12345n);
    expect(fromTwosComplement('0000000000000000000000000000000000000000000000000000000000003039')).toBe(12345n);
    expect(fromTwosComplement('cfc7')).toBe(-12345n);
    expect(fromTwosComplement('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffcfc7')).toBe(-12345n);
  });
});

describe('toTwosComplement', () => {
  it("returns the two's complement equivalent of a number", () => {
    expect(toHex(toTwosComplement(1n, 1))).toBe('01');
    expect(toHex(toTwosComplement(1n, 32))).toBe('0000000000000000000000000000000000000000000000000000000000000001');
    expect(toHex(toTwosComplement(-1n, 1))).toBe('ff');
    expect(toHex(toTwosComplement(-1n, 32))).toBe('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

    expect(toHex(toTwosComplement(12345n, 2))).toBe('3039');
    expect(toHex(toTwosComplement(12345n, 32))).toBe(
      '0000000000000000000000000000000000000000000000000000000000003039'
    );
    expect(toHex(toTwosComplement(-12345n, 2))).toBe('cfc7');
    expect(toHex(toTwosComplement(-12345n, 32))).toBe(
      'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffcfc7'
    );
  });
});
