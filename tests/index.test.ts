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
  })

  test('reports missing credentials', async () => {
    await expect(main()).rejects.toThrow()
  })

  test('correctly build server', async () => {
    process.env.APP_ID = '1234'
    process.env.WEBHOOK_SECRET = 'secret'
    process.env.PRIVATE_KEY = fs.readFileSync(
      path.resolve(__dirname, './__fixtures__/cert.pem'),
      'UTF-8',
    )

    try {
      const server = await main()

      server.close()
    } catch (err) {
      fail(err)
    }
  })
})
