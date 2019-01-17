import * as probot from 'probot'
import getConfig from 'probot-config'
import { Config, validateSchema } from './schema'

export const opencollective = (app: probot.Application): void => {
  app.log('OpenCollective Bot up!')

  app.on('issues.closed', async (context: probot.Context) => {
    console.log('HANDLING 1')

    /* Get config */

    const configuration = await getConfig<Config>(context, 'opencollective.yml')
    const validConfiguration = await validateSchema(configuration)

    if (!validConfiguration) {
      context.log.error("Coudln't load your configuration.")
      return
    }

    console.log('HANDLING 2', configuration)

    console.log('HANDLING 3', context.payload.issue.labels)

    /* Check labels */

    if (
      !!validConfiguration.labels &&
      context.payload.issue.labels.every(
        (label: { name: string }) =>
          !validConfiguration.labels!.includes(label.name),
      )
    ) {
      context.log.info(`OpenCollective Bot not configured for recieved labels.`)
      return
    }
    /* Post */

    console.log('HANDLING 4', context.payload.issues.labels)

    /* prettier-ignore */
    const body = `${validConfiguration.message}\n\n${validConfiguration.opencollective}`

    const issue = context.issue()

    console.log('HANDLING 5', issue)

    await context.github.issues.createComment({
      repo: issue.repo,
      owner: issue.owner,
      number: issue.number,
      body: body,
    })

    console.log('HANDLING 6 commented')

    context.log.info(`Commented on ${issue.owner}/${issue.repo}.`)
  })
}
