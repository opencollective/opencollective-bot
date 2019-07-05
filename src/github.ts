import Octokit, {
  Response,
  ReposGetResponse,
  IssuesCreateCommentResponse,
  IssuesAddLabelsResponseItem,
} from '@octokit/rest'
import { Message } from './config'

export type GithubLabel = string

export interface GithubIssue {
  number: number
  owner: string
  repo: string
}

export interface GithubPullRequest {
  owner: string
  title: string
  repo: string
  head: string
  base: string
}

export interface GithubRepoMinimal {
  id: number
  node_id: string
  name: string
  full_name: string
  private: boolean
}

/**
 *
 * Returns a list of user organisations.
 *
 * @param github
 * @param username
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
 * Get a single repository
 *
 * @param github
 * @param owner
 * @param repo
 */
export async function getRepo(
  github: Octokit,
  owner: string,
  repo: string,
): Promise<ReposGetResponse> {
  return github.repos.get({ owner, repo }).then((res: any) => res.data)
}

/**
 *
 * Fetch multiple repositories
 *
 * @param github
 * @param repositories
 */
export async function fetchRepos(
  github: Octokit,
  repositories: GithubRepoMinimal[],
): Promise<ReposGetResponse[]> {
  return Promise.all(
    repositories.map(repository => {
      const [owner, repo] = repository.full_name.split('/')
      return getRepo(github, owner, repo)
    }),
  )
}

/**
 *
 * Adds messages to a GitHub Issue.
 *
 * @param github
 * @param issue
 * @param messages
 */
export async function messageGithubIssue(
  github: Octokit,
  issue: GithubIssue,
  messages: Message[],
): Promise<Response<IssuesCreateCommentResponse>[]> {
  const actions = messages.map(message =>
    github.issues.createComment({
      repo: issue.repo,
      owner: issue.owner,
      issue_number: issue.number,
      body: message,
    }),
  )

  return Promise.all(actions)
}

/**
 *
 * Adds labels to a GitHub Issue and ensures they all exist.
 *
 * @param github
 * @param issue
 * @param labels
 */
export async function labelGithubIssue(
  github: Octokit,
  issue: GithubIssue,
  labels: GithubLabel[],
): Promise<Response<IssuesAddLabelsResponseItem[]>> {
  /**
   * Flow
   * 1. Check if all labels exist.
   * 2. Create missing ones.
   * 3. Add labels to issue.
   */

  const actions = labels.map(async label =>
    github.issues
      .getLabel({ ...issue, name: label })
      .then(() => Promise.resolve())
      .catch(() =>
        github.issues.createLabel({
          ...issue,
          name: label,
          color: 'fbca04',
        }),
      ),
  )

  await Promise.all(actions)

  return github.issues.addLabels({
    repo: issue.repo,
    owner: issue.owner,
    issue_number: issue.number,
    labels: labels,
  })
}

/**
 *
 * Removes labels from a GitHub Issue.
 *
 * @param github
 * @param issue
 * @param labels
 */
export async function removeLabelsFromGithubIssue(
  github: Octokit,
  issue: GithubIssue,
  labels: GithubLabel[],
): Promise<GithubLabel[]> {
  const actions = labels.map(label =>
    github.issues.removeLabel({
      repo: issue.repo,
      owner: issue.owner,
      issue_number: issue.number,
      name: label,
    }),
  )

  await Promise.all(actions)

  return labels
}

/**
 *
 * Create or Re-Create branch on a given repository
 *
 * @param github
 * @param owner
 * @param repo
 * @param branchName
 * @param defaultBranchName
 */
export async function resetBranch(
  github: Octokit,
  owner: string,
  repo: string,
  branchName: string,
  defaultBranchName: string,
) {
  // Get if the BRANCH_NAME is already existing
  const githubBranch = await github.repos
    .getBranch({
      owner,
      repo,
      branch: branchName,
    })
    .then((res: any) => res.data)
    .catch(() => null)

  // Delete the branch in this case
  if (githubBranch) {
    await github.git.deleteRef({
      owner,
      repo,
      ref: `heads/${branchName}`,
    })
  }

  // Get the reference for the default branch (not necessarily master)
  const reference = await github.git
    .getRef({
      owner,
      repo,
      ref: `heads/${defaultBranchName}`,
    })
    .then((res: any) => res.data)

  // Create the target branch
  return await github.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: reference.object.sha,
  })
}
