/* @flow */
import {describe, it} from 'mocha';
import {expect} from 'chai';
import Sanidator from '../lib';


describe('Sanidator', () => {
  it('basic', () => {

    const checkEmail = async (value, {key, data, validators, error, warn}) => {
      if (!validators.isEmail(value)) {
        return error('Invalid email');
      }
      if (!await checkEmailDomain(value)) {
        return warn('Invalid email domain');
      }
      if (!await isAvailable(value)) {
        return error('Email is taken');
      }
    };

    const checkUsername = async (value, {key, data, validators, error, warn}) => {
      if (!validators.isUsername(value)) {
        return error('Invalid Username');
      }
      if (validators.isBadUsername(value)) {
        return warn('Bad Username');
      }
      if (!await isAvailable(value)) {
        return error('Username is taken');
      }
    };

    const checkPassword = async (value, {passwordConfirm}) => {
      if (!validators.isPassword(value)) {
        return error('Invalid Password');
      }
      if (!validators.isWeak(value)) {
        return warn('Weak Password');
      }
      if (value !== passwordConfirm) {
        return error('Wrong password confirm');
      }
    }

    const trim = (value) => value && value.trim() || null;
    const trimLength = (min, max) => (value) => value && value.trim() || null;

    new Sanidator({
      name: 'Basic',
      rules: [
        ({emailMaxLength}, {trim, length}) => ({
          email: [trim, trimLength(emailMaxLength)],
          username: trim,
          ...rest,
        }),
        (config, {checkEmail, checkUsername}) => ({
          email: [checkEmail],
          username: [checkUsername],
          ...rest,
        }),
      ],
    });
  });
});
