# Deployment

## Prerequisite

### Now

Open Collective Bot is currently deployed with [Now](https://zeit.co/now) (v2). You will need to install [Now Desktop](https://github.com/zeit/now-desktop) or [Now CLI](https://github.com/zeit/now-cli).

Authenticate with:

`now login`

Switch to the Open Collective team account:

`now switch opencollective`

### Secrets

Make sure that the following secrets are set (uses [now secrets](https://zeit.co/docs/v2/deployments/environment-variables-and-secrets/)):

| name (production)       | name (staging)                  | description                                |
| ----------------------- | ------------------------------- | ------------------------------------------ |
| `oc-bot-app-id`         | `oc-bot-staging-app-id`         | GitHub app id                              |
| `oc-bot-webhook-secret` | `oc-bot-staging-webhook-secret` | GitHub webhook-secret                      |
| `oc-bot-private-key`    | `oc-bot-staging-private-key`    | One of GitHub private keys, base64 encoded |
| `oc-bot-sentry-dsn`     | `oc-bot-staging-sentry-dsn`     | Sentry DSN for error reporting             |

Eg: `now secrets add oc-bot-app-id {value}`

## Deploying to staging

`npm run deploy:staging`

## Deploying to production

`npm run deploy:production`
