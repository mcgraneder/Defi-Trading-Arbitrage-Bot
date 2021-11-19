"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUint8ArrayLike = exports.bytesCases = void 0;
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default("codec:wrap:bytes");
const dispatch_1 = require("./dispatch");
const errors_1 = require("./errors");
const Conversion = __importStar(require("../conversion"));
const Utils = __importStar(require("./utils"));
const Messages = __importStar(require("./messages"));
const bytesCasesBasic = [
    bytesFromHexString,
    bytesFromBoxedString,
    bytesFromUint8ArrayLike,
    bytesFromBytesValue,
    bytesFromUdvtValue,
    bytesFromEncodingTextInput,
    bytesFailureCase
];
exports.bytesCases = [
    bytesFromTypeValueInput,
    ...bytesCasesBasic
];
function* bytesFromHexString(dataType, input, wrapOptions) {
    if (typeof input !== "string") {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, 1, "Input was not a string");
    }
    if (!Utils.isByteString(input)) {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, 5, Messages.notABytestringMessage("Input"));
    }
    const asHex = validateAndPad(dataType, input, input, wrapOptions.name);
    return {
        type: dataType,
        kind: "value",
        value: {
            asHex
        }
    };
}
function* bytesFromBoxedString(dataType, input, wrapOptions) {
    if (!Utils.isBoxedString(input)) {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, 1, "Input was not a boxed string");
    }
    //defer to primitive string case
    return yield* bytesFromHexString(dataType, input.valueOf(), wrapOptions);
}
function* bytesFromUint8ArrayLike(dataType, input, wrapOptions) {
    if (!Utils.isUint8ArrayLike(input)) {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, 1, "Input was not a Uint8Array-like");
    }
    //the next series of checks is delegated to a helper fn
    validateUint8ArrayLike(input, dataType, wrapOptions.name); //(this fn just throws an appropriate error if something's bad)
    let asHex = Conversion.toHexString(new Uint8Array(input)); //I am surprised TS accepts this!
    asHex = validateAndPad(dataType, asHex, input, wrapOptions.name);
    return {
        type: dataType,
        kind: "value",
        value: {
            asHex
        }
    };
}
function* bytesFromEncodingTextInput(dataType, input, wrapOptions) {
    if (!Utils.isEncodingTextInput(input)) {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, 1, "Input was not a in encoding/text form");
    }
    if (input.encoding !== "utf8") { //(the only allowed encoding :P )
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, 5, `Unknown or unsupported text encoding ${input.encoding}`);
    }
    let asHex;
    try {
        asHex = Conversion.toHexString(Conversion.stringToBytes(input.text));
    }
    catch (_a) {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, 5, Messages.invalidUtf16Message);
    }
    asHex = validateAndPad(dataType, asHex, input, wrapOptions.name);
    return {
        type: dataType,
        kind: "value",
        value: {
            asHex
        }
    };
}
function* bytesFromBytesValue(dataType, input, wrapOptions) {
    if (!Utils.isWrappedResult(input)) {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, 1, "Input was not a wrapped result");
    }
    if (input.type.typeClass !== "bytes") {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, 5, Messages.wrappedTypeMessage(input.type));
    }
    if (input.kind !== "value") {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, 5, Messages.errorResultMessage);
    }
    if (!wrapOptions.loose &&
        !(input.type.kind === "dynamic" && dataType.kind === "dynamic") &&
        !(input.type.kind === "static" &&
            dataType.kind === "static" &&
            input.type.length === dataType.length)) {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, 5, Messages.wrappedTypeMessage(input.type));
    }
    let asHex = input.value.asHex;
    asHex = validateAndPad(dataType, asHex, input, wrapOptions.name);
    return {
        type: dataType,
        kind: "value",
        value: {
            asHex
        }
    };
}
function* bytesFromUdvtValue(dataType, input, wrapOptions) {
    if (!Utils.isWrappedResult(input)) {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, 1, "Input was not a wrapped result");
    }
    if (input.type.typeClass !== "userDefinedValueType") {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, 1, Messages.wrappedTypeMessage(input.type));
    }
    if (input.kind !== "value") {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, 5, Messages.errorResultMessage);
    }
    return yield* bytesFromBytesValue(dataType, input.value, wrapOptions);
}
function* bytesFromTypeValueInput(dataType, input, wrapOptions) {
    if (!Utils.isTypeValueInput(input)) {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, 1, "Input was not a type/value pair");
    }
    if (!input.type.match(/^byte(s\d*)?$/)) {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, 5, Messages.specifiedTypeMessage(input.type));
    }
    debug("input.type: %s", input.type);
    //now: determine the specified length; we use "null" for dynamic
    //note that "byte" is allowed, with a length of 1
    let length = null;
    let match = input.type.match(/^bytes(\d+)$/);
    if (match) {
        length = Number(match[1]); //static case with specified number
    }
    else if (input.type === "byte") {
        //"byte" case; set length to 1
        length = 1;
    }
    //otherwise, it's dynamic, so leave it at the default of null
    debug("length: %o", length);
    //check: does the specified length match the data type length?
    if (!(length === null && dataType.kind === "dynamic") &&
        !(dataType.kind === "static" && length === dataType.length)) {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, 5, Messages.specifiedTypeMessage(input.type));
    }
    //extract value & try again, with loose option turned on
    return yield* dispatch_1.wrapWithCases(dataType, input.value, Object.assign(Object.assign({}, wrapOptions), { loose: true }), bytesCasesBasic);
}
function* bytesFailureCase(dataType, input, wrapOptions) {
    throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, 2, "Input was not a hex string, byte-array-alike, encoding/text pair, type/value pair, or wrapped bytestring");
}
function validateUint8ArrayLike(input, dataType, //for error information
name //for error information
) {
    //this function doesn't return anything, it just throws errors if something
    //goes wrong
    if (input instanceof Uint8Array) {
        return; //honest Uint8Arrays don't need checking
    }
    if (!Number.isSafeInteger(input.length)) {
        throw new errors_1.TypeMismatchError(dataType, input, name, 5, "Input is byte-array-like, but its length is not a safe integer");
    }
    if (input.length < 0) {
        throw new errors_1.TypeMismatchError(dataType, input, name, 5, "Input is byte-array-like, but its length is negative");
    }
    //check: is it actually like a Uint8Array?
    for (let index = 0; index < input.length; index++) {
        if (typeof input[index] !== "number" ||
            input[index] < 0 ||
            input[index] >= 256 ||
            !Number.isInteger(input[index])) {
            throw new errors_1.TypeMismatchError(dataType, input, name, 5, `Input is byte-array-like, but byte ${index} is not a 1-byte value (number from 0 to 255)`);
        }
    }
    //otherwise, we didn't throw any errors, so return
}
exports.validateUint8ArrayLike = validateUint8ArrayLike;
function validateAndPad(dataType, asHex, input, //for errors
name //for errors
) {
    asHex = asHex.toLowerCase();
    //if static, validate and pad
    if (dataType.kind === "static") {
        if ((asHex.length - 2) / 2 > dataType.length) {
            throw new errors_1.TypeMismatchError(dataType, input, name, 5, Messages.overlongMessage(dataType.length, (asHex.length - 2) / 2));
        }
        else {
            asHex = asHex.padEnd(dataType.length * 2 + 2, "00");
        }
    }
    return asHex;
}
//# sourceMappingURL=bytes.js.map