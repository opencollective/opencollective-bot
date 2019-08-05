import fetch from 'node-fetch'

// const graphqlEndpoint = 'https://api.opencollective.com/graphql/v2'
const graphqlEndpoint = 'http://0.0.0.0:3060/graphql/v2'

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

const collectiveWithGithubhandleQuery = `query collective($githubHandle: String!) {
  collective(githubHandle: $githubHandle) {
    slug
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

async function graphqlQuery(query: string, variables: object): Promise<any> {
  const result = await fetch(
    `${graphqlEndpoint}?apiKey=b00142949ef0aaad15287015ca37176cca620e67`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    },
  )
  console.log(
    'x-ratelimit-remaining',
    result.headers.get('x-ratelimit-remaining'),
  )
  console.log('x-ratelimit-reset', result.headers.get('x-ratelimit-reset'))

  return result.json().then(res => {
    if (!res.data) {
      console.log(res)
    }
    return res.data
  })
}

/**
 *
 * Fetches members of a particuar collective.
 *
 * @param slug
 */
export async function getCollectiveMembers(slug: string): Promise<Member[]> {
  const result = graphqlQuery(membersGraphqlQuery, { slug })

  return result.then(data => data.account.members.nodes)
}

/**
 *
 * Fetch the collective matching a given githubHandle
 *
 * @param githubHandle
 */
export async function getCollectiveWithGithubHandle(
  githubHandle: string,
): Promise<Account> {
  const result = graphqlQuery(collectiveWithGithubhandleQuery, { githubHandle })

  return result.then(data => {
    if (!data.collective) {
      console.log(data)
    }
    return data.collective
  })
}
