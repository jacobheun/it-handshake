# it-handshake

[![Build Status](https://github.com/jacobheun/it-handshake/actions/workflows/js-test-and-release.yml/badge.svg?branch=master)](https://github.com/jacobheun/it-handshake/actions/workflows/js-test-and-release.yml)
[![dependencies Status](https://david-dm.org/jacobheun/it-handshake/status.svg)](https://david-dm.org/jacobheun/it-handshake)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

> Create handshakes for binary protocols with iterable streams.

## Install

```sh
npm install it-handshake
```

## Usage

See [./example/index.js](./example/index.js)

## API

### `handshake(duplex)`

- `duplex: DuplexIterable` A [duplex iterable stream](https://gist.github.com/alanshaw/591dc7dd54e4f99338a347ef568d6ee9#duplex-it)

Returns a new handshake instance that produces [`BufferList`](https://www.npmjs.com/package/bl) objects.

### `shake.write(message)`

- `message: String|Buffer|BufferList`

### `shake.read()`

Returns the next [`BufferList`](https://www.npmjs.com/package/bl) message in the stream.

### `shake.rest()`

Ends the writer. This is necessary for continuing to pipe data through `shake.stream`

### `shake.stream`

The [duplex iterable stream](https://gist.github.com/alanshaw/591dc7dd54e4f99338a347ef568d6ee9#duplex-it) to be used once the handshake is complete.

### `shake.reader`

The underyling [it-reader](https://github.com/alanshaw/it-reader) used by `shake.read()`. While direct usage of the reader is typically unnecessary, it is available for advanced usage.

### `shake.writer`

The underyling writer, [it-pushable](https://github.com/alanshaw/it-pushable), used by `shake.write()`. While direct usage of the writer is typically unnecessary, it is available for advanced usage.

## Related

- [it-reader](https://github.com/alanshaw/it-reader)
- [it-pushable](https://github.com/alanshaw/it-pushable)
- [it-pair](https://github.com/alanshaw/it-pair)
- [it-pipe](https://github.com/alanshaw/it-pipe)

## License
[MIT](LICENSE) © Jacob Heun
