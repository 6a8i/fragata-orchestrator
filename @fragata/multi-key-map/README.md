<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @fragata/multi-key-map

[![Package Version](https://badgen.net/npm/v/@fragata/multi-key-map)](https://npmjs.org/package/@fragata/multi-key-map) ![License](https://badgen.net/npm/license/@fragata/multi-key-map) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@fragata/multi-key-map)](https://bundlephobia.com/result?p=@fragata/multi-key-map) [![Node compatibility](https://badgen.net/npm/node/@fragata/multi-key-map)](https://npmjs.org/package/@fragata/multi-key-map)

> Create map with values affected to multiple keys

## Install

Installation of the [npm package](https://npmjs.org/package/@fragata/multi-key-map):

```sh
npm install --save @fragata/multi-key-map
```

## Usage

```js
import { MultiKeyMap } from '@fragata/multi-key-map'

const map = new MultiKeyMap()

const OBJ = {}
map.set([], 0)
map.set(['foo'], 1)
map.set(['foo', 'bar'], 2)
map.set(['bar', 'foo'], 3)
map.set([OBJ], 4)
map.set([{}], 5)

map.get([]) // 0
map.get(['foo']) // 1
map.get(['foo', 'bar']) // 2
map.get(['bar', 'foo']) // 3
map.get([OBJ]) // 4
map.get([{}]) // undefined

map.delete([])

for (const [key, value] of map.entries() {
  console.log(key, value)
}

for (const  value of map.values()) {
  console.log(value)
}
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
