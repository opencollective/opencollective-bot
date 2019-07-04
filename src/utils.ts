/**
 *
 * Functional equal.
 *
 * @param a
 */
export function is<T>(a: T): (b: T) => boolean {
  return b => a === b
}

/**
 *
 * Functionally negates the function.
 *
 * @param fn
 */
export function not<T>(
  fn: (...args: T[]) => boolean,
): (...args: T[]) => boolean {
  return (...args) => !fn(...args)
}
