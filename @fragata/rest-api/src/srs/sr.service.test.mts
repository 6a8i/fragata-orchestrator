import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { invalidParameters, noSuchObject } from 'fragata-common/api-errors.js'
import type { XoPool, XoSr } from '@fragata/types'

import { SrService, type CreateSrBody, type CreateXostorBody } from './sr.service.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'

describe('SrService.create', () => {
  it('resolves the host id to its XAPI ref, maps XO names to XAPI names, and returns the SR uuid', async () => {
    let srCreateParams: Record<string, unknown> | undefined
    let getFieldArgs: unknown[] | undefined
    let getXapiObjectArgs: unknown[] | undefined

    const fakeXapi = {
      SR_create: async (params: Record<string, unknown>) => {
        srCreateParams = params
        return 'OpaqueRef:new-sr'
      },
      getField: async (...args: unknown[]) => {
        getFieldArgs = args
        return 'sr-uuid-123'
      },
    }
    const xapiHost = { $ref: 'OpaqueRef:host-1', $xapi: fakeXapi }
    const restApi = {
      getXapiObject: (...args: unknown[]) => {
        getXapiObjectArgs = args
        return xapiHost
      },
    } as unknown as RestApi

    const service = new SrService(restApi)
    const body = {
      hostId: 'host-uuid',
      name_label: 'NFS store',
      SR_type: 'nfs',
      size: 1234,
      device_config: { server: '10.0.0.1', serverpath: '/data' },
    } as CreateSrBody

    const id = await service.create(body)

    // host id is resolved against the 'host' collection
    assert.deepEqual(getXapiObjectArgs, ['host-uuid', 'host'])
    // body.hostId (XO id) is replaced by the XAPI ref, SR_type/size are mapped to
    // XAPI's type/physical_size, shared is computed from SR_type (nfs -> shared),
    // device_config is forwarded untouched
    assert.deepEqual(srCreateParams, {
      name_label: 'NFS store',
      type: 'nfs',
      physical_size: 1234,
      shared: true,
      device_config: { server: '10.0.0.1', serverpath: '/data' },
      host: 'OpaqueRef:host-1',
    })
    // uuid is read back from the freshly created SR ref
    assert.deepEqual(getFieldArgs, ['SR', 'OpaqueRef:new-sr', 'uuid'])
    assert.equal(id, 'sr-uuid-123')
  })

  it('computes shared from SR_type and forces content_type for ISO SRs', async () => {
    const srCreateCalls: Record<string, unknown>[] = []
    const fakeXapi = {
      SR_create: async (params: Record<string, unknown>) => {
        srCreateCalls.push(params)
        return 'OpaqueRef:new-sr'
      },
      getField: async () => 'sr-uuid-123',
    }
    const restApi = {
      getXapiObject: () => ({ $ref: 'OpaqueRef:host-1', $xapi: fakeXapi }),
    } as unknown as RestApi
    const service = new SrService(restApi)

    // local SR type -> not shared
    await service.create({
      hostId: 'host-uuid',
      name_label: 'local',
      SR_type: 'ext',
      device_config: {},
    } as CreateSrBody)
    assert.equal(srCreateCalls[0].shared, false)
    assert.equal('content_type' in srCreateCalls[0], false)

    // remote ISO library -> shared, content_type forced to 'iso'
    await service.create({
      hostId: 'host-uuid',
      name_label: 'isos',
      SR_type: 'iso',
      device_config: { location: '10.0.0.1:/isos' },
    } as CreateSrBody)
    assert.equal(srCreateCalls[1].shared, true)
    assert.equal(srCreateCalls[1].content_type, 'iso')

    // local ISO library (legacy_mode) -> not shared
    await service.create({
      hostId: 'host-uuid',
      name_label: 'local isos',
      SR_type: 'iso',
      device_config: { legacy_mode: 'true', location: '/media/isos' },
    } as CreateSrBody)
    assert.equal(srCreateCalls[2].shared, false)
    assert.equal(srCreateCalls[2].content_type, 'iso')
  })


  it('rejects linstor (XOSTOR) SRs, which have their own route', async () => {
    const service = new SrService({} as RestApi)
    const body = {
      hostId: 'host-uuid',
      name_label: 'XOSTOR',
      SR_type: 'linstor',
      device_config: {},
    } as CreateSrBody

    await assert.rejects(service.create(body), (error: unknown) => invalidParameters.is(error))
  })
})

describe('SrService XOSTOR creation', () => {
  const POOL_ID = 'pool-1'
  const objects: Record<string, { id: string; type: string; $pool: string }> = {
    [POOL_ID]: { id: POOL_ID, type: 'pool', $pool: POOL_ID },
    'host-1': { id: 'host-1', type: 'host', $pool: POOL_ID },
    'host-2': { id: 'host-2', type: 'host', $pool: POOL_ID },
    'host-3': { id: 'host-3', type: 'host', $pool: POOL_ID },
    'host-other': { id: 'host-other', type: 'host', $pool: 'pool-2' },
    'network-1': { id: 'network-1', type: 'network', $pool: POOL_ID },
  }

  function makeService() {
    const calls: { name: string; params: Record<string, unknown>; opts: unknown }[] = []
    const restApi = {
      getObject: (id: string, type: string) => {
        const object = objects[id]
        if (object === undefined || object.type !== type) {
          noSuchObject(id, type)
        }
        return object
      },
      callApiMethod: async (name: string, params: Record<string, unknown>, opts: unknown) => {
        calls.push({ name, params, opts })
        return 'sr-uuid-xostor'
      },
    } as unknown as RestApi
    return { calls, service: new SrService(restApi) }
  }

  const validBody = (): CreateXostorBody => ({
    name_label: ' XOSTOR ',
    disksByHost: { 'host-1': ['/dev/sdb'], 'host-2': ['/dev/sdb', '/dev/sdc'], 'host-3': [] },
    provisioning: 'thin',
    replication: 2,
  })

  it('maps the body to the xostor.create params and calls the API method as the current user', async () => {
    const { calls, service } = makeService()

    const params = service.prepareXostorCreation(POOL_ID as XoPool['id'], {
      ...validBody(),
      name_description: 'replicated',
      ignoreFileSystems: true,
      preferredInterface: { networkId: 'network-1', name: ' storage ' },
    })
    const id = await service.createXostor(params, { remoteAddress: '10.0.0.2' })

    assert.equal(id, 'sr-uuid-xostor')
    assert.deepEqual(calls, [
      {
        name: 'xostor.create',
        params: {
          // hosts without disks are left out, no license is involved
          disksByHost: { 'host-1': ['/dev/sdb'], 'host-2': ['/dev/sdb', '/dev/sdc'] },
          name: 'XOSTOR',
          description: 'replicated',
          provisioning: 'thin',
          replication: 2,
          ignoreFileSystems: true,
          preferredInterface: { networkId: 'network-1', name: 'storage' },
        },
        opts: { remoteAddress: '10.0.0.2' },
      },
    ])
  })

  it('leaves the optional params out when they are not given', () => {
    const { service } = makeService()
    const params = service.prepareXostorCreation(POOL_ID as XoPool['id'], validBody())
    assert.deepEqual(Object.keys(params).sort(), ['disksByHost', 'name', 'provisioning', 'replication'])
  })

  it('rejects invalid requests before calling the API method', () => {
    const { calls, service } = makeService()
    const prepare = (patch: Partial<CreateXostorBody>) => () =>
      service.prepareXostorCreation(POOL_ID as XoPool['id'], { ...validBody(), ...patch })
    const isInvalid = (error: unknown) => invalidParameters.is(error)

    // no host with disks
    assert.throws(prepare({ disksByHost: { 'host-1': [] } }), isInvalid)
    // host of another pool
    assert.throws(prepare({ disksByHost: { 'host-other': ['/dev/sdb'] }, replication: 1 }), isInvalid)
    // not a device path, or one the lvm plugin cannot receive
    assert.throws(prepare({ disksByHost: { 'host-1': ['sdb'] }, replication: 1 }), isInvalid)
    assert.throws(prepare({ disksByHost: { 'host-1': ['/dev/sdb,/dev/sdc'] }, replication: 1 }), isInvalid)
    // duplicate disk
    assert.throws(prepare({ disksByHost: { 'host-1': ['/dev/sdb', '/dev/sdb'] }, replication: 1 }), isInvalid)
    // replication higher than the number of hosts with disks, or not a positive integer
    assert.throws(prepare({ replication: 3 }), isInvalid)
    assert.throws(prepare({ replication: 0 }), isInvalid)
    assert.throws(prepare({ replication: 1.5 }), isInvalid)
    // provisioning and name
    assert.throws(prepare({ provisioning: 'fat' as CreateXostorBody['provisioning'] }), isInvalid)
    assert.throws(prepare({ name_label: '  ' }), isInvalid)
    // preferred interface without a name
    assert.throws(prepare({ preferredInterface: { networkId: 'network-1', name: ' ' } }), isInvalid)

    // unknown pool, host or network
    const isNoSuchObject = (error: unknown) => noSuchObject.is(error)
    assert.throws(() => service.prepareXostorCreation('pool-unknown' as XoPool['id'], validBody()), isNoSuchObject)
    assert.throws(prepare({ disksByHost: { 'host-unknown': ['/dev/sdb'] }, replication: 1 }), isNoSuchObject)
    assert.throws(prepare({ preferredInterface: { networkId: 'network-unknown', name: 'storage' } }), isNoSuchObject)

    assert.equal(calls.length, 0)
  })
})

describe('SrService.delete', () => {
  it('deletes a XOSTOR SR and its volume groups, without any license step', async () => {
    const xostorDeleteCalls: unknown[] = []
    const xapi = {
      xostor_delete: async (ref: unknown) => {
        xostorDeleteCalls.push(ref)
      },
      destroySr: async () => assert.fail('destroySr must not be called for a XOSTOR SR'),
    }
    const restApi = {
      getObject: () => ({ id: 'sr-1', SR_type: 'linstor' }),
      getXapiObject: () => ({ $ref: 'OpaqueRef:sr-1', $xapi: xapi }),
      // the license APIs are not available
      xoApp: {},
    } as unknown as RestApi

    await new SrService(restApi).delete('sr-1' as XoSr['id'])

    assert.deepEqual(xostorDeleteCalls, ['OpaqueRef:sr-1'])
  })
})
