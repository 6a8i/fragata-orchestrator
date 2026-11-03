import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Request as ExRequest } from 'express'

import { PoolOvaImportController } from './pool-ova-import.controller.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'

const OBJECTS: Record<string, { id: string; type: string; $pool: string; content_type?: string }> = {
  'pool-1': { id: 'pool-1', type: 'pool', $pool: 'pool-1' },
  'sr-1': { id: 'sr-1', type: 'SR', $pool: 'pool-1', content_type: 'user' },
  'sr-iso': { id: 'sr-iso', type: 'SR', $pool: 'pool-1', content_type: 'iso' },
  'sr-other': { id: 'sr-other', type: 'SR', $pool: 'pool-2', content_type: 'user' },
  'net-1': { id: 'net-1', type: 'network', $pool: 'pool-1' },
}

function createController({ importError }: { importError?: Error } = {}) {
  const events: unknown[] = []
  const getObject = (id: string) => {
    const object = OBJECTS[id]
    if (object === undefined) {
      throw new Error(`no such object ${id}`)
    }
    return object
  }
  const restApi = {
    getObject,
    tasks: { create: (properties: unknown) => ({ id: 'task-1', properties, run: (fn: () => unknown) => fn() }) },
    xoApp: {
      getObject,
      storeOvaInTmp: async (_stream: unknown, opts: unknown) => {
        events.push({ storeOvaInTmp: opts })
        return { path: '/tmp/fragata-ova-x/a.ova', dispose: async () => events.push('dispose') }
      },
      importOvaFile: async (path: string, opts: Record<string, unknown>) => {
        events.push({ importOvaFile: { path, ...opts } })
        if (importError !== undefined) {
          throw importError
        }
        return 'vm-1'
      },
    },
  } as unknown as RestApi
  const req = { setTimeout: () => undefined } as unknown as ExRequest
  return { controller: new PoolOvaImportController(restApi), events, req }
}

describe('PoolOvaImportController.importOva', () => {
  it('stores the upload, then imports it in a task and removes the file', async () => {
    const { controller, events, req } = createController()

    const result = await controller.importOva(
      req,
      'pool-1',
      'sr-1',
      'net-1',
      undefined,
      'renamed',
      undefined,
      2,
      undefined,
      'a.ova',
      true
    )

    assert.deepEqual(result, { id: 'vm-1' })
    assert.deepEqual(events, [
      { storeOvaInTmp: { fileName: 'a.ova' } },
      {
        importOvaFile: {
          path: '/tmp/fragata-ova-x/a.ova',
          sr: 'sr-1',
          network: 'net-1',
          networks: undefined,
          nameLabel: 'renamed',
          descriptionLabel: undefined,
          nCpus: 2,
          memory: undefined,
          fileName: 'a.ova',
        },
      },
      'dispose',
    ])
  })

  it('answers with the task in asynchronous mode', async () => {
    const { controller, req } = createController()

    const result = await controller.importOva(req, 'pool-1', 'sr-1')

    assert.deepEqual(result, { taskId: 'task-1' })
  })

  it('removes the file when the import fails', async () => {
    const { controller, events, req } = createController({ importError: new Error('broken VMDK') })

    const sync = true
    const noOverride = undefined
    await assert.rejects(
      controller.importOva(
        req,
        'pool-1',
        'sr-1',
        noOverride,
        noOverride,
        noOverride,
        noOverride,
        noOverride,
        noOverride,
        noOverride,
        sync
      ),
      /broken VMDK/
    )
    assert.ok(events.includes('dispose'))
  })

  for (const [label, sr, network] of [
    ['an SR of another pool', 'sr-other', undefined],
    ['an ISO SR', 'sr-iso', undefined],
    ['an unknown SR', 'sr-unknown', undefined],
    ['an unknown network', 'sr-1', 'net-unknown'],
  ] as const) {
    it(`rejects ${label} before reading the upload`, async () => {
      const { controller, events, req } = createController()

      await assert.rejects(controller.importOva(req, 'pool-1', sr, network), /is not a|is an ISO SR|invalid/i)
      assert.deepEqual(events, [])
    })
  }

  it('rejects an invalid number of CPUs', async () => {
    const { controller, events, req } = createController()

    await assert.rejects(controller.importOva(req, 'pool-1', 'sr-1', undefined, undefined, undefined, undefined, 0))
    assert.deepEqual(events, [])
  })
})
