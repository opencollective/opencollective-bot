import * as Octokit from '@octokit/rest'

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
