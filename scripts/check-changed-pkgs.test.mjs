import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getChangedPackages, isIgnoredFile } from './check-changed-pkgs.js'

const PACKAGE_NAMES_BY_DIR = new Map([
  ['@fragata/types', '@fragata/types'],
  ['@fragata/babel-config', '@fragata/babel-config'],
  ['@fragata/backups', '@fragata/backups'],
  ['@fragata/lite', '@fragata/lite'],
  ['@fragata/vmware-explorer', '@fragata/vmware-explorer'],
  ['packages/fragata-server', 'fragata-server'],
])

const changedPackages = changedFiles => getChangedPackages(changedFiles, PACKAGE_NAMES_BY_DIR)
const changedPackageNames = changedFiles => Array.from(changedPackages(changedFiles).keys()).sort()

describe('isIgnoredFile', function () {
  for (const file of [
    '@fragata/nbd-client/tests/ca-cert.pem',
    // a test file which does not follow the `*.test.*` naming
    '@fragata/xml/test/parse.js',
    '@fragata/backups/_runners/_vmRunners/__snapshots__/IncrementalXapi.mjs.snap',
    '@fragata/backups/RemoteAdapter.integ.mjs',
    '@fragata/backups/RemoteAdapter.test.mjs',
    '@fragata/backups/docs/design.md',
    '@fragata/backups/README.md',
    '@fragata/web-core/src/composables/foo.spec.ts',
    // a test directory nested in the package sources
    '@fragata/web/src/test/create-vm.ts',
    'packages/fragata-cli/.USAGE.md',
    'packages/fragata-server/.npmignore',
    'packages/fragata-server/perf.load.mjs',
    '@fragata/web/src/shared/utils/index.spec.ts',
  ]) {
    it(`ignores ${file}`, function () {
      assert.equal(isIgnoredFile(file), true)
    })
  }

  for (const file of [
    '@fragata/types/index.mts',
    '@fragata/backups/RemoteAdapter.mjs',
    '@fragata/backups/package.json',
    // not a test file, only a file *about* tests
    '@fragata/backups/testUtils.mjs',
    // `docs` and `test` as file names, not as directories
    'packages/fragata-server/docs.md',
    'packages/fragata-server/test.mjs',
    '@fragata/web/src/shared/utils/index.ts',
  ]) {
    it(`does not ignore ${file}`, function () {
      assert.equal(isIgnoredFile(file), false)
    })
  }
})

describe('getChangedPackages', function () {
  it('maps a file to the package which owns its directory', function () {
    assert.deepEqual(changedPackageNames(['packages/fragata-server/src/api/vm.mjs', '@fragata/types/index.mts']), [
      '@fragata/types',
      'fragata-server',
    ])
  })

  it('reports the files which require the release of each package', function () {
    assert.deepEqual(
      Object.fromEntries(
        changedPackages([
          'packages/fragata-server/src/api/vm.mjs',
          'packages/fragata-server/src/api/vm.spec.mjs',
          'packages/fragata-server/package.json',
        ])
      ),
      { 'fragata-server': ['packages/fragata-server/src/api/vm.mjs', 'packages/fragata-server/package.json'] }
    )
  })

  it('ignores files which are not in a package', function () {
    assert.deepEqual(
      changedPackageNames([
        'CHANGELOG.unreleased.md',
        '.github/workflows/ci.yml',
        'scripts/check-changed-pkgs.js',
        'docs/backups.md',
        'packages/not-a-package/index.js',
      ]),
      []
    )
  })

  it('ignores files directly in a package scope directory', function () {
    assert.deepEqual(changedPackageNames(['@fragata/README.md', 'packages/tsconfig.json']), [])
  })

  it('ignores packages which are never listed in the changelog', function () {
    assert.deepEqual(
      changedPackageNames(['@fragata/babel-config/index.js', '@fragata/lite/src/App.vue', '@fragata/types/index.mts']),
      ['@fragata/types']
    )
  })

  it('ignores a package whose changes are limited to ignored files', function () {
    assert.deepEqual(
      changedPackageNames([
        '@fragata/backups/README.md',
        '@fragata/backups/tests/fixture.json',
        '@fragata/types/types.test.mts',
      ]),
      []
    )
  })

  it('maps a vectura file to the package which bundles its binary', function () {
    assert.deepEqual(
      changedPackageNames([
        '@fragata/vmware-explorer/vectura/src/main.rs',
        '@fragata/vmware-explorer/vectura/tests/cli.rs',
      ]),
      ['@fragata/vmware-explorer']
    )
  })

  it('handles an empty list of changed files', function () {
    assert.deepEqual(changedPackageNames([]), [])
  })
})
