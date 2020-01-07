import main from '../src'
import { Probot } from 'probot'
import { Server } from 'net'

describe('index', () => {
  let probot: Probot
  let server: Server | undefined

  beforeEach(() => {
    probot = new Probot({})
    server = probot.httpServer
    process.env.DISABLE_WEBHOOK_EVENT_CHECK = 'TRUE'
  })

  afterEach(done => {
    if (!server) {
      return done()
    }
    server.close(done)
    delete process.env.DISABLE_WEBHOOK_EVENT_CHECK
  })

  test('load applications to Probot', () => {
    expect(probot.load(main)).toBeTruthy()
  })
})
