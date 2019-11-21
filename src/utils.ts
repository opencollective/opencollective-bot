import crypto from 'crypto'

/**
 *
 * Functional equal.
 *
 * @param a
 */
export function is<T>(a: T): (b: T) => boolean {
  return (b): boolean => a === b
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
  return (...args): boolean => !fn(...args)
}

/**
 *
 * Computes the sha1 hash of a string
 *
 * @param value
 */
export function sha(value: string): string {
  return crypto
    .createHash('sha1')
    .update(value)
    .digest('hex')
}

/**
 *
 * Encode a string using base64
 *
 * @param value
 */
export function base64(value: string): string {
  return Buffer.from(value).toString('base64')
}
