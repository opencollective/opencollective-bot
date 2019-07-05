import * as probot from 'probot'
import { getIssueAuthorCollectiveTiers } from './backers'
import { getCollectiveMembers } from './collective'
import {
  getConfig,
  getLabelsFromConfig,
  getLabelsFromConfigForTiers,
  getMessagesFromConfigForTiers,
} from './config'
import {
  getUserOrganisations,
  labelGithubIssue,
  messageGithubIssue,
  removeLabelsFromGithubIssue,
} from './github'
import { is, not } from './utils'

export const opencollective = (app: probot.Application): void => {
  app.log('OpenCollective Bot up!')

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
    if (!config) {
      return
    }

    // Get backer tiers
    const [
      allCollectiveMembers,
      issueAuthorGithubOrganisations,
    ] = await Promise.all([
      getCollectiveMembers(config.collective),
      getUserOrganisations(context.github, issueAuthorGithubHandle),
    ])
    const issueAuthorCollectiveTiers = getIssueAuthorCollectiveTiers(
      allCollectiveMembers,
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
    if (!config) {
      return
    }

    // Get Open Collective tiers from issue author
    const [
      allCollectiveMembers,
      issueAuthorGithubOrganisations,
    ] = await Promise.all([
      getCollectiveMembers(config.collective),
      getUserOrganisations(context.github, issueAuthorGithubHandle),
    ])
    const issueAuthorCollectiveTiers = getIssueAuthorCollectiveTiers(
      allCollectiveMembers,
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
