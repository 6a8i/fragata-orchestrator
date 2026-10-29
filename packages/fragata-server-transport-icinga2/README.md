<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# fragata-server-transport-icinga2

> Sends backup runs statuses to icinga2 server

## Usage

Like all other fragata-server plugins, it can be configured directly via
the web interface, see [the plugin documentation](https://docs.xen-orchestra.com/architecture#plugins).

### `Xo#sendIcinga2Status({ status, message })`

This xo method is called to send a passive check to icinga2 and change the status of a service.
It has two parameters:

- status: it's the service status in icinga2 (0: OK | 1: WARNING | 2: CRITICAL | 3: UNKNOWN).
- message: it's the status information in icinga2.

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/6a8i/fragata-orchestrator/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
