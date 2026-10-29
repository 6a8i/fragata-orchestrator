import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { formatToolError } from '../../helpers/tool-error.mjs'
import { proxyFetch, type FetchFn } from '../../utils/proxy.mjs'
import type { XoClient } from '../../xo-client.mjs'

const DOC_FETCH_TIMEOUT_MS = 30_000

// The documentation lives in the repository (docs/docs), served as raw Markdown.
const DOCS_BASE_URL = 'https://raw.githubusercontent.com/6a8i/fragata-orchestrator/main/docs/docs'

const DOC_TOPICS = [
  'installation',
  'configuration',
  'backups',
  'restapi',
  'manage',
  'users',
  'architecture',
  'troubleshooting',
  'releases',
] as const

const DOC_PATHS: Record<(typeof DOC_TOPICS)[number], string> = {
  installation: '/getting-started/installation.md',
  configuration: '/getting-started/configuration.md',
  backups: '/backups-and-dr/backup_howto.md',
  restapi: '/automation/restapi.md',
  manage: '/manage-your-infrastructure/manage_infrastructure.md',
  users: '/users-and-access/users.md',
  architecture: '/getting-started/architecture.md',
  troubleshooting: '/getting-started/troubleshooting.md',
  releases: '/getting-started/releases.md',
}

export async function fetchDocumentation(path: string, fetchFn: FetchFn = proxyFetch): Promise<string> {
  const url = `${DOCS_BASE_URL}${path}`

  let response: Response
  try {
    response = await fetchFn(url, {
      headers: { Accept: 'text/markdown, text/plain, text/html' },
      signal: AbortSignal.timeout(DOC_FETCH_TIMEOUT_MS),
    })
  } catch (cause) {
    throw new Error(`Cannot reach documentation server: ${cause instanceof Error ? cause.message : 'Unknown error'}`, {
      cause,
    })
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch documentation: HTTP ${response.status} ${response.statusText}`)
  }

  const raw = await response.text()

  // The source is Markdown; the HTML handling below only matters if a page is
  // ever served rendered, and is harmless on plain Markdown.
  let text = raw
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')

  text = text
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '\n## $1\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim()

  return text
}

export function registerSearchDocs(server: McpServer, getClient: () => XoClient): void {
  server.registerTool(
    'search_documentation',
    {
      title: 'Search Fragata Documentation',
      description:
        'Search and retrieve Fragata documentation. Use this to help users understand Fragata features, configuration, and best practices.',
      inputSchema: {
        topic: z.enum(DOC_TOPICS).describe('Documentation topic to retrieve'),
      },
    },
    async ({ topic }) => {
      const path = DOC_PATHS[topic]

      try {
        const content = await fetchDocumentation(path, getClient().fetchFn)
        return {
          content: [
            {
              type: 'text',
              text: `# Fragata Documentation: ${topic}\n\nSource: ${DOCS_BASE_URL}${path}\n\n${content}`,
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to fetch documentation for "${topic}": ${formatToolError(error)}`,
            },
          ],
          isError: true,
        }
      }
    }
  )
}
