import * as probot from 'probot'

import {
  Config,
  getConfig,
  getLabelsFromConfig,
  getLabelsFromConfigForTiers,
  getMessagesFromConfigForTiers,
} from '../src/config'

/* Helpers */

class MockContext extends probot.Context<any> {
  public _config: Config

  constructor(event: any, github: any, log: any, config: Config) {
    super(event, github, log)
    this._config = config
  }

  public async config<T>(fileName: string): Promise<object | null> {
    return this._config
  }
}

const contextify = (config: Config): probot.Context =>
  new MockContext({}, {}, {}, config)

/* Tests */

describe('getConfig', () => {
  test('correctly finds valid configurations', async () => {
    const correctConfigurations: any[] = [
      { collective: 'maticzav' },
      { collective: 'graphql-shield' },
      {
        collective: 'webpack',
        tiers: [
          {
            tiers: '*',
            labels: ['priority'],
            message: 'Hey :wave:',
          },
          {
            tiers: ['Backers'],
            labels: ['backer-priority'],
            message: 'Hey backer!',
          },
        ],
        invitation: 'Hey',
      },
      {
        collective: 'webpack',
        tiers: [],
        invitation: false,
      },
    ]

    const validations = correctConfigurations.map(async config => {
      expect(await getConfig(contextify(config))).not.toBeNull()
    })

    await Promise.all(validations)
  })

  test('correctly finds invalid configurations', async () => {
    const wrongConfigurations: any[] = [
      {},
      { invitation: 'Hey' },
      { tiers: 'Hey' },
      { collective: 'https://opencollective.com/graphql-shield' },
      {
        collective: 'webpack',
        tiers: 'a',
        invitation: 'Hey',
      },
    ]

    const validations = wrongConfigurations.map(async config => {
      expect(await getConfig(contextify(config))).toBeNull()
    })

    await Promise.all(validations)
  })
})

test('getLabelsFromConfig finds labels', async () => {
  expect(
    getLabelsFromConfig({
      collective: 'webpack',
      tiers: [
        {
          tiers: '*',
          labels: ['priority'],
          message: 'Hey :wave:',
        },
        {
          tiers: ['Backers'],
          labels: ['backer-priority'],
          message: 'Hey backer!',
        },
      ],
      invitation: 'Hey',
    }),
  ).toEqual(['priority', 'backer-priority'])
})

describe('getLabelsFromConfigForTiers', () => {
  test('finds labels', async () => {
    expect(
      getLabelsFromConfigForTiers(
        {
          collective: 'webpack',
          tiers: [
            {
              tiers: '*',
              labels: ['priority'],
              message: 'Hey :wave:',
            },
            {
              tiers: ['Backers'],
              labels: ['backer-priority'],
              message: 'Hey backer!',
            },
            {
              tiers: ['Sponsors'],
              labels: ['sponsor-priority'],
              message: 'Hey backer!',
            },
          ],
          invitation: 'Hey',
        },
        [{ slug: 'backers', name: 'Backers' }],
      ),
    ).toEqual(['priority', 'backer-priority'])
  })

  test('returns no labels when user is not a backer', async () => {
    expect(
      getLabelsFromConfigForTiers(
        {
          collective: 'webpack',
          tiers: [
            {
              tiers: '*',
              labels: ['priority'],
              message: 'Hey :wave:',
            },
            {
              tiers: ['Backers'],
              labels: ['backer-priority'],
              message: 'Hey backer!',
            },
            {
              tiers: ['Sponsors'],
              labels: ['sponsor-priority'],
              message: 'Hey backer!',
            },
          ],
          invitation: 'Hey',
        },
        [],
      ),
    ).toEqual([])
  })
})

describe('getMessageFromConfigForTiers', () => {
  test('finds messages', async () => {
    expect(
      getMessagesFromConfigForTiers(
        {
          collective: 'webpack',
          tiers: [
            {
              tiers: '*',
              labels: ['priority'],
              message: 'Hey :wave: <link> <cool>',
            },
            {
              tiers: ['Backers'],
              labels: ['backer-priority'],
              message: 'Hey backer!',
            },
            {
              tiers: ['Sponsors'],
              labels: ['sponsor-priority'],
              message: 'Hey sponsor!',
            },
          ],
          invitation: 'Hey',
        },
        [{ slug: 'backers', name: 'Backers' }],
        {
          '<link>': 'pass',
          '<cool>': 'cool-pass',
        },
      ),
    ).toEqual(['Hey :wave: pass cool-pass', 'Hey backer!'])
  })

  test('returns invite when user is not a backer', async () => {
    expect(
      getMessagesFromConfigForTiers(
        {
          collective: 'webpack',
          tiers: [
            {
              tiers: ['Sponsors'],
              labels: ['sponsor-priority'],
              message: 'Hey sponsor!',
            },
          ],
          invitation: 'Hey <link>',
        },
        [],
        {
          '<link>': 'pass',
          '<cool>': 'cool-pass',
        },
      ),
    ).toEqual(['Hey pass'])
  })

  test('returns no message when user is not a backer and invitaiton is disabled', async () => {
    expect(
      getMessagesFromConfigForTiers(
        {
          collective: 'webpack',
          tiers: [
            {
              tiers: ['Sponsors'],
              labels: ['sponsor-priority'],
              message: 'Hey sponsor!',
            },
          ],
          invitation: false,
        },
        [],
        {
          '<link>': 'pass',
          '<cool>': 'cool-pass',
        },
      ),
    ).toEqual([])
  })
})
