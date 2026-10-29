<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# fragata-import-servers-csv

[![Package Version](https://badgen.net/npm/v/fragata-import-servers-csv)](https://npmjs.org/package/fragata-import-servers-csv) ![License](https://badgen.net/npm/license/fragata-import-servers-csv) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/fragata-import-servers-csv)](https://bundlephobia.com/result?p=fragata-import-servers-csv) [![Node compatibility](https://badgen.net/npm/node/fragata-import-servers-csv)](https://npmjs.org/package/fragata-import-servers-csv)

> CLI to import servers in XO from a CSV file

## Install

Installation of the [npm package](https://npmjs.org/package/fragata-import-servers-csv):

```sh
npm install --global fragata-import-servers-csv
```

## Usage

`servers.csv`:

```csv
host,username,password
xs1.company.net,user1,password1
xs2.company.net:8080,user2,password2
http://xs3.company.net,user3,password3
```

> The CSV file can also contains these optional fields: `label`, `autoConnect`, `allowUnauthorized`.

Shell command:

```
> fragata-import-servers-csv 'https://xo.company.tld' admin@admin.net admin < servers.csv
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
