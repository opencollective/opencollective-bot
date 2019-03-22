import * as fs from 'fs'
import { safeDump } from 'js-yaml'
import { AddressInfo, Server } from 'net'
import * as path from 'path'
import request from 'request-promise-native'

import { main } from '../src'

describe('validate', () => {
  let uri: string
  let server: Server

  beforeAll(() => {
    process.env.APP_ID = '1234'
    process.env.WEBHOOK_SECRET = 'secret'
    process.env.PRIVATE_KEY = fs.readFileSync(
      path.resolve(__dirname, './__fixtures__/cert.pem'),
      'UTF-8',
    )
    process.env.DISABLE_STATS = 'true'

    server = main(0)
    const { port } = server.address() as AddressInfo

    uri = `http://localhost:${port}/validate`
  })

  afterAll(() => {
    server.close()
  })

  test('shows correct usage description', async () => {
    const res = await request({
      uri,
      method: 'GET',
      json: true,
    }).promise()

    expect(res).toMatchSnapshot()
  })

  test('correctly reports invalid configuration', async () => {
    const config = safeDump({
      opencollective: 'https://opencollective.com/graphql-shield',
    })

    await request({
      uri,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: config,
    })
      .promise()
      .then(() => {
        fail()
      })
      .catch(err => {
        expect(err).toMatchSnapshot()
      })
  })

  test('correctly handles invalid input', async () => {
    const config = `f123
      opencollective: 'https://opencollective.com/graphql-shield',
    `

    await request({
      uri,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: config,
    })
      .promise()
      .then(() => {
        fail()
      })
      .catch(err => {
        expect(err).toMatchSnapshot()
      })
  })

  test('correctly validates valid configuration', async () => {
    const config = safeDump({
      collective: 'graphql-shield',
    })

    const res = await request({
      uri,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: config,
    })

    expect(res).toMatchSnapshot()
  })
})
