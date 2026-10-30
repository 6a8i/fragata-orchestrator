# Object storage support

## Introduction

Fragata is compatible with a wide range of S3-compatible object storage solutions. Based on testing and field feedback, storage providers fall into three tiers that indicate their expected reliability and performance.

To configure an S3-compatible backup repository, see [Backup repositories](../backup-features-and-settings.md#amazon-s3).

To make an S3 backup repository immutable, see [S3 Object Lock](./object-lock.md).

## Storage tiers explained

- **Tier 1** providers are extensively tested. Fragata aligns with their implementation and performs reliably, even at scale.

- **Tier 2** providers closely resemble Tier 1 solutions in behavior. Minor differences may exist, and large-scale testing might be limited.

- **Tier 3** providers have implementations that differ more significantly from Tier 1. Compatibility is best-effort, and some operations may be less reliable.

## Supported storage providers

| Provider              | Tier   | Notes                                                                                                                |
| --------------------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| **AWS / S3**          | 1      | Fully tested and validated for reliability at scale.                                                                 |
| **OVH**               | 1      | Fully tested and validated for reliability at scale.                                                                 |
| **Wasabi**            | 2      | Behaves similarly to Tier 1 but with less extensive large-scale testing.                                             |
| **CleverCloud**       | 2      | Behaves similarly to Tier 1 but with less extensive large-scale testing.                                             |
| **Backblaze / B2**    | 3      | The `list` operation may time out, which will cause irrecoverable errors during the `cleanVM` phase                 |
| **MinIO**             | 2 or 3 | Depends on performance; can be dimensioned to handle large deployment, but this is not covered by systematic testing. |
| **Ceph** (on-premise) | 2 or 3 | Depends on performance; can be dimensioned to handle large deployment, but this is not covered by systematic testing. |
| **NetApp**            | 2      | Tier 2 support applies to ONTAP version 9.16 or later.                                                               |

## What this means for your backups

The most demanding part of the backup process (cleaning and merging old data) is where tier differences matter most. Once a backup is complete, restoration works the same regardless of the storage tier. You can inspect the health of a backup repository (BR) at any time with the `fragata-backups` [CLI](../backup-features-and-settings.md#backups-cli).

There is no formal validation program for every provider. This list reflects hands-on experience and user reports.

## Help us improve storage support

If you’re using a storage solution at scale, whether successfully or with challenges, your feedback is invaluable. Share it in the [project discussions](https://github.com/6a8i/fragata-orchestrator/discussions) so the list can be refined for the entire community.
