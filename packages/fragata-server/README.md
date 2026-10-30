# Fragata Server

![](http://i.imgur.com/HVFMrTk.png)

fragata-server is part of [Fragata](https://github.com/6a8i/fragata-orchestrator/), a web interface for XenServer or XAPI enabled hosts.

It contains all the logic of Fragata and handles:

- connections to all XAPI servers/pools;
- a cache system to provide the best response time possible;
- users authentication and authorizations (work in progress);
- a JSON-RPC based interface for Fragata clients (i.e. [Fragata Classic](https://github.com/6a8i/fragata-orchestrator/tree/main/packages/fragata-web-classic)).

---

## Installation

Manual install procedure is [available here](https://github.com/6a8i/fragata-orchestrator/blob/main/docs/docs/getting-started/install-from-sources.md).

## Compilation

Production build:

```sh
yarn run build
```

Development build:

```sh
yarn run dev
```

## How to report a bug?

All bug reports should go into the [bugtracker of fragata-web-classic](https://github.com/6a8i/fragata-orchestrator/issues).
