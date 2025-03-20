export const negate =
  (predicate) =>
  (...args) =>
    !predicate(...args);
