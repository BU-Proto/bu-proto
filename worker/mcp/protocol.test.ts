import assert from 'node:assert/strict'
import { test } from 'node:test'
import { handleBody, INVALID_PARAMS, METHOD_NOT_FOUND, PARSE_ERROR, PROTOCOL_VERSIONS, type McpServer } from './protocol.ts'

const calls: { name: string; args: Record<string, unknown> }[] = []

const server: McpServer = {
  info: { name: 'test', title: 'Test', version: '0.0.0' },
  instructions: 'Be nice.',
  tools: [{ name: 'echo', title: 'Echo', description: 'Says it back.', inputSchema: { type: 'object' }, annotations: { readOnlyHint: true } }],
  call: async (name, args) => {
    calls.push({ name, args })
    return { content: [{ type: 'text', text: JSON.stringify(args) }] }
  },
}

const post = (body: unknown) => handleBody(server, typeof body === 'string' ? body : JSON.stringify(body))

test('initialize echoes a version it speaks, and offers the newest otherwise', async () => {
  const known = await post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {} } })
  assert.equal(known.status, 200)
  assert.deepEqual(known.body, {
    jsonrpc: '2.0',
    id: 1,
    result: {
      protocolVersion: '2025-06-18',
      capabilities: { tools: { listChanged: false } },
      serverInfo: server.info,
      instructions: 'Be nice.',
    },
  })
  const unknown = await post({ jsonrpc: '2.0', id: 2, method: 'initialize', params: { protocolVersion: '1999-01-01' } })
  assert.equal((unknown.body as { result: { protocolVersion: string } }).result.protocolVersion, PROTOCOL_VERSIONS[0])
})

test('notifications get 202 and no body', async () => {
  assert.deepEqual(await post({ jsonrpc: '2.0', method: 'notifications/initialized' }), { status: 202, body: null })
})

test('tools/list and tools/call', async () => {
  const list = await post({ jsonrpc: '2.0', id: 'a', method: 'tools/list' })
  assert.deepEqual((list.body as { result: { tools: unknown[] } }).result.tools, server.tools)

  calls.length = 0
  const called = await post({ jsonrpc: '2.0', id: 'b', method: 'tools/call', params: { name: 'echo', arguments: { hi: 1 } } })
  assert.deepEqual(calls, [{ name: 'echo', args: { hi: 1 } }])
  assert.deepEqual(called.body, { jsonrpc: '2.0', id: 'b', result: { content: [{ type: 'text', text: '{"hi":1}' }] } })

  const noArgs = await post({ jsonrpc: '2.0', id: 'c', method: 'tools/call', params: { name: 'echo' } })
  assert.equal((noArgs.body as { result: unknown }).result !== undefined, true)
})

test('unknown tools, bad arguments and unknown methods are JSON-RPC errors', async () => {
  const tool = await post({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'nope' } })
  assert.equal((tool.body as { error: { code: number } }).error.code, INVALID_PARAMS)
  const args = await post({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'echo', arguments: [1] } })
  assert.equal((args.body as { error: { code: number } }).error.code, INVALID_PARAMS)
  const method = await post({ jsonrpc: '2.0', id: 3, method: 'resources/list' })
  assert.equal((method.body as { error: { code: number } }).error.code, METHOD_NOT_FOUND)
})

test('a body that is not JSON is a parse error', async () => {
  const result = await post('{nope')
  assert.equal(result.status, 400)
  assert.equal((result.body as { error: { code: number } }).error.code, PARSE_ERROR)
})

test('a batch answers its requests in order and skips its notifications', async () => {
  const result = await post([
    { jsonrpc: '2.0', id: 1, method: 'ping' },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'ping' },
  ])
  assert.deepEqual(result, {
    status: 200,
    body: [
      { jsonrpc: '2.0', id: 1, result: {} },
      { jsonrpc: '2.0', id: 2, result: {} },
    ],
  })
})

test('a tool that throws is an internal error, not a crash', async () => {
  const failing: McpServer = { ...server, call: async () => Promise.reject(new Error('boom')) }
  const original = console.error
  console.error = () => {}
  try {
    const result = await handleBody(failing, JSON.stringify({ jsonrpc: '2.0', id: 9, method: 'tools/call', params: { name: 'echo' } }))
    assert.deepEqual(result.body, { jsonrpc: '2.0', id: 9, error: { code: -32603, message: 'Something went wrong on our side.' } })
  } finally {
    console.error = original
  }
})
