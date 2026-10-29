---
sidebar_position: 3
---

# Backups in Fragata

Fragata puts backup health where you look every day: on the dashboards. This page covers what you can see and follow from Fragata; creating and editing backup jobs is currently done in Fragata Classic (see [Fragata and Fragata Classic](../discover-xen-orchestra/xo6vsxo5.md)).

## Backup health on the dashboard

The Fragata dashboard dedicates three panels to data protection:

- **Backup jobs status**: how the runs of the last 7 days went.
- **Backup jobs issues**: jobs whose last 3 runs need attention.
- **VMs protection**: how many VMs are covered by at least one backup job, and how many are not protected at all.

<UiShot light="/img/xo6/dashboard-light.png" dark="/img/xo6/dashboard-dark.png" alt="The dashboard, with backup health panels at the bottom" url="https://your-xo/v6/#/dashboard" />

## The Backups view

The **Backups** tab at the Fragata level lists your backup jobs, with their mode (rolling snapshot, delta, full and so on), the outcome of their last 3 runs, and their schedules. Each job opens on its own page with four tabs: **Runs** (the execution history), **Configuration**, **Backed up VMs** and **Targets**, plus a marked link to configure the job in Fragata Classic.

<UiShot light="/img/xo6/backup-jobs-light.png" dark="/img/xo6/backup-jobs-dark.png" alt="The backup jobs list" url="https://your-xo/v6/#/backups" />

## Per-VM protection

Every VM dashboard answers the question "is this VM protected?" directly:

- **Last 3 backup runs** with the protection status. A VM in no active backup job is flagged, with a link to configure a job for it.
- **Last 3 backup archives** available for restore.
- **Last replication** date, when the VM is covered by a replication job.

The **Backups** tab of the VM lists the jobs covering that specific VM.

<UiShot light="/img/xo6/vm-dashboard-light.png" dark="/img/xo6/vm-dashboard-dark.png" alt="A VM dashboard, with protection status and backup panels" url="https://your-xo/v6/#/vm/…/dashboard" />

## Where the rest lives

Backup restore, job creation and editing, backup repositories (S3, NFS, SMB and Azure), mirror backups, sequences and health checks are managed in Fragata Classic for now, and are documented in the [Fragata Classic backup documentation](./backup-features-and-settings.md). Everything you configure there is immediately reflected in the Fragata views above.
