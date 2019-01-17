import { Config, validateSchema } from '../schema'

describe('schema', () => {
  test('correctly validates configuration', async () => {
    const correctConfigurations: Config[] = [
      { opencollective: 'https://opencollective.com/maticzav' },
      { opencollective: 'https://opencollective.com/maticzav', message: 'Hey' },
      {
        opencollective: 'https://opencollective.com/maticzav',
        message: 'Hey',
        labels: ['label'],
      },
    ]

    const wrongConfigurations: any[] = [
      {},
      { message: 'Hey' },
      { labels: ['label'] },
      { opencollective: 'https://notopencollective.com' },
      { labels: 'randomstring' },
      { message: 1, opencollective: 'https://opencollective.com/maticzav' },
    ]

    correctConfigurations.forEach(async config => {
      expect(await validateSchema(config)).not.toBeNull()
    })

    wrongConfigurations.forEach(async config => {
      expect(await validateSchema(config)).toBeNull()
    })
  })
})
