<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @fragata/coalesce-calls

[![Package Version](https://badgen.net/npm/v/@fragata/coalesce-calls)](https://npmjs.org/package/@fragata/coalesce-calls) ![License](https://badgen.net/npm/license/@fragata/coalesce-calls) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@fragata/coalesce-calls)](https://bundlephobia.com/result?p=@fragata/coalesce-calls) [![Node compatibility](https://badgen.net/npm/node/@fragata/coalesce-calls)](https://npmjs.org/package/@fragata/coalesce-calls)

> Wraps an async function so that concurrent calls will be coalesced

## Install

Installation of the [npm package](https://npmjs.org/package/@fragata/coalesce-calls):

```sh
npm install --save @fragata/coalesce-calls
```

## Usage

```js
import { coalesceCalls } from '@fragata/coalesce-calls'

const connect = coalesceCalls(async function () {
  // async operation
})

connect()

// the previous promise result will be returned if the operation is not
// complete yet
connect()
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
