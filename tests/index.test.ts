import * as fs from 'fs'
import * as path from 'path'

import { main } from '../src'

describe('index', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.resetModules()

    delete process.env.APP_ID
    delete process.env.WEBHOOK_SECRET
    delete process.env.PRIVATE_KEY
    delete process.env.PRIVATE_KEY_PATH
    delete process.env.DISABLE_STATS
  })

  test('reports missing credentials', () => {
    expect(() => {
      main(0)
    }).toThrow()
  })

  test('correctly build server with private key', () => {
    process.env.APP_ID = '1234'
    process.env.WEBHOOK_SECRET = 'secret'
    process.env.PRIVATE_KEY = fs.readFileSync(
      path.resolve(__dirname, './__fixtures__/cert.pem'),
      'UTF-8',
    )
    process.env.DISABLE_STATS = 'true'

    try {
      const server = main(0)

      server.close()
    } catch (err) {
      fail(err)
    }
  })

  test('correctly build server with private key path', () => {
    process.env.APP_ID = '1234'
    process.env.WEBHOOK_SECRET = 'secret'
    process.env.PRIVATE_KEY_PATH = path.resolve(
      __dirname,
      './__fixtures__/cert.pem',
    )
    process.env.DISABLE_STATS = 'true'

    try {
      const server = main(0)

      server.close()
    } catch (err) {
      fail(err)
    }
  })
})
