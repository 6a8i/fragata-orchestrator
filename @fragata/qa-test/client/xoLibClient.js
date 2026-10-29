import { createLogger } from '@fragata/log'
import Xo from 'fragata-lib'

const log = createLogger('ws')

const XoConnection = Xo.default

/**
 * Creates and authenticates a WebSocket connection to Fragata Fleet using fragata-lib.
 *
 * This function establishes a persistent WebSocket connection to the Fragata Fleet server
 * and handles authentication. The connection uses Fragata Fleet's native JSON-RPC protocol
 * over WebSocket for efficient real-time communication.
 *
 * @param {Object} config - Connection configuration object
 * @param {string} config.xoUrl - Fragata Fleet server URL (e.g., 'https://xo.example.com' or 'wss://xo.example.com')
 * @param {string} config.username - Username for authentication
 * @param {string} config.password - Password for authentication
 * @param {boolean} [config.allowUnauthorized=false] - Allow unauthorized SSL certificates (optional, use with caution)
 * @returns {Promise<Object>} Authenticated XO client instance with call() method for JSON-RPC calls
 * @throws {Error} If connection fails, authentication fails, or required parameters are missing
 */
export async function xoConnection(config) {
  // Extract and validate configuration parameters
  const { xoUrl, username, password } = config

  // Validate required parameters
  if (!xoUrl || !username || !password) {
    throw new Error('Missing required configuration: xoUrl, username, and password are required')
  }

  try {
    const xo = new XoConnection({ url: xoUrl })

    // Establish WebSocket connection
    await xo.open()

    // Authenticate with credentials
    await xo.signIn({ username, password })

    log.debug('Successfully connected to Fragata Fleet', { url: xoUrl })

    return xo
  } catch (error) {
    log.warn('Failed to connect to XO server', { error })
    throw new Error(`XO connection failed: ${error.message}`)
  }
}
