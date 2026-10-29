<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @fragata/diff

[![Package Version](https://badgen.net/npm/v/@fragata/diff)](https://npmjs.org/package/@fragata/diff) ![License](https://badgen.net/npm/license/@fragata/diff) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@fragata/diff)](https://bundlephobia.com/result?p=@fragata/diff) [![Node compatibility](https://badgen.net/npm/node/@fragata/diff)](https://npmjs.org/package/@fragata/diff)

> Computes differences between two arrays, buffers or strings

## Install

Installation of the [npm package](https://npmjs.org/package/@fragata/diff):

```sh
npm install --save @fragata/diff
```

## Usage

```js
import diff from '@fragata/diff'

diff('foo bar baz', 'Foo qux')
// → [ 0, 'F', 4, 'qux', 7, '' ]
//
// Differences of the second string from the first one:
// - at position 0, it contains `F`
// - at position 4, it contains `qux`
// - at position 7, it ends

diff('Foo qux', 'foo bar baz')
// → [ 0, 'f', 4, 'bar', 7, ' baz' ]
//
// Differences of the second string from the first one:
// - at position 0, it contains f`
// - at position 4, it contains `bar`
// - at position 7, it contains `baz`

// works with all collections that supports
// - `.length`
// - `collection[index]`
// - `.slice(start, end)`
//
// which includes:
// - arrays
// - strings
// - `Buffer`
// - `TypedArray`
diff([0, 1, 2], [3, 4])
// → [ 0, [ 3, 4 ], 2, [] ]
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
