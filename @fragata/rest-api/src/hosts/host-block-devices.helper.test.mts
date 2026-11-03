import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { parseBlockDevices } from './host-block-devices.helper.mjs'

describe('parseBlockDevices', () => {
  it('normalizes the lsblk.py output: paths, numbers, booleans and children', () => {
    const output = JSON.stringify({
      blockdevices: [
        {
          name: 'sda',
          kname: 'sda',
          type: 'disk',
          size: '42949672960',
          mountpoint: '',
          ro: '0',
          children: [{ name: 'sda1', kname: 'sda1', type: 'part', size: '4294967296', mountpoint: '/', ro: '0' }],
        },
        { name: 'sdb', kname: 'sdb', type: 'disk', size: '107374182400', mountpoint: null, ro: '0' },
        { name: 'sr0', kname: 'sr0', type: 'rom', size: '1073741312', mountpoint: '', ro: '1' },
      ],
    })

    assert.deepEqual(parseBlockDevices(output), [
      {
        name: 'sda',
        path: '/dev/sda',
        type: 'disk',
        size: 42949672960,
        mountpoint: '',
        readOnly: false,
        children: [
          {
            name: 'sda1',
            path: '/dev/sda1',
            type: 'part',
            size: 4294967296,
            mountpoint: '/',
            readOnly: false,
            children: [],
          },
        ],
      },
      {
        name: 'sdb',
        path: '/dev/sdb',
        type: 'disk',
        size: 107374182400,
        mountpoint: '',
        readOnly: false,
        children: [],
      },
      {
        name: 'sr0',
        path: '/dev/sr0',
        type: 'rom',
        size: 1073741312,
        mountpoint: '',
        readOnly: true,
        children: [],
      },
    ])
  })

  it('returns no device when the output has none', () => {
    assert.deepEqual(parseBlockDevices('{}'), [])
  })
})
