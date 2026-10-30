---
sidebar_position: 8
---

# Troubleshooting

This page covers the problems you may encounter with your Fragata server, and how to get out of them. If your issue is not covered, ask on [GitHub discussions](https://github.com/6a8i/fragata-orchestrator/discussions) or, if you think it is a bug, [open an issue](https://github.com/6a8i/fragata-orchestrator/issues).

:::warning
Before asking, make sure you are on the latest `main` (see [Updating](install-from-sources.md#updating)) and that you have [rebuilt cleanly](install-from-sources.md#troubleshooting) if the build failed. Include the relevant [logs](#logs) in your report.
:::

## First reflex: check the basics

Whenever something feels wrong, check these first:

- **Node.js**: `node -v` must be the [latest LTS](install-from-sources.md#nodejs).
- **Redis**: `redis-cli ping` must answer `PONG` (see [Check that Redis is running](install-from-sources.md#make-sure-redis-is-running)).
- **Disk space**: a full `/var` or `/` stops Redis and `fragata-server` in strange ways. Check with `df -h`.
- **Configuration syntax**: a typo in `config.toml` prevents `fragata-server` from starting, and the [logs](#logs) say which line.
- **Connectivity**: the server must reach your pools (XAPI, port 443) and the machines you back up to.

Then look for the matching section below.

## Access issues

### Recover the web login password

From the machine running Fragata:

<Terminal shell title="reset a web account password">{`
fragata-server-recover-account youremail@here.com
`}</Terminal>

It prompts for a new password. If the email does not exist in Fragata yet, an admin account is created with it: handy as a rescue account. (From a source checkout, run it from the `packages/fragata-server` directory with `node dist/recover-account-cli.mjs youremail@here.com`.)

### Empty page after login

Your antivirus or firewall is blocking WebSockets, the protocol Fragata clients use to talk to `fragata-server` (see [architecture](architecture.md)). Switch to **HTTPS**: WebSockets are then encapsulated in TLS, out of reach of the interception.

### User login failures

Look at the `fragata-server` [logs](#logs) while reproducing the login attempt: the reason is displayed there.

## Logs

- **From the web interface**: Fragata Classic, Settings, then Logs.
- **From the CLI**, with `journalctl` if you run `fragata-server` as a [systemd service](install-from-sources.md#always-running):

<Terminal shell title="tail fragata-server logs">{`
journalctl -u fragata-server -f -n 50
`}</Terminal>

Start the tail, reproduce your issue, and read the error as it happens. For more detail, set the `DEBUG` environment variable of the service (for example `DEBUG=xo:*`).

## Runtime issues

### fragata-server out of memory

If `fragata-server` crashes with `FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory` in its logs, give the machine more memory (see [Sizing](install-from-sources.md#sizing)) and restart it.

`fragata-server` sets its Node.js memory limit to 70% of the machine's RAM (1 GiB minimum), recalculated at each start: no manual setting is needed. If you previously added `--max-old-space-size` to your service file by hand, you can remove it: the automatic limit makes it unnecessary.

### Stats not showing on a pool

If statistics are missing for all VMs and hosts of one specific pool, check whether a _Backup network_ is configured on it (pool Advanced tab), and make sure Fragata can reach **all hosts** of the pool through that network.

### Ghost tasks

If ghost tasks accumulate, try in order:

1. refresh the web page
2. disconnect and reconnect the pool owning the tasks
3. restart the XAPI toolstack of the pool master
4. restart `fragata-server`

## Renew the self-signed certificate

If the certificate you configured for [HTTPS](configuration.md#https-and-certificates) expired, generate a new one and restart:

<Terminal shell title="regenerate a self-signed certificate">{`
cp cert.pem cert.pem-old
cp key.pem key.pem-old
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -nodes -days 360
systemctl restart fragata-server.service
`}</Terminal>

## Reset the configuration

Last resort: reset the `fragata-server` database. **This deletes all configured users, servers and backup jobs.**

<Terminal shell title="full reset">{`
redis-cli
FLUSHALL
systemctl restart fragata-server.service
`}</Terminal>

You can then log in again with `admin@admin.net` / `admin`.

## Backup issues

Backups have their own page: [Backup troubleshooting](../backups-and-dr/backup_troubleshooting.md).
