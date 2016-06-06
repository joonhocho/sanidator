import {isPromise, map, toArray, mapPromiseObject} from './util';


const sanidators = Object.create(null);
const validators = Object.create(null);


const normalizeRule = (rule) => {
  if (typeof rule === 'function') {
    return rule;
  }
  return map(rule, toArray);
};


class Sanidator {
  class addValidator = (name, validator) => {
    if (name in validators) {
      throw new Error(`${name} validator is already defined`);
    }
    validators[name] = validator;
  }

  constructor({name, rules}) {
    if (name in sanidators) {
      throw new Error(`${name} sanidator is already defined`);
    }
    sanidators[name] = this;

    this.name = name;
    this.rules = rules;
  }

  get rules() {
    return this._rules;
  }

  set rules(rules) {
    this._rules = toArray(rules)
        .map(normalizeRule);
  }

  configure(config) {
    this.rules = this.rules.map((rule) =>
      typeof rule === 'function' ?
        rule(config, validators) :
        rule
    );
  }

  run(data) {
    const {rules} = this;
    return rules.reduce((data, rule) =>
      mapPromiseObject(data,
        (data) => mapPromise(data, rule)
      )
    );
  }
}
