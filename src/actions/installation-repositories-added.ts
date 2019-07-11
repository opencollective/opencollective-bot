import path from 'path'
import mls from 'multilines'
import * as probot from 'probot'
import { promises as fs } from 'fs'

import { base64, sha } from '../utils'
import { getCollectiveWithGithubHandle } from '../collective'

const BRANCH_NAME = `opencollective-bot/configuration`

const FILE_PATH = '.github/opencollective.yml'

const PR_TITLE = 'Open Collective Bot configuration'

const PR_BODY = mls`
  | Hi!
  |
  | Thank your for installing the Open Collective Bot.
  |
  | To activate and configure it, please review and merge this PR.`

export default async (context: probot.Context) => {
  const { github, payload } = context

  for (const repositoryAdded of payload.repositories_added) {
    const [owner, repo] = repositoryAdded.full_name.split('/')

    let fileContent = await fs.readFile(
      path.resolve(__dirname, '../assets/default-config.yml'),
      'utf8',
    )

    /**
     * Flow
     *
     * 1. Try to detect the Collective matching the repository
     * 2. Check if configuration already exists on default branch
     * 3. Make sure target branch is existing
     * 4. Update the file in the target branch and create a PR
     */

    // Fetch the collective from Open Collective
    const collective = await getCollectiveWithGithubHandle(`${owner}/${repo}`)

    // Replace placeholder with proper collective slug
    if (collective) {
      fileContent = fileContent.replace('<YOUR-COLLECTIVE>', collective.slug)
    }

    // Get information about the repo
    // we're only interested in the default_branch
    const githubRepo = await github.repos
      .get({ owner, repo })
      .then(res => res.data)

    const { default_branch: defaultBranchName } = githubRepo

    // Get the config file on the default branch
    const githubConfig = await github.repos
      .getContents({
        owner,
        repo,
        path: FILE_PATH,
        ref: `heads/${defaultBranchName}`,
      })
      .then(res => res.data)
      .catch(() => null)

    // If configuration is already existing, do nothing
    if (githubConfig) {
      console.log(`Configuration is already existing on ${owner}/${repo}`)
      return
    }

    // Get if the BRANCH_NAME is already existing
    const githubBranch = await github.repos
      .getBranch({
        owner,
        repo,
        branch: BRANCH_NAME,
      })
      .then(res => res.data)
      .catch(() => null)

    // Delete the branch in this case
    if (githubBranch) {
      await github.git.deleteRef({
        owner,
        repo,
        ref: `heads/${BRANCH_NAME}`,
      })
    }

    // Get the reference for the default branch (not necessarily master)
    const reference = await github.git
      .getRef({
        owner,
        repo,
        ref: `heads/${defaultBranchName}`,
      })
      .then(res => res.data)

    // Create the target branch
    await github.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${BRANCH_NAME}`,
      sha: reference.object.sha,
    })

    // Create the config file
    await github.repos.createOrUpdateFile({
      owner,
      repo,
      path: FILE_PATH,
      message: `chore: add ${FILE_PATH}`,
      content: base64(fileContent),
      sha: sha(fileContent),
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
      .then(res => res.data)

    console.log(`PR created: ${pr.url}`)
  }
}
