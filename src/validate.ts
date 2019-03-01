import bodyParser from 'body-parser'
import express from 'express'
import * as joi from 'joi'
import yaml from 'js-yaml'
import mls from 'multilines'

import { configSchema } from './config'

/* Server */

const validator = express()

validator.get('*', (req, res) => {
  res.send(mls`
  | <pre>Usage:
  |
  | curl -X POST --data-binary @opencollective.yml https://opencollective-bot.now.sh/validate
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
      joi
        .validate(config, configSchema, {
          abortEarly: false,
        })
        .then(() => {
          res.status(200).send('Valid configuration!')
        })
        .catch(err => {
          /* Compose a report */
          const message = err.details
            .map(
              (detail: { path: string[]; message: string }) =>
                `- ${detail.path.join('.')}: ${detail.message}`,
            )
            .join('\n')

          res.status(400).send(message)
        })
    } catch (err) {
      res.status(400).send('Something went wrong.')
    }
  },
)

export { validator }
