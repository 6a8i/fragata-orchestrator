# Fragata documentation

The documentation of Fragata, built with [Docusaurus](https://docusaurus.io/). The pages live in `docs/`; the site is also served by `fragata-server` under `/docs` (see `docusaurus.embed.config.ts`).

### Installation

```
$ yarn
```

### Local development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory. Broken links and broken anchors fail the build.

To build the variant served by `fragata-server` under `/docs`:

```
$ yarn build:fragata-server
```

### Linking to the documentation from the application

The application links to pages of this folder through `https://github.com/6a8i/fragata-orchestrator/blob/main/docs/docs/<page>.md#<anchor>` URLs. When you rename a page or a heading, search the repository for the old URL and update it.
