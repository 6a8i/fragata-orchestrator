---
sidebar_position: 2
---

# Host compatibility list

Fragata connects to hosts running [Fragata Host](#fragata-host), [XCP-ng](https://xcp-ng.org/) or [XenServer](https://www.xenserver.com/) (formerly Citrix Hypervisor), and only those: Fragata is **agent-less** and talks to the XAPI toolstack directly, so a Xen hypervisor installed from a regular Linux distribution will not work (see the [architecture section](architecture.md)).

Fragata should be functional with any version of these platforms. For the best support quality, use the versions marked with full support below.

| Badge | Meaning |
|:---:|---|
| ✅ | Full support |
| 🚀 | All extra features (for example RAM-enabled backup) |
| ☠️ | Platform without security updates anymore: upgrade your hosts! |
| ❎ | Not all Fragata features supported |

## Fragata Host

Fragata Host is the hypervisor of the Fragata project, a fork of [XCP-ng](https://xcp-ng.org/) 8.3. Fragata and Fragata Host are developed together, so if you keep both up to date their compatibility is a given. Fragata also manages upstream XCP-ng pools.

The table below lists the XCP-ng releases (the base of Fragata Host) known to work, which matters if you manage a mixed estate or still have pools on older releases:

<HostCompatTable rows={[
  {version: 'XCP-ng 8.3 LTS', status: '✅ 🚀', notes: 'Recommended: LTS since June 2025, all Fragata features', highlight: true},
  {version: 'XCP-ng 8.2 LTS', status: '✅ ☠️', eol: true, notes: 'EOL since September 16, 2025'},
  {version: 'XCP-ng 8.1', status: '✅ ☠️', eol: true},
  {version: 'XCP-ng 8.0', status: '✅ ☠️', eol: true},
  {version: 'XCP-ng 7.6', status: '✅ ☠️', eol: true},
  {version: 'XCP-ng 7.5', status: '✅ ☠️', eol: true},
  {version: 'XCP-ng 7.4', status: '✅ ☠️', eol: true},
]} />

:::note
The next major branch, XCP-ng 9.x, is in development for both x86 and ARM; its releases will appear here as they ship. Follow the [XCP-ng blog](https://xcp-ng.org/blog/) for announcements.
:::

## XenServer (formerly Citrix Hypervisor)

:::note
XenServer versioning changed over the years: the product was renamed Citrix Hypervisor for the 8.0 to 8.2 era, then back to XenServer. Since XenServer 8 there are no public point releases: versions are plain "XenServer 8" and "XenServer 9", each updated continuously through Early Access and Normal update channels.
:::

<HostCompatTable rows={[
  {version: 'XenServer 9', status: '✅', notes: 'Released July 2026, vendor support until July 31, 2031', highlight: true},
  {version: 'XenServer 8', status: '✅', notes: 'Vendor support until November 30, 2028', highlight: true},
  {version: 'Citrix Hypervisor 8.2 LTS', status: '✅ ☠️', eol: true, notes: 'Vendor EOL since June 25, 2025'},
  {version: 'Citrix Hypervisor 8.1', status: '✅ ☠️', eol: true},
  {version: 'Citrix Hypervisor 8.0', status: '✅ ☠️', eol: true},
  {version: 'XenServer 7.6', status: '✅ ☠️', eol: true},
  {version: 'XenServer 7.5', status: '✅ ☠️', eol: true, notes: 'VDI I/O error (Citrix ticket XSO-873), fix never released by Citrix'},
  {version: 'XenServer 7.4', status: '✅ ☠️', eol: true},
  {version: 'XenServer 7.3', status: '✅ ☠️', eol: true},
  {version: 'XenServer 7.2', status: '❎ ☠️', eol: true, notes: 'JSON-RPC issues: possible INTERNAL_ERROR during incremental replication and incremental backup restore'},
  {version: 'XenServer 7.1 LTS', status: '✅ ☠️', eol: true},
  {version: 'XenServer 7.0', status: '✅ ☠️', eol: true},
  {version: 'XenServer 6.5', status: '✅ ☠️', eol: true, notes: 'Random delta backup issues'},
  {version: 'XenServer 6.1 and 6.2', status: '❎ ☠️', eol: true, notes: 'No official support (XML-RPC only, too CPU intensive); no incremental backup, no incremental replication'},
  {version: 'XenServer 5.x', status: '❎ ☠️', eol: true, notes: 'Basic administration only, no official support'},
]} />

