<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @fragata/toggle-scripts

[![Package Version](https://badgen.net/npm/v/@fragata/toggle-scripts)](https://npmjs.org/package/@fragata/toggle-scripts) ![License](https://badgen.net/npm/license/@fragata/toggle-scripts) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@fragata/toggle-scripts)](https://bundlephobia.com/result?p=@fragata/toggle-scripts) [![Node compatibility](https://badgen.net/npm/node/@fragata/toggle-scripts)](https://npmjs.org/package/@fragata/toggle-scripts)

> Easily enable/disable scripts in package.json

## Install

Installation of the [npm package](https://npmjs.org/package/@fragata/toggle-scripts):

```sh
npm install --save @fragata/toggle-scripts
```

## Usage

```
Usage: toggle-scripts options...

  Easily enable/disable scripts in package.json

  Options
    +<script>    Enable the script <script>, ie remove the prefix `_`
    -<script>    Disable the script <script>, ie prefix it with `_`

  Examples
    toggle-scripts +postinstall +preuninstall
    toggle-scripts -postinstall -preuninstall
```

For example, if you want `postinstall` hook only in dev:

```json
// package.json
{
  "scripts": {
    "postinstall": "<some dev only command>",
    "prepublishOnly": "toggle-scripts -postinstall",
    "postpublish": "toggle-scripts +postinstall"
  }
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
