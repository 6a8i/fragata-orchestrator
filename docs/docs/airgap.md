---
unlisted: true
---

# Air-gapped deployment

An air-gapped Fragata is a Fragata installed on a machine with no Internet access, managing pools on the same isolated network. Because Fragata is installed [from the sources](getting-started/install-from-sources.md), the whole job is to bring everything it downloads while building to the isolated machine.

## Prepare on a connected machine

Use a machine with the **same operating system, CPU architecture and Node.js version** as the target, and follow [Get the code and build](getting-started/install-from-sources.md#fetching-the-code). When `yarn build` is done, archive the whole checkout, `node_modules` included:

<Terminal shell title="connected machine — archive the built checkout">{`
tar -czf fragata-orchestrator.tar.gz fragata-orchestrator
`}</Terminal>

Also download, from your operating system's repositories, the [system packages](getting-started/install-from-sources.md#packages-and-prerequisites) (Redis, `libvhdi-utils`, `nfs-common`...) and a Node.js LTS build, for example with `apt-get download` or an internal mirror.

## Install on the isolated machine

1. Copy the archive and the packages to the target machine, install the packages and Node.js.
2. Extract the archive where you want Fragata to live, and [configure it](getting-started/configuration.md).
3. [Start it](getting-started/install-from-sources.md#running-xo), preferably as a [service](getting-started/install-from-sources.md#always-running).

## Updating

Repeat the preparation step on the connected machine with an up to date checkout (`git pull`, `yarn`, `yarn build`), then replace the checkout on the isolated machine with the new archive and restart `fragata-server`.
