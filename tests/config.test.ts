import * as probot from 'probot'

import {
  Config,
  getConfig,
  getLabelsFromConfig,
  getLabelsFromConfigForTiers,
  getMessagesFromConfigForTiers,
} from '../src/config'

/* Helpers */

const contextify = (config: Config): probot.Context => ({
  config: (name: string) => Promise.resolve(config),
  name: '',
  id: '',
  payload: {} as any,
  github: {} as any,
  log: {} as any,
  event: {} as any,
  repo: {} as any,
  issue: {} as any,
  isBot: true,
})

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

test('getLabelsFromConfigForTiers finds labels', async () => {
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
      ['Backers'],
    ),
  ).toEqual(['priority', 'backer-priority'])
})

test('getMessageFromConfigForTiers finds messages', async () => {
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
      ['Backers'],
      {
        '<link>': 'pass',
        '<cool>': 'cool-pass',
      },
    ),
  ).toEqual(['Hey :wave: pass cool-pass', 'Hey backer!'])
})

test('getMessageFromConfigForTiers returns invite when user is not a backer', async () => {
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

test('getMessageFromConfigForTiers returns no message when user is not a backer and invitaiton is disabled', async () => {
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
