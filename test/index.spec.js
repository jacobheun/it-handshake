/* eslint-env mocha */
'use strict'

const { expect } = require('aegir/utils/chai')
const handshake = require('../')
const duplex = require('it-pair/duplex')
const pipe = require('it-pipe')
const { map, collect } = require('streaming-iterables')
const toBuffer = map(c => c.slice())
const uint8ArrayFromString = require('uint8arrays/from-string')

describe('handshake', () => {
  it('should be able to perform a handshake', async () => {
    const [initiator, responder] = duplex()
    const iShake = handshake(initiator)
    const rShake = handshake(responder)

    iShake.write('hello')
    let message = await rShake.read()
    expect(message.slice()).to.eql(uint8ArrayFromString('hello'))
    rShake.write('hi')
    rShake.rest()
    message = await iShake.read()
    expect(message.slice()).to.eql(uint8ArrayFromString('hi'))
    iShake.rest()

    const buffer = uint8ArrayFromString('more data')
    pipe(
      rShake.stream,
      (source) => (async function * () {
        for await (const message of source) {
          expect(message.slice()).to.eql(buffer)
          yield message
        }
      })(),
      rShake.stream
    )

    const data = await pipe([buffer], iShake.stream, toBuffer, collect)
    expect(data).to.eql([buffer])
  })

  it('should be able to perform consecutive handshakes', async () => {
    const [initiator, responder] = duplex()
    const iShake = handshake(initiator)
    const rShake = handshake(responder)

    iShake.write('hello')
    let message = await rShake.read()
    expect(message.slice()).to.eql(uint8ArrayFromString('hello'))
    rShake.write('hi')
    rShake.rest()
    message = await iShake.read()
    expect(message.slice()).to.eql(uint8ArrayFromString('hi'))
    iShake.rest()

    const iShake2 = handshake(iShake.stream)
    const rShake2 = handshake(rShake.stream)

    iShake2.write('ready?')
    message = await rShake2.read()
    expect(message.slice()).to.eql(uint8ArrayFromString('ready?'))
    rShake2.write('yes!')
    rShake2.rest()
    message = await iShake2.read()
    expect(message.slice()).to.eql(uint8ArrayFromString('yes!'))
    iShake2.rest()

    pipe(
      rShake2.stream,
      (source) => (async function * () {
        for await (const message of source) {
          yield message
        }
      })(),
      rShake2.stream
    )

    const buffer = uint8ArrayFromString('more data')
    const data = await pipe([buffer], iShake2.stream, toBuffer, collect)
    expect(data).to.eql([buffer])
  })

  it('should persist data across handshakes', async () => {
    const [initiator, responder] = duplex()
    const iShake = handshake(initiator)
    const rShake = handshake(responder)
    let message

    // Send the hello, read from the responder and then start the next
    // handshake before the responder finishes
    iShake.write('hello')
    message = await rShake.read()
    expect(message.slice()).to.eql(uint8ArrayFromString('hello'))
    rShake.write('hi')
    message = await iShake.read()
    expect(message.slice()).to.eql(uint8ArrayFromString('hi'))
    iShake.rest()

    const iShake2 = handshake(iShake.stream)
    iShake2.write('ready?')

    rShake.rest()
    const rShake2 = handshake(rShake.stream)

    message = await rShake2.read()
    expect(message.slice()).to.eql(uint8ArrayFromString('ready?'))
    rShake2.write('yes!')
    rShake2.rest()
    message = await iShake2.read()
    expect(message.slice()).to.eql(uint8ArrayFromString('yes!'))
    iShake2.rest()

    pipe(
      rShake2.stream,
      (source) => (async function * () {
        for await (const message of source) {
          yield message
        }
      })(),
      rShake2.stream
    )

    const buffer = uint8ArrayFromString('more data')
    const data = await pipe([buffer], iShake2.stream, toBuffer, collect)
    expect(data).to.eql([buffer])
  })

  it('should survive an exploding sink while doing other async work', async () => {
    const shake = handshake({
      sink: async () => { // eslint-disable-line require-await
        throw new Error('Oh noes!')
      },
      source: () => {

      }
    })

    // make sure the microtask queue is emptied
    await new Promise((resolve) => {
      setTimeout(resolve, 100)
    })

    expect(shake.stream.sink()).to.eventually.be.rejectedWith(/Oh noes!/)
  })
})
