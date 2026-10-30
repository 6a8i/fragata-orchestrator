import get from 'lodash/get.js'
import identity from 'lodash/identity.js'
import isEqual from 'lodash/isEqual.js'
import { createLogger } from '@fragata/log'
import { parseDuration } from '@fragata/parse-duration'
import { watch } from 'app-conf'
import assert from 'node:assert'

const { warn } = createLogger('xo:mixins:config')

// if path is undefined, an empty string or an empty array, returns the root value
const niceGet = (value, path) => (path === undefined || path.length === 0 ? value : get(value, path))

export default class Config {
  constructor(app, { appDir, appName, config }) {
    this._app = app
    this._appDir = appDir
    this._config = config
    const watchers = (this._watchers = new Set())

    app.hooks.on('start', async () => {
      app.hooks.once(
        'stop',
        await watch({ appDir, appName, ignoreUnknownFormats: true }, (error, config) => {
          if (error != null) {
            return warn(error)
          }

          this._config = config
          watchers.forEach(watcher => {
            watcher(config)
          })
        })
      )
    })
  }

  get(path) {
    const value = niceGet(this._config, path)
    if (value === undefined) {
      throw new TypeError('missing config entry: ' + path)
    }
    return value
  }

  getDuration(path) {
    return parseDuration(this.get(path))
  }

  getOptional(path) {
    return niceGet(this._config, path)
  }

  getOptionalDuration(path) {
    const value = this.getOptional(path)
    return value === undefined ? undefined : parseDuration(value)
  }

  watch(path, cb) {
    // short syntax for the whole config: watch(cb)
    if (typeof path === 'function') {
      cb = path
      path = undefined
    }

    // internal arg
    const processor = arguments.length > 2 ? arguments[2] : identity

    // unique value to ensure first run even if the value is `undefined`
    let prev = {}

    const watcher = config => {
      try {
        const value = processor(niceGet(config, path))
        if (!isEqual(value, prev)) {
          const previous = prev
          prev = value
          cb(value, previous, path)
        }
      } catch (error) {
        warn('watch', { error, path })
      }
    }

    // ensure sync initialization
    watcher(this._config)

    const watchers = this._watchers
    watchers.add(watcher)
    return () => watchers.delete(watcher)
  }

  watchDuration(path, cb) {
    return this.watch(path, cb, parseDuration)
  }

  async getGuiRoutes() {
    const mounts = this.getOptional('http.mounts') ?? {}

    const guiRoutes = {}

    for (let [url, path] of Object.entries(mounts)) {
      url = url.replace(/(.+)\/$/, '$1')

      const key = `xo${url
        .split('/')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join('')}`
      guiRoutes[key] = { url, path }
    }

    // The web UI mount
    const v6 = Object.values(guiRoutes).find(route => route.path.includes('@fragata/web/dist'))
    guiRoutes.v6 = v6

    // If no default route is present, the web UI is also served at '/'
    if (Object.values(guiRoutes).find(route => route.url === '/') === undefined) {
      assert.notStrictEqual(v6, undefined, 'No path for the web UI (@fragata/web/dist) found in config')
      guiRoutes.default = { path: v6.path, url: '/' }
    }

    return guiRoutes
  }
}
