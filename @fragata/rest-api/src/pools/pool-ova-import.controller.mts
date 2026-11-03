import {
  Example,
  Extension,
  Middlewares,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'
import { invalidParameters } from 'fragata-common/api-errors.js'
import type { XoNetwork, XoPool, XoSr } from '@fragata/types'

import { acl } from '../middlewares/acl.middleware.mjs'
import {
  asynchronousActionResp,
  badRequestResp,
  createdResp,
  forbiddenOperationResp,
  internalServerErrorResp,
  invalidParameters as invalidParametersResp,
  notFoundResp,
  unauthorizedResp,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import type { ImportOvaResult } from './pool-ova-import.type.mjs'

const TWELVE_HOURS = 12 * 60 * 60 * 1e3

/**
 * Import of OVA files into a pool: the server reads the OVF descriptor and converts the VMDKs itself.
 */
@Route('pools')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('pools')
@provide(PoolOvaImportController)
export class PoolOvaImportController extends XapiXoController<XoPool> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('pool', restApi)
  }

  #checkInPool(poolId: XoPool['id'], objectId: string, type: 'SR' | 'network') {
    let object: { $pool?: string; type: string; content_type?: string } | undefined
    try {
      object = this.restApi.xoApp.getObject(objectId as XoSr['id']) as typeof object
    } catch {
      object = undefined
    }
    if (object === undefined || object.type !== type || object.$pool !== poolId) {
      throw invalidParameters(`${objectId} is not a ${type} of the pool`)
    }
    if (type === 'SR' && object.content_type === 'iso') {
      throw invalidParameters(`${objectId} is an ISO SR`)
    }
  }

  // For this endpoint, the requestBody type is written directly to `tsoa.json` because TSOA does not provide a decorator for "octet-stream" file uploads
  /**
   * Imports a VM from an OVA file sent as the raw request body.
   *
   * The upload is first written to a temporary file of the server, then the request answers with the task
   * which reads the OVF descriptor, creates the VM and converts the VMDKs to the SR (with `sync`, it
   * answers when the VM is imported). The temporary file is removed in all cases.
   *
   * By default, the CPUs, memory, name and description come from the OVF, and all the network interfaces
   * of the OVF are connected to `network`, or to the management network of the pool when it is not given.
   *
   * Required privilege:
   * - resource: sr, action: import:vm
   *
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629677"
   * @example sr "c787b75c-3e0d-70fa-d0c3-cbfd382d7e33"
   * @example network "6b6ca0f5-6611-0636-4b0a-1fb1c815e969"
   * @example networks ["6b6ca0f5-6611-0636-4b0a-1fb1c815e969"]
   * @example name_label "VM imported from an OVA"
   * @example name_description "Appliance exported from VMware"
   * @example cpus 2
   * @example memory 4294967296
   * @example filename "appliance.ova"
   * @param sr SR of the disks, in the pool
   * @param network network of all the network interfaces of the OVF
   * @param networks one network per network interface, in order: replaces the interfaces of the OVF
   * @param name_label name of the VM, from the OVF by default
   * @param name_description description of the VM, from the OVF by default
   * @param cpus number of vCPUs, from the OVF by default
   * @param memory memory of the VM in bytes, from the OVF by default
   * @param filename name of the uploaded file, the name of the VM when the OVF has none
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'deny')
  @Post('{id}/actions/import_ova')
  @Middlewares(acl({ resource: 'sr', action: 'import:vm', objectId: 'query.sr' }))
  @Tags('vms')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(createdResp.status, 'VM imported (sync)')
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async importOva(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() sr: string,
    @Query() network?: string,
    @Query() networks?: string[],
    @Query() name_label?: string,
    @Query() name_description?: string,
    @Query() cpus?: number,
    @Query() memory?: number,
    @Query() filename?: string,
    @Query() sync?: boolean
  ): CreateActionReturnType<ImportOvaResult> {
    const poolId = id as XoPool['id']
    this.getObject(poolId)
    this.#checkInPool(poolId, sr, 'SR')
    for (const networkId of [network, ...(networks ?? [])]) {
      if (networkId !== undefined) {
        this.#checkInPool(poolId, networkId, 'network')
      }
    }
    if (cpus !== undefined && !(Number.isSafeInteger(cpus) && cpus > 0)) {
      throw invalidParameters('cpus must be a positive integer')
    }
    if (memory !== undefined && !(Number.isSafeInteger(memory) && memory > 0)) {
      throw invalidParameters('memory must be a positive integer')
    }

    const { xoApp } = this.restApi
    req.setTimeout(TWELVE_HOURS)
    // the whole body is received before answering: the client knows the upload succeeded
    const upload = await xoApp.storeOvaInTmp(req, { fileName: filename })

    try {
      return await this.createAction<ImportOvaResult>(
        async () => {
          try {
            const vmId = await xoApp.importOvaFile(upload.path, {
              sr: sr as XoSr['id'],
              network: network as XoNetwork['id'] | undefined,
              networks: networks as XoNetwork['id'][] | undefined,
              nameLabel: name_label,
              descriptionLabel: name_description,
              nCpus: cpus,
              memory,
              fileName: filename,
            })
            return { id: vmId }
          } finally {
            await upload.dispose()
          }
        },
        {
          sync,
          statusCode: createdResp.status,
          taskProperties: {
            name: `import the OVA ${filename ?? ''}`.trim(),
            objectId: poolId,
            params: { sr, network, networks, name_label, cpus, memory },
          },
        }
      )
    } catch (error) {
      // the task did not start, it will not remove the file
      await upload.dispose()
      throw error
    }
  }
}
