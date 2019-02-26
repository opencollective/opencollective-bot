import { getCollectiveBackerTiers } from '../src/backers'

import { backers } from './__fixtures__/backers'

describe('backers', () => {
  test('backers find correct tiers', async () => {
    const res = await getCollectiveBackerTiers(backers, 'kentcdodds', [
      'airbnb',
      'something-else',
    ])

    expect(res).toEqual(['Backer', 'Sponsor'])
  })
})
