---
sidebar_label: Installation
sidebar_position: 3
---

# Installing Fragata from source

Fragata is fully open source and is installed by building it from its Git repository, for free. Nothing is installed on your hosts: Fragata is a regular Node.js application that talks to them over the network, so it can run on any Linux machine or VM that can reach your pools.

What you are about to build: a single `fragata-orchestrator` checkout containing the server (`fragata-server`) and the web interfaces, running as one Node.js process, with Redis as its database. Total time on a fresh VM: about fifteen minutes.

This procedure is validated against a fresh **Debian 12 x64** install and works nearly identically on any dpkg-based system. RPM-based systems are close too, since most dependencies come from npm rather than the OS.

## Sizing {#sizing}

Fragata itself is light, but backups, V2V and compression are parallel workloads that benefit from CPU and RAM. A few rules of thumb for the machine (or VM) that runs it:

| Usage | vCPUs | RAM |
| --- | --- | --- |
| A few pools, no backup jobs, no V2V | 2 | 4 GiB |
| Backup jobs, V2V, more pools | 4 | 8 GiB |
| Large infrastructures or a heavy backup load | 8 | 16 GiB |

- 2 GiB is the strict minimum, for labs only.
- You can always give more, but **measure** afterwards to check the improvement is real before going further.
- `fragata-server` sets its own memory limit to 70% of the machine's RAM at each start, so there is nothing else to tune after resizing.
- Keep 20 GiB of free disk space for the checkout, its dependencies and the logs.

## Requirements

### Node.js

Fragata requires [Node.js](https://nodejs.org/), **always the [latest LTS version](https://github.com/nodejs/release?tab=readme-ov-file#release-schedule)**. Check what you have:

<Terminal title="check your Node.js version">{`
node -v
v22.11.0
`}</Terminal>

If it is missing or older than the current LTS, install it following [the Node.js instructions](https://nodejs.org/en/download/package-manager/).

### Yarn

The build uses the [Yarn](https://classic.yarnpkg.com/en/docs/install) package manager: install it the same way, from its official instructions.

### System packages {#packages-and-prerequisites}

A few system packages are needed (Redis is the database Fragata uses; the rest covers builds and the various remote types):

<Terminal shell title="Debian / Ubuntu — install the dependencies">{`
apt-get install build-essential redis-server libpng-dev git python3-minimal libvhdi-utils lvm2 cifs-utils nfs-common ntfs-3g openssl libfuse2
`}</Terminal>

On Fedora and older CentOS-like systems:

<Terminal shell title="Fedora / CentOS-like — install the dependencies">{`
dnf install redis libpng-devel git lvm2 cifs-utils make automake gcc gcc-c++ nfs-utils ntfs-3g openssl
`}</Terminal>

:::note RHEL-family 10 and newer
Since release 10 of CentOS Stream, AlmaLinux and Rocky Linux, Redis is replaced by **Valkey**, a drop-in compatible fork; the `valkey-compat-redis` package (in the `devel` repository) provides the usual Redis commands, and `ntfs-3g` moved to EPEL:

<Terminal shell title="RHEL-family 10 — install the dependencies">{`
dnf install epel-release
dnf config-manager --enable devel
dnf install valkey valkey-compat-redis libpng-devel git lvm2 cifs-utils make automake gcc gcc-c++ nfs-utils ntfs-3g openssl
`}</Terminal>
:::

### Check that Redis is running {#make-sure-redis-is-running}

<Terminal shell title="start Redis (or valkey.service if you installed Valkey)">{`
systemctl restart redis.service
`}</Terminal>

<Terminal title="make sure it answers">{`
redis-cli ping
PONG
`}</Terminal>

## Get the code and build {#fetching-the-code}

Everything lives in one repository. Ideally, work as a **non-root user** (see [the sudo section](#sudo) for NFS mounts):

<Terminal shell title="fetch the code">{`
git clone -b main https://github.com/6a8i/fragata-orchestrator
`}</Terminal>

Install the dependencies and build, as the same user that will run Fragata (a few minutes):

<Terminal shell title="build">{`
cd fragata-orchestrator
yarn
yarn build
`}</Terminal>

## Configure

Create the `fragata-server` configuration file from the provided sample:

<Terminal shell title="create the configuration">{`
cd packages/fragata-server
mkdir -p ~/.config/fragata-server
cp sample.config.toml ~/.config/fragata-server/config.toml
`}</Terminal>

Two things you may want to change in that file:

- **Ports**: defaults are 80 and 443. A non-root user cannot bind ports below 1024, so pick 1024 or higher in that case.
- If you install `fragata-server` as a system-wide service, place the file in `/etc/fragata-server/config.toml` instead.

## First run {#running-xo}

From the `fragata-orchestrator/packages/fragata-server` directory:

<Terminal title="start Fragata">{`
yarn start
WebServer listening on localhost:80
[INFO] Default user: "admin@admin.net" with password "admin"
`}</Terminal>

Open the server's IP in your browser, log in with `admin@admin.net` / `admin`, and change that password right away. That's it!

## Run it at boot {#always-running}

The clean way is a **systemd service**. Create `/etc/systemd/system/fragata-server.service` with the following (adapt the two paths to your Node and your checkout):

```ini
[Unit]
Description=Fragata Server
After=network-online.target

[Service]
Environment="DEBUG=xo:main"
Restart=always
SyslogIdentifier=fragata-server

# Adapt the paths to your Node binary and your fragata-orchestrator checkout!
ExecStart=/usr/bin/node /home/username/fragata-orchestrator/packages/fragata-server/dist/cli.mjs

[Install]
WantedBy=multi-user.target
```

<Terminal shell title="enable and start the service">{`
systemctl daemon-reload
systemctl enable --now fragata-server
`}</Terminal>

<Terminal shell title="check it">{`
systemctl status fragata-server
`}</Terminal>

:::warning Security
With this unit, `fragata-server` runs as `root`: make sure the checkout files are not editable by other users, or they become an attack vector.
:::

<details>
<summary>Alternative: forever / forever-service (legacy)</summary>

The historical way, using the unmaintained [forever](https://github.com/foreversd/forever) tool. Prefer systemd for any new setup.

<Terminal shell title="run with forever, as the user owning Fragata">{`
yarn global add forever
forever start dist/cli.mjs
`}</Terminal>

Or install it as a service (run as root, from the fragata-server directory, adapting path and username):

<Terminal shell title="install as a service with forever-service">{`
yarn global add forever forever-service
cd /home/username/fragata-orchestrator/packages/fragata-server/
forever-service install orchestra -r username -s dist/cli.mjs
`}</Terminal>

Manage it with `service orchestra start` / `status`, and remove it with `forever-service delete orchestra`.

</details>

## Updating

From your `fragata-orchestrator` directory:

<Terminal shell title="update to the latest main">{`
git checkout .  # careful: this discards any local changes!
git pull --ff-only
yarn
yarn build
`}</Terminal>

Then restart Fragata if it was running. Always update to the latest `main` before reporting an issue: it is the only supported state.

## Build troubleshooting {#troubleshooting}

If the build fails, reset the dependencies and try again, from the `fragata-orchestrator` directory:

<Terminal shell title="clean rebuild">{`
rm -rf node_modules
yarn
yarn build
`}</Terminal>

## sudo {#sudo}

Running `fragata-server` as a non-root user requires `sudo` for mounting NFS remotes. Enable it near the end of the configuration file:

```toml
useSudo = true
```

Then allow your user to run the mount commands without a password prompt, in your `sudo` configuration:

```
username ALL=(root)NOPASSWD: /bin/mount, /bin/umount, /bin/findmnt
```

## FreeBSD and OpenBSD

:::note Community territory
We do not test Fragata on FreeBSD or OpenBSD at all: everything below comes purely from community feedback, and may lag behind reality. If you run Fragata on these systems and want to help maintain these instructions, [open a discussion](https://github.com/6a8i/fragata-orchestrator/discussions): we would be happy to have more testers and maintainers for these targets.
:::

### FreeBSD

<Terminal shell title="install the packages">{`
pkg install gmake redis python git npm node autoconf
npm update -g
pkg install jpeg-turbo optipng gifsicle  # saves npm from building them itself
`}</Terminal>

FreeBSD ships CLANG rather than GCC:

<Terminal shell title="point g++ at clang++">{`
ln -s /usr/bin/clang++ /usr/local/bin/g++
`}</Terminal>

Enable Redis at boot by adding `redis_enable="YES"` to `/etc/rc.conf`, and start it now:

<Terminal shell title="start Redis">{`
service redis start
`}</Terminal>

### OpenBSD

<Terminal shell title="install the packages">{`
pkg_add gmake redis python--%2.7 git node autoconf yarn
pkg_add jpeg optipng gifsicle
`}</Terminal>

OpenBSD ships CLANG rather than GCC:

<Terminal shell title="use clang for the build">{`
export CC=/usr/bin/clang
export CXX=/usr/bin/clang++
`}</Terminal>

Raise the open-files limit, make `node` visible to `npm`, and point Yarn at Python if needed:

<Terminal shell title="build environment tweaks">{`
ulimit -n 10240
ln -s /usr/local/bin/node /tmp/node
PYTHON=/usr/local/bin/python2 yarn
`}</Terminal>

Enable and start Redis:

<Terminal shell title="Redis at boot">{`
rcctl enable redis
rcctl start redis
`}</Terminal>
