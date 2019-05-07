import * as probot from 'probot'
import { getCollectiveBackerTiers } from './backers'
import {
  getConfig,
  getMessagesFromConfigForTiers,
  getLabelsFromConfigForTiers,
  getLabelsFromConfig,
} from './config'
import { getCollectiveMembers } from './collective'
import {
  getUserOrganisations,
  messageGithubIssue,
  labelGithubIssue,
  removeLabelsFromGithubIssue,
} from './github'
import { is, not } from './utils'

export const opencollective = (app: probot.Application): void => {
  app.log('OpenCollective Bot up!')

  app.on('installation_repositories', async (context: probot.Context) => {
    //get 'added' action as condition before adding the config file
    if (context.payload.action === 'added') {
      let added_repos = context.payload.repositories_added

      // This can open PRs with new files at any point in time, but this
      // gets called when the app is first installed on a repo
      context.log({ event: context.event, action: context.payload.action })

      let fields = {
        file: {
          path: '.github/opencollective.yml',
          content: `collective: graphql-shield
        tiers:
          - tiers: '*'
            labels: ['backer']
            message: 'Hey <link>'
          - tiers: ['Sponsor']
            labels: ['sponsor']
            message: 'Hey sponsor <link>'
        invitation: |
          Hey <author> :wave:,
          This is an optional message to your audience. Check the
          default message below.
        
          <link>`,
        },
        pr: {
          body: 'The body of your Pull request',
          title: 'The title of your Pull Request',
        },
      }

      const branch = `add-${fields.file.path}` // your branch's name
      const content = Buffer.from(fields.file.content).toString('base64') // content for your configuration file

      const reference = await context.github.git.getRef({
        owner: context.repo.owner,
        repo: context.repo.repo,
        ref: 'heads/master',
      }) // get the reference for the master branch

      console.log(
        await context.github.git.createRef(
          context.repo({
            ref: `refs/heads/${branch}`,
            sha: reference.data.object.sha,
          }),
        ),
      ) // create a reference in git for your branch

      console.log(
        await context.github.repos.createFile(
          context.repo({
            path: fields.file.path, // the path to your config file
            message: `adds ${fields.file.path}`, // a commit message
            content,
            branch,
          }),
        ),
      ) // create your config file

      console.log(
        context.github.pulls.create(
          context.repo({
            maintainer_can_modify: true, // allows maintainers to edit your app's PR
            title: fields.pr.title, // the title of the PR
            head: branch,
            base: 'master', // where you want to merge your changes
            body: fields.pr.body, // the body of your PR
          }),
        ),
      )
    }
  })

  app.on('issues.opened', async (context: probot.Context) => {
    const backerName = context.payload.issue.user.login
    const issue = context.issue()

    /**
     * Flow
     *
     * 1. Get configuration,
     * 2. Determine backer tiers,
     * 3. Calculate messages and labels,
     * 4. Apply messages and labels.
     */

    // Get configuration
    const config = await getConfig(context)
    if (!config) return

    // Get backer tiers
    const [allBackers, backerOrganisations] = await Promise.all([
      getCollectiveMembers(config.collective),
      getUserOrganisations(context.github, backerName),
    ])
    const backerTiers = getCollectiveBackerTiers(
      allBackers,
      backerName,
      backerOrganisations,
    )

    /**
     * Ignore messages to admins, contributors...
     */
    if (backerTiers === null) {
      return
    }

    // Calculate messages and labels
    const dict = {
      '<author>': `@${backerName}`,
      '<link>': `https://opencollective.com/${config.collective}`,
    }
    const messages = getMessagesFromConfigForTiers(config, backerTiers, dict)
    const labels = getLabelsFromConfigForTiers(config, backerTiers)

    // Sync
    await Promise.all([
      messageGithubIssue(context.github, issue, messages),
      labelGithubIssue(context.github, issue, labels),
    ])

    console.log(`Commented on ${issue.owner}/${issue.repo}/${issue.number}.`)
  })

  app.on('issues.labeled', async (context: probot.Context) => {
    const backerName = context.payload.issue.user.login
    const label = context.payload.label.name
    const issue = context.issue()

    /**
     * Flow
     *
     * 1. Get configuration,
     * 2. Determine backer tiers,
     * 3. Calculate labels,
     * 4. See if added label is appropriate.
     */

    // Get configuration
    const config = await getConfig(context)
    if (!config) return

    // Get backer tiers
    const [allBackers, backerOrganisations] = await Promise.all([
      getCollectiveMembers(config.collective),
      getUserOrganisations(context.github, backerName),
    ])
    const backerTiers = getCollectiveBackerTiers(
      allBackers,
      backerName,
      backerOrganisations,
    )

    /**
     * Admins, Contributors,... have full control over labels.
     */
    if (backerTiers === null) {
      return
    }

    // Calculate messages and labels
    const allLabels = getLabelsFromConfig(config)
    const applicableLabels = getLabelsFromConfigForTiers(config, backerTiers)

    // Sync
    if (allLabels.some(is(label)) && applicableLabels.every(not(is(label)))) {
      await removeLabelsFromGithubIssue(context.github, issue, [label])
      console.log(
        `Removed ${label} from ${issue.owner}/${issue.repo}/${issue.number}.`,
      )
    }
  })
}
