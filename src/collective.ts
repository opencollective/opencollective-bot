import fetch from 'isomorphic-fetch'

export type Member = {
  MemberId: number
  type: 'COLLECTIVE' | 'EVENT' | 'ORGANIZATION' | 'USER'
  role:
    | 'HOST'
    | 'ADMIN'
    | 'BACKER'
    | 'FOLLOWER'
    | 'MEMBER'
    | 'FUNDRAISER'
    | 'CONTRIBUTOR'
  tier: string
  isActive: boolean
  name: string
  github: string
}

/**
 *
 * Fetches members of a particuar collective.
 *
 * @param slug
 */
export async function getCollectiveMembers(slug: string): Promise<Member[]> {
  return fetch(`https://opencollective.com/${slug}/members.json`).then(res =>
    res.json(),
  )
}
