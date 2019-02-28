import * as probot from 'probot'
import {
  getConfig,
  getMessagesFromConfigForTiers,
  getLabelsFromConfigForTiers,
} from './config'
import { getCollectiveMembers } from './collective'
import {
  getUserOrganisations,
  messageGithubIssue,
  labelGithubIssue,
} from './github'
import { getCollectiveBackerTiers } from './backers'

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

    context.issue()

    // Get configuration
    const configuration = await getConfig(context)
    if (!configuration) return

    // Get backer tiers
    const [allBackers, backerOrganisations] = await Promise.all([
      getCollectiveMembers(configuration.collective),
      getUserOrganisations(context.github, backerName),
    ])
    const backerTiers = getCollectiveBackerTiers(
      allBackers,
      backerName,
      backerOrganisations,
    )

    // Calculate messages and labels
    const messages = getMessagesFromConfigForTiers(configuration, backerTiers)
    const labels = getLabelsFromConfigForTiers(configuration, backerTiers)

    // Sync
    await Promise.all([
      messageGithubIssue(context.github, issue, messages),
      labelGithubIssue(context.github, issue, labels),
    ])

    console.log(`Commented on ${issue.owner}/${issue.repo}.`)
  })
}
