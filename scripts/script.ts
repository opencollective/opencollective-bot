import fs from 'fs'
// import path from 'path'

import jwt from 'jsonwebtoken'
// import mls from 'multilines'
import Octokit from '@octokit/rest'
import { get } from 'lodash'

import { getCollectiveWithGithubHandle } from '../src/collective'

// const APP_ID = 29949
// const PRIVATE_KEY_PATH = './private-key.pem'

const APP_ID = 23739
const PRIVATE_KEY_PATH = './open-collective-bot.2019-07-11.private-key.pem'

// const FUNDING_BRANCH_NAME = `opencollective-bot/funding`

// const FUNDING_FILE_PATH = '.github/FUNDING.yml'

// const FUNDING_PR_TITLE = 'Add FUNDING.yml'

// const FUNDING_PR_BODY = mls`
//   | Looks like you don't have a FUNDING.yml in your repository.
//   |
//   | This file is required by GitHub to display the "Sponsor" button on your repository page.
//   |
//   | You can review and merge this PR to add the FUNDING.yml to your repository.
//   |
//   | You will also need to activate "Sponsorships" for your repository, see GitHub documentation: https://help.github.com/en/articles/displaying-a-sponsor-button-in-your-repository`

// const FUNDING_DEFAULT_FILE_CONTENT = fs.readFileSync(
//   path.resolve(__dirname, '../src/assets/default-funding.yml'),
//   'utf8',
// )

const privateKey = fs.readFileSync(PRIVATE_KEY_PATH)

const getOctokit = () => {
  const now = Math.floor(Date.now() / 1000)
  const payload = { iat: now, exp: now + 600, iss: APP_ID }
  const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' })

  return new Octokit({ auth: token })
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

getOctokit()
  .apps.listInstallations({ per_page: 100 })
  .then(async res => {
    for (const installation of res.data) {
      console.log(
        get(installation, 'account.html_url'),
        get(installation, 'account.type'),
        get(installation, 'created_at'),
      )

      const installationToken = await getOctokit()
        .apps.createInstallationToken({
          installation_id: installation.id,
        })
        .then(res => res.data.token)

      const installationOctokit = new Octokit({
        auth: installationToken,
      })

      const repos = await installationOctokit.apps.listRepos({ per_page: 100 })
      for (const repository of get(repos, 'data.repositories')) {
        console.log(' *', repository.html_url)

        // console.log(repository)

        // Fetch the collective from Open Collective
        const collective = await getCollectiveWithGithubHandle(
          repository.full_name,
        )

        await sleep(1000)

        console.log(collective)
      }

      // break
    }
  })
