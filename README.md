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

# Development

> This short guide is meant to give a guide as to how github apps are made and basic steps to reproduce the OpenCollective Bot should you wish to make futher changes.

## Installation

Feel free to clone or download this project using the **git clone** and install using **Yarn install** to install required dependencies

**WebHooks** are crucial to **Github Apps**. Hence, you can use [Ngrok](https://ngrok.com) , [Smee](https://smee.io) or other comfortable options .

> **Ngrok** is however used in this guide .

### Running Ngrok

> After making all necessary local Ngrok installations found here [Ngrok](https://ngrok.com)

- Run `Ngrok http <{localhost port}>` from your downloaded `Ngrok.exe` to test your installation.

### Registering App

> Follow steps listed at [Github](https://developer.github.com/apps/building-github-apps/creating-a-github-app/) to register your bot.

> Leave the **Web Interface** blank as it would be generated after sucessfully setting up the bot locally and running the Ngrok terminal .

#### Credentials

After registering the app, take note of the **App ID** shown in the about page

> Using a `.env` file in this project is highly recommended to store your credentials

- Create a new `.env` file at the root folder and copy the code below into it.

```js
 APP_ID = <App ID>
 WebHook_Secret =
 Private_Key_PATH = < path to the private key downloaded from github>
```

- Copy the App Id found at the **about** page and insert into the App Id value in the `.env` file .

- Place the private key downloaded in the working directory and refrence it in your env file. E.g `private-key.pem`

- Run `openssl rand -base64 32` in a terminal with **Openssl** installed, copy the key generated and paste into the Webhook Secret in the `.env` file.

### Installation and Inspecting

- Run `Yarn dev` to start the bot locally and this should start the bot on port `3000`

- Run `Ngrok http 3000` to create a local tunnel exposing port 3000

- Copy the generated https port shown at the Ngrok terminal

- Use the https Url generated for Ngrok as the Webhook Url found in the about page

Once fully setup, you can install it within any already existing repository to test and see it work

Ngrok out of the box, provides the ability to inspect incoming traffic running over your tunnels. To do this, open the **localhost ** url shown in your terminal in your browser.

## License

MIT @ Matic Zavadlal
