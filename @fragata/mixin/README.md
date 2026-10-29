<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @fragata/mixin

[![Package Version](https://badgen.net/npm/v/@fragata/mixin)](https://npmjs.org/package/@fragata/mixin) ![License](https://badgen.net/npm/license/@fragata/mixin) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@fragata/mixin)](https://bundlephobia.com/result?p=@fragata/mixin) [![Node compatibility](https://badgen.net/npm/node/@fragata/mixin)](https://npmjs.org/package/@fragata/mixin)

## Install

Installation of the [npm package](https://npmjs.org/package/@fragata/mixin):

```sh
npm install --save @fragata/mixin
```

## Usage

- mixins can depend on each other, they will be instantiated on-demand

```js
import mixin from '@fragata/mixin'

class MyMixin {
  constructor(app, ...mixinParams) {}

  foo() {}
}

class App {
  constructor() {
    mixin(this, { MyMixin }, [...mixinParams])
  }
}

app = new App()
app.myMixin.foo()
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
