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
): Tier[] | null {
  const tiers = allBackers.reduce<Tier[] | null>((acc, member) => {
    if (!member.github || acc === null) return acc

    const githubName = stripGithubName(member.github)
    const isMember = [...backerOrganisations, backerName].some(is(githubName))

    /* Tiers */
    if (isMember && member.role === 'BACKER' && member.tier) {
      return uniq([...acc, member.tier])
    }

    /* Admins, Contributors */
    if (isMember && ['HOST', 'ADMIN', 'CONTRIBUTOR'].includes(member.role)) {
      return null
    }

    return acc
  }, [])

  return tiers
}
