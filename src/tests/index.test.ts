import { main } from '../'

describe('index', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.resetModules()

    delete process.env.APP_ID
    delete process.env.WEBHOOK_SECRET
    delete process.env.PRIVATE_KEY
  })

  test('reporst missing credentials', async () => {
    await expect(main()).rejects.toThrow()
  })

  test('correctly build server', async () => {
    process.env.APP_ID = '1234'
    process.env.WEBHOOK_SECRET = 'secret'
    process.env.PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----\ncontent\n-----END RSA PRIVATE KEY-----`

    const server = await main()

    server.close()
  })
})
