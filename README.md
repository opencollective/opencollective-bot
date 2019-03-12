<p align="center"><img src="media/logo.png" width="400" /></p>

# Open Collective Bot

[![CircleCI](https://circleci.com/gh/maticzav/opencollective-bot/tree/master.svg?style=shield)](https://circleci.com/gh/maticzav/opencollective-bot/tree/master)
[![codecov](https://codecov.io/gh/maticzav/opencollective-bot/branch/master/graph/badge.svg)](https://codecov.io/gh/maticzav/opencollective-bot)

> Helps you promote your [Open Collective](https://opencollective.com/) in your Github repository.

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

> Note that Open Collective bot won't message issues opened by maintainers or other Open Collective admin members.

> PS.: You can test your configuration at `https://opencollective-bot.now.sh/validate`!

##### Default Messages

- `backers`

```
Hey <author> :wave:,

Thanks for backing our project. We will handle your issue
with priority support. To make sure we don't forget how special
you are, we added a `priority` label to your issue.

Thanks again for backing us :tada:!
```

<p align="center"><img src="media/backers.png" width="600" /></p>

- `invitation`

```
Hey <author> :wave:,

Thank you for opening an issue. We will get back to you as
soon as we can. Also, check out our Open Collective and consider
backing us.

<link>
PS.: We offer `priority` support for all backers. Don't forget to
add `priority` label when you start backing us :smile:
```

<p align="center"><img src="media/invite.png" width="600" /></p>

## Deployment

**Summary**: This project is currently deployed with [Now](https://zeit.co/now) (v2). To deploy to staging or production, you need to be a core member of the Open Collective team.

See: [docs/deployment.md](docs/deployment.md)

---

## License

> The logo and bot avatar are taken from Open Collective's marketing website https://opencollective.com/.

MIT @ Matic Zavadlal
