---
sidebar_label: Core concepts
sidebar_position: 4
---

# How Fragata is organized

Fragata organizes everything around a simple idea: **every level of your infrastructure gets the same treatment**. Your whole infrastructure, a pool, a host or a single VM each have their own page, with a dashboard and a consistent set of tabs. Once you know how one page works, you know them all.

## The object hierarchy

Fragata manages any number of pools, wherever they are:

- **Fragata** (the top level): everything connected to this Fragata, across all pools and sites.
- **Pool**: a group of Fragata Hosts sharing storage and networks, managed as one unit.
- **Host**: a Fragata Host machine inside a pool.
- **VM**: a virtual machine running on a host.

The tree view on the left mirrors this hierarchy, and every page shows its object's place in it (a VM page links to its host and pool, and so on).

## Dashboards at every level

Each level opens on a **dashboard** that answers "is everything fine here?" at its own scale.

At the top level, the dashboard aggregates the whole infrastructure: pool, host and VM status, total memory, CPUs and storage, alarms, missing patches per pool and host, backup job health and how many VMs are protected by a backup job:

<UiShot light="/img/xo6/dashboard-light.png" dark="/img/xo6/dashboard-dark.png" alt="The Fragata dashboard" url="https://your-fragata/v6/#/dashboard" />

At the pool level, the same layout narrows to the pool: host and VM status, alarms, the exact list of missing patches, storage and RAM usage per host, and CPU provisioning:

<UiShot light="/img/xo6/pool-dashboard-light.png" dark="/img/xo6/pool-dashboard-dark.png" alt="A pool dashboard" url="https://your-fragata/v6/#/pool/…/dashboard" />

Host and VM dashboards follow the same principle, down to the quick info of a single VM (state, IP address reported by the guest tools, OS, vCPUs, RAM, virtualization mode) and its individual backup protection status.

## Tabs, tables and the side panel

Object pages are organized in tabs. The exact set depends on the object:

| Level         | Tabs                                                                        |
| ------------- | --------------------------------------------------------------------------- |
| Fragata       | Dashboard, Backups, Tasks, Pools, Hosts, VMs                                |
| Pool          | Dashboard, Stats, System, Network, Traffic rules, Storage, Tasks, Hosts, VMs     |
| Host          | Dashboard, Console, Stats, System, Network, Storage, Tasks, VMs             |
| VM            | Dashboard, Console, Backups, Stats, System, Network, VDIs, Snapshots, Tasks |

Tables (networks, tasks, backup jobs, snapshots and so on) share the same tooling everywhere:

- a **Search Engine** field with a query builder, to filter large tables precisely,
- pagination controls,
- an eye icon per row that opens the **side panel** with the details of that row, so you never lose the context of the list.

<UiShot light="/img/xo6/pool-networks-light.png" dark="/img/xo6/pool-networks-dark.png" alt="Networks of a pool, with the query builder and the side panel" url="https://your-fragata/v6/#/pool/…/networks" />

## Tasks: everything is tracked

Every level has a **Tasks** tab. It records what happens on your infrastructure: user authentications, API calls, rolling pool reboots, backup runs and any other operation, with their outcome and when they ended. When you need to understand what happened and when, start there.

<UiShot light="/img/xo6/tasks-light.png" dark="/img/xo6/tasks-dark.png" alt="The tasks view" url="https://your-fragata/v6/#/tasks" />

## Where Fragata Classic fits

The new interface is under active development. A few operations still live in Fragata Classic, and it tells you explicitly: buttons and links marked with an external-link icon (for example **Manage VM lifecycle in Fragata Classic**, or the **Stats** tab) open the right Fragata Classic page for that same object. Both interfaces work on the same data at the same time, so there is no synchronization to think about. The current split is documented in [Fragata and Fragata Classic](fragata-vs-classic.md).
