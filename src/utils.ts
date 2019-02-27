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
 * Functionally determines whether two lists intersect.
 *
 * @param a
 */
export function intersect<T>(as: T[]): (bs: T[]) => boolean {
  return bs => bs.some(b => as.some(is(b)))
}
