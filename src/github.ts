import Octokit from '@octokit/rest'

export type Label = string

/**
 *
 * Returns a list of user organisations.
 *
 * @param context
 */
export async function getUserOrganisations(
  github: Octokit,
  username: string,
): Promise<string[]> {
  return github.orgs
    .listForUser({
      username: username,
    })
    .then(res => res.data.map(org => org.login))
}

/**
 *
 * Strips Github username from Github URL in OpenCollective respnse.
 *
 * @param url
 */
export function stripGithubName(url: string): string {
  const matches = url.match(/https:\/\/github.com\/(\w+)(?:\/.*)?/)
  /* istanbul ignore if */
  if (!matches || matches.length < 2) {
    throw new Error(`Couldn't parse Github URL ${url}.`)
  }
  return matches[1]
}
