import * as probot from 'probot'
import { opencollective } from '../src/bot'
import yaml from 'js-yaml'
import btoa from 'btoa'

import * as events from './__fixtures__/events'
import { Config } from '../src/config'

describe('opencollective', () => {
  let app: probot.Application
  let github

  beforeEach(() => {
    app = new probot.Application()

    // Mock out the GitHub API
    github = {
      issues: {
        createComment: jest
          .fn()
          .mockImplementation(args => Promise.resolve(args)),
        addLabels: jest.fn().mockImplementation(args => Promise.resolve(args)),
        removeLabel: jest
          .fn()
          .mockImplementation(args => Promise.resolve(args)),
      },
      repos: {
        getContents: jest.fn().mockReturnValue({
          data: {
            content: btoa(
              yaml.dump({
                collective: 'graphql-shield',
                tiers: [
                  {
                    tiers: '*',
                    labels: ['backer'],
                    message: 'Thanks for backing us!',
                  },
                  {
                    tiers: ['Sponsor'],
                    labels: ['sponsor'],
                    message: 'Thanks for being our sponsor!',
                  },
                ],
                invitation: 'Hey, this is invitation message!',
              } as Config),
            ),
          },
        }),
      },
    }

    // Mock out GitHub client
    app.load(opencollective)
    app.auth = () => Promise.resolve(github)
  })

  // test('reports incorrect configuration', async () => {
  //   await app.receive({
  //     name: 'issues',
  //     payload: events.opened,
  //   })

  //   /* Tests */

  //   expect(github.issues.createComment).toBeCalledTimes(0)
  // })

  test('skips execution when no labels match in configuration', async () => {
    /* Mocks */

    const github = {
      issues: {
        createComment: jest.fn().mockReturnValue(undefined),
      },
      repos: {
        getContents: jest.fn().mockReturnValue({
          data: {
            content: btoa(
              yaml.dump({
                message: 'Hey',
                opencollective: 'https://opencollective.com/graphql-shield',
                labels: [],
              }),
            ),
          },
        }),
      },
    }

    /* Execution */

    const app = new probot.Application()
    app.load(opencollective)

    app.auth = () => Promise.resolve(github as any)

    await app.receive({
      name: 'issues',
      payload: events.closed,
    })

    /* Tests */

    expect(github.issues.createComment).toBeCalledTimes(0)
  })

  test('executes when labels match', async () => {
    /* Mocks */

    const github = {
      issues: {
        createComment: jest.fn().mockReturnValue(undefined),
      },
      repos: {
        getContents: jest.fn().mockReturnValue({
          data: {
            content: btoa(
              yaml.dump({
                message: 'pass',
                opencollective: 'https://opencollective.com/graphql-shield',
                labels: ['kind/question', 'another'],
              }),
            ),
          },
        }),
      },
    }

    /* Execution */

    const app = new probot.Application()
    app.load(opencollective)

    app.auth = () => Promise.resolve(github as any)

    await app.receive({
      name: 'issues',
      payload: events.closed,
    })

    /* Tests */

    expect(github.issues.createComment).toBeCalledTimes(1)
    expect(github.issues.createComment).toBeCalledWith({
      body: `pass\n\nhttps://opencollective.com/graphql-shield`,
      number: 2,
      owner: 'maticzav',
      repo: 'opencollective-bot',
    })
  })
})
