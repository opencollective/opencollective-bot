import nock from 'nock'
import * as probot from 'probot'

import { opencollective } from '../../src/bot'

import installationRepositoriesFixture from '../__fixtures__/installation_repositories.added'
import repository from '../__fixtures__/repos.get-1'
import { setIndent } from '../../src/actions/addPackageJsonFunding'

beforeEach(async () => {
  if (!nock.isActive()) nock.activate()

  process.env.FEATURE_DISABLE_CONFIGURATION = 'TRUE'
  process.env.FEATURE_DISABLE_FUNDING = 'TRUE'
  process.env.DISABLE_WEBHOOK_EVENT_CHECK = 'TRUE'
})

afterEach(async () => {
  nock.restore()
  nock.cleanAll()

  delete process.env.FEATURE_DISABLE_CONFIGURATION
  delete process.env.FEATURE_DISABLE_FUNDING
  delete process.env.DISABLE_WEBHOOK_EVENT_CHECK
})

describe('opencollective installation_repositories', () => {
  test('properly add funding property to the Package.Json if it exists and collective detected', async () => {
    nock('https://api.opencollective.com/')
      .post('/graphql/v2')
      .reply(200, {
        data: {
          collective: {
            slug: 'backyourstack',
          },
        },
      })

    const app = new probot.Application()

    const github = {
      repos: {
        get: jest.fn().mockResolvedValue({
          data: repository,
        }),
        getBranch: jest.fn().mockRejectedValue(new Error('Branch not found')),
        getContents: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            data: {
              name: 'package.json',
              path: 'package.json',
              /*
                content: {
                  "name": "backyourstack",
                  "version": "1.1.0",
                  "jest": {
                    "coverageDirectory": "./coverage/",
                    "collectCoverage": true
                  }
                }
              */
              content:
                'ewogICJuYW1lIjogImJhY2t5b3Vyc3RhY2siLAogICJ2ZXJzaW9uIjogIjEu\nMS4wIiwKICAiamVzdCI6IHsKICAgICJjb3ZlcmFnZURpcmVjdG9yeSI6ICIu\nL2NvdmVyYWdlLyIsCiAgICAiY29sbGVjdENvdmVyYWdlIjogdHJ1ZQogIH0K\nfQo=\n',
            },
          })
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

    expect(github.repos.get).toBeCalledTimes(2)
    expect(github.repos.getBranch).toBeCalledTimes(1)
    expect(github.repos.getContents).toBeCalledTimes(1)
    expect(github.repos.createOrUpdateFile).toBeCalledTimes(1)
    expect(github.git.getRef).toBeCalledTimes(1)
    expect(github.git.createRef).toBeCalledTimes(1)
    expect(github.pulls.create).toBeCalledTimes(1)
  })

  test('properly add funding property to the Package.Json if it exists and collective not detected', async () => {
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
        get: jest.fn().mockResolvedValue({
          data: repository,
        }),
        getBranch: jest.fn().mockRejectedValue(new Error('Branch not found')),
        getContents: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            data: {
              name: 'package.json',
              path: 'package.json',
              /*
                  content: {
                    "name": "backyourstack",
                    "version": "1.1.0",
                    "jest": {
                      "coverageDirectory": "./coverage/",
                      "collectCoverage": true
                    }
                  }
                */
              content:
                'ewogICJuYW1lIjogImJhY2t5b3Vyc3RhY2siLAogICJ2ZXJzaW9uIjogIjEu\nMS4wIiwKICAiamVzdCI6IHsKICAgICJjb3ZlcmFnZURpcmVjdG9yeSI6ICIu\nL2NvdmVyYWdlLyIsCiAgICAiY29sbGVjdENvdmVyYWdlIjogdHJ1ZQogIH0K\nfQo=\n',
            },
          })
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

    expect(github.repos.get).toBeCalledTimes(2)
    expect(github.repos.getBranch).toBeCalledTimes(1)
    expect(github.repos.getContents).toBeCalledTimes(1)
    expect(github.repos.createOrUpdateFile).toBeCalledTimes(1)
    expect(github.git.getRef).toBeCalledTimes(1)
    expect(github.git.createRef).toBeCalledTimes(1)
    expect(github.pulls.create).toBeCalledTimes(1)
  })

  test('do nothing, if package.json does not exist', async () => {
    nock('https://api.opencollective.com/')
      .post('/graphql/v2')
      .reply(200, {
        data: {
          collective: {
            slug: 'backyourstack',
          },
        },
      })

    const app = new probot.Application()

    const github = {
      repos: {
        get: jest.fn().mockResolvedValue({
          data: repository,
        }),
        getBranch: jest.fn().mockRejectedValue(new Error('Branch not found')),
        getContents: jest.fn().mockImplementation(({ ref }) => {
          if (!ref) {
            return Promise.reject(new Error('File not found'))
          } else {
            return Promise.resolve({
              data: {
                name: 'package.json',
                path: 'package.json',
                /*
                  content: {
                    "name": "backyourstack",
                    "version": "1.1.0",
                    "jest": {
                      "coverageDirectory": "./coverage/",
                      "collectCoverage": true
                    }
                  }
                */
                content:
                  'ewogICJuYW1lIjogImJhY2t5b3Vyc3RhY2siLAogICJ2ZXJzaW9uIjogIjEu\nMS4wIiwKICAiamVzdCI6IHsKICAgICJjb3ZlcmFnZURpcmVjdG9yeSI6ICIu\nL2NvdmVyYWdlLyIsCiAgICAiY29sbGVjdENvdmVyYWdlIjogdHJ1ZQogIH0K\nfQo=\n',
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

    expect(github.repos.getContents).toBeCalledTimes(1)
    expect(github.repos.get).toBeCalledTimes(1)
    expect(github.repos.getBranch).toBeCalledTimes(0)
    expect(github.git.deleteRef).toBeCalledTimes(0)
    expect(github.git.getRef).toBeCalledTimes(0)
    expect(github.git.createRef).toBeCalledTimes(0)
    expect(github.repos.createOrUpdateFile).toBeCalledTimes(0)
    expect(github.pulls.create).toBeCalledTimes(0)
  })

  test('do nothing, if package.json contains already funding property', async () => {
    nock('https://api.opencollective.com/')
      .post('/graphql/v2')
      .reply(200, {
        data: {
          collective: {
            slug: 'backyourstack',
          },
        },
      })

    const app = new probot.Application()

    const github = {
      repos: {
        get: jest.fn().mockResolvedValue({
          data: repository,
        }),
        getBranch: jest.fn().mockRejectedValue(new Error('Branch not found')),
        getContents: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            data: {
              name: 'package.json',
              path: 'package.json',
              /*
                    content:
                    {
                        "name": "backyourstack",
                        "version": "1.1.0",
                        "funding": {
                            "type": "opencollective",
                            "url": "https://opencollective.com/backyourstack"
                        }
                    }
                    */
              content:
                'ewogICJuYW1lIjogImJhY2t5b3Vyc3RhY2siLAogICJ2ZXJzaW9uIjogIjEu\nMS4wIiwKICAiZnVuZGluZyI6IHsKICAgICJ0eXBlIjogIm9wZW5jb2xsZWN0\naXZlIiwKICAgICJ1cmwiOiAiaHR0cHM6Ly9vcGVuY29sbGVjdGl2ZS5jb20v\nYmFja3lvdXJzdGFjayIKICB9Cn0K\n',
            },
          })
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

    expect(github.repos.getContents).toBeCalledTimes(1)
    expect(github.repos.get).toBeCalledTimes(1)
    expect(github.repos.getBranch).toBeCalledTimes(0)
    expect(github.git.deleteRef).toBeCalledTimes(0)
    expect(github.git.getRef).toBeCalledTimes(0)
    expect(github.git.createRef).toBeCalledTimes(0)
    expect(github.repos.createOrUpdateFile).toBeCalledTimes(0)
    expect(github.pulls.create).toBeCalledTimes(0)
  })

  test('do nothing, if package.json contains private: true', async () => {
    nock('https://api.opencollective.com/')
      .post('/graphql/v2')
      .reply(200, {
        data: {
          collective: {
            slug: 'backyourstack',
          },
        },
      })

    const app = new probot.Application()

    const github = {
      repos: {
        get: jest.fn().mockResolvedValue({
          data: repository,
        }),
        getBranch: jest.fn().mockRejectedValue(new Error('Branch not found')),
        getContents: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            data: {
              name: 'package.json',
              path: 'package.json',
              /*
                    content:
                    {
                        "name": "backyourstack",
                        "version": "1.1.0",
                        "funding": {
                            "type": "opencollective",
                            "url": "https://opencollective.com/backyourstack"
                        },
                        "private": true
                    }
                    */
              content:
                'ewogICAgICAibmFtZSI6ICJiYWNreW91cnN0YWNrIiwKICAgICAgInZlcnNp\nb24iOiAiMS4xLjAiLAogICAgICAiamVzdCI6IHsKICAgICAgICAgICAgImNv\ndmVyYWdlRGlyZWN0b3J5IjogIi4vY292ZXJhZ2UvIiwKICAgICAgICAgICAg\nImNvbGxlY3RDb3ZlcmFnZSI6IHRydWUKICAgICAgfSwKICAgICAgInByaXZh\ndGUiOiB0cnVlCn0K\n',
            },
          })
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

    expect(github.repos.getContents).toBeCalledTimes(1)
    expect(github.repos.get).toBeCalledTimes(1)
    expect(github.repos.getBranch).toBeCalledTimes(0)
    expect(github.git.deleteRef).toBeCalledTimes(0)
    expect(github.git.getRef).toBeCalledTimes(0)
    expect(github.git.createRef).toBeCalledTimes(0)
    expect(github.repos.createOrUpdateFile).toBeCalledTimes(0)
    expect(github.pulls.create).toBeCalledTimes(0)
  })
})

describe('package.json indents', () => {
  test('mixed, gets first line indents (8)', () => {
    expect(
      setIndent(`
      {
              "name": "backyourstack",
        "version": "1.1.0",
            "jest": {
          "coverageDirectory": "./coverage/",
      "collectCoverage": true
              }
      }
      `),
    ).toBe('        ')
  })

  test('no indent, sets (2)', () => {
    expect(
      setIndent(
        `{
"name": "backyourstack",
"version": "1.1.0",
"jest": {
"coverageDirectory": "./coverage/",
"collectCoverage": true
}
}`,
      ),
    ).toBe('  ')
  })
})
