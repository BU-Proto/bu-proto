// The Model Context Protocol, as much of it as a tools-only server needs: JSON-RPC 2.0 over
// Streamable HTTP, stateless. Every POST carries one message (or, from older clients, a batch) and
// gets its answer as plain JSON; there is no session id and no server-sent stream, which the
// spec allows (https://modelcontextprotocol.io/specification/2025-11-25/basic/transports).
//
// Plain TypeScript with no imports, so `npm test` loads it straight from Node. What the tools do
// lives in ./tools.ts; the HTTP side and auth in ../routes/mcp.ts.

/** Protocol versions this server speaks, newest first. A client asking for another gets the newest. */
export const PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'] as const

export interface ToolAnnotations {
  title?: string
  /** Changes nothing. */
  readOnlyHint?: boolean
  /** May delete something or reach people outside the team (an email). Only meaningful for writes. */
  destructiveHint?: boolean
  /** Calling again with the same arguments changes nothing more. */
  idempotentHint?: boolean
  /** Reaches past the portal's own data (a web page, an email to someone, Claude). */
  openWorldHint?: boolean
}

/** A tool as tools/list describes it. */
export interface McpTool {
  name: string
  title: string
  description: string
  inputSchema: Record<string, unknown>
  annotations: ToolAnnotations
}

export interface ToolResult {
  content: { type: 'text'; text: string }[]
  structuredContent?: Record<string, unknown>
  isError?: boolean
}

/** What a server is: who it says it is, its tools, and how to call one. */
export interface McpServer {
  info: { name: string; title: string; version: string }
  /** Shown to the model once, on initialize: what this server is and how to use it well. */
  instructions: string
  tools: readonly McpTool[]
  /** Run a tool that tools/list named. An error the model can act on comes back as `isError`, not a throw. */
  call: (name: string, args: Record<string, unknown>) => Promise<ToolResult>
}

type Id = string | number | null

export interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: Id
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

export const PARSE_ERROR = -32700
export const INVALID_REQUEST = -32600
export const METHOD_NOT_FOUND = -32601
export const INVALID_PARAMS = -32602
export const INTERNAL_ERROR = -32603

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const isId = (value: unknown): value is Id => typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value)) || value === null

function failure(id: Id, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message } }
}

/** The answer to one JSON-RPC message, or null for a notification or a response (neither is answered). */
export async function handleMessage(server: McpServer, message: unknown): Promise<JsonRpcResponse | null> {
  if (!isObject(message) || message.jsonrpc !== '2.0') return failure(null, INVALID_REQUEST, 'Not a JSON-RPC 2.0 message.')
  // A response to something we asked (we never ask), or a notification: nothing to say back.
  if (!('method' in message)) return null
  if (typeof message.method !== 'string') return failure(isId(message.id) ? message.id : null, INVALID_REQUEST, 'method must be a string.')
  if (!('id' in message)) return null
  if (!isId(message.id)) return failure(null, INVALID_REQUEST, 'id must be a string or a number.')

  const id = message.id
  const params = isObject(message.params) ? message.params : {}
  try {
    switch (message.method) {
      case 'initialize': {
        const asked = typeof params.protocolVersion === 'string' ? params.protocolVersion : ''
        const protocolVersion = (PROTOCOL_VERSIONS as readonly string[]).includes(asked) ? asked : PROTOCOL_VERSIONS[0]
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion,
            capabilities: { tools: { listChanged: false } },
            serverInfo: server.info,
            instructions: server.instructions,
          },
        }
      }
      case 'ping':
        return { jsonrpc: '2.0', id, result: {} }
      case 'tools/list':
        // One page: the list is short enough that a cursor would only add a round trip.
        return { jsonrpc: '2.0', id, result: { tools: server.tools } }
      case 'tools/call': {
        const name = params.name
        if (typeof name !== 'string' || !server.tools.some((tool) => tool.name === name)) {
          return failure(id, INVALID_PARAMS, `Unknown tool: ${String(name)}`)
        }
        if (params.arguments !== undefined && !isObject(params.arguments)) {
          return failure(id, INVALID_PARAMS, 'arguments must be an object.')
        }
        return { jsonrpc: '2.0', id, result: await server.call(name, params.arguments ?? {}) }
      }
      default:
        return failure(id, METHOD_NOT_FOUND, `This server doesn't do ${message.method}.`)
    }
  } catch (error) {
    console.error('mcp', message.method, error)
    return failure(id, INTERNAL_ERROR, 'Something went wrong on our side.')
  }
}

/**
 * The HTTP answer to a POSTed body: 200 with the response (or responses, for a batch), or 202
 * with nothing when the body held only notifications.
 */
export async function handleBody(server: McpServer, raw: string): Promise<{ status: 200 | 202 | 400; body: unknown }> {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { status: 400, body: failure(null, PARSE_ERROR, 'The body is not JSON.') }
  }
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return { status: 400, body: failure(null, INVALID_REQUEST, 'An empty batch.') }
    const answers: JsonRpcResponse[] = []
    // In order, not in parallel: a batch's writes may depend on each other.
    for (const message of parsed) {
      const answer = await handleMessage(server, message)
      if (answer) answers.push(answer)
    }
    return answers.length ? { status: 200, body: answers } : { status: 202, body: null }
  }
  const answer = await handleMessage(server, parsed)
  return answer ? { status: 200, body: answer } : { status: 202, body: null }
}
