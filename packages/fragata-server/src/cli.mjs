#!/usr/bin/env node

// must come first: sizes the libuv threadpool before anything uses it
import './_threadpool.mjs'
import * as SourceMapSupport from 'source-map-support'
import Bluebird from 'bluebird'
import execPromise from 'exec-promise'
import { catchGlobalErrors } from '@fragata/log/configure'
import { createCachedLookup } from '@fragata/cached-dns.lookup'
import { createLogger } from '@fragata/log'

import main from './index.mjs'

// ===================================================================

// https://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production
if (process.env.NODE_ENV === undefined) {
  process.env.NODE_ENV = 'production'
}

// Better stack traces if possible.
try {
  SourceMapSupport.install({
    handleUncaughtExceptions: false,
  })
} catch (_) {}

// Enable `async_hooks` because it's used by `@fragata/backups/Task` via `node-zone`
//
// See: http://bluebirdjs.com/docs/api/promise.config.html#async-hooks
Bluebird.config({ asyncHooks: true })

// Use Bluebird for all promises as it provides better performance and
// less memory usage.
global.Promise = Bluebird

catchGlobalErrors(createLogger('xo:fragata-server'))

createCachedLookup().patchGlobal()

execPromise(main)
