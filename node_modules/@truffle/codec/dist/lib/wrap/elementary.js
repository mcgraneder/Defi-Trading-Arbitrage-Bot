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
exports.wrapAddress = exports.wrapDecimal = exports.wrapIntegerOrEnum = exports.wrapBytes = exports.wrapString = exports.wrapBool = exports.byteStringPattern = exports.wrongLengthMessage = exports.notABytestringMessage = exports.specifiedTypeMessage = exports.wrappedTypeMessage = exports.checksumFailedMessage = exports.errorResultMessage = void 0;
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default("codec:wrap:elementary");
const Format = __importStar(require("../format"));
const errors_1 = require("./errors");
const Conversion = __importStar(require("../conversion"));
const Utils = __importStar(require("./utils"));
const EvmUtils = __importStar(require("../evm/utils"));
const bn_js_1 = __importDefault(require("bn.js"));
const big_js_1 = __importDefault(require("big.js"));
const utf8_1 = __importDefault(require("utf8"));
const lodash_isboolean_1 = __importDefault(require("lodash.isboolean")); //recognizes boolean *or* Boolean
const lodash_isstring_1 = __importDefault(require("lodash.isstring")); //recognizes string *or* String
const lodash_isnumber_1 = __importDefault(require("lodash.isnumber")); //recognizes number *or* Number
const Web3Utils = require("web3-utils"); //importing untyped, sorry!
exports.errorResultMessage = "Input is a wrapped result representing an error rather than a value";
const notAStringMessage = "Input was not a string, type/value pair, or wrapped or boxed string";
const nonIntegerMessage = "Input numeric value was not an integer";
const nonNumericMessage = "Input string was not numeric";
const badEnumMessage = "Input string was neither numeric nor a valid enum value";
const outOfRangeMessage = "Input is outside the range of this numeric type";
const outOfRangeEnumMessage = "Input is outside the range of this enum type";
exports.checksumFailedMessage = "Address checksum failed (use all lowercase or all uppercase to circumvent)";
const invalidUtf16Message = "Input string was not valid UTF-16";
function wrappedTypeMessage(dataType) {
    return `Input is a wrapped value of type ${Format.Types.typeString(dataType)}`;
}
exports.wrappedTypeMessage = wrappedTypeMessage;
function specifiedTypeMessage(dataType) {
    return `Input had type explicitly specified as ${dataType}`;
}
exports.specifiedTypeMessage = specifiedTypeMessage;
function overlongMessage(expected, got) {
    return `Input is too long for type (expected ${expected} bytes, got ${got} bytes)`;
}
function tooPreciseMessage(expected, got) {
    return `Input has too many decimal places for type (expected ${expected} decimal places, got ${got} decimal places)`;
}
function notABytestringMessage(what) {
    return `${what} is not a valid bytestring (even-length hex string)`;
}
exports.notABytestringMessage = notABytestringMessage;
function wrongLengthMessage(what, expected, got) {
    return `Input ${what} was ${got} bytes instead of ${expected} bytes`;
}
exports.wrongLengthMessage = wrongLengthMessage;
const hexStringPattern = /^0[xX][0-9a-fA-F]*$/;
const shortHexStringPattern = /^[0-9a-fA-F]*$/;
exports.byteStringPattern = /^0[xX]([0-9a-fA-F]{2})*$/;
function wrapBool(dataType, input, wrapOptions) {
    let asBoolean;
    if (typeof input === "boolean") {
        asBoolean = input;
    }
    else if (typeof input === "number") {
        asBoolean = Boolean(input);
    }
    else if (typeof input === "string") {
        //strings are true unless they're falsy or the case-insensitive string "false"
        asBoolean = Boolean(input) && input.toLowerCase() !== "false";
    }
    else if (lodash_isboolean_1.default(input)) {
        //if it's a boxed boolean, extract
        //(we do this *after* the primitive boolean check since isBoolean
        //detects both, don't want an infinite loop... this pattern will reoccur
        //throughout all these functions)
        asBoolean = input.valueOf();
    }
    else if (lodash_isstring_1.default(input)) {
        //just extract & rerun in this case since strings have special handling
        return wrapBool(dataType, input.valueOf(), wrapOptions);
    }
    else if (lodash_isnumber_1.default(input)) {
        asBoolean = Boolean(input.valueOf());
    }
    else if (Utils.isWrappedResult(input)) {
        //1. is it already wrapped?
        if (input.type.typeClass === "bool") {
            switch (input.kind) {
                case "value":
                    asBoolean = input.value.asBoolean;
                    break;
                case "error":
                    switch (input.error.kind) {
                        case "BoolOutOfRangeError":
                        case "BoolPaddingError":
                            //treat BoolErrors as true
                            asBoolean = true;
                            break;
                        default:
                            throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, exports.errorResultMessage);
                    }
                    break;
            }
        }
        else {
            throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, wrappedTypeMessage(input.type));
        }
    }
    else if (Utils.isTypeValueInput(input)) {
        //2. is it a type/value?
        if (input.type !== "bool") {
            throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, specifiedTypeMessage(input.type));
        }
        //if so wrap input.value
        return wrapBool(dataType, input.value, Object.assign(Object.assign({}, wrapOptions), { loose: true }));
    }
    else {
        // otherwise, is it truthy or falsy?
        asBoolean = Boolean(input);
    }
    return {
        type: dataType,
        kind: "value",
        value: {
            asBoolean
        }
    };
}
exports.wrapBool = wrapBool;
function wrapString(dataType, input, wrapOptions) {
    let asString;
    if (Utils.isWrappedResult(input)) {
        //1. is it already wrapped?
        //(rather than dealing with the different kinds in this case
        //for rewrapping, we'll just rewrap directly)
        //yes, this is a little inconsistent with how we handle other cases
        if (input.type.typeClass === "string") {
            switch (input.kind) {
                case "value":
                    return {
                        type: dataType,
                        kind: "value",
                        value: input.value
                    };
                case "error":
                    throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, exports.errorResultMessage);
            }
        }
        else {
            throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, wrappedTypeMessage(input.type));
        }
    }
    else if (Utils.isTypeValueInput(input)) {
        //2. is it a type/value?
        //if so wrap input.value
        if (input.type !== "string") {
            throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, specifiedTypeMessage(input.type));
        }
        return wrapString(dataType, input.value, Object.assign(Object.assign({}, wrapOptions), { loose: true }));
    }
    else if (typeof input === "string") {
        asString = input;
    }
    else if (lodash_isstring_1.default(input)) {
        //if it's a boxed string, extract
        asString = input.valueOf();
    }
    else {
        //we don't know what it is
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, notAStringMessage);
    }
    try {
        //check: is this valid UTF-16?
        //(probably not the best way but oh well)
        utf8_1.default.encode(asString); //encode but discard :P
    }
    catch (_) {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, invalidUtf16Message);
    }
    return {
        type: dataType,
        kind: "value",
        value: {
            kind: "valid",
            asString
        }
    };
}
exports.wrapString = wrapString;
function wrapBytes(dataType, input, wrapOptions) {
    let asHex;
    if (Utils.isWrappedResult(input)) {
        //1. is it already wrapped?
        if (input.type.typeClass === "bytes") {
            switch (input.kind) {
                case "value":
                    if (wrapOptions.loose ||
                        (input.type.kind === "dynamic" && dataType.kind === "dynamic") ||
                        (input.type.kind === "static" &&
                            dataType.kind === "static" &&
                            input.type.length === dataType.length)) {
                        //it's valid! (barring length issues)
                        asHex = input.value.asHex;
                    }
                    else {
                        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, wrappedTypeMessage(input.type));
                    }
                    break;
                case "error":
                    throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, exports.errorResultMessage);
            }
        }
        else {
            throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, wrappedTypeMessage(input.type));
        }
    }
    else if (Utils.isTypeValueInput(input)) {
        //2. is it a type/value?
        //if so wrap input.value (with loose on so strings will work)
        if (!input.type.match(/^byte(s\d*)?$/)) {
            throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, specifiedTypeMessage(input.type));
        }
        debug("input.type: %s", input.type);
        let length = null;
        let match = input.type.match(/^bytes(\d+)$/);
        debug("match: %O", match);
        if (match) {
            length = Number(match[1]);
        }
        else if (input.type === "byte") {
            //if type is byte, set length to 1;
            //otherwise it's type bytes so leave it null
            length = 1;
        }
        debug("length: %o", length);
        if ((length === null && dataType.kind === "dynamic") ||
            (dataType.kind === "static" && length === dataType.length)) {
            //wrap input.value, but with loose on, so strings will be allowed
            return wrapBytes(dataType, input.value, Object.assign(Object.assign({}, wrapOptions), { loose: true }));
        }
        else {
            throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, specifiedTypeMessage(input.type));
        }
    }
    else if (typeof input === "string") {
        //is it a hex string?
        if (input.match(hexStringPattern)) {
            //reject hex strings that are not byte strings
            if (!input.match(exports.byteStringPattern)) {
                throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, "Input was not a valid even-length hex string");
            }
            asHex = input.toLowerCase();
            //further validation and padding come later
        }
        else {
            throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, "Input was not a valid even-length hex string");
        }
    }
    else if (lodash_isstring_1.default(input)) {
        //unbox and retry
        return wrapBytes(dataType, input.valueOf(), wrapOptions);
    }
    else if (input instanceof Uint8Array) {
        asHex = Conversion.toHexString(input);
    }
    else if (Utils.isUint8ArrayLikeInput(input)) {
        //note: this has to go *after* isString, as otherwise Strings will be detected here
        checkUint8ArrayLike(input, dataType, wrapOptions.name); //will throw appropriate errors
        asHex = Conversion.toHexString(new Uint8Array(input)); //I am surprised TS accepts this!
    }
    else if (Utils.isEncodingTextInput(input)) {
        switch (input.encoding) {
            case "utf8":
                try {
                    asHex = Conversion.toHexString(Conversion.stringToBytes(input.text));
                }
                catch (_a) {
                    throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, invalidUtf16Message);
                }
                break;
            default:
                throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, `Unknown or unsupported text encoding ${input.encoding}`);
        }
    }
    else {
        //we don't know what it is
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, "Input was not a hex string, byte-array-alike, encoding/text pair, type/value pair, or wrapped bytestring");
    }
    //now: if static length, validate and pad
    if (dataType.kind === "static") {
        if ((asHex.length - 2) / 2 > dataType.length) {
            throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, overlongMessage(dataType.length, (asHex.length - 2) / 2));
        }
        else {
            asHex = asHex.padEnd(dataType.length * 2 + 2, "00");
        }
    }
    //no idea why TS is messing up here
    return {
        type: dataType,
        kind: "value",
        value: {
            asHex
        }
    };
}
exports.wrapBytes = wrapBytes;
function* wrapIntegerOrEnum(dataType, input, wrapOptions) {
    let asBN;
    if (typeof input === "number") {
        //numeric case
        if (Number.isSafeInteger(input)) {
            asBN = new bn_js_1.default(input);
        }
        else {
            if (Number.isInteger(input)) {
                throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, "Input number is not a Javascript safe integer");
            }
            else {
                throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, nonIntegerMessage);
            }
        }
    }
    else if (typeof input === "bigint") {
        //bigint case
        asBN = Conversion.toBN(input);
    }
    else if (lodash_isnumber_1.default(input)) {
        //we'll just recurse here so we don't need to add another integrality check
        return yield* wrapIntegerOrEnum(dataType, input.valueOf(), wrapOptions);
    }
    else if (bn_js_1.default.isBN(input)) {
        asBN = input.clone();
    }
    else if (Conversion.isBig(input)) {
        if (Conversion.countDecimalPlaces(input) === 0) {
            asBN = Conversion.toBN(input);
        }
        else {
            throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, nonIntegerMessage);
        }
    }
    else if (Utils.isTypeValueInput(input)) {
        if (input.type.match(/^u?int\d*$/)) {
            const [_, typeClass, bitsAsString] = input.type.match(/^(u?int)(\d*)$/);
            const bits = bitsAsString ? Number(bitsAsString) : 256; //defaults to 256
            //(not using the WORD_SIZE constant due to fixed types bringing its applicability
            //here into question)
            const requiredTypeClass = dataType.typeClass !== "enum"
                ? dataType.typeClass
                : "uint"; //allow underlying uint type to work for enums
            //(we handle "enum" given as type in a separate case below)
            const requiredBits = dataType.typeClass !== "enum"
                ? dataType.bits
                : 8 * Math.ceil(Math.log2(Format.Types.fullType(dataType, wrapOptions.userDefinedTypes).options.length) / 8); //compute required bits for enum type (sorry)
            if (requiredTypeClass === typeClass && requiredBits === bits) {
                return yield* wrapIntegerOrEnum(dataType, input.value, Object.assign(Object.assign({}, wrapOptions), { loose: true }));
            }
            else {
                throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, specifiedTypeMessage(input.type));
            }
        }
        else if (input.type === "enum") {
            if (dataType.typeClass === "enum") {
                return yield* wrapIntegerOrEnum(dataType, input.value, Object.assign(Object.assign({}, wrapOptions), { loose: true }));
            }
            else {
                throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, specifiedTypeMessage(input.type));
            }
        }
        else {
            throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, specifiedTypeMessage(input.type));
        }
    }
    else if (Utils.isWrappedResult(input)) {
        switch (input.type.typeClass) {
            case "int":
            case "uint":
                if (!wrapOptions.loose &&
                    (input.type.typeClass !== dataType.typeClass ||
                        input.type.bits !== dataType.bits)) {
                    throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, wrappedTypeMessage(input.type));
                }
                switch (input.kind) {
                    case "value":
                        asBN = (input).value.asBN.clone();
                        break;
                    case "error":
                        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, exports.errorResultMessage);
                }
                break;
            case "fixed":
            case "ufixed":
                if (!wrapOptions.loose) {
                    throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, wrappedTypeMessage(input.type));
                }
                switch (input.kind) {
                    case "value":
                        asBN = Conversion.toBN(input.value.asBig);
                        break;
                    case "error":
                        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, exports.errorResultMessage);
                }
                break;
            case "enum":
                const coercedInput = input;
                if (!wrapOptions.loose &&
                    (dataType.typeClass !== "enum" || input.type.id !== dataType.id)) {
                    throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, wrappedTypeMessage(input.type));
                }
                switch (coercedInput.kind) {
                    case "value":
                        asBN = coercedInput.value.numericAsBN.clone();
                        break;
                    case "error":
                        switch (coercedInput.error.kind) {
                            case "EnumOutOfRangeError":
                                asBN = coercedInput.error.rawAsBN.clone();
                                break;
                            default:
                                throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, exports.errorResultMessage);
                        }
                        break;
                }
                break;
            default:
                throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, wrappedTypeMessage(input.type));
        }
    }
    else if (typeof input === "string") {
        //hoo boy...
        if (input.trim() === "") {
            //bigint accepts this but we shouldn't
            throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, dataType.typeClass === "enum"
                ? badEnumMessage
                : nonNumericMessage);
        }
        try {
            //first: is it just an integer numeric string that BigInt
            //will accept? [we'll juse BigInt as it accepts more than BN does]
            const asBigInt = BigInt(input);
            asBN = Conversion.toBN(asBigInt);
        }
        catch (_a) {
            //if that didn't work -- might it be a numeric string with a unit?
            //(this case will also handle things that Big will accept but BigInt won't,
            //such as scientific notation, or just non-integers in general)
            let [_, quantityString, unit] = input.match(/^(.*?)(|wei|gwei|shannon|finney|szabo|ether)\s*$/i); //units will be case insensitive; note this always matches
            quantityString = quantityString.trim(); //Big rejects whitespace, let's allow it
            const unitPlacesTable = {
                //we could accept all of web3's units here, but, that's a little much;
                //we'll just accept the most common ones
                "": 0,
                "wei": 0,
                "gwei": 9,
                "shannon": 9,
                "szabo": 12,
                "finney": 15,
                "ether": 18
            };
            let quantity;
            try {
                quantity = quantityString.match(/^\s*$/)
                    ? new big_js_1.default(1) //allow just "ether" e.g.
                    : new big_js_1.default(quantityString);
            }
            catch (_b) {
                quantity = null;
            }
            if (quantity !== null) {
                const places = unitPlacesTable[unit.toLowerCase()];
                const asBig = Conversion.shiftBigUp(quantity, places);
                if (Conversion.countDecimalPlaces(asBig) === 0) {
                    asBN = Conversion.toBN(asBig);
                }
                else {
                    throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, unit !== ""
                        ? "Input numeric value was not an integral number of wei"
                        : nonIntegerMessage);
                }
            }
            else {
                //if that didn't work -- might it be a negated hex string?
                //(BN & BigInt don't allow that, but ethers does, so we have to handle it somewhat manually)
                if (input.match(/^\s*-/)) {
                    let positiveAsBN;
                    const [_, positiveString] = input.match(/^\s*-(.*)$/);
                    try {
                        const positive = BigInt(positiveString);
                        positiveAsBN = Conversion.toBN(positive);
                    }
                    catch (_c) {
                        positiveAsBN = null;
                    }
                    if (positiveAsBN === null ||
                        positiveString === "" ||
                        positiveString.match(/^(-|\s)/)) {
                        //no double negation, no bare "-", and no space after the minus!
                        //(we do this as a string check, rather than checking if
                        //positiveAsBN is >=0, in order to prevent entering e.g. "--" or "- 2")
                        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, nonNumericMessage);
                    }
                    asBN = positiveAsBN.neg();
                }
                else {
                    //finally: if it's not numeric at all.  in this case, we give up for ints & uints,
                    //but we still have work to do for enums.
                    if (dataType.typeClass !== "enum") {
                        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, nonNumericMessage);
                    }
                    const fullType = (Format.Types.fullType(dataType, wrapOptions.userDefinedTypes));
                    const options = fullType.options;
                    const components = input.split(".");
                    debug("components: %O", components);
                    debug("dataType: %O", dataType);
                    debug("options: %O", options);
                    //the enum can be qualified.  if it's qualified, does the type match?
                    let matchingType;
                    switch (components.length) {
                        case 1:
                            //not qualified, automatically matches
                            matchingType = true;
                            break;
                        case 2:
                            //qualified by type name, does it match?
                            matchingType = components[0] === dataType.typeName;
                            break;
                        case 3:
                            //qualified by type name and contract name, does it match?
                            matchingType =
                                dataType.kind === "local" &&
                                    components[0] === dataType.definingContractName &&
                                    components[1] === dataType.typeName;
                            break;
                        default:
                            //no valid reason to have 3 or more periods
                            //(and split cannot return an empty array)
                            matchingType = false;
                    }
                    debug("matchingType: %O", matchingType);
                    const numeric = matchingType
                        ? options.indexOf(components[components.length - 1])
                        : -1; //if type doesn't match, just indicate error
                    debug("numeric: %d", numeric);
                    if (numeric === -1) {
                        //-1 comes from either our setting it manually above to indicate error,
                        //or from a failed indexOf call
                        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, badEnumMessage);
                    }
                    else {
                        asBN = new bn_js_1.default(numeric); //whew!
                    }
                }
            }
        }
    }
    else if (lodash_isstring_1.default(input)) {
        //strings are complicated so let's just recurse
        return yield* wrapIntegerOrEnum(dataType, input.valueOf(), wrapOptions);
    }
    else if (input instanceof Uint8Array) {
        asBN = Conversion.toBN(input);
    }
    else if (Utils.isUint8ArrayLikeInput(input)) {
        //note: this has to go *after* isString, as otherwise Strings will be detected here
        //(much like how isString must go after string to prevent infinite loop)
        checkUint8ArrayLike(input, dataType, wrapOptions.name); //will throw appropriate errors
        asBN = Conversion.toBN(new Uint8Array(input)); //I am surprised TS accepts this!
    }
    else {
        const request = { kind: "integer", input };
        const response = yield request;
        if (response.kind !== "integer") {
            throw new errors_1.BadResponseTypeError(request, response);
        }
        if (response.value === null) {
            const enumMessage = dataType.typeClass === "enum" ? "enum value name, " : "";
            throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, response.reason ||
                `Input was not a number, big integer, numeric string, ${enumMessage}type/value pair, boxed number, byte-array-like, wrapped number or enum, or recognized big number class`);
        }
        asBN = Conversion.toBN(response.value);
    }
    //validate and return
    switch (dataType.typeClass) {
        case "uint":
            if (asBN.isNeg() || asBN.bitLength() > dataType.bits) {
                throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, outOfRangeMessage);
            }
            return {
                type: dataType,
                kind: "value",
                value: {
                    asBN
                }
            };
        case "int":
            if ((!asBN.isNeg() && asBN.bitLength() >= dataType.bits) || //>= since signed
                (asBN.isNeg() && asBN.neg().subn(1).bitLength() >= dataType.bits)
            //bitLength doesn't work great for negatives so we do this instead
            ) {
                throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, outOfRangeMessage);
            }
            return {
                type: dataType,
                kind: "value",
                value: {
                    asBN
                }
            };
        case "enum":
            const fullType = (Format.Types.fullType(dataType, wrapOptions.userDefinedTypes));
            if (asBN.isNeg() || asBN.gten(fullType.options.length)) {
                throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, outOfRangeEnumMessage);
            }
            else {
                return {
                    type: dataType,
                    kind: "value",
                    value: {
                        numericAsBN: asBN,
                        name: fullType.options[asBN.toNumber()]
                    }
                };
            }
    }
}
exports.wrapIntegerOrEnum = wrapIntegerOrEnum;
function checkUint8ArrayLike(input, dataType, //for throwing
name //for throwing
) {
    //this function doesn't return anything, it just throws errors if something
    //goes wrong
    if (!Number.isSafeInteger(input.length)) {
        throw new errors_1.TypeMismatchError(dataType, input, name, "Input is byte-array-like, but its length is not a safe integer");
    }
    if (input.length < 0) {
        throw new errors_1.TypeMismatchError(dataType, input, name, "Input is byte-array-like, but its length is negative");
    }
    //check: is it actually like a Uint8Array?
    for (let index = 0; index < input.length; index++) {
        if (typeof input[index] !== "number" ||
            input[index] < 0 ||
            input[index] >= 256 ||
            !Number.isInteger(input[index])) {
            throw new errors_1.TypeMismatchError(dataType, input, name, `Input is byte-array-like, but byte ${index} is not a 1-byte value (number from 0 to 255)`);
        }
    }
    //otherwise, we didn't throw any errors, so return
}
function* wrapDecimal(dataType, input, wrapOptions) {
    let asBig;
    if (typeof input === "number") {
        //numeric case
        if (Number.isFinite(input)) {
            if (Utils.isSafeNumber(dataType, input)) {
                asBig = new big_js_1.default(input);
            }
            else {
                throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, "Given number is outside the safe range for this data type (possible loss of precision); use a numeric string, bigint, or big number class instead");
            }
        }
        else {
            throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, "Numeric value is not finite");
        }
    }
    else if (typeof input === "bigint") {
        //bigint case
        asBig = new big_js_1.default(input.toString());
    }
    else if (lodash_isnumber_1.default(input)) {
        //boxed number case
        return yield* wrapDecimal(dataType, input.valueOf(), wrapOptions);
    }
    else if (bn_js_1.default.isBN(input)) {
        asBig = Conversion.toBig(input);
    }
    else if (Conversion.isBig(input)) {
        asBig = input.plus(0); //clone
    }
    else if (Utils.isTypeValueInput(input)) {
        if (input.type.match(/^u?fixed(\d+(x\d+)?)?$/)) {
            const [_0, typeClass, _2, bitsAsString, _4, placesAsString] = input.type.match(/^(u?fixed)((\d+)(x(\d+))?)?$/);
            //not all of the fields in this match are used, so we discard them into _n variables
            const bits = bitsAsString ? Number(bitsAsString) : 128; //defaults to 128
            const places = placesAsString ? Number(placesAsString) : 18; //defaults to 18
            if (dataType.typeClass === typeClass &&
                dataType.bits === bits &&
                dataType.places === places) {
                return yield* wrapDecimal(dataType, input.value, Object.assign(Object.assign({}, wrapOptions), { loose: true }));
            }
            else {
                throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, specifiedTypeMessage(input.type));
            }
        }
        else {
            throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, specifiedTypeMessage(input.type));
        }
    }
    else if (Utils.isWrappedResult(input)) {
        switch (input.type.typeClass) {
            case "fixed":
            case "ufixed":
                if (!wrapOptions.loose &&
                    (input.type.typeClass !== dataType.typeClass ||
                        input.type.bits !== dataType.bits ||
                        input.type.places !== dataType.places)) {
                    throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, wrappedTypeMessage(input.type));
                }
                switch (input.kind) {
                    case "value":
                        asBig = input.value.asBig.plus(0); //clone
                        break;
                    case "error":
                        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, exports.errorResultMessage);
                }
                break;
            case "int":
            case "uint":
                if (!wrapOptions.loose) {
                    throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, wrappedTypeMessage(input.type));
                }
                switch (input.kind) {
                    case "value":
                        asBig = Conversion.toBig(input.value
                            .asBN);
                        break;
                    case "error":
                        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, exports.errorResultMessage);
                }
                break;
            case "enum":
                const coercedInput = input;
                if (!wrapOptions.loose) {
                    throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, wrappedTypeMessage(input.type));
                }
                switch (coercedInput.kind) {
                    case "value":
                        asBig = Conversion.toBig(coercedInput.value.numericAsBN);
                        break;
                    case "error":
                        switch (coercedInput.error.kind) {
                            case "EnumOutOfRangeError":
                                asBig = Conversion.toBig(coercedInput.error.rawAsBN);
                                break;
                            default:
                                throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, exports.errorResultMessage);
                        }
                        break;
                }
                break;
            default:
                throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, wrappedTypeMessage(input.type));
        }
    }
    else if (typeof input === "string") {
        //so much simpler than the integer case!
        const trimmed = input.trim(); //allow whitespace
        try {
            asBig = new big_js_1.default(trimmed);
        }
        catch (_a) {
            throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, nonNumericMessage);
        }
    }
    else if (lodash_isstring_1.default(input)) {
        //we'll just recurse here for proper string handling
        return yield* wrapDecimal(dataType, input.valueOf(), wrapOptions);
    }
    else {
        const request = { kind: "decimal", input };
        const response = yield request;
        if (response.kind !== "decimal") {
            throw new errors_1.BadResponseTypeError(request, response);
        }
        if (response.value === null) {
            throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, response.reason ||
                `Input was not a number, big integer, numeric string, type/value pair, boxed number, wrapped number or enum, or recognized big number class`);
        }
        asBig = response.value.plus(0); //clone
    }
    //validate and return
    if (Conversion.countDecimalPlaces(asBig) > dataType.places) {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, tooPreciseMessage(dataType.places, Conversion.countDecimalPlaces(asBig)));
    }
    if (asBig.gt(Utils.maxValue(dataType)) ||
        asBig.lt(Utils.minValue(dataType))) {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, outOfRangeMessage);
    }
    //no idea why TS is messing up here
    return {
        type: dataType,
        kind: "value",
        value: {
            asBig
        }
    };
}
exports.wrapDecimal = wrapDecimal;
//handles both address and contracts
//NOTE: even with loose turned off, we'll consider these interchangeable
function* wrapAddress(dataType, input, wrapOptions) {
    let asAddress;
    if (Utils.isWrappedResult(input)) {
        //1. is it already wrapped?
        switch (input.kind) {
            case "value":
                switch (input.type.typeClass) {
                    case "address":
                        asAddress = input.value.asAddress;
                        break;
                    case "contract":
                        asAddress = input.value.address;
                        break;
                    default:
                        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, wrappedTypeMessage(input.type));
                }
                break;
            case "error":
                throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, exports.errorResultMessage);
        }
    }
    else if (Utils.isTypeValueInput(input)) {
        //2. is it a type/value?
        //if so wrap input.value (with loose on so strings will work)
        if (input.type !== "address" && input.type !== "contract") {
            throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, specifiedTypeMessage(input.type));
        }
        return yield* wrapAddress(dataType, input.value, Object.assign(Object.assign({}, wrapOptions), { loose: true }));
    }
    else if (typeof input === "string") {
        if (input.match(hexStringPattern)) {
            //case 1: it's a hex string
            asAddress = input; //validation will be handled below
        }
        else if (input.match(shortHexStringPattern)) {
            //doing this because ethers does it
            asAddress = "0x" + input;
        }
        else {
            //case 2: it needs resolution
            //(this will handle ICAP addresses as well)
            const request = { kind: "address", name: input };
            const response = yield request;
            if (response.kind !== "address") {
                throw new errors_1.BadResponseTypeError(request, response);
            }
            if (response.address === null) {
                throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, response.reason);
            }
            asAddress = response.address;
        }
    }
    else if (lodash_isstring_1.default(input)) {
        //unbox and retry
        return yield* wrapAddress(dataType, input.valueOf(), wrapOptions);
    }
    else if (Utils.isContractInput(input)) {
        asAddress = input.address;
    }
    else {
        //we don't know what it is
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, "Input was not recognizable as an address");
    }
    //now: validate
    if (!asAddress.match(exports.byteStringPattern)) {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, notABytestringMessage("Address"));
    }
    if (asAddress.length !== 2 * EvmUtils.ADDRESS_SIZE + 2) {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, wrongLengthMessage("address", EvmUtils.ADDRESS_SIZE, (asAddress.length - 2) / 2));
    }
    if (!Web3Utils.isAddress(asAddress)) {
        throw new errors_1.TypeMismatchError(dataType, input, wrapOptions.name, exports.checksumFailedMessage);
    }
    //and normalize
    asAddress = Web3Utils.toChecksumAddress(asAddress);
    switch (dataType.typeClass) {
        case "address":
            return {
                type: dataType,
                kind: "value",
                value: {
                    asAddress
                }
            };
        case "contract":
            return {
                type: dataType,
                kind: "value",
                value: {
                    kind: "unknown",
                    address: asAddress
                }
            };
    }
}
exports.wrapAddress = wrapAddress;
//# sourceMappingURL=elementary.js.map