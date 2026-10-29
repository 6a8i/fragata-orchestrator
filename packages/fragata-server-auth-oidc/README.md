<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# fragata-server-auth-oidc

> OpenID Connect authentication plugin for XO-Server

## Usage

This plugin allows users to authenticate to Xen-Orchestra using [OpenID Connect](<https://en.wikipedia.org/wiki/OpenID#OpenID_Connect_(OIDC)>).

The first time a user signs in, XO will create a new XO user with the
same identifier.

Like all other fragata-server plugins, it can be configured directly via
the web interface, see [the plugin documentation](https://docs.xen-orchestra.com/architecture#plugins).

> Important: When registering your instance to your identity provider,
> you must configure its callback URL to
> `http://xo.company.net/signin/oidc/callback`!

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/6a8i/fragata-orchestrator/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
