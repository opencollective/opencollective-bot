# Environment Variables

| Name             | Default | Required | Description                             |
| ---------------- | ------- | -------- | --------------------------------------- |
| NODE_ENV         | -       | No       | Node environment                        |
| APP_ID           | -       | Yes      | GitHub App Id                           |
| WEBHOOK_SECRET   | -       | Yes      | GitHub App Webhook secret               |
| PRIVATE_KEY      | -       | Yes      | GitHub App private key (base64 encoded) |
| PRIVATE_KEY_PATH | -       | Yes      | Path to GitHub App private key          |

**Note**: you only need to define PRIVATE_KEY **or** PRIVATE_KEY_PATH.
