import * as joi from 'joi'
import Octokit from '@octokit/rest'

import {
  getUserOrganisations,
  stripGithubName,
  messageGithubIssue,
  labelGithubIssue,
  removeLabelsFromGithubIssue,
  createGithubPR,
  removeGithubPR,
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
    expect(stripGithubName('https://github.com/graphql-boilerplates')).toMatch(
      'graphql-boilerplates',
    )
    expect(stripGithubName('https://github.com/web-pack-pack')).toMatch(
      'web-pack-pack',
    )
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
        number: 1,
        owner: 'maticzav',
        repo: 'label-sync',
        body: 'pass-1',
      },
      {
        number: 1,
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
      number: 1,
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

test('createGithubPR creates github pull request', async () => {
  const client = {
    pulls: {
      createPR: jest.fn().mockImplementation(args => Promise.resolve(args)),
    },
  }

  const res = await createGithubPR(client as any, [
    {
      owner: 'twisstosin',
      repo: 'Lasgithub-Android',
      title: 'Test', // the title of the PR
      head: 'add-opencollective-config',
      base: 'master', // where you want to merge your changes
      body: 'test', // the body of your PR,
      maintainer_can_modify: true, // allows maintainers to edit your app's PR
    },
  ])

  let testResponse = res[0].data

  await removeGithubPR(
    client as any,
    testResponse.user.login,
    'Lasgithub-Android',
    testResponse.number,
  )

  expect(client.pulls.createPR).toBeCalledTimes(1)
  expect(testResponse).toEqual([
    {
      number: 1,
      owner: 'maticzav',
      repo: 'label-sync',
      body: 'pass-1',
    },
  ])
})
