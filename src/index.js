import {isPromise, map, toArray, mapPromise, mapPromiseObject, reducePromise} from './util';


const sanidators = Object.create(null);
const validators = Object.create(null);


const ruleToFunction = (fnsMap) => (data, context) => ({
  ...data,
  ...map(fnsMap, (fns, key) => {
    const contextForKey = {
      validators,
      ...context,
      key,
      data,
    };
    return reducePromise(
      fns.map((fn) => (value) => {
        if (context.errors.length) {
          return value;
        }
        contextForKey.error = (message) => {
          context.errors.push({key, value, message});
        };
        contextForKey.warn = (message) => {
          context.warnings.push({key, value, message});
        };
        return mapPromise(
          fn(value, contextForKey),
          (v) => v === undefined ? value : v,
          (e) => {
            contextForKey.error(e.message);
            return value;
          }
        );
      }),
      data[key]
    )
  }),
});


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
      .map((rule) => typeof rule === 'function' ?
        rule(config, validators) :
        rule
      )
      .map((rule) => typeof rule === 'function' ?
        rule :
        ruleToFunction(map(rule, toArray))
      );
  }

  process(data) {
    const errors = [];
    const warnings = [];
    const context = {errors, warnings};

    const {rules} = this;
    for (let i = 0; i < rules.length && !errors.length; i++) {
      // TODO await for errors from prev iteration
      data = mapPromiseObject(data, (data) =>
        rules[i](data, context))
    }

    return mapPromiseObject(data, (data) => ({
      data,
      errors,
      warnings,
    }));
  }
}
