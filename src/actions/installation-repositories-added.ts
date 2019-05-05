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

    // TEMP: don't commit
    // if (repo !== 'backyourstack') {
    //   continue
    // }

    let fileContent = await fs.readFile(
      path.resolve(__dirname, '../assets/default-config.yml'),
      'utf8',
    )

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

    // If config is already existing, do nothing
    if (githubConfig) {
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

    if (!githubBranch) {
      // get the reference for the default branch (not necessarily master)
      const reference = await github.git
        .getRef({
          owner,
          repo,
          ref: `heads/${defaultBranchName}`,
        })
        .then(res => res.data)

      await github.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${BRANCH_NAME}`,
        sha: reference.object.sha,
      })
    }

    // Get the config file on the branch
    const githubFile = await github.repos
      .getContents({
        owner,
        repo,
        path: FILE_PATH,
        ref: `heads/${BRANCH_NAME}`,
      })
      .then(res => res.data)
      .catch(() => null)

    // Create or update the config file
    await github.repos.createOrUpdateFile({
      owner,
      repo,
      path: FILE_PATH,
      message: `chore: add ${FILE_PATH}`,
      content: base64(fileContent),
      sha: githubFile ? githubFile.sha : sha(fileContent),
      branch: BRANCH_NAME,
    })

    // Create the PR
    await github.pulls.create({
      owner,
      repo,
      head: BRANCH_NAME,
      base: defaultBranchName,
      title: PR_TITLE,
      body: PR_BODY,
      maintainer_can_modify: true,
    })

    console.log('PR created')
  }
}
