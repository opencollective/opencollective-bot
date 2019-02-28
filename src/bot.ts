import * as probot from 'probot'
import { getCollectiveBackerTiers } from './backers'
import {
  getConfig,
  getMessagesFromConfigForTiers,
  getLabelsFromConfigForTiers,
  getLabelsFromConfig,
} from './config'
import { getCollectiveMembers } from './collective'
import {
  getUserOrganisations,
  messageGithubIssue,
  labelGithubIssue,
  removeLabelsFromGithubIssue,
} from './github'
import { is, not } from './utils'

export const opencollective = (app: probot.Application): void => {
  app.log('OpenCollective Bot up!')

  app.on('issues.opened', async (context: probot.Context) => {
    const backerName = context.payload.issue.user.login
    const issue = context.issue()

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
    const [allBackers, backerOrganisations] = await Promise.all([
      getCollectiveMembers(config.collective),
      getUserOrganisations(context.github, backerName),
    ])
    const backerTiers = getCollectiveBackerTiers(
      allBackers,
      backerName,
      backerOrganisations,
    )

    // Calculate messages and labels
    const dict = {
      '<link>': `https://opencollective.com/${config.collective}`,
    }
    const messages = getMessagesFromConfigForTiers(config, backerTiers, dict)
    const labels = getLabelsFromConfigForTiers(config, backerTiers)

    // Sync
    await Promise.all([
      messageGithubIssue(context.github, issue, messages),
      labelGithubIssue(context.github, issue, labels),
    ])

    console.log(`Commented on ${issue.owner}/${issue.repo}/${issue.number}.`)
  })

  app.on('issues.labeled', async (context: probot.Context) => {
    const backerName = context.payload.issue.user.login
    const label = context.payload.label.name
    const issue = context.issue()

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

    // Get backer tiers
    const [allBackers, backerOrganisations] = await Promise.all([
      getCollectiveMembers(config.collective),
      getUserOrganisations(context.github, backerName),
    ])
    const backerTiers = getCollectiveBackerTiers(
      allBackers,
      backerName,
      backerOrganisations,
    )

    // Calculate messages and labels
    const allLabels = getLabelsFromConfig(config)
    const applicableLabels = getLabelsFromConfigForTiers(config, backerTiers)

    // Sync
    if (allLabels.some(is(label)) && applicableLabels.every(not(is(label)))) {
      await removeLabelsFromGithubIssue(context.github, issue, [label])
      console.log(
        `Removed ${label} from ${issue.owner}/${issue.repo}/${issue.number}.`,
      )
    }
  })
}
