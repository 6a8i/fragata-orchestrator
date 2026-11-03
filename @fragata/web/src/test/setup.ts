import { enableAutoUnmount } from '@vue/test-utils'

// Composables that rely on remote resources call `fetch`
// as soon as they are used. In unit tests we never want to hit the network, so
// `fetch` is stubbed with a never-settling promise: the request simply stays
// pending for the lifetime of the test. Tests that need a real response can
// override this stub locally with `vi.stubGlobal('fetch', …)`.
vi.stubGlobal(
  'fetch',
  vi.fn(() => new Promise(() => {}))
)

// Collections are watched through server-sent events, which happy-dom does not
// provide: an event source that never connects, like the stubbed `fetch`.
class NeverOpenEventSource extends EventTarget {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSED = 2
  readonly readyState = NeverOpenEventSource.CONNECTING
  readonly withCredentials: boolean
  onopen = null
  onmessage = null
  onerror = null

  constructor(
    readonly url: string,
    init?: EventSourceInit
  ) {
    super()
    this.withCredentials = init?.withCredentials ?? false
  }

  close() {}
}
vi.stubGlobal('EventSource', NeverOpenEventSource)

enableAutoUnmount(afterEach)
