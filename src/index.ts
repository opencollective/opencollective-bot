import { ApplicationFunction, Application, Probot } from 'probot'
import { opencollective } from './bot'
import { validatorApp } from './validate'

import defaultApp from 'probot/lib/apps/default'
import sentryApp from 'probot/lib/apps/sentry'
import statsApp from 'probot/lib/apps/default'

export const main: ApplicationFunction = (app: Application) => {
  /* Load apps */

  const apps: ApplicationFunction[] = [
    opencollective,
    validatorApp,
    defaultApp,
    sentryApp,
    statsApp,
  ]

  apps.forEach(appFn => {
    appFn(app)
  })
}

Probot.run(main)
