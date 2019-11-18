import * as probot from 'probot'
import { orderBy } from 'lodash'

import { getIssueAuthorCollectiveTiers } from './backers'
import {
  getConfig,
  getMessagesFromConfigForTiers,
  getLabelsFromConfigForTiers,
  getLabelsFromConfig,
} from './config'
import { getCollectiveMembers } from './collective'
import {
  fetchRepos,
  getUserOrganisations,
  messageGithubIssue,
  labelGithubIssue,
  removeLabelsFromGithubIssue,
} from './github'
import { is, not } from './utils'

import createConfiguration from './actions/createConfiguration'
import createFunding from './actions/createFunding'
import addPackageJsonFunding from './actions/addPackageJsonFunding'

export const opencollective = (app: probot.Application): void => {
  app.log('Open Collective Bot up!')

  app.on('installation_repositories.added', async (context: probot.Context) => {
    const { github, payload } = context

    let repos = await fetchRepos(github, payload.repositories_added)

    // Make sure we don't flood (fetch top repos with 100 stars)
    if (repos.length >= 2) {
      repos = orderBy(
        repos.filter(repo => repo.stargazers_count >= 100),
        'stargazers_count',
        'desc',
      ).slice(0, 2)
    }

    for (const repo of repos) {
      if (!process.env.FEATURE_DISABLE_CONFIGURATION) {
        await createConfiguration(github, repo)
      }

      if (!process.env.FEATURE_DISABLE_FUNDING) {
        await createFunding(github, repo)
      }

      if (!process.env.FEATURE_DISABLE_FUNDING_PACKAGE_JSON) {
        await addPackageJsonFunding(github, repo)
      }
    }
  })

  app.on('issues.opened', async (context: probot.Context) => {
    const issue = context.issue()
    const issueAuthorGithubHandle = context.payload.issue.user.login

    /**
     * Flow
     *
     * 1. Get configuration,
     * 2. Determine backer tiers,
     * 3. Calculate messages and labels,
     * 4. Apply messages and labels.
     */

    // Get configuration
    const config = await getConfig(context)
    if (!config) return

    // Get backer tiers
    const [
      collectiveMembers,
      issueAuthorGithubOrganisations,
    ] = await Promise.all([
      getCollectiveMembers(config.collective),
      getUserOrganisations(context.github, issueAuthorGithubHandle),
    ])
    const issueAuthorCollectiveTiers = getIssueAuthorCollectiveTiers(
      collectiveMembers,
      issueAuthorGithubHandle,
      issueAuthorGithubOrganisations,
    )

    /**
     * Ignore messages to admins, contributors...
     */
    if (issueAuthorCollectiveTiers === null) {
      return
    }

    // Calculate messages and labels
    const dict = {
      '<author>': `@${issueAuthorGithubHandle}`,
      '<link>': `https://opencollective.com/${config.collective}`,
    }
    const messages = getMessagesFromConfigForTiers(
      config,
      issueAuthorCollectiveTiers,
      dict,
    )
    const labels = getLabelsFromConfigForTiers(
      config,
      issueAuthorCollectiveTiers,
    )

    // Sync
    await Promise.all([
      messageGithubIssue(context.github, issue, messages),
      labelGithubIssue(context.github, issue, labels),
    ])

    console.log(`Commented on ${issue.owner}/${issue.repo}/${issue.number}.`)
  })

  app.on('issues.labeled', async (context: probot.Context) => {
    const label = context.payload.label.name
    const issue = context.issue()
    const issueAuthorGithubHandle = context.payload.issue.user.login

    /**
     * Flow
     *
     * 1. Get configuration,
     * 2. Determine backer tiers,
     * 3. Calculate labels,
     * 4. See if added label is appropriate.
     */

    // Get configuration
    const config = await getConfig(context)
    if (!config) return

    // Get Open Collective tiers from issue author
    const [
      collectiveMembers,
      issueAuthorGithubOrganisations,
    ] = await Promise.all([
      getCollectiveMembers(config.collective),
      getUserOrganisations(context.github, issueAuthorGithubHandle),
    ])
    const issueAuthorCollectiveTiers = getIssueAuthorCollectiveTiers(
      collectiveMembers,
      issueAuthorGithubHandle,
      issueAuthorGithubOrganisations,
    )

    /**
     * Admins, Contributors,... have full control over labels.
     */
    if (issueAuthorCollectiveTiers === null) {
      return
    }

    // Calculate messages and labels
    const allLabels = getLabelsFromConfig(config)
    const applicableLabels = getLabelsFromConfigForTiers(
      config,
      issueAuthorCollectiveTiers,
    )

    // Sync
    if (allLabels.some(is(label)) && applicableLabels.every(not(is(label)))) {
      await removeLabelsFromGithubIssue(context.github, issue, [label])
      console.log(
        `Removed ${label} from ${issue.owner}/${issue.repo}/${issue.number}.`,
      )
    }
  })
}
