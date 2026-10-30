# Fragata Web Classic

![](http://i.imgur.com/tRffA5y.png)

Fragata Web Classic is part of [Fragata](https://github.com/6a8i/fragata-orchestrator), a web interface for XenServer or XAPI enabled hosts.

It is a web client for [fragata-server](https://github.com/6a8i/fragata-orchestrator/tree/master/packages/fragata-server).

---

## Installation

The install procedure is [available here](https://github.com/6a8i/fragata-orchestrator/blob/main/docs/docs/getting-started/install-from-sources.md)

## Compilation

Production build:

```
$ npm run build
```

Development build:

```
$ npm run dev
```

### Environment

#### `NODE_ENV`

Set to _production_ it disables many checks which result in increased
performance.

## How to report a bug?

Please consider using the [bugtracker](https://github.com/6a8i/fragata-orchestrator/issues).

## Process for new release

```bash
# Switch to the stable branch.
git checkout stable

# Fetches latest changes.
git pull --ff-only

# Merge changes of the next-release branch.
git merge next-release

# Increment the version (patch, minor or major).
npm version minor

# Go back to the next-release branch.
git checkout next-release

# Fetches the last changes (the merge and version bump) from stable to
# next-release.
git merge --ff-only stable

# Push the changes on git.
git push --follow-tags origin stable next-release

# Publish this release to npm.
npm publish
```

## License

AGPL3 © [Vates SAS](http://vates.fr)
