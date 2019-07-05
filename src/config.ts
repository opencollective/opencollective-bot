import * as joi from '@hapi/joi'
import * as probot from 'probot'
import yaml from 'js-yaml'
import { flatten, intersection } from 'lodash'

import { Tier } from './collective'
import { GithubLabel } from './github'

import defaultConfigAsString from './assets/default-config'

export type Config = {
  collective: string
  tiers: TierConfig[]
  invitation: Message | false
}

export type TierConfig = {
  tiers: string[] | '*'
  labels: GithubLabel[]
  message: Message
}

export type Message = string

const defaultConfig = yaml.safeLoad(defaultConfigAsString)

/* Schema */

const tierConfigSchema = joi.object().keys({
  tiers: joi
    .array()
    .items(joi.string())
    .allow('*'),
  labels: joi.array().items(joi.string()),
  message: joi.string().required(),
})

export const configSchema = joi.object().keys({
  collective: joi
    .string()
    .regex(/^[\w\-]+$/, 'Use your collective slug.')
    .required(),
  tiers: joi
    .array()
    .items(tierConfigSchema)
    .optional()
    .default(defaultConfig.tiers),
  invitation: joi
    .string()
    .default(defaultConfig.invitation)
    .allow(false)
    .optional()
    .description('An invitation message shown to non-backers'),
})

/**
 *
 * Loads configuration from GitHub.
 *
 * @param context
 */
export async function getConfig(
  context: probot.Context,
): Promise<Config | null> {
  try {
    const config = await context.config('opencollective.yml')
    const value = await configSchema.validateAsync(config)

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
  /**
   * Returns no labels if user is not a backer.
   */
  if (tiers.length === 0) {
    return []
  }

  const tiersNamesAndSlugs = flatten(
    tiers.map(({ slug, name }) => [slug, name]),
  )

  /**
   * Finds all labels for the specified tiers.
   */
  return config.tiers.reduce<GithubLabel[]>((acc, configTier) => {
    if (configTier.tiers === '*') {
      return [...acc, ...configTier.labels]
    } else if (intersection(tiersNamesAndSlugs, configTier.tiers).length > 0) {
      return [...acc, ...configTier.labels]
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
  dictionary: { [key: string]: string },
): Message[] {
  /**
   *
   * Hydrates raw message to include placeholder values.
   *
   * @param message
   */
  function hydrateMessage(message: string): string {
    return Object.keys(dictionary).reduce((acc, tag) => {
      return acc.replace(tag, dictionary[tag])
    }, message)
  }

  /**
   * Returns invitation message if user has no tiers.
   */
  if (tiers.length === 0 && config.invitation) {
    return [hydrateMessage(config.invitation)]
  }

  const tiersNamesAndSlugs = flatten(
    tiers.map(({ slug, name }) => [slug, name]),
  )

  /**
   * Finds all messages for specified tiers.
   */
  const rawMessages = config.tiers.reduce<Message[]>((acc, configTier) => {
    if (configTier.tiers === '*') {
      return [...acc, configTier.message]
    } else if (intersection(tiersNamesAndSlugs, configTier.tiers).length > 0) {
      return [...acc, configTier.message]
    } else {
      return acc
    }
  }, [])

  const messages = rawMessages.map(hydrateMessage)

  return messages
}
