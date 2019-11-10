import * as joi from '@hapi/joi'

import { getCollectiveMembers } from '../src/collective'

/**
 * ! Important !
 *
 * Schema has to be aligned with Member Type definition.
 */
const memberTypeSchema = joi.object().keys({
  role: joi
    .string()
    .valid(
      'HOST',
      'ADMIN',
      'BACKER',
      'FOLLOWER',
      'MEMBER',
      'FUNDRAISER',
      'CONTRIBUTOR',
    )
    .required(),
  tier: joi
    .object()
    .keys({
      slug: joi.string(),
      name: joi.string(),
    })
    .allow(null),
  account: joi.object().keys({
    slug: joi.string(),
    githubHandle: joi.string().allow(null),
  }),
})

describe('collective', () => {
  test(
    'get members has expected types',
    async () => {
      const res = await getCollectiveMembers('webpack')
      expect(res.length).not.toBe(0)
      const validations = res.map(async member => {
        try {
          await memberTypeSchema.validateAsync(member, { allowUnknown: true })
        } catch (err) {
          console.log(err, member)
          throw err
        }
      })

      try {
        await Promise.all(validations)
      } catch (err) {
        fail(err)
      }
    },
    60 * 1000,
  )
})
