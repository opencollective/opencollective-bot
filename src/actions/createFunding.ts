import mls from 'multilines'
import Octokit, { ReposGetResponse } from '@octokit/rest'

import { base64, sha } from '../utils'
import { getCollectiveWithGithubHandle } from '../collective'
import { resetBranch } from '../github'

import defaultFundingAsString from '../assets/default-funding'

const FUNDING_BRANCH_NAME = `opencollective-bot/funding`

const FUNDING_FILE_PATH = '.github/FUNDING.yml'

const FUNDING_PR_TITLE = 'Add FUNDING.yml'

const FUNDING_PR_BODY = mls`
  | Looks like you don't have a FUNDING.yml in your repository.
  |
  | This file is required by GitHub to display the "Sponsor" button on your repository page.
  |
  | You can review and merge this PR to add the FUNDING.yml to your repository.
  |
  | You will also need to activate "Sponsorships" for your repository, see GitHub documentation: https://help.github.com/en/articles/displaying-a-sponsor-button-in-your-repository`

const FUNDING_DEFAULT_FILE_CONTENT = defaultFundingAsString

export default async function createFunding(
  github: Octokit,
  repoResponse: ReposGetResponse,
): Promise<void> {
  const owner = repoResponse.owner.login
  const repo = repoResponse.name

  // Check if funding file is existing
  const githubFundingUpper = await github.repos
    .getContents({
      owner,
      repo,
      path: '.github/FUNDING.yml',
    })
    .then(({ data }) => data)
    .catch(() => null)

  const githubFundingLower = await github.repos
    .getContents({
      owner,
      repo,
      path: '.github/funding.yml',
    })
    .then(({ data }) => data)
    .catch(() => null)

  if (githubFundingUpper || githubFundingLower) {
    console.log(`FUNDING.yml is already existing on ${owner}/${repo}`)
    return
  }

  let fileContent = FUNDING_DEFAULT_FILE_CONTENT

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

  await resetBranch(github, owner, repo, FUNDING_BRANCH_NAME, defaultBranchName)

  // Create the config file
  await github.repos.createOrUpdateFile({
    owner,
    repo,
    path: FUNDING_FILE_PATH,
    message: `chore: add ${FUNDING_FILE_PATH}`,
    content: base64(fileContent),
    sha: sha(fileContent),
    branch: FUNDING_BRANCH_NAME,
  })

  // Create the PR
  const pr = await github.pulls
    .create({
      owner,
      repo,
      head: FUNDING_BRANCH_NAME,
      base: defaultBranchName,
      title: FUNDING_PR_TITLE,
      body: FUNDING_PR_BODY,
      maintainer_can_modify: true,
    })
    .then(({ data }) => data)

  console.log(`PR created for funding.yml: ${pr.url}`)
}
