import uniq from 'lodash.uniq'

import { Member, Tier } from './collective'
import { stripGithubName } from './github'
import { is } from './utils'

/**
 *
 * Returns tiers of a backer.
 *
 * @param name
 */
export function getIssueAuthorCollectiveTiers(
  collectiveMembers: Member[],
  githubUser: string,
  githubUserOrganisations: string[],
): Tier[] | null {
  const tiers = collectiveMembers.reduce<Tier[] | null>((acc, member) => {
    if (!member.github || acc === null) {
      return acc
    }

    const memberGithub = stripGithubName(member.github)
    const isMember = [githubUser, ...githubUserOrganisations].some(
      is(memberGithub),
    )

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
