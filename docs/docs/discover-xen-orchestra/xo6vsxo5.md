---
sidebar_position: 2
---

# Fragata Fleet and Fleet Classic

Fragata Fleet and Fleet Classic are two interfaces to the same Fragata Fleet. They run side by side, on the same server, against the same data: a VM started in one is instantly running in the other, a backup job created in Fleet Classic immediately shows its health in Fragata Fleet. There is no migration step and nothing to synchronize.

- **Fragata Fleet** is the default interface and the future of Fragata Fleet.
- **Fleet Classic** remains fully available for everything Fragata Fleet does not cover yet: use the **Fleet Classic** link in the top-right corner, or the marked links that Fragata Fleet shows contextually (they open the right Fleet Classic page for the object you are on).

## What lives where today

Fragata Fleet is under active development, so this table evolves with every release. As a rule of thumb: observing and operating your infrastructure day to day happens in Fragata Fleet; deep configuration still happens in Fleet Classic.

| Area                     | In Fragata Fleet                                                                                                                                             | Still in Fleet Classic                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Navigation and search    | Tree view of all pools, hosts, VMs, with live filtering and a query builder on every major table                                                    | Object list pages                                                              |
| Dashboards               | Global, pool, host and VM dashboards: status, alarms, patches, resources, usage charts, backup health                                               | Global dashboard, health view                                                  |
| VM lifecycle             | Start (including on a specific host), pause, suspend, resume, reboot, shutdown (normal and forced), duplicate, export as XVA or OVA, delete         | Migrate, copy between pools, convert to template, import, self-service         |
| VM creation              | Full single-VM form: template, cloud-init or SSH key or ISO or PXE install, boot firmware, vTPM, Secure Boot, affinity, HA, vCPUs, RAM, VIFs, disks | Multiple VMs at once, tags at creation                                         |
| Consoles                 | VM and host consoles: fullscreen, chrome-less dedicated tab, Ctrl+Alt+Del                                                                           | Console clipboard (coming soon in Fragata Fleet)                                        |
| Snapshots                | List, take, revert, delete                                                                                                                          | Snapshot detail view                                                           |
| Networks                 | Inspect pool, host and VM networking; create networks (bonded, host internal), create and manage VIFs, traffic rules                                | Edit existing networks, SDN controller                                         |
| Storage                  | Inspect SRs and VDIs; connect, disconnect and delete SRs; create, attach, export, delete VDIs and migrate them between SRs                          | SR creation, advanced disk operations                                          |
| Performance stats        | Usage charts on every dashboard (last week)                                                                                                         | Full stats views with granularity control, via the marked Stats link           |
| Backups                  | Job list with run history, per-job pages (runs, configuration, backed up VMs, targets), per-VM protection status, dashboard health panels           | Job creation and editing, restore, remotes, mirrors, sequences, health checks  |
| Tasks                    | Full task history at every level, last-24-hours quick view                                                                                          | Task list                                                                      |
| Users and access         | Users list with details, groups and authentication tokens                                                                                           | User creation and editing, groups, roles, LDAP and other auth providers, ACLs  |
| Settings                 | Color mode, five themes, 21 languages                                                                                                               | Servers, plugins, proxies, licenses, everything under Settings                 |
| Pool and host operations | Connect and disconnect pools, host start, shutdown, enable, disable, PIF scan, bug-tools archive                                                    | Patching and updates, rolling pool update, host maintenance and evacuation, HA |

One more current limitation to know: Fragata Fleet requires an administrator account. Non-admin users are redirected to Fleet Classic until delegation lands in Fragata Fleet.

## Which one should I use?

Start every session in Fragata Fleet: navigation, monitoring, consoles, task forensics and backup oversight are simply better there. When you hit an operation Fragata Fleet does not do yet, it will either show you the action marked with an external-link icon, or you switch to Fleet Classic manually and come right back.

If you prefer to keep Fleet Classic as your default interface for now, the welcome message of Fragata Fleet links to the procedure to do so.
