import fetch from 'isomorphic-fetch'

export type Tier = string

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
  tier?: Tier
  isActive: boolean
  name: string
  github: string | null
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
