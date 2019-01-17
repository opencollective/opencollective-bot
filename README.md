<p align="center"><img src="media/logo.png" width="800" /></p>

# OpenCollective Bot

[![CircleCI](https://circleci.com/gh/maticzav/opencollective-bot/tree/master.svg?style=shield)](https://circleci.com/gh/maticzav/opencollective-bot/tree/master)
[![codecov](https://codecov.io/gh/maticzav/opencollective-bot/branch/master/graph/badge.svg)](https://codecov.io/gh/maticzav/opencollective-bot)

> Helps you promote your Open Collective in your Github repository.

## Overview

- 🐶 **Easy to use:** Simply install Github App and you are ready to go!
- 🛠 **Customizable:** Change the configuration and our bot will listen!
- ❤ **Build for Open Source community:** Simply install Github App and you are ready to go!

## Configuration

Put your configuration in `.github/opencollective.yml`.

```yaml
opencollective: https://opencollective.com/graphql-shield
message: |
  Hey :wave:,
  This is an optional message to your audience. Check the
  default message below.
labels:
  - Question
  - Answer
  - Optional labels, all issues by default.
```

##### Default Message

```
Hey :wave:,

We saw you use our package. To keep our code as accessible as possible, we decided to open source it and are now helping others with their questions.

In a pursuit to continue our work, help us by donating to our collective! :heart:
```

## License

MIT @ Matic Zavadlal
