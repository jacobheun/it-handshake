/* eslint no-console: ["error", { allow: ["log"] }] */

import { pipe } from 'it-pipe'
import { duplexPair } from 'it-pair/duplex'
import { handshake } from 'it-handshake'

// Create connected duplex streams
const [client, server] = duplexPair()
const clientShake = handshake(client)
const serverShake = handshake(server)

clientShake.write('hello')
console.log('client: %s', await serverShake.read())
// > client: hello
serverShake.write('hi')
serverShake.rest() // the server has finished the handshake
console.log('server: %s', await clientShake.read())
// > server: hi
clientShake.rest() // the client has finished the handshake

// Make the server echo responses
pipe(
  serverShake.stream,
  async function * (source) {
    for await (const message of source) {
      yield message
    }
  },
  serverShake.stream
)

// Send and receive an echo through the handshake stream
pipe(
  ['echo'],
  clientShake.stream,
  async function * (source) {
    for await (const bufferList of source) {
      console.log('Echo response: %s', bufferList.slice())
      // > Echo response: echo
    }
  }
)
