<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @fragata/defined

[![Package Version](https://badgen.net/npm/v/@fragata/defined)](https://npmjs.org/package/@fragata/defined) ![License](https://badgen.net/npm/license/@fragata/defined) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@fragata/defined)](https://bundlephobia.com/result?p=@fragata/defined) [![Node compatibility](https://badgen.net/npm/node/@fragata/defined)](https://npmjs.org/package/@fragata/defined)

> Utilities to help handling (possibly) undefined values

## Install

Installation of the [npm package](https://npmjs.org/package/@fragata/defined):

```sh
npm install --save @fragata/defined
```

## Usage

### `defined()`

Returns the first non-`undefined` value from a list of arguments, evaluating functions if needed.

There is two ways to use this function:

- either with a single array argument: it should return the first non-undefined item
- or with multiple arguments: it should return the first non-undefined argument

If only `undefined` values, return `undefined`.

```js
import defined from '@fragata/defined/index.js'

defined(undefined, 'foo', 42)
// Returns 'foo'

defined([undefined, null, 10])
// Returns null

defined([undefined, undefined], [undefined, undefined, 10])
// Returns [undefined, undefined]

defined(() => 'bar', 42)
// Returns 'bar'

defined(undefined, undefined)
// Returns undefined
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
