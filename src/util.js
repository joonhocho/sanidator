const isPromise = (x) => x != null && typeof x.then === 'function';

const forEach = (x, fn) => Object.keys(x).forEach((key) => fn(x[key], key, x));

const map = (x, fn) => Object.keys(x).reduce((y, key) => {
  y[key] = fn(x[key], key, x);
  return y;
}, {});

const values = (x) => Object.keys(x).map((key) => x[key]);

const toArray = (x) => {
  if (Array.isArray(x)) return x;
  return [x];
};

const mapPromise = (x, onResolve, onReject) => {
  if (isPromise(x)) {
    return x.then(onResolve, onReject);
  }

  if (onReject) {
    try {
      return onResolve(x);
    } catch (err) {
      return onReject(err);
    }
  }

  return onResolve(x);
};


const promiseProps = (obj) => {
  const promises = [];
  const keyToIndex = {};

  forEach(obj, (v, k) => {
    if (isPromise(v)) {
      keyToIndex[k] = promises.length;
      promises.push(v);
    }
  });

  if (promises.length) {
    return Promise.all(promises).then((vals) =>
      map(obj, (v, k) => {
        if (k in keyToIndex) {
          return vals[keyToIndex[k]];
        }
        return v;
      })
    );
  }

  return obj;
};


const mapPromiseObject = (obj, onResolved, onReject) =>
  mapPromise(
    mapPromise(obj, promiseProps),
    onResolved, onReject
  );


const reducePromise = (fns, value) => fns.reduce(
  (v, fn) => mapPromise(v, fn),
  value
);


const toPromise = (x) => {
  if (isPromise(x)) return x;
  return Promise.resolve(x);
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
  reducePromise,
  toPromise,
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
  reducePromise,
  toPromise,
};
