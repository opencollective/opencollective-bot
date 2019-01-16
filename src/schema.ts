import * as joi from 'joi'

export interface Config {
  labels?: string[]
  message: string
  opencollective: string
}

/* Schema, Defaults */

export const defaultMessage = `
Hey :wave:,

We saw you use our package. To keep our code as accessible as possible, we decided to open source it and are now helping others with their questions.

In a pursuit to continue our work, help us by donating to our collective! :heart:
`

export const schema = joi.object().keys({
  labels: joi
    .array()
    .single()
    .description(
      'Issues to apply message to. By default, every issue will receive the message.',
    )
    .default(false),
  message: joi
    .string()
    .required()
    .description('Message for your backers.')
    .default(defaultMessage),
  opencollective: joi
    .string()
    .regex(new RegExp('^https://opencollective.com/.+'))
    .required()
    .description('Open collective link of your collective.'),
})

export async function validateSchema(config: Config): Promise<Config | null> {
  try {
    const value = await joi.validate(config, schema)

    return value
  } catch (err) {
    return null
  }
}
