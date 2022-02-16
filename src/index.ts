import { Reader, reader } from 'it-reader'
import { pushable } from 'it-pushable'
import defer from 'p-defer'
import map from 'it-map'
import type { Duplex, Source } from 'it-stream-types'
import type { Pushable } from 'it-pushable'

export interface Handshake {
  reader: Reader
  writer: Pushable<Uint8Array>
  stream: Duplex<Uint8Array>
  rest: () => Source<Uint8Array>
  write: (data: Uint8Array) => void
  read: () => Promise<Uint8Array | undefined>
}

// Convert a duplex stream into a reader and writer and rest stream
export function handshake (stream: Duplex<Uint8Array>): Handshake {
  const writer = pushable<Uint8Array>() // Write bytes on demand to the sink
  const source = reader(stream.source) // Read bytes on demand from the source

  // Waits for a source to be passed to the rest stream's sink
  const sourcePromise = defer<Source<Uint8Array>>()
  let sinkErr: Error

  const sinkPromise = stream.sink((async function * () {
    yield * writer
    const source = await sourcePromise.promise
    yield * source
  })())

  sinkPromise.catch(err => {
    sinkErr = err
  })

  const rest: Duplex<Uint8Array> = {
    sink: async source => {
      if (sinkErr != null) {
        return await Promise.reject(sinkErr)
      }

      sourcePromise.resolve(source)
      return await sinkPromise
    },
    source: map(source, bl => bl.slice())
  }

  return {
    reader: source,
    writer,
    stream: rest,
    rest: () => writer.end(),
    write: writer.push,
    read: async () => {
      const res = await source.next()

      if (res.value != null) {
        return res.value.slice()
      }
    }
  }
}
