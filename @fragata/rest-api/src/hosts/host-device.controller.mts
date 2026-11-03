import {
  Body,
  Example,
  Extension,
  Get,
  Middlewares,
  Path,
  Post,
  Query,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { json } from 'express'
import { incorrectState, invalidParameters } from 'fragata-common/api-errors.js'
import type { XoHost } from '@fragata/types'

import { acl } from '../middlewares/acl.middleware.mjs'
import {
  asynchronousActionResp,
  badRequestResp,
  forbiddenOperationResp,
  internalServerErrorResp,
  invalidParameters as invalidParametersResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
} from '../open-api/common/response.common.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import { parseBlockDevices, type HostBlockDevice } from './host-block-devices.helper.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'

type AnyXoObject = {
  id: string
  type: string
  _xapiRef: string
  [key: string]: unknown
}

export type HostPci = {
  id: string
  pciId: string
  className: string
  deviceName: string
  /** `enabled`, `disabled`, `disable_on_reboot` or `enable_on_reboot`; missing when the host cannot tell */
  dom0Access?: string
}

export type HostUsb = {
  id: string
  description: string
  passthroughEnabled: boolean
  usbGroupId?: string
}

export type SetPciDom0AccessBody = {
  pciIds: string[]
  /** `false` hides the PCIs from dom0 so that VMs can use them */
  enabled: boolean
  /** reboot even if VMs cannot be evacuated */
  forceReboot?: boolean
}

export type SetUsbPassthroughBody = {
  pusbId: string
  enabled: boolean
}

/**
 * Devices of a host: passthrough setup of its PCI and USB devices, and its block devices.
 */
@Route('hosts')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('hosts')
@provide(HostDeviceController)
export class HostDeviceController extends XapiXoController<XoHost> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('host', restApi)
  }

  #objectsOfHost(type: string, hostField: string, hostId: string): AnyXoObject[] {
    return (Object.values(this.restApi.xoApp.getObjects({ filter: { type } })) as unknown as AnyXoObject[]).filter(
      obj => obj[hostField] === hostId
    )
  }

  /**
   * PCI devices of the host, with whether dom0 uses them.
   *
   * Required privilege:
   * - resource: host, action: read
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Get('{id}/pcis')
  @Middlewares(acl({ resource: 'host', action: 'read', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async getHostPcis(@Path() id: string): Promise<HostPci[]> {
    const host = this.getXapiObject(id as XoHost['id'])
    const xapi = host.$xapi

    return Promise.all(
      this.#objectsOfHost('PCI', '$host', id).map(async pci => {
        let dom0Access: string | undefined
        try {
          dom0Access = await xapi.call<string>('PCI.get_dom0_access_status', pci._xapiRef)
        } catch {
          // older hosts do not have this method
        }
        return {
          id: pci.id,
          pciId: String(pci.pci_id),
          className: String(pci.class_name),
          deviceName: String(pci.device_name),
          dom0Access,
        }
      })
    )
  }

  /**
   * Block devices (disks and what is built on them: partitions, LVM volumes, RAID arrays...) of the host, from the
   * `lsblk.py` host plugin. Used to choose the disks of a XOSTOR SR: a disk can be used when its `type` is `disk` or
   * `raid*`, it has no `children`, no `mountpoint`, is not `readOnly` and is not a `td*` (tapdisk) device.
   *
   * Required privilege:
   * - resource: host, action: probe:block-devices
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Example<HostBlockDevice[]>([
    {
      name: 'sdb',
      path: '/dev/sdb',
      type: 'disk',
      size: 107374182400,
      mountpoint: '',
      readOnly: false,
      children: [],
    },
  ])
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}/block_devices')
  @Middlewares(acl({ resource: 'host', action: 'probe:block-devices', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async getHostBlockDevices(@Path() id: string): Promise<HostBlockDevice[]> {
    // a halted host cannot run the plugin
    const { power_state } = this.getObject(id as XoHost['id'])
    if (power_state !== 'Running') {
      throw incorrectState({ actual: power_state, expected: 'Running', object: id, property: 'power_state' })
    }
    const host = this.getXapiObject(id as XoHost['id'])
    const output = await host.$xapi.callAsync<string>(
      'host.call_plugin',
      host.$ref,
      'lsblk.py',
      'list_block_devices',
      {}
    )
    return parseBlockDevices(output)
  }

  /**
   * USB devices of the host.
   *
   * Required privilege:
   * - resource: host, action: read
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Get('{id}/usbs')
  @Middlewares(acl({ resource: 'host', action: 'read', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getHostUsbs(@Path() id: string): HostUsb[] {
    this.getObject(id as XoHost['id'])
    return this.#objectsOfHost('PUSB', 'host', id).map(pusb => ({
      id: pusb.id,
      description: String(pusb.description),
      passthroughEnabled: pusb.passthroughEnabled === true,
      usbGroupId: pusb.usbGroup as string | undefined,
    }))
  }

  /**
   * Gives the PCIs to, or takes them from, dom0, then reboots the host to apply it.
   *
   * Required privilege:
   * - resource: host, action: manage-devices
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   * @example body { "pciIds": ["c5b7f6c2-8d39-4f0e-a3e7-50d7c43fa40a"], "enabled": false }
   */
  @Example(taskLocation)
  @Post('{id}/actions/set_pci_dom0_access')
  @Middlewares([json(), acl({ resource: 'host', action: 'manage-devices', objectId: 'params.id' })])
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  setPciDom0Access(
    @Path() id: string,
    @Body() body: SetPciDom0AccessBody,
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const hostId = id as XoHost['id']
    const action = async () => {
      const pcis = this.#objectsOfHost('PCI', '$host', id)
      const selected = body.pciIds.map(pciId => {
        const pci = pcis.find(candidate => candidate.id === pciId)
        if (pci === undefined) {
          throw invalidParameters(`the PCI ${pciId} is not on this host`)
        }
        return pci
      })

      const xapi = this.getXapiObject(hostId).$xapi
      const method = body.enabled ? 'PCI.enable_dom0_access' : 'PCI.disable_dom0_access'
      for (const pci of selected) {
        await xapi.call(method, pci._xapiRef)
      }
      await xapi.rebootHost(hostId, body.forceReboot ?? false)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: { name: 'set PCI dom0 access', objectId: hostId, params: body },
    })
  }

  /**
   * Enables or disables the passthrough of a USB device of the host.
   *
   * Required privilege:
   * - resource: host, action: manage-devices
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   * @example body { "pusbId": "4a6c8e0b-2d4f-4a1c-9e3b-5d7f9a1c3e5b", "enabled": true }
   */
  @Post('{id}/actions/set_usb_passthrough')
  @Middlewares([json(), acl({ resource: 'host', action: 'manage-devices', objectId: 'params.id' })])
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async setUsbPassthrough(@Path() id: string, @Body() body: SetUsbPassthroughBody): Promise<void> {
    const pusb = this.#objectsOfHost('PUSB', 'host', id).find(candidate => candidate.id === body.pusbId)
    if (pusb === undefined) {
      throw invalidParameters(`the USB device ${body.pusbId} is not on this host`)
    }
    const host = this.getXapiObject(id as XoHost['id'])
    await host.$xapi.call('PUSB.set_passthrough_enabled', pusb._xapiRef, body.enabled)
    // the listing reads the objects updated from the XAPI events
    await host.$xapi.barrier(host.$ref)
  }

  /**
   * Scans the host for new USB devices.
   *
   * Required privilege:
   * - resource: host, action: manage-devices
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Post('{id}/actions/scan_usbs')
  @Middlewares(acl({ resource: 'host', action: 'manage-devices', objectId: 'params.id' }))
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async scanHostUsbs(@Path() id: string): Promise<void> {
    const host = this.getXapiObject(id as XoHost['id'])
    await host.$xapi.call('PUSB.scan', host.$ref)
    await host.$xapi.barrier(host.$ref)
  }
}
