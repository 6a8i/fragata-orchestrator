<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @fragata/proxy-cli

[![Package Version](https://badgen.net/npm/v/@fragata/proxy-cli)](https://npmjs.org/package/@fragata/proxy-cli) ![License](https://badgen.net/npm/license/@fragata/proxy-cli) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@fragata/proxy-cli)](https://bundlephobia.com/result?p=@fragata/proxy-cli) [![Node compatibility](https://badgen.net/npm/node/@fragata/proxy-cli)](https://npmjs.org/package/@fragata/proxy-cli)

> CLI for @fragata/proxy

## Install

Installation of the [npm package](https://npmjs.org/package/@fragata/proxy-cli):

```sh
npm install --global @fragata/proxy-cli
```

## Usage

```
$ fragata-proxy-cli --help

Usage:

  fragata-proxy-cli <method> [<param>=<value>]...
    Call a method of the API and display its result.

  fragata-proxy-cli [--file | -f] <file>
    Read a CSON or JSON file containing an object with `method` and `params`
    properties and call the API method.

    The file can also contain an array containing multiple calls, which will be
    run in sequence.
```

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/6a8i/fragata-orchestrator/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
