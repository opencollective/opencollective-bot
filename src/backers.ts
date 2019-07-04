import { uniq } from 'lodash'

import { Tier, Member } from './collective'
import { is } from './utils'

/**
 *
 * Returns tiers of a backer.
 *
 * @param name
 */
export function getIssueAuthorCollectiveTiers(
  collectiveMembers: Member[],
  issueAuthorGithubHandle: string,
  issueAuthorGithubOrganisations: string[],
): Tier[] | null {
  const tiers = collectiveMembers.reduce<Tier[] | null>((acc, member) => {
    if (!member.account.githubHandle || acc === null) return acc

    const isMember = [
      issueAuthorGithubHandle,
      ...issueAuthorGithubOrganisations,
    ].some(is(member.account.githubHandle))

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
