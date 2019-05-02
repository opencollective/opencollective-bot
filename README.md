<p align="center"><img src="media/logo.png" width="400" /></p>

# Open Collective Bot

[![CircleCI](https://circleci.com/gh/opencollective/opencollective-bot/tree/master.svg?style=shield)](https://circleci.com/gh/opencollective/opencollective-bot/tree/master)
[![codecov](https://codecov.io/gh/opencollective/opencollective-bot/branch/master/graph/badge.svg)](https://codecov.io/gh/opencollective/opencollective-bot)

The Open Collective Bot will comment on issues based on whether the author is already a backer of your [Open Collective](https://opencollective.com/). It can also tag issues based on the same information.

## Overview

- 🐶 **Easy to use:** Simply install [Github App](https://github.com/apps/open-collective-bot) and you are ready to go!
- 🛠 **Customizable:** Change the configuration and our bot will listen!
- ❤ **Covered with tests:** Keeping that 100% bar!

## Configuration

Put your configuration in `.github/opencollective.yml`.

```yaml
collective: graphql-shield
tiers:
  - tiers: '*'
    labels: ['backer']
    message: 'Hey <link>'
  - tiers: ['Sponsor']
    labels: ['sponsor']
    message: 'Hey sponsor <link>'
invitation: |
  Hey <author> :wave:,
  This is an optional message to your audience. Check the
  default message below.

  <link>
```

See some examples:

- [captain-fact](https://github.com/CaptainFact/captain-fact/blob/master/.github/opencollective.yml)
- [more](https://github.com/search?q=%22opencollective.yml%22+in%3Apath&type=Code)

#### Available tags

- **\<author\>:** Author of an issue,
- **\<link\>:** Link to your Open Collective.

#### API

```ts
type Message = string
type GithubLabel = string

type Config = {
  collective: string
  tiers: TierConfig[]
  invitation: Message | false
}

type TierConfig = {
  tiers: Tier[] | '*'
  labels: GithubLabel[]
  message: Message
}
```

Note that the Open Collective Bot won't comment on issues opened by maintainers or other admins of your Collective.

PS: You can test your configuration at https://bot.opencollective.com/validate

##### Default Messages

- `backers`

```
Hey <author> :wave:,

Thanks for backing our project. We will handle your issue with priority support. To make sure we don't forget how special you are, we added a `priority` label to your issue.

Thanks again for backing us :tada:!
```

<p align="center"><img src="media/backers.png" width="600" /></p>

- `invitation`

```
Hey <author> :wave:,

Thank you for opening an issue. We will get back to you as soon as we can. Also, check out our Open Collective and consider backing us.

<link>
PS.: We offer `priority` support for all backers. Don't forget to
add `priority` label when you start backing us :smile:
```

<p align="center"><img src="media/invite.png" width="600" /></p>

## Deployment

**Summary**: This project is currently deployed with [Now](https://zeit.co/now) (v2). To deploy to staging or production, you need to be a core member of the Open Collective team.

See: [docs/deployment.md](docs/deployment.md)

## Development

> This is a guide on how to run the OpenCollective Bot locally.

Visit the [Github App Docs](https://developer.github.com/apps/quickstart-guides/setting-up-your-development-environment/) for a full documentation on Github Apps

### **Local Installation**

Clone this project using the `git clone` command and install dependencies with `yarn` using the `yarn install` command to install all required dependencies.

**WebHooks** are crucial to production **Github Apps**. This project which was built using **Probot** relies on **Smee** for Webhooks

### Setting up Smee

> Visit the [Smee](https://smee.io) website, to start a new channel

- The **Webhook Proxy URL** generated by **Smee** should be noted as it would be used as the **Webhook Url** in the **Github App Settings** when registering the app on github.

- `npm i -g smee-client` to install the **smee client**

### Registering App

> **Github App Settings** can be found at `https://github.com/settings/apps`

- For the **Homepage URL**, use the the link to the repository where the Github App is placed. E.g https://github.com/test_user/test_bot

- After a succesfull registration, generate a `private key`(file with a `.pem` extension ), rename to `private-key.pem` and store in the root project folder .

- Generate a unique secret with `openssl rand -base64 32` and use the secret as the webhook secret.
  > **Note:** Webhook Secret used here must match with `WEBHOOK_SECRET` in `.env` file within project folder.

#### Permissions

The **Open Collective Bot** comments on issues based on whether the author is already a backer of your Open Collective. It can also tag issues based on the same information. Inorder to achieve this, the following permissions need to be enabled from the **Github App Settings** ;

- Issues = Read and Write
- Organization members = Read only

After registering the app, take note of the **App ID** shown in the **Github App Settings** .

> Settings used can be changed later, incase of any changes such as the **Webhook URL**

### Environment Variables

> `dotenv-cli` is used to handle environment variables for development .

- Create a `.env` file in the working directory with the following variabes below

```js
 APP_ID = <App ID>
 WEBHOOK_SECRET = development
 PRIVATE_KEY_PATH = private-key.pem
```

> **APP_ID** takes the App_id found at the **Github App Settings**.

### Running Locally

- Run `yarn dev` to start the bot locally and this should start the bot on port `3000`

Once fully setup, you can install it within any already existing repository to test and see it work

> Github Apps can be installed on repositories by visiting the [Github App Settings](https://github.com/settings/apps) and navigating to the **Intsall App** column in the left vertical tab.

Open your **Smee URL** in any browser to view and inspect incoming payloads

## License

MIT @ Matic Zavadlal
