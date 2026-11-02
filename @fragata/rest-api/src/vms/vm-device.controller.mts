import { Body, Delete, Get, Middlewares, Path, Post, Response, Route, Security, SuccessResponse, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { json } from 'express'
import { invalidParameters } from 'fragata-common/api-errors.js'
import type { XoVm } from '@fragata/types'

import { acl } from '../middlewares/acl.middleware.mjs'
import {
  badRequestResp,
  createdResp,
  forbiddenOperationResp,
  invalidParameters as invalidParametersResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import type {
  AttachVmPcisBody,
  CreateVmVgpuBody,
  CreateVmVusbBody,
  DetachVmPcisBody,
  VmDevices,
} from './vm-device.type.mjs'

/** Raw XO records of the types the shared typings do not describe */
type AnyXoObject = {
  id: string
  type: string
  _xapiRef: string
  $pool?: string
  [key: string]: unknown
}

const formatPciIds = (pciIds: string[]) => '0/' + pciIds.join(',0/')

const MANAGE_DEVICES = acl({ resource: 'vm', action: 'manage-devices', objectId: 'params.id' })

/**
 * PCI passthrough, vGPUs, vTPMs and USB passthrough of a VM.
 */
@Route('vms')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vms')
@provide(VmDeviceController)
export class VmDeviceController extends XapiXoController<XoVm> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('VM', restApi)
  }

  #objectsOfType(type: string, filter?: (obj: AnyXoObject) => boolean): AnyXoObject[] {
    const objects = Object.values(this.restApi.xoApp.getObjects({ filter: { type } })) as unknown as AnyXoObject[]
    return filter === undefined ? objects : objects.filter(filter)
  }

  #object(id: string, type: string): AnyXoObject {
    const object = this.#objectsOfType(type, obj => obj.id === id)[0]
    if (object === undefined) {
      throw invalidParameters(`no such ${type} ${id}`)
    }
    return object
  }

  /** resolves once the change made on the VM is visible in the objects the other routes read */
  async #synced(vmId: XoVm['id']): Promise<void> {
    const xapiVm = this.getXapiObject(vmId)
    await xapiVm.$xapi.barrier(xapiVm.$ref)
  }

  /**
   * Devices of the VM, and the devices of its pool it could use.
   *
   * Required privilege:
   * - resource: vm, action: read
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Get('{id}/devices')
  @Middlewares(acl({ resource: 'vm', action: 'read', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getVmDevices(@Path() id: string): VmDevices {
    const vm = this.getObject(id as XoVm['id'])
    const poolId = vm.$pool
    const inPool = (obj: AnyXoObject) => obj.$pool === poolId

    const poolPcis = this.#objectsOfType('PCI', inPool)
    const pcis = (vm.attachedPcis ?? []).map(pciId => {
      const pci = poolPcis.find(candidate => candidate.pci_id === pciId)
      return {
        id: pci?.id,
        pciId,
        className: pci?.class_name as string | undefined,
        deviceName: pci?.device_name as string | undefined,
        hostId: pci?.$host as string | undefined,
      }
    })

    const nameOfVgpuType = (vgpuType: AnyXoObject) =>
      [vgpuType.vendorName, vgpuType.modelName].filter(Boolean).join(' ') || vgpuType.id

    const vgpus = this.#objectsOfType('vgpu', obj => obj.vm === vm.id).map(vgpu => {
      const gpuGroup = this.#objectsOfType('gpuGroup', obj => obj.id === vgpu.gpuGroup)[0]
      const vgpuType = this.#objectsOfType('vgpuType', obj => obj.id === vgpu.vgpuType)[0]
      return {
        id: vgpu.id,
        device: String(vgpu.device),
        currentlyAttached: Boolean(vgpu.currentlyAttached),
        gpuGroup: gpuGroup && { id: gpuGroup.id, name: String(gpuGroup.name_label) },
        vgpuType: vgpuType && { id: vgpuType.id, name: nameOfVgpuType(vgpuType) },
      }
    })

    const pusbs = this.#objectsOfType('PUSB', inPool)
    const vusbs = this.#objectsOfType('VUSB', obj => obj.vm === vm.id).map(vusb => ({
      id: vusb.id,
      currentlyAttached: Boolean(vusb.currentlyAttached),
      usbGroupId: vusb.usbGroup as string | undefined,
      description: pusbs.find(pusb => pusb.usbGroup === vusb.usbGroup)?.description as string | undefined,
    }))

    const vgpuTypes = this.#objectsOfType('vgpuType', inPool)

    return {
      pcis,
      vgpus,
      vtpms: vm.VTPMs,
      vusbs,
      availablePcis: poolPcis.map(pci => ({
        id: pci.id,
        pciId: String(pci.pci_id),
        className: String(pci.class_name),
        deviceName: String(pci.device_name),
        hostId: String(pci.$host),
      })),
      availableGpuGroups: this.#objectsOfType('gpuGroup', inPool).map(gpuGroup => ({
        id: gpuGroup.id,
        name: String(gpuGroup.name_label),
        vgpuTypes: vgpuTypes
          .filter(vgpuType => ((gpuGroup.enabledVgpuTypes as string[] | undefined) ?? []).includes(vgpuType.id))
          .map(vgpuType => ({ id: vgpuType.id, name: nameOfVgpuType(vgpuType) })),
      })),
      availableUsbs: pusbs
        .filter(pusb => pusb.passthroughEnabled === true && typeof pusb.usbGroup === 'string')
        .map(pusb => ({
          usbGroupId: pusb.usbGroup as string,
          description: String(pusb.description),
          hostId: String(pusb.host),
        })),
    }
  }

  /**
   * Attaches PCIs of a host to the VM (PCI passthrough). Applies at the next VM start: the VM then has to run on
   * that host, and dom0 access to the PCIs must be disabled on it.
   *
   * Required privilege:
   * - resource: vm, action: manage-devices
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example body { "pciIds": ["c5b7f6c2-8d39-4f0e-a3e7-50d7c43fa40a"] }
   */
  @Post('{id}/actions/attach_pcis')
  @Middlewares([json(), MANAGE_DEVICES])
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async attachVmPcis(@Path() id: string, @Body() body: AttachVmPcisBody): Promise<void> {
    const vm = this.getObject(id as XoVm['id'])
    const pcis = body.pciIds.map(pciId => this.#object(pciId, 'PCI'))
    if (pcis.some(pci => pci.$pool !== vm.$pool)) {
      throw invalidParameters('the PCIs must belong to a host of the pool of the VM')
    }

    const addresses = [...new Set([...(vm.attachedPcis ?? []), ...pcis.map(pci => String(pci.pci_id))])]
    const xapiVm = this.getXapiObject(vm.id)
    await xapiVm.$xapi.call('VM.remove_from_other_config', xapiVm.$ref, 'pci')
    await xapiVm.$xapi.call('VM.add_to_other_config', xapiVm.$ref, 'pci', formatPciIds(addresses))
    await this.#synced(vm.id)
  }

  /**
   * Required privilege:
   * - resource: vm, action: manage-devices
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example body { "pciAddresses": ["0000:04:00.0"] }
   */
  @Post('{id}/actions/detach_pcis')
  @Middlewares([json(), MANAGE_DEVICES])
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async detachVmPcis(@Path() id: string, @Body() body: DetachVmPcisBody): Promise<void> {
    const vm = this.getObject(id as XoVm['id'])
    const remaining = (vm.attachedPcis ?? []).filter(address => !body.pciAddresses.includes(address))
    const xapiVm = this.getXapiObject(vm.id)
    await xapiVm.$xapi.call('VM.remove_from_other_config', xapiVm.$ref, 'pci')
    if (remaining.length > 0) {
      await xapiVm.$xapi.call('VM.add_to_other_config', xapiVm.$ref, 'pci', formatPciIds(remaining))
    }
    await this.#synced(vm.id)
  }

  /**
   * Adds a vGPU to the VM. The VM must be halted.
   *
   * Required privilege:
   * - resource: vm, action: manage-devices
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example body { "gpuGroupId": "1d6c1d1f-58d0-1e4d-0ce4-c3d5f5bfa0b6", "vgpuTypeId": "8eb6b3a8-e4b3-4f84-a7e7-1aeed0c0a4b5" }
   */
  @Post('{id}/vgpus')
  @Middlewares([json(), MANAGE_DEVICES])
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async createVmVgpu(@Path() id: string, @Body() body: CreateVmVgpuBody): Promise<{ id: string }> {
    const xapiVm = this.getXapiObject(id as XoVm['id'])
    const gpuGroup = this.#object(body.gpuGroupId, 'gpuGroup')
    const vgpuType = this.#object(body.vgpuTypeId, 'vgpuType')
    const xapi = xapiVm.$xapi

    const ref = await xapi.call<string>('VGPU.create', xapiVm.$ref, gpuGroup._xapiRef, '0', {}, vgpuType._xapiRef)
    const uuid = await xapi.call<string>('VGPU.get_uuid', ref)
    await this.#synced(id as XoVm['id'])
    this.setStatus(createdResp.status)
    return { id: uuid }
  }

  /**
   * Required privilege:
   * - resource: vm, action: manage-devices
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example vgpuId "2d4c5b1e-6a3e-4b8f-9f0d-7c1e9a3b5d6f"
   */
  @Delete('{id}/vgpus/{vgpuId}')
  @Middlewares(MANAGE_DEVICES)
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteVmVgpu(@Path() id: string, @Path() vgpuId: string): Promise<void> {
    const vm = this.getObject(id as XoVm['id'])
    const vgpu = this.#object(vgpuId, 'vgpu')
    if (vgpu.vm !== vm.id) {
      throw invalidParameters('the vGPU does not belong to this VM')
    }
    await this.getXapiObject(vm.id).$xapi.call('VGPU.destroy', vgpu._xapiRef)
    await this.#synced(vm.id)
  }

  /**
   * Adds a virtual TPM to the VM. The VM must be halted and boot in UEFI.
   *
   * Required privilege:
   * - resource: vm, action: manage-devices
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Post('{id}/vtpms')
  @Middlewares(MANAGE_DEVICES)
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async createVmVtpm(@Path() id: string): Promise<{ id: string }> {
    const xapiVm = this.getXapiObject(id as XoVm['id'])
    const xapi = xapiVm.$xapi
    const ref = await xapi.VTPM_create({ VM: xapiVm.$ref })
    const uuid = await xapi.call<string>('VTPM.get_uuid', ref)
    await this.#synced(id as XoVm['id'])
    this.setStatus(createdResp.status)
    return { id: uuid }
  }

  /**
   * Removes the virtual TPM. The VM must be halted. Secrets sealed in the TPM are lost.
   *
   * Required privilege:
   * - resource: vm, action: manage-devices
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example vtpmId "0b6a8e3f-4d9c-4c1e-8f2a-5e7d3c9b1a4f"
   */
  @Delete('{id}/vtpms/{vtpmId}')
  @Middlewares(MANAGE_DEVICES)
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteVmVtpm(@Path() id: string, @Path() vtpmId: string): Promise<void> {
    const vm = this.getObject(id as XoVm['id'])
    if (!(vm.VTPMs as string[]).includes(vtpmId)) {
      throw invalidParameters('the vTPM does not belong to this VM')
    }
    const vtpm = this.#object(vtpmId, 'VTPM')
    await this.getXapiObject(vm.id).$xapi.call('VTPM.destroy', vtpm._xapiRef)
    await this.#synced(vm.id)
  }

  /**
   * Adds a USB passthrough to the VM, plugged at its next start. A VM can have up to six of them.
   *
   * Required privilege:
   * - resource: vm, action: manage-devices
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example body { "usbGroupId": "6f2d1c9e-3b8a-4e7f-a1d5-9c0b2e4f6a8d" }
   */
  @Post('{id}/vusbs')
  @Middlewares([json(), MANAGE_DEVICES])
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async createVmVusb(@Path() id: string, @Body() body: CreateVmVusbBody): Promise<{ id: string }> {
    const xapiVm = this.getXapiObject(id as XoVm['id'])
    const usbGroup = this.#object(body.usbGroupId, 'USB_group')
    const xapi = xapiVm.$xapi
    const ref = await xapi.call<string>('VUSB.create', xapiVm.$ref, usbGroup._xapiRef, {})
    const uuid = await xapi.call<string>('VUSB.get_uuid', ref)
    await this.#synced(id as XoVm['id'])
    this.setStatus(createdResp.status)
    return { id: uuid }
  }

  /**
   * Required privilege:
   * - resource: vm, action: manage-devices
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example vusbId "3e5f7a9c-1b2d-4c6e-8f0a-2b4d6f8a0c1e"
   */
  @Delete('{id}/vusbs/{vusbId}')
  @Middlewares(MANAGE_DEVICES)
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteVmVusb(@Path() id: string, @Path() vusbId: string): Promise<void> {
    const vm = this.getObject(id as XoVm['id'])
    const vusb = this.#object(vusbId, 'VUSB')
    if (vusb.vm !== vm.id) {
      throw invalidParameters('the VUSB does not belong to this VM')
    }
    const xapi = this.getXapiObject(vm.id).$xapi
    if (vusb.currentlyAttached === true) {
      await xapi.call('VUSB.unplug', vusb._xapiRef)
    }
    await xapi.call('VUSB.destroy', vusb._xapiRef)
    await this.#synced(vm.id)
  }
}
