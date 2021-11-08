import { ContractFunction, ContractInput, ContractInputTuple } from './contract';
import { keccak256 } from './utils/keccak256';

const isTuple = (input: ContractInput): input is ContractInputTuple => {
  return input.type === 'tuple';
};

/**
 * Parse the type of a contract input to a `string`.
 *
 * @param {ContractInput} input
 * @return {string}
 */
export const parseType = (input: ContractInput): string => {
  if (isTuple(input)) {
    return `(${input.components.map(parseType)})`;
  }

  return input.type;
};

/**
 * Get the function identifier of a contract function as `string`.
 *
 * @param {ContractFunction} contractFunction
 * @return {string}
 */
export const getIdentifier = (contractFunction: ContractFunction): string => {
  const types = contractFunction.inputs.map(parseType).join(',');

  return keccak256(`${contractFunction.name}(${types})`).slice(0, 8);
};
