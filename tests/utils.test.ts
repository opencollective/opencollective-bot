import { is } from '../src/utils'

test('is works as expected', () => {
  expect(is(2)(2)).toBeTruthy()
  expect(is(2)(3)).toBeFalsy()
})
