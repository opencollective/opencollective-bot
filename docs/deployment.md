# Deployment

## Now

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

### Deploying to staging

`npm run deploy:staging`

### Deploying to production

`npm run deploy:production`

## Heroku

Open Collective Bot can also run in other environments like [Heroku](https://heroku.com). In case you want to deploy there you must do the following steps:

### Download and install the Heroku Cli

You can follow the [official documentation](<(https://devcenter.heroku.com/articles/heroku-cli#download-and-install)>) to install the command line tool.

### Creating a Heroku remote running

`heroku create`

### Secrets

You must configure the environment variables using this command:

`heroku config:set NAME=VALUE`

The variables to be published are:

| name             | description                                  |
| ---------------- | -------------------------------------------- |
| `APP_ID`         | GitHub app id                                |
| `WEBHOOK_SECRET` | GitHub webhook-secret                        |
| `PRIVATE_KEY`    | One of GitHub private keys encoded in base64 |
| `SENTRY_DSN`     | Sentry DSN for error reporting               |

The contents of the private key for your GitHub App. If you're unable to use multiline environment variables, use base64 encoding to convert the key to a single line string.

`heroku config:set PRIVATE_KEY="$(cat private-key.pem | base64)"`

### Deploying

To deploy your app to Heroku, you typically use the `git push` command to push the code from your local repository’s master branch to your heroku remote, like so:

`git push heroku master`
