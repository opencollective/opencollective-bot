# Development

## Prerequisite

1. Make sure you have Node.js version >= 8. We recommend using version 8, the one used in CI and production.

- To manage Node versions you can use [nvm](https://github.com/creationix/nvm): `nvm install && nvm use`.

2. Make sure you have Yarn available:

- `npm install --global yarn`

3. Make sure you have the [smee.io](https://smee.io/) client available:

- `npm install --global smee-client`

## Install

We recommend cloning the repository in a folder dedicated to `opencollective` projects.

```
git clone git@github.com:opencollective/opencollective-bot.git opencollective/bot
cd opencollective/bot
```

Dependencies are managed with [Yarn](https://yarnpkg.com/). Run:

```
yarn install
```

## Webhook Proxy (smee.io)

1. Go on [smee.io](https://smee.io/)
2. Start a new channel
3. Note the _Webhook Proxy URL_, we will later use it as `WEBHOOK_PROXY_URL`

## GitHub App

1. Create a GitHub App

- GitHub App name: `Open Collective Bot (dev)`
- Homepage URL: `http://github.com/opencollective/opencollective-bot`
- Webhook URL: Use your `WEBHOOK_PROXY_URL` from the previous step.
- Webhook Secret: `development`
- Permissions:
  - Repository contents: Read only
  - Issues: Read & Write
  - Pull requests: Read & Write
- Events
  - Issues
  - Pull request

2. Generate a private key and store it as `private-key.pem` in the project directory.

3. Note the GitHub App Id, we will later use it as `APP_ID`

## Configure environment variables

Create in the project directory an `.env` file with the following content:

```
APP_ID=<APP_ID>
WEBHOOK_SECRET=development
PRIVATE_KEY_PATH=private-key.pem
```

## Start

### Start the app

In a terminal, run:

```
yarn dev
```

### Start the Webhook proxy

In a separated terminal, using the `WEBHOOK_PROXY_URL` created before, run:

```
smee -u <WEBHOOK_PROXY_URL>
```

example: `smee -u https://smee.io/O1MG7MFNgng8gPJx`
