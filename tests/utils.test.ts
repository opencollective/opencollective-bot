import { is, not, base64, sha } from '../src/utils'

describe('utils', () => {
  test('is works as expected', () => {
    expect(is(2)(2)).toBeTruthy()
    expect(is(2)(3)).toBeFalsy()
  })

  test('not works as expected', () => {
    expect(not(() => true)()).toBe(false)
    expect(not(() => false)()).toBe(true)
  })

  test('base64 works as expected', () => {
    expect(base64('abc')).toBe('YWJj')
  })

  test('sha works as expected', () => {
    expect(sha('abc')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d')
  })
})
