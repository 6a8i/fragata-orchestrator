---
slug: project
sidebar_label: About
sidebar_position: 1
---

# About Fragata

Fragata is an Open Source project to **visualize, manage, back up and delegate** a Fragata Host, XCP-ng or XenServer infrastructure from one place, with no agent on the hosts.

It is a hard fork of Xen Orchestra, the open source project created by Olivier Lambert and developed by Vates and a worldwide community of contributors for more than 15 years. Fragata keeps that history and the AGPL license, and goes its own way from there: its own name, its own roadmap and none of the original commercial services (see [Licenses](licenses.md)).

## Components

- **Fragata**: the orchestrator. `fragata-server` plus two web interfaces, the new default one and [Fragata Classic](../discover-fragata/fragata-vs-classic.md), the REST API and the backup engine.
- **Fragata Host**: the hypervisor, a fork of [XCP-ng](https://xcp-ng.org). Fragata also manages upstream XCP-ng and XenServer pools (see [host compatibility](../getting-started/supported_hosts.md)).
- **Fragata Deck**: the lightweight web UI embedded in every Fragata Host.

## Milestones of the codebase {#initial-idea}

The code Fragata is built on has a long history:

- **2009**: the original idea is announced on the [Xen user mailing list](https://lists.xenproject.org/archives/html/xen-users/2009-09/msg00537.html). This first incarnation targets Xen and `xend` (both now long deprecated).
- **December 2012**: the project is rebooted on top of XAPI for XenServer, with the first commit of the current codebase.
- **2014 to 2016**: successive major versions, with a fully redesigned web interface; the generation that is still known today as [Fragata Classic](../discover-fragata/fragata-vs-classic.md) appears in 2016.
- **2018**: after Citrix closed a lot of XenServer features, the XCP-ng project is launched as a fully open source fork of XenServer, the base of Fragata Host.
- **2023**: first preview of [V2V](../guides/v2v-migration-guide.md), the built-in tool to migrate VMs directly from VMware.
- **2025**: the new interface ([Fragata](../discover-fragata/gettingstarted.md)) becomes the default one.
- **2026**: [distributed backups](../backups-and-dr/scale-and-security/distributed_backups.md), symmetrical and bidirectional replication, a rewritten immutable backup engine and QCOW2 support (disks beyond the 2 TiB VHD limit).
- **October 2026**: Fragata is forked as an independent project.

## Feedback and issues

- **Questions and ideas**: [GitHub discussions](https://github.com/6a8i/fragata-orchestrator/discussions).
- **Bugs and feature requests**: tracked on the [GitHub repository](https://github.com/6a8i/fragata-orchestrator/issues). It is always better to first drop a message in the discussions.

## Team and contributors

See the [dedicated GitHub page](https://github.com/6a8i/fragata-orchestrator/graphs/contributors) for all contributors.
