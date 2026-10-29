<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @fragata/async-map

[![Package Version](https://badgen.net/npm/v/@fragata/async-map)](https://npmjs.org/package/@fragata/async-map) ![License](https://badgen.net/npm/license/@fragata/async-map) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@fragata/async-map)](https://bundlephobia.com/result?p=@fragata/async-map) [![Node compatibility](https://badgen.net/npm/node/@fragata/async-map)](https://npmjs.org/package/@fragata/async-map)

> Promise.all + map for all iterables

## Install

Installation of the [npm package](https://npmjs.org/package/@fragata/async-map):

```sh
npm install --save @fragata/async-map
```

## Usage

### `asyncMap(iterable, iteratee, thisArg = iterable)`

Similar to `Promise.all + Array#map` for all iterables: calls `iteratee` for each item in `iterable`, and returns a promise of an array containing the awaited result of each calls to `iteratee`.

It rejects as soon as te first call to `iteratee` rejects.

```js
import { asyncMap } from '@fragata/async-map'

const array = await asyncMap(iterable, iteratee, thisArg)
```

It can be used with any iterables (`Array`, `Map`, etc.):

```js
const map = new Map()
map.set('foo', 42)
map.set('bar', 3.14)

const array = await asyncMap(map, async function ([key, value]) {
  // TODO: do async computation
  //
  // the map can be accessed via `this`
})
```

#### Use with plain objects

Plain objects are not iterable, but you can use `Object.keys`, `Object.values` or `Object.entries` to help:

```js
const object = {
  foo: 42,
  bar: 3.14,
}

const array = await asyncMap(
  Object.entries(object),
  async function ([key, value]) {
    // TODO: do async computation
    //
    // the object can be accessed via `this` because it's been passed as third arg
  },
  object
)
```

### `asyncMapSettled(iterable, iteratee, thisArg = iterable)`

Similar to `asyncMap` but waits for all promises to settle before rejecting.

```js
import { asyncMapSettled } from '@fragata/async-map'

const array = await asyncMapSettled(iterable, iteratee, thisArg)
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
