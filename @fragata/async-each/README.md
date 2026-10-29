<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @fragata/async-each

[![Package Version](https://badgen.net/npm/v/@fragata/async-each)](https://npmjs.org/package/@fragata/async-each) ![License](https://badgen.net/npm/license/@fragata/async-each) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@fragata/async-each)](https://bundlephobia.com/result?p=@fragata/async-each) [![Node compatibility](https://badgen.net/npm/node/@fragata/async-each)](https://npmjs.org/package/@fragata/async-each)

> Run async fn for each item in (async) iterable

## Install

Installation of the [npm package](https://npmjs.org/package/@fragata/async-each):

```sh
npm install --save @fragata/async-each
```

## Usage

### `asyncEach(iterable, iteratee, [opts])`

Executes `iteratee` in order for each value yielded by `iterable`.

Returns a promise wich rejects as soon as a call to `iteratee` throws or a promise returned by it rejects, and which resolves when all promises returned by `iteratee` have resolved.

`iterable` must be an iterable or async iterable.

`iteratee` is called with the same `this` value as `asyncEach`, and with the following arguments:

- `value`: the value yielded by `iterable`
- `index`: the 0-based index for this value
- `iterable`: the iterable itself

`opts` is an object that can contains the following options:

- `concurrency`: a number which indicates the maximum number of parallel call to `iteratee`, defaults to `10`. The value `0` means no concurrency limit.
- `signal`: an abort signal to stop the iteration
- `stopOnError`: whether to stop iteration of first error, or wait for all calls to finish and throw an `AggregateError`, defaults to `true`

```js
import { asyncEach } from '@fragata/async-each'

const contents = []
await asyncEach(
  ['foo.txt', 'bar.txt', 'baz.txt'],
  async function (filename, i) {
    contents[i] = await readFile(filename)
  },
  {
    // reads two files at a time
    concurrency: 2,
  }
)
```

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/6a8i/fragata-fleet/issues)
  you've encountered;
- fork and create a pull request.

## License

[ISC](https://spdx.org/licenses/ISC) © [Vates SAS](https://vates.fr)
