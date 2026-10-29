<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# fragata-vmdk-to-vhd

[![Package Version](https://badgen.net/npm/v/fragata-vmdk-to-vhd)](https://npmjs.org/package/fragata-vmdk-to-vhd) ![License](https://badgen.net/npm/license/fragata-vmdk-to-vhd) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/fragata-vmdk-to-vhd)](https://bundlephobia.com/result?p=fragata-vmdk-to-vhd) [![Node compatibility](https://badgen.net/npm/node/fragata-vmdk-to-vhd)](https://npmjs.org/package/fragata-vmdk-to-vhd)

> JS lib reading and writing .vmdk and .ova files

## Install

Installation of the [npm package](https://npmjs.org/package/fragata-vmdk-to-vhd):

```sh
npm install --save fragata-vmdk-to-vhd
```

## Usage

To convert a VMDK stream to a Fixed VHD stream without buffering the entire input or output:

```js
import { vmdkToVhd } from 'fragata-vmdk-to-vhd'
import { createReadStream, createWriteStream } from 'fs'
;(async () => {
  const stream = await vmdkToVhd(fs.createReadStream(vmdkFileName))

  stream.pipe(fs.createWriteStream(vhdFileName))
})()
```

or:

```js
var vmdkToVhd = require('fragata-vmdk-to-vhd').vmdkToVhd
var createReadStream = require('fs').createReadStream
var createWriteStream = require('fs').createWriteStream

vmdkToVhd(fs.createReadStream(vmdkFileName)).then(function (stream) {
  stream.pipe(fs.createWriteStream(vhdFileName))
})
```

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/6a8i/fragata-fleet/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
