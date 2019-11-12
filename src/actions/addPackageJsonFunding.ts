import mls from 'multilines'
import Octokit, { ReposGetResponse } from '@octokit/rest'
import detectIndent from 'detect-indent'

import { base64 } from '../utils'
import { getCollectiveWithGithubHandle } from '../collective'
import { resetBranch } from '../github'

import defaultFundingPackageAsString from '../assets/default-funding-package'

const BRANCH_NAME = `opencollective-bot/funding_package`

const FILE_PATH = 'package.json'

const PR_TITLE = 'Add FUNDING to package.json'

const PR_BODY = mls`
  | Add FUNDING to package.json
  |
  | Add FUNDING to package.json
  |
  | Add FUNDING to package.json
  `

const FUNDING_DEFAULT_FILE_CONTENT = defaultFundingPackageAsString

function setIndent(packageJSON: string): string {
  return detectIndent(packageJSON).indent || '  '
}

function updatePackageJson(packageJSON: string, fundingUrl: string) {
  const indent = setIndent(packageJSON)
  const obj = JSON.parse(packageJSON)
  obj['funding'] = {
    type: 'opencollective',
    url: fundingUrl,
  }
  return JSON.stringify(obj, null, indent)
}

export { setIndent }
export default async function addPackageJsonFunding(
  github: Octokit,
  repoResponse: ReposGetResponse,
) {
  const owner = repoResponse.owner.login
  const repo = repoResponse.name

  // Check if package.json file is existing
  const packageJsonFile = await github.repos
    .getContents({
      owner,
      repo,
      path: 'package.json',
    })
    .then((res: any) => res.data)
    .catch(() => null)

  if (!packageJsonFile) {
    console.log(`There is not package.json on ${owner}/${repo}`)
    return
  }

  // Content Base64 Decoding
  const packageJsonContent = Buffer.from(
    packageJsonFile.content,
    'base64',
  ).toString()

  // Check if package.json already contains funding property
  if (packageJsonContent.includes('"funding":')) {
    console.log(`Funding property already exists on ${owner}/${repo}`)
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
    .then((res: any) => res.data)

  await resetBranch(github, owner, repo, BRANCH_NAME, defaultBranchName)

  // Add funding property to package.json that fetched from reposiory
  const updatedPackageJsonContent = updatePackageJson(
    packageJsonContent,
    fileContent,
  )
  // Update Package.json
  await github.repos.createOrUpdateFile({
    owner,
    repo,
    path: FILE_PATH,
    message: `Funding added to ${FILE_PATH}`,
    content: base64(updatedPackageJsonContent),
    sha: packageJsonFile.sha,
    branch: BRANCH_NAME,
  })

  // Create the PR
  const pr = await github.pulls
    .create({
      owner,
      repo,
      head: BRANCH_NAME,
      base: defaultBranchName,
      title: PR_TITLE,
      body: PR_BODY,
      maintainer_can_modify: true,
    })
    .then((res: any) => res.data)

  console.log(`PR created for adding fund property to package.json: ${pr.url}`)
}
