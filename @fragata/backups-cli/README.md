<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @fragata/backups-cli

[![Package Version](https://badgen.net/npm/v/@fragata/backups-cli)](https://npmjs.org/package/@fragata/backups-cli) ![License](https://badgen.net/npm/license/@fragata/backups-cli) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@fragata/backups-cli)](https://bundlephobia.com/result?p=@fragata/backups-cli) [![Node compatibility](https://badgen.net/npm/node/@fragata/backups-cli)](https://npmjs.org/package/@fragata/backups-cli)

## Install

Installation of the [npm package](https://npmjs.org/package/@fragata/backups-cli):

```sh
npm install --global @fragata/backups-cli
```

## Usage

```
> fragata-backups --help
Usage:

    fragata-backups clean-vms [--merge] [--remove] xo-vm-backups/*

    alternatively you can target the full remote, thus handling S3/Azure or encrypted remotes

    fragata-backups clean-vms [--merge] [--remove] --remote=REMOTEURL

      Detects and repair issues with VM backups.

      Options:
        -m, --merge     Merge (or continue merging) VHD files that are unused
        -r, --remove    Remove unused, incomplete, orphan, or corrupted files


    fragata-backups create-symlink-index xo-vm-backups <field path>

    fragata-backups info xo-vm-backups/*
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
