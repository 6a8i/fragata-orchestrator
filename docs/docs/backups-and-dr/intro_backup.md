---
slug: backup
sidebar_position: 1
---

# Backup overview

Fragata ships a complete, **agentless** backup engine for your whole infrastructure: nothing to install inside your VMs, everything managed from one place, from quick rolling snapshots to cross-site disaster recovery.

New to backups in Fragata? Start with these two:

<CardGrid>
<LinkCard title="Backup strategy guide" href="/backups-and-dr/backup_howto">Which backup type for which need: design your protection plan before clicking anything.</LinkCard>
<LinkCard title="Backups in Fragata" href="/backups-and-dr/backups-in-fragata">Follow backup health from the new dashboards: job status, per-VM protection, restore points.</LinkCard>
</CardGrid>

## Pick your backup type

- **[Rolling snapshots](./backup-types/rolling_snapshots.md)**: scheduled snapshots kept on a rotation. No repository needed, instant restore points.
- **[Full backups](./backup-types/full_backups.md)**: a complete export of the VM to a backup repository (BR), every time. Simple and self-contained.
- **[Incremental backups](./backup-types/incremental_backups.md)**: after an initial full, only the changed blocks are sent. Fast, compact, deduplicable.
- **[Full replication](./backup-types/full_replication.md)** (formerly Disaster Recovery, DR): a ready-to-boot copy of your VMs, kept up to date on another host or SR.
- **[Incremental replication](./backup-types/incremental_replication.md)** (formerly Continuous Replication, CR): the same standby copy, sending only the deltas.
- **[Mirror backups](./backup-types/mirror_backup.md)**: replicate a whole backup repository to another one, the key to [3-2-1 strategies](backup_howto.md#long-term-retention-strategy).
- **[Metadata backup](./backup-types/metadata_backup.md)**: the Fragata configuration and pool metadata themselves, so the orchestrator is never your single point of failure.

:::tip
You don't have to pick VMs one by one: **[smart backup](./backup-features-and-settings.md#smart-backup)** selects them dynamically by pool, tag or power state, so new VMs are protected automatically.
:::

## Going further

<CardGrid>
<LinkCard title="Features and settings" href="/backups-and-dr/backup-features-and-settings">Encryption, schedules, smart backup, backup repositories, restore (including file-level), retention, health checks: the full reference.</LinkCard>
<LinkCard title="Distributed backups" href="/backups-and-dr/scale-and-security/distributed_backups">Spread backups and replications across several targets, and combine them with mirrors for multi-site, resilient backup architectures.</LinkCard>
<LinkCard title="Immutability" href="/backups-and-dr/scale-and-security/immutability">Make your backup repositories tamper-proof against ransomware.</LinkCard>
<LinkCard title="Backup reports" href="/backups-and-dr/backup_reports">Get notified after each run: email, XMPP and more.</LinkCard>
<LinkCard title="Troubleshooting" href="/backups-and-dr/backup_troubleshooting">Interrupted runs, full SRs, slow transfers: the usual suspects and their fixes.</LinkCard>
</CardGrid>

:::tip
Sizing question? The [retention calculator](calculator.md) estimates how much storage a given schedule and retention will consume.
:::
