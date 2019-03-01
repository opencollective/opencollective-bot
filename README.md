<p align="center"><img src="media/logo.png" width="400" /></p>

# OpenCollective Bot

[![CircleCI](https://circleci.com/gh/maticzav/opencollective-bot/tree/master.svg?style=shield)](https://circleci.com/gh/maticzav/opencollective-bot/tree/master)
[![codecov](https://codecov.io/gh/maticzav/opencollective-bot/branch/master/graph/badge.svg)](https://codecov.io/gh/maticzav/opencollective-bot)

> Helps you promote your [Open Collective](https://opencollective.com/) in your Github repository.

## Overview

- 🐶 **Easy to use:** Simply install [Github App](https://github.com/apps/opencollective-bot) and you are ready to go!
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
- **\<link\>:** Link to your OpenCollective.

> Note that OpenCollective bot won't message issues opened by maintainers or other OpenCollective admin members.

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
soon as we can. Also, check out our OpenCollective and consider
backing us.

<link>
PS.: We offer `priority` support for all backers. Don't forget to
add `priority` label when you start backing us :smile:
```

<p align="center"><img src="media/invite.png" width="600" /></p>

---

## License

> The logo and bot avatar are taken from OpenCollective's marketing website https://opencollective.com/.

MIT @ Matic Zavadlal
