# Fragata Server

![](http://i.imgur.com/HVFMrTk.png)

XO-Server is part of [Fragata](https://github.com/6a8i/fragata-orchestrator/), a web interface for XenServer or XAPI enabled hosts.

It contains all the logic of XO and handles:

- connections to all XAPI servers/pools;
- a cache system to provide the best response time possible;
- users authentication and authorizations (work in progress);
- a JSON-RPC based interface for XO clients (i.e. [XO-Web](https://github.com/6a8i/fragata-orchestrator/tree/master/packages/fragata-web-classic)).

[![Build Status](https://travis-ci.org/vatesfr/xen-orchestra.svg?branch=next-release)](https://travis-ci.org/vatesfr/xen-orchestra)

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
