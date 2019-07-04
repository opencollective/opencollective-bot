import { getIssueAuthorCollectiveTiers } from '../src/backers'

import { backers } from './__fixtures__/backers'

describe('backers', () => {
  test('backers find correct tiers', async () => {
    const res = await getIssueAuthorCollectiveTiers(backers, 'kentcdodds', [
      'airbnb',
      'something-else',
    ])

    expect(res).toEqual(['Backer', 'Sponsor'])
  })
  test('backers return null on admin role', async () => {
    const res = await getIssueAuthorCollectiveTiers(backers, 'maticzav', [
      'airbnb',
      'something-else',
    ])

    expect(res).toEqual(null)
  })
})
