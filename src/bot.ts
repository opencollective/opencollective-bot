import * as probot from 'probot'
import { getConfig } from './config'

export const opencollective = (app: probot.Application): void => {
  app.log('OpenCollective Bot up!')

  app.on('issues.closed', async (context: probot.Context) => {
    /* Get config */

    const configuration = await getConfig(context)

    if (!configuration) {
      context.log.error("Coudln't load your configuration.")
      return
    }

    // const [allBackers, backerOrganisations] = await Promise.all([
    //   getCollectiveMembers(collectiveSlug),
    //   getUserOrganisations(github, backerName),
    // ])

    /* Check labels */

    // const labelDefinitions = validConfiguration.labels

    // if (
    //   labelDefinitions !== undefined &&
    //   context.payload.issue.labels.every(
    //     (label: { name: string }) => !labelDefinitions.includes(label.name),
    //   )
    // ) {
    //   context.log.info(`OpenCollective Bot not configured for recieved labels.`)
    //   return
    // }

    // /* Post */

    // /* prettier-ignore */
    // const body = `${validConfiguration.message}\n\n${validConfiguration.opencollective}`

    // const issue = context.issue()

    // await context.github.issues.createComment({
    //   repo: issue.repo,
    //   owner: issue.owner,
    //   number: issue.number,
    //   body: body,
    // })

    // context.log.info(`Commented on ${issue.owner}/${issue.repo}.`)
  })
}
