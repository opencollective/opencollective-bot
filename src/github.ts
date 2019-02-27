import Octokit, {
  Response,
  IssuesCreateCommentResponse,
  IssuesAddLabelsResponseItem,
} from '@octokit/rest'
import { Message } from './config'

export type GithubLabel = string
export interface GithubIssue {
  owner: string
  number: number
  repo: string
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

/**
 *
 * Adds messages to a Github Issue.
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
 * Adds labels to a Github Issue.
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
  return github.issues.addLabels({
    repo: issue.repo,
    owner: issue.owner,
    number: issue.number,
    labels: labels,
  })
}
