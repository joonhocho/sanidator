/* @flow */
import {describe, it} from 'mocha';
import {expect} from 'chai';
import Sanidator from '../lib';
import {mapPromise} from '../lib/util';



describe('Sanidator', () => {
  const emails = [];
  const usernames = [];

  Sanidator.addValidator(
    'isEmail',
    (x) => x && x.indexOf('@') >= 0
  );

  Sanidator.addValidator(
    'checkEmailDomain',
    (x) => Promise.resolve(/@(gmail.com|yahoo.com)$/i.test(x))
  );

  Sanidator.addValidator(
    'isEmailAvailable',
    (x) => Promise.resolve(emails.indexOf(x) === -1)
  );

  Sanidator.addValidator(
    'isUsername',
    (x) => /^\w+$/.test(x)
  );

  Sanidator.addValidator(
    'isBadUsername',
    (x) => /admin/i.test(x)
  );

  Sanidator.addValidator(
    'isUsernameAvailable',
    (x) => Promise.resolve(usernames.indexOf(x) === -1)
  );

  Sanidator.addValidator(
    'isPassword',
    (x) => /^\w+$/.test(x)
  );

  Sanidator.addValidator(
    'isWeakPassword',
    (x) => !x || x.length < 8
  );

  Sanidator.addValidator(
    'trim',
    (value) => value && value.trim() || null
  );

  Sanidator.addValidator(
    'trimLength',
    (max) => (value) =>
      value && value.length > max ?
      value.substring(0, max) :
      value
  );

  it('basic', async (done) => {

    const checkEmail = async (value, {validators, error, warn}) => {
      if (!validators.isEmail(value)) {
        return error('Invalid email');
      }
      if (!await validators.checkEmailDomain(value)) {
        return warn('Invalid email domain');
      }
      if (!await validators.isEmailAvailable(value)) {
        return error('Email is taken');
      }
    };

    const checkUsername = async (value, {validators, error, warn}) => {
      if (!validators.isUsername(value)) {
        return error('Invalid Username');
      }
      if (validators.isBadUsername(value)) {
        return warn('Bad Username');
      }
      if (!await validators.isUsernameAvailable(value)) {
        return error('Username is taken');
      }
    };

    const checkPassword = async (value, {data, validators, error, warn}) => {
      if (!validators.isPassword(value)) {
        return error('Invalid Password');
      }
      if (validators.isWeakPassword(value)) {
        return warn('Weak Password');
      }
      if (await Promise.resolve(value !== data.passwordConfirm)) {
        return error('Wrong password confirm');
      }
    }

    const sany = new Sanidator({
      name: 'Basic',
      rules: [
        ({emailMaxLength}, {trim, trimLength}) => ({
          email: [trim, trimLength(emailMaxLength)],
          username: trim,
        }),
        {
          email: checkEmail,
          username: checkUsername,
          password: checkPassword,
        },
      ],
      config: {
        emailMaxLength: 254,
      },
    });

    const res = sany.process({
      a: 1,
      email: '  aseouth@theu  ',
      username: ' hi ',
      password: 'passsantu231',
      passwordConfirm: 'asssantu231',
    });

    mapPromise(
      res,
      ({data, errors, warnings}) => {
        console.log(data, errors, warnings);
        done();
      },
      (err) => {
        console.error(err, res.errors, res.warnings);
        done(err);
      }
    );
  });
});
