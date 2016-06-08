import {map, toArray, mapPromise, mapPromiseObject, toPromise} from './util';


const sanidators = Object.create(null);
const validators = Object.create(null);


const errorFn = (errors, key, value) => (error) => {
  errors.push({key, value, error});
};

const warnFn = (warnings, key, value) => (warning) => {
  warnings.push({key, value, warning});
};

const valueIfUndefined = (value) => (v) => {
  if (v === undefined) return value;
  return v;
};

const logError = (value, error) => (e) => {
  error(e);
  return value;
};


const ruleToFunction = (fnsMap) => (data, {errors, warnings}) => Object.assign({}, data, map(fnsMap, (fns, key) => {
  const contextForKey = {
    key,
    data,
    errors,
    warnings,
    validators,
  };

  const nextFn = (fn) => (value) => {
    if (errors.length) return value;

    contextForKey.error = errorFn(errors, key, value);
    contextForKey.warn = warnFn(errors, key, value);

    return mapPromise(
      fn(value, contextForKey),
      valueIfUndefined(value),
      logError(value, contextForKey.error)
    );
  };

  let value = data[key];
  for (let i = 0; i < fns.length && !errors.length; i++) {
    value = mapPromise(value, nextFn(fns[i]));
  }

  return value;
}));


export default class Sanidator {
  static addValidator = (name, validator) => {
    if (name in validators) {
      throw new Error(`${name} validator is already defined`);
    }
    validators[name] = validator;
  }

  constructor({name, rules, config}) {
    if (name in sanidators) {
      throw new Error(`${name} sanidator is already defined`);
    }
    sanidators[name] = this;

    this.name = name;
    this.setRules(rules, config);
  }

  setRules(rules, config) {
    this.rules = toArray(rules)
      .map((rule) => {
        if (typeof rule === 'function') {
          return rule(config, validators);
        }
        return rule;
      })
      .map((rule) => {
        if (typeof rule === 'function') return rule;
        return ruleToFunction(map(rule, toArray));
      });
  }

  process(obj) {
    const {rules} = this;

    const errors = [];
    const warnings = [];
    const ctxt = {errors, warnings};

    const nextRuleFn = (rule) => (data) => {
      if (errors.length) return data;
      return rule(data, ctxt);
    };

    for (let i = 0; i < rules.length && !errors.length; i++) {
      // TODO await for errors from prev iteration
      obj = mapPromiseObject(obj, nextRuleFn(rules[i]));
    }

    return mapPromiseObject(obj, (data) => ({
      data,
      errors,
      warnings,
    }));
  }

  processAsync(obj) {
    return toPromise(this.process(obj));
  }
}
