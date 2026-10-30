# Contribute

Fragata is an Open Source project released under the [AGPL v3](http://www.gnu.org/licenses/agpl-3.0-standalone.html) license, contributions are therefore very welcome.

This page is a summary: the source of truth is the [CONTRIBUTING.md](https://github.com/6a8i/fragata-orchestrator/blob/main/CONTRIBUTING.md) file at the root of the repository, and the project is governed by its [Code of Conduct](https://github.com/6a8i/fragata-orchestrator/blob/main/CODE_OF_CONDUCT.md).

## Questions

If you have a question, do not open a GitHub issue: search the [GitHub discussions](https://github.com/6a8i/fragata-orchestrator/discussions) first, and open a new discussion there if needed, with as much context as you can (versions, platform, what you are trying to do).

## Bug reports

Bugs are tracked as [GitHub issues](https://github.com/6a8i/fragata-orchestrator/issues). Before opening one:

- Make sure you are using the latest version.
- Check the [documentation](../intro.md) and the [discussions](https://github.com/6a8i/fragata-orchestrator/discussions) to rule out a configuration problem.
- Search [existing bug reports](https://github.com/6a8i/fragata-orchestrator/issues?q=label%3Abug) to avoid duplicates.
- Collect the relevant information: stack trace, OS and platform, versions, reproduction steps.

In your report, explain the behavior you expected, the actual behavior, and the reproduction steps someone else can follow.

:::warning
Never report security vulnerabilities or bugs containing sensitive information in the public issue tracker. Use the [dedicated security advisories page](https://github.com/6a8i/fragata-orchestrator/security/advisories/new) instead.
:::

## Suggesting enhancements

Enhancement suggestions (new features and improvements) are also tracked as [GitHub issues](https://github.com/6a8i/fragata-orchestrator/issues). Search existing suggestions first, use a clear title, describe the current behavior and the behavior you expected, and explain why the change would be useful to most Fragata users. For more general product feedback, see the [About page](intro_project.md#feedback-and-issues).

## Translations

Translations are plain locale files in the repository (see the `locales` folders of the web packages): send a pull request to add or improve a language.

## Documentation / Code

:::note
By contributing, you confirm that you authored 100% of the content, that you have the necessary rights to it, and that it may be provided under the project license.
:::

Using the GitHub fork/pull-request feature, you may send us fixes or enhancements. Please explain what you are fixing (issue number if available) and how you did it.

### Pull requests

The best way to propose a change to the documentation or code is
to create a [GitHub pull request](https://help.github.com/articles/using-pull-requests/).

1. Fork the [Fragata repository](https://github.com/6a8i/fragata-orchestrator) using the Fork button
2. Follow [the documentation](../getting-started/install-from-sources.md) to install and run Fragata from the sources
3. Create a branch for your work
4. Edit the source files
5. Add a summary of your changes to `CHANGELOG.unreleased.md`, if your changes do not relate to an existing changelog item and update the list of packages that must be released to take your changes into account
6. [Create a pull request](https://github.com/6a8i/fragata-orchestrator/compare) for this branch against the `main` branch
7. Push into the branch until the pull request is ready to merge
8. Avoid unnecessary merges: keep your branch up to date by regularly rebasing `git rebase origin/main`
9. When ready to merge, clean up the history (reorder commits, squash some of them together, rephrase messages): `git rebase -i origin/main`

### Issue triage

#### Labels

**Type**

- bug
- cleanup: should be taken care of to avoid technical debt
- enhancement
- meta: points to other issues and is used to manage long term goals (similar but orthogonal to milestones)
- question

:::warning
All issues MUST have one of these labels!
:::

**Difficulty**

:::tip
This helps new people to contribute.
:::

1. easy
2. medium

**Component**

- backup
- GUI
- upstream: not a Fragata issue → link to the upstream issue and monitor progress

**Severity**

1. low: will be fixed when possible
2. medium
3. high: should be fixed for the next release
4. critical: should be fixed ASAP and a patch release is done once fixed

:::warning
A new version MUST NOT be released with a `high` or `critical` issue.
:::

**Status**

For all issues:

- duplicate: issue is a duplicate → SHOULD be closed
- in progress: issue has been assigned and some work is going on

For bugs:

- confirmed: bug is confirmed → SHOULD be assigned to someone
- invalid: bug cannot be confirmed → SHOULD be closed

For enhancements:

- draft: proposal is not finished and work should not be started yet
- wontfix: not a real enhancement → SHOULD be closed
