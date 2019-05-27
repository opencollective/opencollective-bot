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
  createGithubPR,
  createGithubFile,
  createGithubRef,
} from './github'
import { is, not } from './utils'

var fs = require('fs')

let configFileName = 'opencollective.yml'

let configContent = fs
  .readFileSync(process.cwd() + '/' + configFileName)
  .toString()

export const opencollective = (app: probot.Application): void => {
  app.log('OpenCollective Bot up!')

  app.on('installation_repositories', async (context: probot.Context) => {
    /**
     * Flow
     *
     * 1. Get 'repository_added' action,
     * 2. Get all newly added repositories,
     * In each repo
     * 3. Get reference to repo's master branch,
     * 4. Create reference a new branch,
     * 5. Add content from config file,
     * 6. Create a PR
     *
     */

    //get 'added' action as condition before adding the config file
    if (context.payload.action === 'added') {
      let fields = {
        file: {
          path: '.github/opencollective.yml',
          content: configContent,
        },
        pr: {
          body: 'Edit the yml file to configure the bot. \n' + configContent,
          title: 'Open Collective Bot Configuration',
        },
      }

      //call function to open PR with default config details
      await openPR(context, fields, context.payload)
    }
  })

  async function openPR(context: probot.Context, fields: any, payload: any) {
    const owner = payload.installation.account.login
    const repos = payload.repositories_added

    //loop through all newly added repositories for bot
    for (var repo of repos) {
      var newContext = Object.create(context)

      newContext.repo = { owner: owner, repo: repo }

      const branch = `add-opencollective-config` // new branch's name
      const content = Buffer.from(fields.file.content).toString('base64') // content for the configuration file

      const reference = await context.github.git.getRef({
        owner: owner,
        repo: repo.name,
        ref: 'heads/master',
      }) // get the reference for the master branch

      await Promise.all([
        createGithubRef(context.github, [
          {
            owner: owner,
            repo: repo.name,
            ref: `refs/heads/${branch}`,
            sha: reference.data.object.sha,
          },
        ]),
      ]) // create a reference in git for the branch

      await Promise.all([
        createGithubFile(context.github, [
          {
            owner: owner,
            repo: repo.name,
            path: fields.file.path, // the path to your config file
            message: `adds ${fields.file.path}`, // a commit message
            content: content,
            branch: branch,
          },
        ]),
      ]) // create your config file

      return await Promise.all([
        createGithubPR(context.github, [
          {
            owner: owner,
            repo: repo.name,
            title: fields.pr.title, // the title of the PR
            head: branch,
            base: 'master', // where you want to merge your changes
            body: fields.pr.body, // the body of your PR,
            maintainer_can_modify: true, // allows maintainers to edit your app's PR
          },
        ]),
      ])
    }
  }

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
