import nock from 'nock'
import * as probot from 'probot'
import yaml from 'js-yaml'
import btoa from 'btoa'

import { opencollective } from '../../src/bot'
import { Config } from '../../src/config'

import installationRepositoriesFixture from '../__fixtures__/installation_repositories.added-multiple'
import repository1 from '../__fixtures__/repos.get-1'
import repository2 from '../__fixtures__/repos.get-2'

beforeEach(async () => {
  if (!nock.isActive()) nock.activate()

  process.env.FEATURE_DISABLE_FUNDING = 'TRUE'
  process.env.FEATURE_DISABLE_FUNDING_PACKAGE_JSON = 'TRUE'
  process.env.DISABLE_WEBHOOK_EVENT_CHECK = 'TRUE'
})

afterEach(async () => {
  nock.restore()
  nock.cleanAll()

  delete process.env.FEATURE_DISABLE_FUNDING
  delete process.env.FEATURE_DISABLE_FUNDING_PACKAGE_JSON
  delete process.env.DISABLE_WEBHOOK_EVENT_CHECK
})

describe('opencollective installation_repositories', () => {
  test('properly create configuration file and branch if not exists', async () => {
    nock('https://api.opencollective.com/')
      .post('/graphql/v2')
      .reply(200, {
        data: {
          collective: {
            slug: 'backyourstack',
          },
        },
      })

    nock('https://api.opencollective.com/')
      .post('/graphql/v2')
      .reply(200, {
        data: {
          collective: null,
        },
      })

    const app = new probot.Application()

    const github = {
      repos: {
        get: jest
          .fn()
          .mockResolvedValue({
            data: repository1,
          })
          .mockResolvedValueOnce({
            data: repository1,
          })
          .mockResolvedValueOnce({
            data: repository2,
          }),
        getBranch: jest.fn().mockRejectedValue(new Error('Branch not found')),
        getContents: jest.fn().mockImplementation(({ ref }) => {
          if (!ref) {
            return Promise.reject(new Error('File not found'))
          } else {
            return Promise.resolve({
              data: {
                content: btoa(
                  yaml.dump({
                    collective: 'backyourstack',
                  } as Config),
                ),
              },
            })
          }
        }),
        createOrUpdateFile: jest.fn(),
      },
      git: {
        getRef: jest.fn().mockResolvedValue({
          // we're just interested in sha
          data: {
            object: { sha: 'a9993e364706816aba3e25717850c26c9cd0d89d' },
          },
        }),
        createRef: jest.fn(),
        deleteRef: jest.fn(),
      },
      pulls: {
        create: jest.fn().mockResolvedValue({
          // we're just interested in url
          data: { url: 'https://github.com/znarf/backyourstack/pull/11' },
        }),
      },
    }

    // Mock out GitHub client
    app.load(opencollective)
    app.auth = () => Promise.resolve(github as any)

    await app.receive({
      id: '123',
      name: 'installation_repositories',
      payload: installationRepositoriesFixture,
    })

    expect(github.repos.get).toBeCalledTimes(3)
    expect(github.repos.getBranch).toBeCalledTimes(1)
    expect(github.repos.getContents).toBeCalledTimes(1)
    expect(github.repos.createOrUpdateFile).toBeCalledTimes(1)
    expect(github.git.getRef).toBeCalledTimes(1)
    expect(github.git.createRef).toBeCalledTimes(1)
    expect(github.pulls.create).toBeCalledTimes(1)
  })

  test('properly create configuration file if not exists and branch exists', async () => {
    nock('https://api.opencollective.com/')
      .post('/graphql/v2')
      .times(2)
      .reply(200, {
        data: {
          collective: null,
        },
      })

    const app = new probot.Application()

    const github = {
      repos: {
        get: jest
          .fn()
          .mockResolvedValue({
            data: repository1,
          })
          .mockResolvedValueOnce({
            data: repository1,
          })
          .mockResolvedValueOnce({
            data: repository2,
          }),
        getBranch: jest.fn().mockResolvedValue({
          // we're not interested in any data, just needs to return
          data: {},
        }),
        getContents: jest.fn().mockRejectedValue(new Error('File not found')),
        createOrUpdateFile: jest.fn(),
      },
      git: {
        getRef: jest.fn().mockResolvedValue({
          // we're just interested in sha
          data: {
            object: { sha: 'a9993e364706816aba3e25717850c26c9cd0d89d' },
          },
        }),
        createRef: jest.fn(),
        deleteRef: jest.fn(),
      },
      pulls: {
        create: jest.fn().mockResolvedValue({
          // we're just interested in url
          data: { url: 'https://github.com/znarf/backyourstack/pull/11' },
        }),
      },
    }

    // Mock out GitHub client
    app.load(opencollective)
    app.auth = () => Promise.resolve(github as any)

    await app.receive({
      id: '123',
      name: 'installation_repositories',
      payload: installationRepositoriesFixture,
    })

    expect(github.repos.get).toBeCalledTimes(3)
    expect(github.repos.getBranch).toBeCalledTimes(1)
    expect(github.repos.getContents).toBeCalledTimes(1)
    expect(github.repos.createOrUpdateFile).toBeCalledTimes(1)
    expect(github.git.getRef).toBeCalledTimes(1)
    expect(github.git.createRef).toBeCalledTimes(1)
    expect(github.git.deleteRef).toBeCalledTimes(1)
    expect(github.pulls.create).toBeCalledTimes(1)
  })

  test('do nothing if config file exists on the default branch', async () => {
    nock('https://api.opencollective.com/')
      .post('/graphql/v2')
      .times(2)
      .reply(200, {
        data: {
          collective: null,
        },
      })

    const app = new probot.Application()

    const github = {
      repos: {
        get: jest
          .fn()
          .mockResolvedValue({
            data: repository1,
          })
          .mockResolvedValueOnce({
            data: repository1,
          })
          .mockResolvedValueOnce({
            data: repository2,
          }),
        getContents: jest.fn().mockResolvedValue({
          data: {
            content: btoa(
              yaml.dump({
                collective: 'backyourstack',
              } as Config),
            ),
          },
        }),
      },
    }

    // Mock out GitHub client
    app.load(opencollective)
    app.auth = () => Promise.resolve(github as any)

    await app.receive({
      id: '123',
      name: 'installation_repositories',
      payload: installationRepositoriesFixture,
    })

    expect(github.repos.get).toBeCalledTimes(2)
    expect(github.repos.getContents).toBeCalledTimes(1)
  })
})
