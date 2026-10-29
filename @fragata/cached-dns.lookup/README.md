<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @fragata/cached-dns.lookup

[![Package Version](https://badgen.net/npm/v/@fragata/cached-dns.lookup)](https://npmjs.org/package/@fragata/cached-dns.lookup) ![License](https://badgen.net/npm/license/@fragata/cached-dns.lookup) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@fragata/cached-dns.lookup)](https://bundlephobia.com/result?p=@fragata/cached-dns.lookup) [![Node compatibility](https://badgen.net/npm/node/@fragata/cached-dns.lookup)](https://npmjs.org/package/@fragata/cached-dns.lookup)

> Cached implementation of dns.lookup

## Install

Installation of the [npm package](https://npmjs.org/package/@fragata/cached-dns.lookup):

```sh
npm install --save @fragata/cached-dns.lookup
```

## Usage

Node does not cache queries to `dns.lookup`, which can lead application doing a lot of connections to have perf issues and to saturate Node threads pool.

This library attempts to mitigate these problems by providing a version of this function with a version short cache, applied on both errors and results.

> Limitation: `verbatim: false` option is not supported.

It has exactly the same API as the native method and can be used directly:

```js
import { createCachedLookup } from '@fragata/cached-dns.lookup'

const lookup = createCachedLookup()

lookup('example.net', { all: true, family: 0 }, (error, result) => {
  if (error != null) {
    return console.warn(error)
  }
  console.log(result)
})
```

Or it can be used to replace the native implementation and speed up the whole app:

```js
// assign our cached implementation to dns.lookup
const restore = createCachedLookup().patchGlobal()

// to restore the previous implementation
restore()
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
