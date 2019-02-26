import * as joi from 'joi'
import Octokit from '@octokit/rest'

import { getUserOrganisations, stripGithubName } from '../src/github'

const organsisationTypeSchema = joi.string()

describe('github', () => {
  test('get user organisations has expected types', async () => {
    try {
      const client = new Octokit()

      const res = await getUserOrganisations(client, 'maticzav')
      expect(res.length).not.toBe(0)
      const validations = res.map(async org => {
        try {
          await joi.validate(org, organsisationTypeSchema, {
            allowUnknown: true,
          })
        } catch (err) {
          console.log(err, org)
          throw err
        }
      })

      await Promise.all(validations)
    } catch (err) {
      fail(err)
    }
  })

  test('strip github username correctly strips', () => {
    expect(stripGithubName('https://github.com/maticzav')).toMatch('maticzav')
  })
})
