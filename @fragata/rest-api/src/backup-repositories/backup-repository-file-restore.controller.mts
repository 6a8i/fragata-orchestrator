import {
  Body,
  Controller,
  Extension,
  Get,
  Middlewares,
  Path,
  Post,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import type { XoBackupRepository, XoPool } from '@fragata/types'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { json } from 'express'
import { basename } from 'node:path'
import type { Readable } from 'node:stream'
import { invalidParameters } from 'fragata-common/api-errors.js'

import { badRequestResp, noContentResp, notFoundResp, unauthorizedResp } from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type {
  BackupDiskBody,
  BackupPartition,
  FetchPartitionFilesBody,
  ListPartitionFilesBody,
  MetadataBackup,
  RestoreMetadataBackupBody,
} from './backup-repository-file-restore.type.mjs'

/**
 * File restore: browse the partitions of a disk of a VM backup and download files from them, without restoring the
 * VM. `disk` is the `id` of a disk of a backup archive. Administrators only.
 */
@Route('backup-repositories')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('backup-repositories')
@provide(BackupRepositoryFileRestoreController)
export class BackupRepositoryFileRestoreController extends Controller {
  #restApi: RestApi

  constructor(@inject(RestApi) restApi: RestApi) {
    super()
    this.#restApi = restApi
  }

  /**
   * @example id "eff462a7-04e4-4412-9fa2-c4f6ba2724a0"
   * @example body { "disk": "/xo-vm-backups/840cab69-813e-4b5d-a5ed-88c9873a36df/vdis/b2d5aca3-db00-4c38-ba06-9d031fafe706/5115d055-b6ed-47e7-a1eb-a5b1c3fcba32/20261102T141705Z.vhd" }
   */
  @Extension('x-mcp-exposure', 'allow')
  @Post('{id}/actions/list_partitions')
  @Middlewares(json())
  @Response(notFoundResp.status, notFoundResp.description)
  async listBackupDiskPartitions(@Path() id: string, @Body() body: BackupDiskBody): Promise<BackupPartition[]> {
    return this.#restApi.xoApp.listBackupNgDiskPartitions(id, body.disk)
  }

  /**
   * Entries of a directory: directories end with `/`. Without `partition`, the disk is read as one file system.
   *
   * @example id "eff462a7-04e4-4412-9fa2-c4f6ba2724a0"
   * @example body { "disk": "/xo-vm-backups/840cab69-813e-4b5d-a5ed-88c9873a36df/vdis/b2d5aca3-db00-4c38-ba06-9d031fafe706/5115d055-b6ed-47e7-a1eb-a5b1c3fcba32/20261102T141705Z.vhd", "partition": "1", "path": "/" }
   */
  @Extension('x-mcp-exposure', 'allow')
  @Post('{id}/actions/list_partition_files')
  @Middlewares(json())
  @Response(notFoundResp.status, notFoundResp.description)
  async listBackupPartitionFiles(@Path() id: string, @Body() body: ListPartitionFilesBody): Promise<string[]> {
    const entries = await this.#restApi.xoApp.listBackupNgPartitionFiles(id, body.disk, body.partition, body.path)
    return Object.keys(entries).sort()
  }

  /**
   * Downloads files and directories of a partition as one archive.
   *
   * @example id "eff462a7-04e4-4412-9fa2-c4f6ba2724a0"
   * @example body { "disk": "/xo-vm-backups/840cab69-813e-4b5d-a5ed-88c9873a36df/vdis/b2d5aca3-db00-4c38-ba06-9d031fafe706/5115d055-b6ed-47e7-a1eb-a5b1c3fcba32/20261102T141705Z.vhd", "partition": "1", "paths": ["/docs/hello.txt"], "format": "zip" }
   */
  @Extension('x-mcp-exposure', 'deny')
  @Post('{id}/actions/fetch_partition_files')
  @Middlewares(json())
  @SuccessResponse(200, 'Download started', 'application/octet-stream')
  @Response(notFoundResp.status, notFoundResp.description)
  async fetchBackupPartitionFiles(@Path() id: string, @Body() body: FetchPartitionFilesBody): Promise<Readable> {
    if (body.paths.length === 0) {
      throw invalidParameters('no path to fetch')
    }
    const format = body.format ?? 'zip'
    const stream = await this.#restApi.xoApp.fetchBackupNgPartitionFiles(
      id,
      body.disk,
      body.partition,
      body.paths,
      format
    )
    const name = body.paths.length === 1 ? basename(body.paths[0]) || 'restore' : 'restore'
    this.setHeader('content-disposition', `attachment; filename="${name}.${format}"`)
    this.setHeader('content-type', 'application/octet-stream')
    return stream
  }

  /**
   * Backups made by metadata backup jobs: of the configuration of the orchestrator (`xo-config-backup`) and of
   * pools (`xo-pool-metadata-backup`), most recent first.
   *
   * @example id "eff462a7-04e4-4412-9fa2-c4f6ba2724a0"
   */
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}/metadata_backups')
  @Response(notFoundResp.status, notFoundResp.description)
  async listMetadataBackups(@Path() id: string): Promise<MetadataBackup[]> {
    const repositoryId = id as XoBackupRepository['id']
    const { xo, pool } = await this.#restApi.xoApp.listMetadataBackups([repositoryId])
    const backups = [
      ...(xo[repositoryId] ?? []),
      ...Object.values(pool[repositoryId] ?? {}).flat(),
    ] as unknown as (MetadataBackup & { pool?: Record<string, unknown>; poolMaster?: Record<string, unknown> })[]
    // the pool and its master are saved whole: only their identity is useful to choose a backup
    const identity = (record?: Record<string, unknown>) =>
      record === undefined ? undefined : { uuid: record.uuid as string, name_label: record.name_label as string }
    return backups
      .map(({ pool, poolMaster, ...backup }) => ({
        ...backup,
        ...(pool !== undefined && { pool: identity(pool) }),
        ...(poolMaster !== undefined && { poolMaster: identity(poolMaster) }),
      }))
      .sort((a, b) => b.timestamp - a.timestamp) as MetadataBackup[]
  }

  /**
   * Restores a metadata backup. A configuration backup replaces the configuration of the orchestrator; a pool
   * metadata backup is restored on its pool, or on `poolId`.
   *
   * @example id "eff462a7-04e4-4412-9fa2-c4f6ba2724a0"
   * @example body { "backupId": "eff462a7-04e4-4412-9fa2-c4f6ba2724a0/xo-config-backups/b2d5aca3-db00-4c38-ba06-9d031fafe706/20261102T150000Z" }
   */
  @Extension('x-mcp-exposure', 'deny')
  @Post('{id}/actions/restore_metadata')
  @Middlewares(json())
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async restoreMetadataBackup(@Path() id: string, @Body() body: RestoreMetadataBackupBody): Promise<void> {
    if (!body.backupId.startsWith(id + '/')) {
      throw invalidParameters('the backup does not belong to this backup repository')
    }
    const poolUuid =
      body.poolId === undefined ? undefined : this.#restApi.getObject<XoPool>(body.poolId as XoPool['id'], 'pool').uuid
    await this.#restApi.xoApp.restoreMetadataBackup({ id: body.backupId, poolUuid })
  }
}
