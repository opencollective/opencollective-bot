import * as probot from 'probot'
import getConfig from 'probot-config'
import { Config, validateSchema } from './schema'

export const opencollective = (app: probot.Application): void => {
  app.on('issues.closed', async (context: probot.Context) => {
    /* Get config */

    const configuration = await getConfig<Config>(context, 'opencollective.yml')
    const validConfiguration = await validateSchema(configuration)

    if (!validConfiguration) {
      context.log.error("Coudln't load your configuration.")
      return
    }

    /* Check labels */

    if (
      validConfiguration.labels !== undefined &&
      context.payload.labels.every(
        (label: { name: string }) =>
          !validConfiguration.labels!.includes(label.name),
      )
    ) {
      context.log.info(`OpenCollective Bot not configured for recieved labels.`)
      return
    }
    /* Post */

    const body = `
${validConfiguration.message}

${validConfiguration.opencollective}
    `

    const issue = context.issue()

    context.github.issues.createComment({
      repo: issue.repo,
      owner: issue.owner,
      number: issue.number,
      body: body,
    })
  })
}
