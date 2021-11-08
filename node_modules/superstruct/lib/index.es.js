function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};

  var target = _objectWithoutPropertiesLoose(source, excluded);

  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

/**
 * Convert a validation result to an iterable of failures.
 */
function* toFailures(result, context) {
  if (result === true) ; else if (result === false) {
    yield context.fail();
  } else {
    yield* result;
  }
}
/**
 * Shifts (removes and returns) the first value from the `input` iterator.
 * Like `Array.prototype.shift()` but for an `Iterator`.
 */

function iteratorShift(input) {
  const {
    done,
    value
  } = input.next();
  return done ? undefined : value;
}

/**
 * `Struct` objects encapsulate the schema for a specific data type (with
 * optional coercion). You can then use the `assert`, `is` or `validate` helpers
 * to validate unknown data against a struct.
 */

class Struct {
  constructor(props) {
    const {
      type,
      schema,
      coercer = value => value,
      validator = () => [],
      refiner = () => []
    } = props;
    this.type = type;
    this.schema = schema;
    this.coercer = coercer;
    this.validator = validator;
    this.refiner = refiner;
  }

}
/**
 * `StructError` objects are thrown (or returned) by Superstruct when its
 * validation fails. The error represents the first error encountered during
 * validation. But they also have an `error.failures` property that holds
 * information for all of the failures encountered.
 */

class StructError extends TypeError {
  constructor(failure, moreFailures) {
    const {
      path,
      value,
      type,
      branch
    } = failure,
          rest = _objectWithoutProperties(failure, ["path", "value", "type", "branch"]);

    const message = `Expected a value of type \`${type}\`${path.length ? ` for \`${path.join('.')}\`` : ''} but received \`${JSON.stringify(value)}\`.`;
    let failuresResult;

    function failures() {
      if (!failuresResult) {
        failuresResult = [failure, ...moreFailures];
      }

      return failuresResult;
    }

    super(message);
    this.value = value;
    Object.assign(this, rest);
    this.type = type;
    this.path = path;
    this.branch = branch;
    this.failures = failures;
    this.stack = new Error().stack;
    this.__proto__ = StructError.prototype;
  }

}
/**
 * Assert that a value passes a `Struct`, throwing if it doesn't.
 */

function assert(value, struct) {
  const result = validate(value, struct);

  if (result[0]) {
    throw result[0];
  }
}
/**
 * Coerce a value with the coercion logic of `Struct` and validate it.
 */

function coerce(value, struct) {
  const ret = struct.coercer(value);
  assert(ret, struct);
  return ret;
}
/**
 * Check if a value passes a `Struct`.
 */

function is(value, struct) {
  const result = validate(value, struct);
  return !result[0];
}
/**
 * Validate a value against a `Struct`, returning an error if invalid.
 */

function validate(value, struct, coercing = false) {
  if (coercing) {
    value = struct.coercer(value);
  }

  const failures = check(value, struct);
  const failure = iteratorShift(failures);

  if (failure) {
    const error = new StructError(failure, failures);
    return [error, undefined];
  } else {
    return [undefined, value];
  }
}
/**
 * Check a value against a `Struct`, returning an iterable of failures.
 */

function* check(value, struct, path = [], branch = []) {
  const {
    type
  } = struct;
  const ctx = {
    value,
    type,
    branch,
    path,

    fail(props = {}) {
      return _objectSpread2({
        value,
        type,
        path,
        branch: [...branch, value]
      }, props);
    },

    check(v, s, parent, key) {
      const p = parent !== undefined ? [...path, key] : path;
      const b = parent !== undefined ? [...branch, parent] : branch;
      return check(v, s, p, b);
    }

  };
  const failures = toFailures(struct.validator(value, ctx), ctx);
  const failure = iteratorShift(failures);

  if (failure) {
    yield failure;
    yield* failures;
  } else {
    yield* toFailures(struct.refiner(value, ctx), ctx);
  }
}

/**
 * Augment a `Struct` to add an additional coercion step to its input.
 */

function coercion(struct, coercer) {
  const fn = struct.coercer;
  return new Struct(_objectSpread2(_objectSpread2({}, struct), {}, {
    coercer: value => {
      return fn(coercer(value));
    }
  }));
}
/**
 * Augment a struct to coerce a default value for missing values.
 *
 * Note: You must use `coerce(value, Struct)` on the value before validating it
 * to have the value defaulted!
 */

function defaulted(S, fallback, strict) {
  return coercion(S, x => {
    const f = typeof fallback === 'function' ? fallback() : fallback;

    if (x === undefined) {
      return f;
    }

    if (strict !== true && isPlainObject(x) && isPlainObject(f)) {
      const ret = _objectSpread2({}, x);

      let changed = false;

      for (const key in f) {
        if (ret[key] === undefined) {
          ret[key] = f[key];
          changed = true;
        }
      }

      if (changed) {
        return ret;
      }
    }

    return x;
  });
}
/**
 * Coerce a value to mask its properties to only that defined in the struct.
 */

function masked(S) {
  return coercion(S, x => {
    if (!isPlainObject(x)) {
      return x;
    }

    const ret = {};

    for (const key in S.schema) {
      ret[key] = x[key];
    }

    return ret;
  });
}
/**
 * Check if a value is a plain object.
 */

function isPlainObject(value) {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

/**
 * Augment a string or array struct to constrain its length to zero.
 */

function empty(S) {
  return refinement(S, `${S.type} & Empty`, value => {
    return value.length === 0;
  });
}
/**
 * Augment a string or array struct to constrain its length to being between a
 * minimum and maximum size.
 */

function length(S, min, max) {
  return refinement(S, `${S.type} & Length<${min},${max}>`, value => {
    return min < value.length && value.length < max;
  });
}
/**
 * Refine a string struct to match a specific regexp pattern.
 */

function pattern(S, regexp) {
  return refinement(S, `${S.type} & Pattern<${regexp.source}>`, value => {
    return regexp.test(value);
  });
}
/**
 * Augment a `Struct` to add an additional refinement to the validation.
 */

function refinement(struct, type, refiner) {
  const fn = struct.refiner;
  return new Struct(_objectSpread2(_objectSpread2({}, struct), {}, {
    type,

    *refiner(value, fail) {
      yield* toFailures(fn(value, fail), fail);
      yield* toFailures(refiner(value, fail), fail);
    }

  }));
}

/**
 * Validate any value.
 */

function any() {
  return struct('any', () => true);
}
function array(Element) {
  return new Struct({
    type: `Array<${Element ? Element.type : 'unknown'}>`,
    schema: Element,
    coercer: value => {
      return Element && Array.isArray(value) ? value.map(v => coerce(v, Element)) : value;
    },

    *validator(value, ctx) {
      if (!Array.isArray(value)) {
        yield ctx.fail();
        return;
      }

      if (Element) {
        for (const [i, v] of value.entries()) {
          yield* ctx.check(v, Element, value, i);
        }
      }
    }

  });
}
/**
 * Validate that boolean values.
 */

function boolean() {
  return struct('boolean', value => {
    return typeof value === 'boolean';
  });
}
/**
 * Validate that `Date` values.
 *
 * Note: this also ensures that the value is *not* an invalid `Date` object,
 * which can occur when parsing a date fails but still returns a `Date`.
 */

function date() {
  return struct('Date', value => {
    return value instanceof Date && !isNaN(value.getTime());
  });
}
/**
 * Validate that a value dynamically, determing which struct to use at runtime.
 */

function dynamic(fn) {
  return struct('Dynamic<...>', (value, ctx) => {
    return ctx.check(value, fn(value, ctx));
  });
}
function enums(values) {
  return struct(`Enum<${values.map(toLiteralString)}>`, value => {
    return values.includes(value);
  });
}
/**
 * Validate that a value is a function.
 */

function func() {
  return struct('Function', value => {
    return typeof value === 'function';
  });
}
/**
 * Validate that a value is an instance of a class.
 */

function instance(Class) {
  return struct(`InstanceOf<${Class.name}>`, value => {
    return value instanceof Class;
  });
}
function intersection(Structs) {
  return struct(Structs.map(s => s.type).join(' & '), function* (value, ctx) {
    for (const S of Structs) {
      yield* ctx.check(value, S);
    }
  });
}
/**
 * Validate a value lazily, by constructing the struct right before the first
 * validation. This is useful for cases where you want to have self-referential
 * structs for nested data structures.
 */

function lazy(fn) {
  let S;
  return struct('Lazy<...>', (value, ctx) => {
    if (!S) {
      S = fn();
    }

    return ctx.check(value, S);
  });
}
function literal(constant) {
  return struct(`Literal<${toLiteralString(constant)}>`, value => {
    return value === constant;
  });
}
/**
 * Validate that a value is a map with specific key and value entries.
 */

function map(Key, Value) {
  return struct(`Map<${Key.type},${Value.type}>`, function* (value, ctx) {
    if (!(value instanceof Map)) {
      yield ctx.fail();
      return;
    }

    for (const [k, v] of value.entries()) {
      yield* ctx.check(k, Key, value, k);
      yield* ctx.check(v, Value, value, k);
    }
  });
}
/**
 * Validate that a value always fails.
 */

function never() {
  return struct('never', () => false);
}
/**
 * Augment a struct to make it accept `null` values.
 */

function nullable(S) {
  return new Struct({
    type: `${S.type} | null`,
    schema: S.schema,
    validator: (value, ctx) => {
      return value === null || ctx.check(value, S);
    }
  });
}
/**
 * Validate that a value is a number.
 */

function number() {
  return struct(`number`, value => {
    return typeof value === 'number' && !isNaN(value);
  });
}
function object(Structs) {
  const knowns = Structs ? Object.keys(Structs) : [];
  const Never = never();
  return new Struct({
    type: Structs ? `Object<{${knowns.join(',')}}>` : 'Object',
    schema: Structs ? Structs : null,
    coercer: Structs ? createObjectCoercer(Structs) : x => x,

    *validator(value, ctx) {
      if (typeof value !== 'object' || value == null) {
        yield ctx.fail();
        return;
      }

      if (Structs) {
        const unknowns = new Set(Object.keys(value));

        for (const key of knowns) {
          unknowns.delete(key);
          const Value = Structs[key];
          const v = value[key];
          yield* ctx.check(v, Value, value, key);
        }

        for (const key of unknowns) {
          const v = value[key];
          yield* ctx.check(v, Never, value, key);
        }
      }
    }

  });
}
/**
 * Augment a struct to make it optionally accept `undefined` values.
 */

function optional(S) {
  return new Struct({
    type: `${S.type}?`,
    schema: S.schema,
    validator: (value, ctx) => {
      return value === undefined || ctx.check(value, S);
    }
  });
}
/**
 * Validate that a partial object with specific entry values.
 */

function partial(Structs) {
  if (Structs instanceof Struct) {
    Structs = Structs.schema;
  }

  const knowns = Object.keys(Structs);
  const Never = never();
  return new Struct({
    type: `Partial<{${knowns.join(',')}}>`,
    schema: Structs,
    coercer: createObjectCoercer(Structs),

    *validator(value, ctx) {
      if (typeof value !== 'object' || value == null) {
        yield ctx.fail();
        return;
      }

      const unknowns = new Set(Object.keys(value));

      for (const key of knowns) {
        unknowns.delete(key);

        if (!(key in value)) {
          continue;
        }

        const Value = Structs[key];
        const v = value[key];
        yield* ctx.check(v, Value, value, key);
      }

      for (const key of unknowns) {
        const v = value[key];
        yield* ctx.check(v, Never, value, key);
      }
    }

  });
}
/**
 * Validate that a value is a record with specific key and
 * value entries.
 */

function record(Key, Value) {
  return struct(`Record<${Key.type},${Value.type}>`, function* (value, ctx) {
    if (typeof value !== 'object' || value == null) {
      yield ctx.fail();
      return;
    }

    for (const k in value) {
      const v = value[k];
      yield* ctx.check(k, Key, value, k);
      yield* ctx.check(v, Value, value, k);
    }
  });
}
/**
 * Validate that a set of values matches a specific type.
 */

function set(Element) {
  return struct(`Set<${Element.type}>`, (value, ctx) => {
    if (!(value instanceof Set)) {
      return false;
    }

    for (const val of value) {
      const [failure] = ctx.check(val, Element);

      if (failure) {
        return false;
      }
    }

    return true;
  });
}
/**
 * Validate that a value is a string.
 */

function string() {
  return struct('string', value => {
    return typeof value === 'string';
  });
}
/**
 * Define a `Struct` instance with a type and validation function.
 */

function struct(name, validator) {
  return new Struct({
    type: name,
    validator,
    schema: null
  });
}
function tuple(Elements) {
  const Never = never();
  return struct(`[${Elements.map(s => s.type).join(',')}]`, function* (value, ctx) {
    if (!Array.isArray(value)) {
      yield ctx.fail();
      return;
    }

    for (const [index, Element] of Elements.entries()) {
      const v = value[index];
      yield* ctx.check(v, Element, value, index);
    }

    if (value.length > Elements.length) {
      const index = Elements.length;
      const v = value[index];
      yield* ctx.check(v, Never, value, index);
    }
  });
}
/**
 * Validate that a value matches a specific strutural interface, like the
 * structural typing that TypeScript uses.
 */

function type(Structs) {
  const keys = Object.keys(Structs);
  return struct(`Type<{${keys.join(',')}}>`, function* (value, ctx) {
    if (typeof value !== 'object' || value == null) {
      yield ctx.fail();
      return;
    }

    for (const key of keys) {
      const Value = Structs[key];
      const v = value[key];
      yield* ctx.check(v, Value, value, key);
    }
  });
}
function union(Structs) {
  return struct(`${Structs.map(s => s.type).join(' | ')}`, function* (value, ctx) {
    for (const S of Structs) {
      const [...failures] = ctx.check(value, S);

      if (failures.length === 0) {
        return;
      }
    }

    yield ctx.fail();
  });
}
/**
 * Convert a value to a literal string.
 */

function toLiteralString(value) {
  return typeof value === 'string' ? `"${value.replace(/"/g, '"')}"` : `${value}`;
}
/**
 * Coerce the values of an object-like struct.
 */


function createObjectCoercer(Structs) {
  const knowns = Object.keys(Structs);
  return value => {
    if (typeof value !== 'object' || value == null) {
      return value;
    }

    const ret = {};
    const unknowns = new Set(Object.keys(value));

    for (const key of knowns) {
      unknowns.delete(key);
      const Value = Structs[key];
      const v = value[key];
      ret[key] = coerce(v, Value);
    }

    for (const key of unknowns) {
      ret[key] = value[key];
    }

    return ret;
  };
}

export { Struct, StructError, any, array, assert, boolean, coerce, coercion, date, defaulted, dynamic, empty, enums, func, instance, intersection, is, lazy, length, literal, map, masked, never, nullable, number, object, optional, partial, pattern, record, refinement, set, string, struct, tuple, type, union, validate };
//# sourceMappingURL=index.es.js.map
