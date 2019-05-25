import Octokit, {
  Response,
  IssuesCreateCommentResponse,
  IssuesAddLabelsResponseItem,
  PullsCreateResponse,
  ReposCreateFileResponse,
  GitCreateRefParams,
  GitCreateRefResponse,
  ReposCreateFileParams,
  PullsUpdateResponse,
} from '@octokit/rest'
import { Message } from './config'

export type GithubLabel = string
export interface GithubIssue {
  owner: string
  number: number
  repo: string
}

export interface GithubPullRequest {
  owner: string
  title: string
  repo: string
  head: string
  base: string
  body: string
  maintainer_can_modify: boolean
}

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
 * Strips GitHub username from GitHub URL in Open Collective response.
 *
 * @param url
 */
export function stripGithubName(url: string): string {
  const matches = url.match(/https:\/\/github.com\/([\w\-]+)(?:\/.*)?/)
  /* istanbul ignore if */
  if (!matches || matches.length < 2) {
    throw new Error(`Couldn't parse Github URL ${url}.`)
  }
  return matches[1]
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
      number: issue.number,
      body: message,
    }),
  )

  return Promise.all(actions)
}

/**
 *
 * Creates a GitHub Pull Request.
 *
 * @param github
 * @param pulls
 */
export async function createGithubPR(
  github: Octokit,
  pulls: GithubPullRequest[],
): Promise<Response<PullsCreateResponse>[]> {
  const actions = pulls.map(pull =>
    github.pulls.create({
      owner: pull.owner,
      repo: pull.repo,
      title: pull.title,
      head: pull.head,
      base: pull.base,
      body: pull.body,
      maintainer_can_modify: pull.maintainer_can_modify,
    }),
  )

  return Promise.all(actions)
}

/**
 *
 * Creates a GitHub Pull Request.
 *
 * @param github
 * @param owner
 * @param repo
 */
export async function removeGithubPR(
  github: Octokit,
  owner: string,
  repo: string,
  number: number,
): Promise<Response<PullsUpdateResponse>> {
  return github.pulls.update({
    owner: owner,
    repo: repo,
    number: number,
    state: 'closed',
  })
}

/**
 *
 * Creates a GitHub Pull Request.
 *
 * @param github
 * @param references
 */
export async function createGithubRef(
  github: Octokit,
  references: GitCreateRefParams[],
): Promise<Response<GitCreateRefResponse>[]> {
  const actions = references.map(reference =>
    github.git.createRef({
      owner: reference.owner,
      repo: reference.repo,
      ref: reference.ref,
      sha: reference.sha,
    }),
  )

  return Promise.all(actions)
}

/**
 *
 * Creates a GitHub Pull Request.
 *
 * @param github
 * @param files
 */
export async function createGithubFile(
  github: Octokit,
  files: ReposCreateFileParams[],
): Promise<Response<ReposCreateFileResponse>[]> {
  const actions = files.map(file =>
    github.repos.createFile({
      owner: file.owner,
      repo: file.repo,
      path: file.path,
      message: file.message,
      content: file.content,
      branch: file.branch,
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
 * @param messages
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
    number: issue.number,
    labels: labels,
  })
}

/**
 *
 * Removes labels from a GitHub Issue.
 *
 * @param github
 * @param issue
 * @param messages
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
      number: issue.number,
      name: label,
    }),
  )

  await Promise.all(actions)
  return labels
}
