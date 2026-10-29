<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @fragata/template

[![Package Version](https://badgen.net/npm/v/@fragata/template)](https://npmjs.org/package/@fragata/template) ![License](https://badgen.net/npm/license/@fragata/template) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@fragata/template)](https://bundlephobia.com/result?p=@fragata/template) [![Node compatibility](https://badgen.net/npm/node/@fragata/template)](https://npmjs.org/package/@fragata/template)

## Install

Installation of the [npm package](https://npmjs.org/package/@fragata/template):

```sh
npm install --save @fragata/template
```

## Usage

Create a string replacer based on a pattern and a list of rules.

```js
const myReplacer = compileTemplate('{name}_COPY_{name}_{id}_%%', {
  '{name}': vm => vm.name_label,
  '{id}': vm => vm.id,
  '%': (_, i) => i,
})

const newString = myReplacer(
  {
    name_label: 'foo',
    id: 42,
  },
  32
)

newString === 'foo_COPY_{name}_42_32%' // true
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
