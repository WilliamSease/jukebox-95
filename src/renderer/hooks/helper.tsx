// Makes every nested object's keys optional too, instead of just the top level,
// so `dispatch({ ui: { errorMessage: 'x' } })` type-checks without requiring
// every other key of `ui` to be supplied.
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

// Merges toModify into target, recursively, for plain-object values only.
// Arrays and class instances (e.g. Theme) are replaced wholesale rather than
// merged, so passing a new tracksInPlayer array or a whole new theme still
// works the way you'd expect instead of trying to merge array indices.
export function deepMerge<T extends object>(
  target: T,
  toModify: DeepPartial<T>,
): T {
  const result: any = { ...target };
  Object.keys(toModify).forEach((key) => {
    const targetValue = (target as any)[key];
    const newValue = (toModify as any)[key];
    result[key] =
      isPlainObject(targetValue) && isPlainObject(newValue)
        ? deepMerge(targetValue, newValue)
        : newValue;
  });
  return result;
}
