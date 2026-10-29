import Disposable from 'promise-toolbox/Disposable'

import { compose } from '@fragata/compose'
import { decorateWith } from '@fragata/decorate-with'
import { deduped } from '@fragata/disposable/deduped.js'
import { RemoteAdapter } from '@fragata/backups/RemoteAdapter.mjs'

export default class BackupsRemoteAdapter {
  constructor(app) {
    this._app = app
  }

  // FIXME: invalidate cache on remote option change
  @decorateWith(compose, function (resource) {
    return this._app.debounceResource(resource)
  })
  @decorateWith(deduped, remote => [remote.url])
  @decorateWith(Disposable.factory)
  async *getBackupsRemoteAdapter(remote) {
    const app = this._app
    return new RemoteAdapter(await app.getRemoteHandler(remote), {
      debounceResource: app.debounceResource.bind(app),
      dirMode: app.config.get('backups.dirMode'),
      // this adapter is also used for file restore
      useGetDiskLegacy: app.config.getOptional('backups.useGetDiskLegacy'),
    })
  }
}
