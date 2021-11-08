"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toTwosComplement = exports.fromTwosComplement = void 0;

var _buffer = require("./buffer");

const fromTwosComplement = buffer => {
  const bufferValue = (0, _buffer.toBuffer)(buffer);
  let value = 0n;

  for (const byte of bufferValue) {
    value = (value << 8n) + BigInt(byte);
  }

  return BigInt.asIntN(bufferValue.length * 8, value);
};

exports.fromTwosComplement = fromTwosComplement;

const toTwosComplement = (value, length) => {
  const buffer = new Uint8Array(length);

  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = Number(BigInt.asUintN(8, value));
    value = value >> 8n;
  }

  return buffer.reverse();
};

exports.toTwosComplement = toTwosComplement;
//# sourceMappingURL=twos-complement.js.map