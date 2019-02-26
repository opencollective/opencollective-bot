import * as joi from 'joi'
import * as probot from 'probot'

export interface Config {
  labels?: string[]
  message?: string
  opencollective: string
}

/* Schema */

export const defaultMessage = `
Hey :wave:,

We saw you use our package. To keep our code as accessible as possible, we decided to open source it and are now helping others with their questions.

In a pursuit to continue our work, help us by donating to our collective! :heart:
`

/**
 * Defines schema of configuration file
 */
export const schema = joi
  .object()
  .keys({
    labels: joi
      .array()
      .single()
      .description(
        'Issues to apply message to. By default, every issue will receive the message.',
      ),
    message: joi
      .string()
      .description('Message for your backers.')
      .default(defaultMessage),
    opencollective: joi
      .string()
      .regex(new RegExp('^https://opencollective.com/.+'))
      .required()
      .description('Open collective link of your collective.'),
  })
  .requiredKeys(['opencollective'])

/**
 *
 * Loads configuration from Github.
 *
 * @param context
 */
export async function getConfig(
  context: probot.Context,
): Promise<Config | null> {
  try {
    const config = await context.config('opencollective.yml')
    const value = await joi.validate(config, schema)

    return value
  } catch (err) {
    return null
  }
}
