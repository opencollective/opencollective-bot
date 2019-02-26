import uniq from 'lodash.uniq'

import { Tier, Member } from './collective'
import { stripGithubName } from './github'
import { is } from './utils'

/**
 *
 * Returns tiers of a backer.
 *
 * @param name
 */
export function getCollectiveBackerTiers(
  allBackers: Member[],
  backerName: string,
  backerOrganisations: string[],
): Tier[] {
  const tiers = allBackers.reduce<Tier[]>((acc, member) => {
    if (!member.github) return acc

    const githubName = stripGithubName(member.github)
    const isMember = [...backerOrganisations, backerName].some(is(githubName))

    if (isMember && member.role === 'BACKER' && member.tier) {
      return uniq([...acc, member.tier])
    }

    return acc
  }, [])

  return tiers
}
