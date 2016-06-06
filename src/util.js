const isPromise = (x) => x != null && typeof x.then === 'function';

const forEach = (x, fn) => Object.keys(x).forEach((key) => fn(x[key], key, x));

const map = (x, fn) => Object.keys(x).reduce((y, key) => {
  y[key] = fn(x[key], key, x);
  return y;
}, {});

const values = (x) => Object.keys(x).map((key) => x[key]);

const toArray = (x) =>
  Array.isArray(x) ? x : [x];

const mapPromise = (x, fn, onRejected) => {
  if (isPromise(x)) {
    return x.then(fn, onRejected);
  }

  if (onRejected) {
    try {
      return fn(x);
    } catch (err) {
      return onRejected(err);
    }
  }

  return fn(x);
};


const promiseProps = (obj) => {
  const promises = [];
  const keyToIndex = Object.create(null);
  forEach(obj, (v, k) => {
    if (isPromise(v)) {
      keyToIndex[k] = promises.length;
      promises.push(v);
    }
  });

  if (promises.length) {
    return Promise.all(promises).then((values) => {
      return map(obj, (v, k) => {
        if (k in keyToIndex) {
          return values[keyToIndex[k]];
        }
        return v;
      });
    });
  }

  return obj;
};


const mapPromiseObject = (obj, onResolved, onRejected) => {
  return mapPromise(mapPromise(obj, promiseProps), onResolved, onRejected);
};


export {
  isPromise,
  mapPromise,
  forEach,
  map,
  values,
  toArray,
  promiseProps,
  mapPromiseObject,
};

export default {
  isPromise,
  mapPromise,
  forEach,
  map,
  values,
  toArray,
  promiseProps,
  mapPromiseObject,
};
