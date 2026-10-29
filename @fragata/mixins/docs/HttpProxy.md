> This module provides an HTTP and HTTPS proxy for `fragata-proxy` and `fragata-server`.

- [Set up](#set-up)
- [Usage](#usage)
  - [`fragata-proxy`](#fragata-proxy)
  - [`fragata-server`](#fragata-server)
- [Use cases](#use-cases)
  - [Access hosts in a private network](#access-hosts-in-a-private-network)
  - [Allow upgrading fragata-proxy via fragata-server](#allow-upgrading-xo-proxy-via-xo-server)

## Set up

The proxy is enabled by default, to disable it, add the following lines to your config:

```toml
[http.proxy]
enabled = false
```

## Usage

For safety reasons, the proxy requires authentication to be used.

### `fragata-proxy`

Use the authentication token:

```console
$ cat ~/.config/fragata-proxy/config.z-auto.json
{"authenticationToken":"J0BgKritQgPxoyZrBJ5ViafQfLk06YoyFwC3fmfO5wU"}
```

Proxy URL to use:

```
https://J0BgKritQgPxoyZrBJ5ViafQfLk06YoyFwC3fmfO5wU@fragata-proxy.company.lan
```

### `fragata-server`

> Only available for admin users.

You can use your credentials:

```
https://user:password@xo.company.lan
```

Or create a dedicated token with `fragata-cli`:

```console
$ fragata-cli create-token xoa.company.lan admin@admin.net
Password: ********
Successfully logged with admin@admin.net
Authentication token created

DiYBFavJwf9GODZqQJs23eAx9eh3KlsRhBi8RcoX0KM
```

And use it in the URL:

```
https://DiYBFavJwf9GODZqQJs23eAx9eh3KlsRhBi8RcoX0KM@xo.company.lan
```

## Use cases

### Access hosts in a private network

To access hosts in a private network, deploy an XO Proxy in this network, expose its port 443 and use it as an HTTP proxy to connect to your servers in XO.

### Allow upgrading fragata-proxy via fragata-server

If your fragata-proxy does not have direct Internet access, you can use fragata-server as an HTTP proxy to make upgrades possible.
