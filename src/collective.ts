import fetch from 'node-fetch'

const graphqlEndpoint = 'https://api.opencollective.com/graphql/v2'

const membersGraphqlQuery = `query account($slug: String!) {
  account(slug: $slug) {
    members(limit: 1000) {
      limit
      totalCount
      nodes {
        role
        account {
          slug
          githubHandle
        }
        tier {
          slug
          name
        }
      }
    }
  }
}`

export type Tier = {
  slug: string
  name: string
}

export type Account = {
  slug: string
  githubHandle: string | null
}

export type Member = {
  role:
    | 'HOST'
    | 'ADMIN'
    | 'BACKER'
    | 'FOLLOWER'
    | 'MEMBER'
    | 'FUNDRAISER'
    | 'CONTRIBUTOR'
  account: Account
  tier: Tier | null
}

/**
 *
 * Fetches members of a particuar collective.
 *
 * @param slug
 */
export async function getCollectiveMembers(slug: string): Promise<Member[]> {
  const result = await fetch(graphqlEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: membersGraphqlQuery, variables: { slug } }),
  })

  return result.json().then(res => res.data.account.members.nodes)
}
