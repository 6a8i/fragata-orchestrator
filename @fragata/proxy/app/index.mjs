import Config from '@fragata/mixins/Config.mjs'
import Hooks from '@fragata/mixins/Hooks.mjs'
import HttpProxy from '@fragata/mixins/HttpProxy.mjs'
import LiveMount from '@fragata/mixins/live-mount/index.mjs'
import SslCertificate from '@fragata/mixins/SslCertificate.mjs'
import mixin from '@fragata/mixin'
import { createDebounceResource } from '@fragata/disposable/debounceResource.js'

import Api from './mixins/api.mjs'
import Appliance from './mixins/appliance.mjs'
import Authentication from './mixins/authentication.mjs'
import Backups from './mixins/backups.mjs'
import Logs from './mixins/logs.mjs'
import Remotes from './mixins/remotes.mjs'
import ReverseProxy from './mixins/reverseProxy.mjs'

export default class App {
  constructor(opts) {
    mixin(
      this,
      {
        Api,
        Appliance,
        Authentication,
        Backups,
        Config,
        Hooks,
        HttpProxy,
        LiveMount,
        Logs,
        Remotes,
        ReverseProxy,
        SslCertificate,
      },
      [opts]
    )

    const debounceResource = createDebounceResource()
    this.config.watchDuration('resourceCacheDelay', delay => {
      debounceResource.defaultDelay = delay
    })
    this.hooks.once('stop', debounceResource.flushAll)

    this.debounceResource = debounceResource
  }
}
