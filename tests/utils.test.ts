import { is, not, intersect } from '../src/utils'

describe('utils', () => {
  test('intersect works as expected', () => {
    expect(intersect([1, 2, 3])([3, 4, 5])).toBeTruthy()
    expect(intersect([1, 2, 3])([4, 5, 6])).toBeFalsy()
  })

  test('is works as expected', () => {
    expect(is(2)(2)).toBeTruthy()
    expect(is(2)(3)).toBeFalsy()
  })

  test('not works as expected', () => {
    expect(not(() => true)()).toBe(false)
    expect(not(() => false)()).toBe(true)
  })
})
