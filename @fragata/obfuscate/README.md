<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @fragata/obfuscate

[![Package Version](https://badgen.net/npm/v/@fragata/obfuscate)](https://npmjs.org/package/@fragata/obfuscate) ![License](https://badgen.net/npm/license/@fragata/obfuscate) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@fragata/obfuscate)](https://bundlephobia.com/result?p=@fragata/obfuscate) [![Node compatibility](https://badgen.net/npm/node/@fragata/obfuscate)](https://npmjs.org/package/@fragata/obfuscate)

## Install

Installation of the [npm package](https://npmjs.org/package/@fragata/obfuscate):

```sh
npm install --save @fragata/obfuscate
```

## Usage

### `replace(value, replacement)`

> Recursively replace sensitive entries with a replacement value.

```js
import { replace } from '@fragata/obfuscate'

replace({ username: 'foo', password: 'bar' }, 'obfuscated')
// → { username: 'foo', password: 'obfuscated'}
```

### `obfuscate(value)`

> Recursively replace sensitive entries with a special tag.

```js
import { obfuscate } from '@fragata/obfuscate'

obfuscate({ username: 'foo', password: 'bar' })
// → {
//   username: 'foo',
//   password: 'obfuscated-q3oi6d9X8uenGvdLnHk2',
// }
```

### `merge(newValue, oldValue)`

> Replace entries obfuscated by `obfuscate()` in the new value by entries from the old one.
>
> This is especially useful to give an obfuscated value to a client, let them modify it, and then merge modified and unmodified values.

```js
import { obfuscate, merge } from '@fragata/obfuscate'

const original = { username: 'foo', password: 'bar', token: 'baz' }

// compute an obfuscated value to send to a client
const obfuscated = obfuscate(original)

// let the client update any entries
obfuscated.token = 'qux'

// merge the updated value with the original one
merge(obfuscated, original)
// → { username: 'foo', password: 'bar', token: 'qux' }
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
