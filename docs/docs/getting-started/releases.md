---
sidebar_position: 1
---

# Releases

Fragata is distributed as source code on [GitHub](https://github.com/6a8i/fragata-orchestrator). A single checkout contains the server (`fragata-server`), the two web interfaces ([Fragata and Fragata Classic](../discover-fragata/fragata-vs-classic.md)), the REST API and the backup engine.

## One line of development

The `main` branch is the Fragata line: it is where development happens and the only supported state. There are no release channels to choose from, and nothing to register: you [install from the sources](install-from-sources.md) and [update with `git`](install-from-sources.md#updating).

Changes are tracked in the [changelog](https://github.com/6a8i/fragata-orchestrator/blob/main/CHANGELOG.md#changelog), and what is coming next in `CHANGELOG.unreleased.md`.

<Terminal shell title="updating an installation from the sources">{`
cd fragata-orchestrator
git pull  # stay on main
yarn && yarn build
`}</Terminal>

:::warning
Update to the latest `main` before reporting anything: issues on older checkouts are not investigated.
:::

## Supported versions for security updates

| Version | Security updates |
| --- | --- |
| Installations using the `main` branch, up to date | Yes |
| Other versions | No |

To report a vulnerability, use GitHub's private vulnerability reporting on the repository rather than opening a public issue.
