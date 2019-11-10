import * as joi from '@hapi/joi'
import Octokit from '@octokit/rest'

import {
  getUserOrganisations,
  messageGithubIssue,
  labelGithubIssue,
  removeLabelsFromGithubIssue,
} from '../src/github'

/* Helpers */

const organsisationTypeSchema = joi.string()

/* Tests */

describe('github', () => {
  test('get user organisations has expected types', async () => {
    try {
      const client = new Octokit()

      const res = await getUserOrganisations(client, 'maticzav')
      expect(res.length).not.toBe(0)
      const validations = res.map(async org => {
        try {
          await organsisationTypeSchema.validateAsync(org, {
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

  test('messageGithubIssue messages github issue', async () => {
    const client = {
      issues: {
        createComment: jest
          .fn()
          .mockImplementation(args => Promise.resolve(args)),
      },
    }
    const issue = {
      number: 1,
      owner: 'maticzav',
      repo: 'label-sync',
    }
    const messages = ['pass-1', 'pass-2']

    const res = await messageGithubIssue(client as any, issue, messages)

    expect(client.issues.createComment).toBeCalledTimes(2)
    expect(res).toEqual([
      {
        issue_number: 1,
        owner: 'maticzav',
        repo: 'label-sync',
        body: 'pass-1',
      },
      {
        issue_number: 1,
        owner: 'maticzav',
        repo: 'label-sync',
        body: 'pass-2',
      },
    ])
  })

  test('labelGithubIssue messages github issue', async () => {
    const client = {
      issues: {
        getLabel: jest
          .fn()
          .mockRejectedValueOnce(undefined)
          .mockResolvedValue(undefined),
        createLabel: jest.fn().mockResolvedValue(undefined),
        addLabels: jest.fn().mockImplementation(args => Promise.resolve(args)),
      },
    }
    const issue = {
      number: 1,
      owner: 'maticzav',
      repo: 'label-sync',
    }
    const labels = ['pass-1', 'pass-2']

    const res = await labelGithubIssue(client as any, issue, labels)

    expect(client.issues.getLabel).toBeCalledTimes(2)
    expect(client.issues.createLabel).toBeCalledTimes(1)
    expect(client.issues.addLabels).toBeCalledTimes(1)
    expect(res).toEqual({
      issue_number: 1,
      owner: 'maticzav',
      repo: 'label-sync',
      labels: ['pass-1', 'pass-2'],
    })
  })

  test('removeLabelsFromGithubIssue removes labels', async () => {
    const client = {
      issues: {
        removeLabel: jest
          .fn()
          .mockImplementation(args => Promise.resolve(args)),
      },
    }
    const issue = {
      number: 1,
      owner: 'maticzav',
      repo: 'label-sync',
    }
    const labels = ['pass-1', 'pass-2']

    const res = await removeLabelsFromGithubIssue(client as any, issue, labels)

    expect(client.issues.removeLabel).toBeCalledTimes(2)
    expect(res).toEqual(['pass-1', 'pass-2'])
  })
})
