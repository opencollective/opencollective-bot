import { createProbot, ApplicationFunction } from 'probot'
import { findPrivateKey } from 'probot/lib/private-key'
import logRequestErrors from 'probot/lib/middleware/log-request-errors'

import { opencollective } from './bot'

/* Credentials */

if (
  !process.env.APP_ID ||
  !process.env.WEBHOOK_SECRET ||
  !process.env.PRIVATE_KEY
) {
  throw new Error('Missing credentials.')
}

/* Probot setup */

const cert = findPrivateKey() as string

const probot = createProbot({
  id: parseInt(process.env.APP_ID, 10),
  secret: process.env.WEBHOOK_SECRET,
  cert: cert,
  port: 3000,
})

/* Load apps */

const apps: ApplicationFunction[] = [
  opencollective,
  require('probot/lib/apps/default'),
  require('probot/lib/apps/sentry'),
  require('probot/lib/apps/stats'),
]

process.on('unhandledRejection', probot.errorHandler)

apps.forEach(appFn => probot.load(appFn))

// Register error handler as the last middleware
probot.server.use(logRequestErrors)

/* Start the server */

probot.start()
