import { Server } from 'http'
import { ApplicationFunction, createProbot } from 'probot'
import probotAppsDefault from 'probot/lib/apps/default'
import probotAppsSentry from 'probot/lib/apps/sentry'
import probotAppsStats from 'probot/lib/apps/stats'
import { logRequestErrors } from 'probot/lib/middleware/log-request-errors'
import { findPrivateKey } from 'probot/lib/private-key'

import { opencollective } from './bot'
import { validator } from './validate'

/* istanbul ignore if */
if (process.env.NODE_ENV !== 'test') {
  try {
    main(3000)
    console.log(`Server UP! 🚀`)
  } catch (err) {
    console.log(err)
  }
}

export function main(port: number): Server {
  /* Credentials */

  if (
    !process.env.APP_ID ||
    !process.env.WEBHOOK_SECRET ||
    !(process.env.PRIVATE_KEY || process.env.PRIVATE_KEY_PATH)
  ) {
    throw new Error('Missing credentials.')
  }

  /* Probot setup */

  const cert = findPrivateKey() as string

  const probot = createProbot({
    cert,
    id: parseInt(process.env.APP_ID, 10),
    port,
    secret: process.env.WEBHOOK_SECRET,
  })

  /* Load apps */

  const apps: ApplicationFunction[] = [
    opencollective,
    probotAppsDefault,
    probotAppsSentry,
    probotAppsStats,
  ]
  ;(process as NodeJS.EventEmitter).on(
    'unhandledRejection',
    probot.errorHandler,
  )

  apps.forEach(appFn => probot.load(appFn))

  /* Load express apps */

  probot.server.use('/validate', validator)

  // Register error handler as the last middleware
  probot.server.use(logRequestErrors as any)

  /* Start the server */

  const server = probot.server.listen(port)

  return server
}
