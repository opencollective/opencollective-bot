import main from '../src'
import { Probot } from 'probot'
import { Server } from 'net'

describe('index', () => {
  let probot: Probot
  let server: Server | undefined

  beforeEach(() => {
    probot = new Probot({})
    server = probot.httpServer
  })

  afterEach(done => {
    if (!server) {
      return done()
    }
    server.close(done)
  })

  test('load applications to Probot', () => {
    expect(probot.load(main)).toBeTruthy()
  })
})
