import { ContractFunction, ContractInput } from './contract';
import { getIdentifier } from './identifier';
import { pack, unpack } from './parsers/array';
import { concat } from './utils/buffer';

/**
 * Encode the input data with the provided types.
 *
 * @param {(ContractInput | string)[]} input
 * @param {unknown[]} values
 * @return {Buffer}
 */
export const encode = (input: Array<ContractInput | string>, values: unknown[]): Uint8Array => {
  const types = input.map((type) => {
    if (typeof type === 'string') {
      return type;
    }

    return type.type;
  });

  return pack(Buffer.alloc(0), values, types);
};

/**
 * Encode the input data with the provided types, and prepend the function identifier.
 *
 * @param {ContractFunction} contractFunction
 * @param {unknown[]} values
 * @return {Buffer}
 */
export const encodeWithIdentifier = (contractFunction: ContractFunction, values: unknown[]): Uint8Array => {
  const identifier = Buffer.from(getIdentifier(contractFunction), 'hex');
  const encoded = encode(contractFunction.inputs, values);

  return concat(identifier, encoded);
};

export const decode = <T extends unknown[]>(input: Array<ContractInput | string>, buffer: Buffer): T => {
  const types = input.map((type) => {
    if (typeof type === 'string') {
      return type;
    }

    return type.type;
  });

  return unpack(buffer, types) as T;
};
