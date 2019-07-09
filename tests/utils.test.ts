import { is, not } from '../src/utils'

describe('utils', () => {
  test('is works as expected', () => {
    expect(is(2)(2)).toBeTruthy()
    expect(is(2)(3)).toBeFalsy()
  })

  test('not works as expected', () => {
    expect(not(() => true)()).toBe(false)
    expect(not(() => false)()).toBe(true)
  })
})
