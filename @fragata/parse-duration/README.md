<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @fragata/parse-duration

[![Package Version](https://badgen.net/npm/v/@fragata/parse-duration)](https://npmjs.org/package/@fragata/parse-duration) ![License](https://badgen.net/npm/license/@fragata/parse-duration) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@fragata/parse-duration)](https://bundlephobia.com/result?p=@fragata/parse-duration) [![Node compatibility](https://badgen.net/npm/node/@fragata/parse-duration)](https://npmjs.org/package/@fragata/parse-duration)

> Small wrapper around ms to parse a duration

## Install

Installation of the [npm package](https://npmjs.org/package/@fragata/parse-duration):

```sh
npm install --save @fragata/parse-duration
```

## Usage

`ms` without magic: always parse a duration and throws if invalid.

```js
import { parseDuration } from '@fragata/parse-duration'

parseDuration('2 days')
// 172800000

parseDuration(172800000)
// 172800000

parseDuration(undefined)
// throws TypeError('not a valid duration: undefined')
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
