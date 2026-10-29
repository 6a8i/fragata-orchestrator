<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @fragata/emit-async

[![Package Version](https://badgen.net/npm/v/@fragata/emit-async)](https://npmjs.org/package/@fragata/emit-async) ![License](https://badgen.net/npm/license/@fragata/emit-async) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@fragata/emit-async)](https://bundlephobia.com/result?p=@fragata/emit-async) [![Node compatibility](https://badgen.net/npm/node/@fragata/emit-async)](https://npmjs.org/package/@fragata/emit-async)

> Emit an event for async listeners to settle

## Install

Installation of the [npm package](https://npmjs.org/package/@fragata/emit-async):

```sh
npm install --save @fragata/emit-async
```

## Usage

```js
import EE from 'events'
import emitAsync from '@fragata/emit-async'

const ee = new EE()

// exposing emitAsync on our event emitter
//
// it's not required though and we could have used directly via
// emitAsync.call(ee, event, args...)
ee.emitAsync = emitAsync

ee.on('start', async function () {
  // whatever
})

// similar to EventEmitter#emit() but returns a promise which resolves when all
// listeners have settled
await ee.emitAsync('start')

// by default, it will rejects as soon as one listener reject, you can customise
// error handling though:
await ee.emitAsync(
  {
    onError(error, event, listener) {
      console.warn(error)
    },
  },
  'start'
)
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
