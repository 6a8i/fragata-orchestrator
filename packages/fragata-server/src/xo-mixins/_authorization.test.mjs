import assert from 'assert/strict'
import test from 'node:test'
import Authorization from './authorization.mjs'

const { describe, it } = test

describe('Authorization', function () {
  const auth = new Authorization({})

  describe('checkFeatureAuthorization', function () {
    it('allows every feature', async function () {
      for (const featureCode of ['RBAC', 'WARM_MIGRATION', 'BACKUP.DELTA', 'UNKNOWN.FEATURE']) {
        await assert.doesNotReject(() => auth.checkFeatureAuthorization(featureCode))
      }
    })
  })

  describe('hasFeatureAuthorization', function () {
    it('returns true for every feature', async function () {
      assert.equal(await auth.hasFeatureAuthorization('RBAC'), true)
      assert.equal(await auth.hasFeatureAuthorization('UNKNOWN.FEATURE'), true)
    })
  })
})
