import mls from 'multilines'
import Octokit, { ReposGetResponse } from '@octokit/rest'

import { base64, sha } from '../utils'
import { getCollectiveWithGithubHandle } from '../collective'
import { resetBranch } from '../github'

import defaultConfigAsString from '../assets/default-config'

const CONFIG_BRANCH_NAME = `opencollective-bot/configuration`

const CONFIG_FILE_PATH = '.github/opencollective.yml'

const CONFIG_PR_TITLE = 'Open Collective Bot configuration'

const CONFIG_PR_BODY = mls`
  | Thank your for installing the Open Collective Bot!
  |
  | To activate and configure it, please review and merge this PR.`

const CONFIG_DEFAULT_FILE_CONTENT = defaultConfigAsString

export default async function createConfiguration(
  github: Octokit,
  repoResponse: ReposGetResponse,
): Promise<void> {
  const owner = repoResponse.owner.login
  const repo = repoResponse.name

  /**
   * Flow
   *
   * 1. Try to detect the Collective matching the repository
   * 2. Check if configuration already exists on default branch
   * 3. Make sure target branch is existing
   * 4. Update the file in the target branch and create a PR
   */

  // Get the config file on the default branch
  const githubConfig = await github.repos
    .getContents({
      owner,
      repo,
      path: CONFIG_FILE_PATH,
    })
    .then(({ data }) => data)
    .catch(() => null)

  // If configuration is already existing, do nothing
  if (githubConfig) {
    console.log(`Configuration is already existing on ${owner}/${repo}`)
    return
  }

  let fileContent = CONFIG_DEFAULT_FILE_CONTENT

  // Fetch the collective from Open Collective
  const collective = await getCollectiveWithGithubHandle(`${owner}/${repo}`)

  // Replace placeholder with proper collective slug
  if (collective) {
    fileContent = fileContent.replace('<YOUR-COLLECTIVE-SLUG>', collective.slug)
  }

  // Get information about the repo
  // we're only interested in the default_branch
  const { default_branch: defaultBranchName } = await github.repos
    .get({ owner, repo })
    .then(({ data }) => data)

  await resetBranch(github, owner, repo, CONFIG_BRANCH_NAME, defaultBranchName)

  // Create the config file
  await github.repos.createOrUpdateFile({
    owner,
    repo,
    path: CONFIG_FILE_PATH,
    message: `chore: add ${CONFIG_FILE_PATH}`,
    content: base64(fileContent),
    sha: sha(fileContent),
    branch: CONFIG_BRANCH_NAME,
  })

  // Create the PR
  const pr = await github.pulls
    .create({
      owner,
      repo,
      head: CONFIG_BRANCH_NAME,
      base: defaultBranchName,
      title: CONFIG_PR_TITLE,
      body: CONFIG_PR_BODY,
      maintainer_can_modify: true,
    })
    .then(({ data }) => data)

  console.log(`PR created for configuration: ${pr.url}`)
}
