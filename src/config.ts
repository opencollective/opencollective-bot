import * as joi from 'joi'
import mls from 'multilines'
import * as probot from 'probot'

import { Tier } from './collective'
import { GithubLabel } from './github'
import { intersect } from './utils'

export type Config = {
  collective: string
  tiers: TierConfig[]
  invitation: Message
}

export type TierConfig = {
  tiers: Tier[] | '*'
  labels: GithubLabel[]
  message: Message
}

export type Message = string

/* Schema */

const tierConfigSchema = joi.object().keys({
  tiers: joi
    .array()
    .items(joi.string())
    .allow('*'),
  labels: joi.array().items(joi.string()),
  message: joi.string().required(),
})

export const configSchema = joi
  .object()
  .keys({
    collective: joi
      .string()
      .regex(/^[\w\-]+$/, 'Use your collective slug.')
      .required(),
    tiers: joi
      .array()
      .items(tierConfigSchema)
      .optional()
      .default([
        {
          tiers: '*',
          labels: ['priority'],
          message: mls`
          | Hey :wave:,
          | 
          | Thanks for backing our project. We will handle your issue
          | with priority support. To make sure we don't forget how special
          | you are, we added a ${'`priority`'} label to your issue.
          |
          | Thanks again for backing us :tada:!
          `,
        },
      ]),
    invitation: joi
      .string()
      .default(
        mls`
        | Hey :wave:,
        |
        | Thank you for opening an issue. We will get back to you as
        | soon as we can. Also, check out our OpenCollective and consider
        | backing us.
        |
        | <link>
        |
        | PS.: We offer ${'`priority`'} support for all backers. Don't forget to
        | add ${'`priority`'} label when you start backing us :smile:
      `,
      )
      .optional()
      .description('An invitation message shown to non-backers'),
  })
  .requiredKeys(['collective'])

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
    const value = await joi.validate(config, configSchema)

    return value
  } catch (err) {
    return null
  }
}

/**
 *
 * Returns a collection of all labels in configuration.
 *
 * @param config
 */
export function getLabelsFromConfig(config: Config): GithubLabel[] {
  return config.tiers.reduce<GithubLabel[]>(
    (acc, tier) => [...acc, ...tier.labels],
    [],
  )
}

/**
 *
 * Returns a collection of labels in configuration for
 * particular tiers..
 *
 * @param config
 * @param tiers
 */
export function getLabelsFromConfigForTiers(
  config: Config,
  tiers: Tier[],
): GithubLabel[] {
  return config.tiers.reduce<GithubLabel[]>((acc, tier) => {
    if (tier.tiers === '*') {
      return [...acc, ...tier.labels]
    } else if (intersect(tier.tiers)(tiers)) {
      return [...acc, ...tier.labels]
    } else {
      return acc
    }
  }, [])
}

/**
 *
 * Returns a collection of messages assignable to partiular tier.
 *
 * @param config
 * @param tiers
 */
export function getMessagesFromConfigForTiers(
  config: Config,
  tiers: Tier[],
): Message[] {
  const rawMessages = config.tiers.reduce<Message[]>((acc, tier) => {
    if (tier.tiers === '*') {
      return [...acc, tier.message]
    } else if (intersect(tier.tiers)(tiers)) {
      return [...acc, tier.message]
    } else {
      return acc
    }
  }, [])

  const messages = rawMessages.map(hydrateMessage)
  return messages

  /* Helper functions */
  /**
   *
   * Hydartes raw message to include placeholder values.
   *
   * @param message
   */
  function hydrateMessage(message: string): string {
    return message.replace(
      '<link>',
      `https://opencollective.com/${config.collective}`,
    )
  }
}
