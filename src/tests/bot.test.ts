import * as probot from 'probot'
import { opencollective } from '../bot'
import yaml from 'js-yaml'
import btoa from 'btoa'

import * as events from './__fixtures__/events'

describe('bot', () => {
  test('reports incorrect configuration', async () => {
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
                opencollective: 'collective',
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

  test('by default captures all closed issues regardless of label', async () => {
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
