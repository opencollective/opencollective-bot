import bodyParser from 'body-parser'
import express from 'express'
import yaml from 'js-yaml'
import mls from 'multilines'

import { configSchema } from './config'
import { ApplicationFunction, Application } from 'probot'

/* Server */

const validator = express()

validator.get('*', (req, res) => {
  res.send(mls`
  | <pre>Usage:
  |
  | curl -X POST --data-binary @.github/opencollective.yml https://opencollective-bot.now.sh/validate
  | <pre>
  `)
})

validator.post(
  '*',
  bodyParser.urlencoded({ extended: false }),
  async (req, res) => {
    try {
      // Load file.
      const file = Object.keys(req.body)[0]
      const config = yaml.safeLoad(file)

      // Validate configuration.
      await configSchema.validateAsync(config, { abortEarly: false })
      res.status(200).send('Valid configuration!')
    } catch (err) {
      if (err.isJoi) {
        /* Compose a report */
        const message = err.details
          .map(
            (detail: { path: string[]; message: string }) =>
              `- ${detail.path.join('.')}: ${detail.message}`,
          )
          .join('\n')
        return res.status(400).send(message)
      }

      if (err.name === 'YAMLException') {
        const message =
          'YAML file is not properly formatted:\nSyntaxError: ' + err.message
        return res.status(400).send(message)
      }

      return res.status(400).send('Something went wrong.')
    }
  },
)

const validatorApp: ApplicationFunction = (app: Application) => {
  // Get an express router to expose new HTTP endpoints
  const router = app.route('/validate')

  // Add express app to router
  router.use(validator)
}

export { validator, validatorApp }
