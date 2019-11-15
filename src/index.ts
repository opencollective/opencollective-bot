import { ApplicationFunction, Application } from 'probot'
import { opencollective } from './bot'
import { validatorApp } from './validate'

const main: ApplicationFunction = (app: Application) => {
  /* Load apps */

  const apps: ApplicationFunction[] = [opencollective, validatorApp]

  apps.forEach(appFn => {
    appFn(app)
  })
}

export = main
