// REST client for the end-to-end tests against a running orchestrator

const BASE_URL = process.env.FRAGATA_URL ?? 'http://localhost:8080'
const USER = process.env.FRAGATA_USER ?? 'admin@admin.net'
const PASSWORD = process.env.FRAGATA_PASSWORD ?? 'admin'

let cookie

export async function signIn() {
  const response = await fetch(`${BASE_URL}/signin/local`, {
    method: 'POST',
    body: new URLSearchParams({ username: USER, password: PASSWORD }),
    redirect: 'manual',
  })
  cookie = response.headers
    .getSetCookie()
    .map(c => c.split(';')[0])
    .join('; ')
  if (!/(^|; )token=/.test(cookie)) {
    throw new Error(`cannot sign in to ${BASE_URL} as ${USER}`)
  }
}

export class ApiError extends Error {
  constructor(method, path, status, body) {
    super(`${method} ${path} → ${status} ${String(body).slice(0, 300)}`)
    this.status = status
    this.body = body
  }
}

export async function call(method, path, body, headers = {}) {
  const response = await fetch(`${BASE_URL}/rest/v0/${path}`, {
    method,
    headers: { cookie, 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : body instanceof Uint8Array ? body : JSON.stringify(body),
  })
  const text = await response.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  if (!response.ok) {
    throw new ApiError(method, path, response.status, text)
  }
  return data
}

export const get = path => call('GET', path)

/** raw body of the answer, for downloads */
export async function download(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${BASE_URL}/rest/v0/${path}`, {
    method,
    headers: { cookie, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    throw new ApiError(method, path, response.status, await response.text())
  }
  return { data: Buffer.from(await response.arrayBuffer()), headers: response.headers }
}

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/** polls until `fn` returns a value other than `undefined` */
export async function waitFor(fn, { timeout = 60e3, interval = 1e3 } = {}) {
  const end = Date.now() + timeout
  for (;;) {
    const value = await fn()
    if (value !== undefined) {
      return value
    }
    if (Date.now() > end) {
      throw new Error('timeout')
    }
    await sleep(interval)
  }
}
