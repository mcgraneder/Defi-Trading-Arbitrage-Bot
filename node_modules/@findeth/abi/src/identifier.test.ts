import erc20Abi from './__tests__/erc20.json';
import miscAbi from './__tests__/misc.json';
import { ContractFunction } from './contract';
import { getIdentifier, parseType } from './identifier';

const erc20 = erc20Abi as ContractFunction[];
const misc = miscAbi as ContractFunction[];

describe('parseTypes', () => {
  it('parses a regular type to a string', () => {
    expect(parseType(misc[0].inputs[0])).toBe('address');
    expect(parseType(misc[0].inputs[1])).toBe('uint256');
  });

  it('parses a tuple type to a string', () => {
    expect(parseType(misc[0].inputs[2])).toBe('(address,uint256)');
    expect(parseType(misc[0].inputs[3])).toBe('(address,(address,uint256))');
  });
});

describe('getIdentifier', () => {
  it('returns the identifier for functions', () => {
    erc20
      .filter((contractFunction) => contractFunction.type === 'function')
      .forEach((contractFunction) => {
        expect(getIdentifier(contractFunction)).toMatchSnapshot();
      });

    misc.forEach((contractFunction) => {
      expect(getIdentifier(contractFunction)).toMatchSnapshot();
    });
  });
});
