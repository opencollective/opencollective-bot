/* Some of the code here is taken from Stale bot, thanks Probot! */
import nock from 'nock'
import * as probot from 'probot'
import yaml from 'js-yaml'
import btoa from 'btoa'

import { opencollective } from '../src/bot'
import { Config } from '../src/config'

import issueOpenedFixture from './__fixtures__/issues.opened'
import issueLabeledFixture from './__fixtures__/issues.labeled'

/* Mocks */

const config = btoa(
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
)

/* Tests */

beforeEach(async () => {
  if (!nock.isActive()) nock.activate()
  process.env.DISABLE_WEBHOOK_EVENT_CHECK = 'TRUE'
})

afterEach(async () => {
  nock.restore()
  nock.cleanAll()
  delete process.env.DISABLE_WEBHOOK_EVENT_CHECK
})

describe('opencollective issues.opened', () => {
  test('skips execution on incorrect configuration', async () => {
    const app = new probot.Application()
    const github = {
      integrations: {
        getInstallations: jest.fn(),
      },
      paginate: jest.fn(),
      issues: {
        createComment: jest.fn(),
        getLabel: jest.fn(),
        createLabel: jest.fn(),
        addLabels: jest.fn(),
        removeLabel: jest.fn(),
      },
      orgs: {
        listForUser: jest.fn(),
      },
      repos: {
        getContents: jest.fn().mockReturnValue({
          data: {
            content: btoa(
              yaml.dump({
                collective: 'https://opencollective.com/graphql-shield',
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
      name: 'issues',
      payload: issueOpenedFixture,
    })

    expect(github.repos.getContents).toBeCalledTimes(1)
    expect(github.issues.createComment).toBeCalledTimes(0)
    expect(github.issues.getLabel).toBeCalledTimes(0)
    expect(github.issues.createLabel).toBeCalledTimes(0)
    expect(github.issues.addLabels).toBeCalledTimes(0)
    expect(github.issues.removeLabel).toBeCalledTimes(0)
  })

  test('ignores admin issues', async () => {
    nock('https://api.opencollective.com/')
      .post('/graphql/v2')
      .reply(200, {
        data: {
          account: {
            members: {
              limit: 1000,
              totalCount: 2,
              nodes: [
                {
                  role: 'ADMIN',
                  account: {
                    slug: 'maticzav',
                    githubHandle: 'maticzav',
                  },
                  tier: null,
                },
                {
                  role: 'BACKER',
                  account: {
                    slug: 'airbnb',
                    githubHandle: 'airbnb',
                  },
                  tier: {
                    slug: 'sponsor',
                    name: 'Sponsor',
                  },
                },
              ],
            },
          },
        },
      })

    const app = new probot.Application()

    const github = {
      integrations: {
        getInstallations: jest.fn(),
      },
      paginate: jest.fn(),
      issues: {
        createComment: jest
          .fn()
          .mockImplementation(args => Promise.resolve(args)),
        getLabel: jest.fn().mockImplementation(() =>
          Promise.reject({
            code: 404,
            status: 'Not Found',
            headers: {},
          }),
        ),
        createLabel: jest
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
            content: config,
          },
        }),
      },
      orgs: {
        listForUser: jest.fn().mockResolvedValue({
          status: 200,
          data: [
            {
              login: 'graphql-boilerplates',
              id: 18574799,
              node_id: 'MDEyOk9yZ2FuaXphdGlvbjE4NTc0Nzk5',
              url: 'https://api.github.com/orgs/graphql-boilerplates',
              repos_url:
                'https://api.github.com/orgs/graphql-boilerplates/repos',
              events_url:
                'https://api.github.com/orgs/graphql-boilerplates/events',
              hooks_url:
                'https://api.github.com/orgs/graphql-boilerplates/hooks',
              issues_url:
                'https://api.github.com/orgs/graphql-boilerplates/issues',
              members_url:
                'https://api.github.com/orgs/graphql-boilerplates/members{/member}',
              public_members_url:
                'https://api.github.com/orgs/graphql-boilerplates/public_members{/member}',
              avatar_url:
                'https://avatars2.githubusercontent.com/u/18574799?v=4',
              description:
                'Collection of production-ready GraphQL boilerplate projects',
            },
          ],
          headers: {},
        }),
      },
    }

    app.load(opencollective)
    app.auth = () => Promise.resolve(github as any)

    await app.receive({
      id: '123',
      name: 'issues',
      payload: issueOpenedFixture,
    })

    expect(github.repos.getContents).toBeCalledTimes(1)
    expect(github.issues.createComment).toBeCalledTimes(0)
    expect(github.issues.getLabel).toBeCalledTimes(0)
    expect(github.issues.createLabel).toBeCalledTimes(0)
    expect(github.issues.addLabels).toBeCalledTimes(0)
    expect(github.issues.removeLabel).toBeCalledTimes(0)
  })

  test('sends correct message', async () => {
    nock('https://api.opencollective.com/')
      .post('/graphql/v2')
      .reply(200, {
        data: {
          account: {
            members: {
              limit: 1000,
              totalCount: 2,
              nodes: [
                {
                  role: 'BACKER',
                  account: {
                    slug: 'maticzav',
                    githubHandle: 'maticzav',
                  },
                  tier: {
                    slug: 'backer',
                    name: 'Backer',
                  },
                },
                {
                  role: 'BACKER',
                  account: {
                    slug: 'graphql-boilerplates',
                    githubHandle: 'graphql-boilerplates',
                  },
                  tier: {
                    slug: 'sponsor',
                    name: 'Sponsor',
                  },
                },
              ],
            },
          },
        },
      })

    const app = new probot.Application()

    const github = {
      integrations: {
        getInstallations: jest.fn(),
      },
      paginate: jest.fn(),
      issues: {
        createComment: jest
          .fn()
          .mockImplementation(args => Promise.resolve(args)),
        getLabel: jest.fn().mockImplementation(() =>
          Promise.reject({
            code: 404,
            status: 'Not Found',
            headers: {},
          }),
        ),
        createLabel: jest
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
            content: config,
          },
        }),
      },
      orgs: {
        listForUser: jest.fn().mockResolvedValue({
          status: 200,
          data: [
            {
              login: 'graphql-boilerplates',
              id: 18574799,
              node_id: 'MDEyOk9yZ2FuaXphdGlvbjE4NTc0Nzk5',
              url: 'https://api.github.com/orgs/graphql-boilerplates',
              repos_url:
                'https://api.github.com/orgs/graphql-boilerplates/repos',
              events_url:
                'https://api.github.com/orgs/graphql-boilerplates/events',
              hooks_url:
                'https://api.github.com/orgs/graphql-boilerplates/hooks',
              issues_url:
                'https://api.github.com/orgs/graphql-boilerplates/issues',
              members_url:
                'https://api.github.com/orgs/graphql-boilerplates/members{/member}',
              public_members_url:
                'https://api.github.com/orgs/graphql-boilerplates/public_members{/member}',
              avatar_url:
                'https://avatars2.githubusercontent.com/u/18574799?v=4',
              description:
                'Collection of production-ready GraphQL boilerplate projects',
            },
          ],
          headers: {},
        }),
      },
    }

    app.load(opencollective)
    app.auth = () => Promise.resolve(github as any)

    await app.receive({
      id: '123',
      name: 'issues',
      payload: issueOpenedFixture,
    })

    expect(github.repos.getContents).toBeCalledTimes(1)
    expect(github.issues.createComment).toBeCalledTimes(2)
    expect(github.issues.getLabel).toBeCalledTimes(2)
    expect(github.issues.createLabel).toBeCalledTimes(2)
    expect(github.issues.addLabels).toBeCalledTimes(1)
    expect(github.issues.removeLabel).toBeCalledTimes(0)
  })
})

describe('opencollective issues.labeled', () => {
  test('skips execution on incorrect configuration', async () => {
    const app = new probot.Application()
    const github = {
      integrations: {
        getInstallations: jest.fn(),
      },
      paginate: jest.fn(),
      issues: {
        createComment: jest.fn(),
        getLabel: jest.fn(),
        createLabel: jest.fn(),
        addLabels: jest.fn(),
        removeLabel: jest.fn(),
      },
      orgs: {
        listForUser: jest.fn(),
      },
      repos: {
        getContents: jest.fn().mockReturnValue({
          data: {
            content: btoa(
              yaml.dump({
                collective: 'https://opencollective.com/graphql-shield',
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
      name: 'issues',
      payload: issueLabeledFixture,
    })

    expect(github.repos.getContents).toBeCalledTimes(1)
    expect(github.issues.createComment).toBeCalledTimes(0)
    expect(github.issues.getLabel).toBeCalledTimes(0)
    expect(github.issues.createLabel).toBeCalledTimes(0)
    expect(github.issues.addLabels).toBeCalledTimes(0)
    expect(github.issues.removeLabel).toBeCalledTimes(0)
  })

  test('removes incorrect label', async () => {
    nock('https://api.opencollective.com/')
      .post('/graphql/v2')
      .reply(200, {
        data: {
          account: {
            members: {
              limit: 1000,
              totalCount: 1,
              nodes: [
                {
                  role: 'BACKER',
                  account: {
                    slug: 'maticzav',
                    githubHandle: 'maticzav',
                  },
                  tier: {
                    slug: 'backer',
                    name: 'Backer',
                  },
                },
              ],
            },
          },
        },
      })

    const app = new probot.Application()

    const github = {
      integrations: {
        getInstallations: jest.fn(),
      },
      paginate: jest.fn(),
      issues: {
        createComment: jest
          .fn()
          .mockImplementation(args => Promise.resolve(args)),
        getLabel: jest.fn().mockImplementation(() =>
          Promise.reject({
            code: 404,
            status: 'Not Found',
            headers: {},
          }),
        ),
        createLabel: jest
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
            content: config,
          },
        }),
      },
      orgs: {
        listForUser: jest.fn().mockResolvedValue({
          status: 200,
          data: [],
          headers: {},
        }),
      },
    }

    app.load(opencollective)
    app.auth = () => Promise.resolve(github as any)

    await app.receive({
      id: '123',
      name: 'issues',
      payload: issueLabeledFixture,
    })

    expect(github.repos.getContents).toBeCalledTimes(1)
    expect(github.issues.createComment).toBeCalledTimes(0)
    expect(github.issues.getLabel).toBeCalledTimes(0)
    expect(github.issues.createLabel).toBeCalledTimes(0)
    expect(github.issues.addLabels).toBeCalledTimes(0)
    expect(github.issues.removeLabel).toBeCalledTimes(1)
  })

  test('ignores correct label', async () => {
    nock('https://api.opencollective.com/')
      .post('/graphql/v2')
      .reply(200, {
        data: {
          account: {
            members: {
              limit: 1000,
              totalCount: 2,
              nodes: [
                {
                  role: 'BACKER',
                  account: {
                    slug: 'maticzav',
                    githubHandle: 'maticzav',
                  },
                  tier: {
                    slug: 'backer',
                    name: 'Backer',
                  },
                },
                {
                  role: 'BACKER',
                  account: {
                    slug: 'graphql-boilerplates',
                    githubHandle: 'graphql-boilerplates',
                  },
                  tier: {
                    slug: 'sponsor',
                    name: 'Sponsor',
                  },
                },
              ],
            },
          },
        },
      })

    const app = new probot.Application()

    const github = {
      integrations: {
        getInstallations: jest.fn(),
      },
      paginate: jest.fn(),
      issues: {
        createComment: jest
          .fn()
          .mockImplementation(args => Promise.resolve(args)),
        getLabel: jest.fn().mockImplementation(() =>
          Promise.reject({
            code: 404,
            status: 'Not Found',
            headers: {},
          }),
        ),
        createLabel: jest
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
            content: config,
          },
        }),
      },
      orgs: {
        listForUser: jest.fn().mockResolvedValue({
          status: 200,
          data: [
            {
              login: 'graphql-boilerplates',
              id: 18574799,
              node_id: 'MDEyOk9yZ2FuaXphdGlvbjE4NTc0Nzk5',
              url: 'https://api.github.com/orgs/graphql-boilerplates',
              repos_url:
                'https://api.github.com/orgs/graphql-boilerplates/repos',
              events_url:
                'https://api.github.com/orgs/graphql-boilerplates/events',
              hooks_url:
                'https://api.github.com/orgs/graphql-boilerplates/hooks',
              issues_url:
                'https://api.github.com/orgs/graphql-boilerplates/issues',
              members_url:
                'https://api.github.com/orgs/graphql-boilerplates/members{/member}',
              public_members_url:
                'https://api.github.com/orgs/graphql-boilerplates/public_members{/member}',
              avatar_url:
                'https://avatars2.githubusercontent.com/u/18574799?v=4',
              description:
                'Collection of production-ready GraphQL boilerplate projects',
            },
          ],
          headers: {},
        }),
      },
    }

    app.load(opencollective)
    app.auth = () => Promise.resolve(github as any)

    await app.receive({
      id: '123',
      name: 'issues',
      payload: issueLabeledFixture,
    })

    expect(github.repos.getContents).toBeCalledTimes(1)
    expect(github.issues.createComment).toBeCalledTimes(0)
    expect(github.issues.getLabel).toBeCalledTimes(0)
    expect(github.issues.createLabel).toBeCalledTimes(0)
    expect(github.issues.addLabels).toBeCalledTimes(0)
    expect(github.issues.removeLabel).toBeCalledTimes(0)
  })

  test('ignores admin label', async () => {
    nock('https://api.opencollective.com/')
      .post('/graphql/v2')
      .reply(200, {
        data: {
          account: {
            members: {
              limit: 1000,
              totalCount: 2,
              nodes: [
                {
                  role: 'ADMIN',
                  account: {
                    slug: 'maticzav',
                    githubHandle: 'maticzav',
                  },
                  tier: {
                    slug: 'backer',
                    name: 'Backer',
                  },
                },
                {
                  role: 'BACKER',
                  account: {
                    slug: 'graphql-boilerplates',
                    githubHandle: 'graphql-boilerplates',
                  },
                  tier: {
                    slug: 'sponsor',
                    name: 'Sponsor',
                  },
                },
              ],
            },
          },
        },
      })

    const app = new probot.Application()

    const github = {
      integrations: {
        getInstallations: jest.fn(),
      },
      paginate: jest.fn(),
      issues: {
        createComment: jest
          .fn()
          .mockImplementation(args => Promise.resolve(args)),
        getLabel: jest.fn().mockImplementation(() =>
          Promise.reject({
            code: 404,
            status: 'Not Found',
            headers: {},
          }),
        ),
        createLabel: jest
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
            content: config,
          },
        }),
      },
      orgs: {
        listForUser: jest.fn().mockResolvedValue({
          status: 200,
          data: [
            {
              login: 'graphql-boilerplates',
              id: 18574799,
              node_id: 'MDEyOk9yZ2FuaXphdGlvbjE4NTc0Nzk5',
              url: 'https://api.github.com/orgs/graphql-boilerplates',
              repos_url:
                'https://api.github.com/orgs/graphql-boilerplates/repos',
              events_url:
                'https://api.github.com/orgs/graphql-boilerplates/events',
              hooks_url:
                'https://api.github.com/orgs/graphql-boilerplates/hooks',
              issues_url:
                'https://api.github.com/orgs/graphql-boilerplates/issues',
              members_url:
                'https://api.github.com/orgs/graphql-boilerplates/members{/member}',
              public_members_url:
                'https://api.github.com/orgs/graphql-boilerplates/public_members{/member}',
              avatar_url:
                'https://avatars2.githubusercontent.com/u/18574799?v=4',
              description:
                'Collection of production-ready GraphQL boilerplate projects',
            },
          ],
          headers: {},
        }),
      },
    }

    app.load(opencollective)
    app.auth = () => Promise.resolve(github as any)

    await app.receive({
      id: '123',
      name: 'issues',
      payload: issueLabeledFixture,
    })

    expect(github.repos.getContents).toBeCalledTimes(1)
    expect(github.issues.createComment).toBeCalledTimes(0)
    expect(github.issues.getLabel).toBeCalledTimes(0)
    expect(github.issues.createLabel).toBeCalledTimes(0)
    expect(github.issues.addLabels).toBeCalledTimes(0)
    expect(github.issues.removeLabel).toBeCalledTimes(0)
  })
})
