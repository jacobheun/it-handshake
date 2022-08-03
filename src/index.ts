import { Reader, reader } from 'it-reader'
import { pushable } from 'it-pushable'
import defer from 'p-defer'
import type { Duplex, Source } from 'it-stream-types'
import type { Pushable } from 'it-pushable'
import type { Uint8ArrayList } from 'uint8arraylist'

export interface Handshake<T extends Uint8Array | Uint8ArrayList = Uint8Array> {
  reader: Reader
  writer: Pushable<T>
  stream: Duplex<T>
  rest: () => Source<T>
  write: (data: T) => void
  read: () => Promise<Uint8ArrayList | undefined>
}

// Convert a duplex stream into a reader and writer and rest stream
export function handshake<T extends Uint8Array | Uint8ArrayList = Uint8Array> (stream: Duplex<T>): Handshake<T> {
  const writer = pushable<T>() // Write bytes on demand to the sink
  const source = reader(stream.source) // Read bytes on demand from the source

  // Waits for a source to be passed to the rest stream's sink
  const sourcePromise = defer<Source<T>>()
  let sinkErr: Error

  const sinkPromise = stream.sink((async function * () {
    yield * writer
    const source = await sourcePromise.promise
    yield * source
  })())

  sinkPromise.catch(err => {
    sinkErr = err
  })

  const rest: Duplex<T> = {
    sink: async source => {
      if (sinkErr != null) {
        return await Promise.reject(sinkErr)
      }

      sourcePromise.resolve(source)
      return await sinkPromise
    },
    source: stream.source
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
        return res.value
      }
    }
  }
}
