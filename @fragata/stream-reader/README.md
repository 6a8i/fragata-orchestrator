<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @fragata/stream-reader

[![Package Version](https://badgen.net/npm/v/@fragata/stream-reader)](https://npmjs.org/package/@fragata/stream-reader) ![License](https://badgen.net/npm/license/@fragata/stream-reader) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@fragata/stream-reader)](https://bundlephobia.com/result?p=@fragata/stream-reader) [![Node compatibility](https://badgen.net/npm/node/@fragata/stream-reader)](https://npmjs.org/package/@fragata/stream-reader)

> Efficiently reads and skips chunks of a given size in a stream

## Install

Installation of the [npm package](https://npmjs.org/package/@fragata/stream-reader):

```sh
npm install --save @fragata/stream-reader
```

## Usage

```js
import StreamReader from '@fragata/stream-reader'

const reader = new StreamReader(stream)
```

### `.read([size])`

- returns the next available chunk of data
- like `stream.read()`, a number of bytes can be specified
- returns with less data than expected if stream has ended
- returns `null` if the stream has ended and no data has been read

```js
const chunk = await reader.read(512)
```

### `.readStrict([size])`

Similar behavior to `readChunk` but throws if the stream ended before the requested data could be read.

```js
const chunk = await reader.readStrict(512)
```

### `.skip(size)`

Skips a given number of bytes from a stream.

Returns the number of bytes actually skipped, which may be less than the requested size if the stream has ended.

```js
const bytesSkipped = await reader.skip(2 * 1024 * 1024 * 1024)
```

### `.skipStrict(size)`

Skips a given number of bytes from a stream and throws if the stream ended before enough stream has been skipped.

```js
await reader.skipStrict(2 * 1024 * 1024 * 1024)
```

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/6a8i/fragata-orchestrator/issues)
  you've encountered;
- fork and create a pull request.

## License

[ISC](https://spdx.org/licenses/ISC) © [Vates SAS](https://vates.fr)
