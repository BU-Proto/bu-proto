import { Hono } from 'hono'
import { UPLOAD_MAX_BYTES } from '../../shared/constants'
import { ApiError, bodyFields } from '../lib/http'
import type { AppEnv } from '../types'

// Pictures uploaded from the portal: board portraits, event covers, win photos. The portal
// shrinks them first; here each one is checked to be a real JPEG, PNG or WebP, kept in D1, and
// served back at /api/uploads/<key>.<ext> for good (its address never changes, so it caches forever).

const app = new Hono<AppEnv>()

const TYPES = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const
type Extension = keyof typeof TYPES

const TOO_BIG = `That picture is over ${UPLOAD_MAX_BYTES / 1024 / 1024} MB, even after shrinking. Try a smaller one.`
const NOT_A_PICTURE = 'That isn’t a JPEG, PNG or WebP picture.'

/** What the file is by its first bytes, never by its name or the type it claims. */
function sniff(bytes: Uint8Array): Extension | null {
  const at = (offset: number, ...values: number[]) => values.every((value, index) => bytes[offset + index] === value)
  if (at(0, 0xff, 0xd8, 0xff)) return 'jpg'
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'png'
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return 'webp'
  return null
}

/** A random key for the address: 16 bytes as hex. */
function newKey(): string {
  return [...crypto.getRandomValues(new Uint8Array(16))].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

// POST /api/admin/uploads, a multipart form with the picture as `file` → 201 { url }.
app.post('/api/admin/uploads', async (c) => {
  const length = Number(c.req.header('Content-Length') ?? 0)
  if (length > UPLOAD_MAX_BYTES + 64 * 1024) {
    await c.req.raw.body?.cancel().catch(() => {})
    throw new ApiError(413, TOO_BIG, { file: TOO_BIG })
  }
  const fields = await bodyFields(c)
  const file = fields?.file
  if (!(file instanceof File) || file.size === 0) throw new ApiError(400, 'Choose a picture to upload.', { file: 'Choose a picture' })
  if (file.size > UPLOAD_MAX_BYTES) throw new ApiError(413, TOO_BIG, { file: TOO_BIG })

  const buffer = await file.arrayBuffer()
  const extension = sniff(new Uint8Array(buffer, 0, Math.min(16, buffer.byteLength)))
  if (!extension) throw new ApiError(415, NOT_A_PICTURE, { file: NOT_A_PICTURE })

  const key = newKey()
  await c.env.DB.prepare('INSERT INTO uploads (key, content_type, bytes, size, name, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(key, TYPES[extension], buffer, buffer.byteLength, file.name.slice(0, 200), c.var.admin.email)
    .run()
  return c.json({ url: `/api/uploads/${key}.${extension}` }, 201)
})

// GET /api/uploads/<key>.<ext> → the picture. Public: these show on the site.
app.get('/api/uploads/:name', async (c) => {
  const match = /^([0-9a-f]{32})\.(jpg|png|webp)$/.exec(c.req.param('name'))
  if (!match) throw new ApiError(404, 'Not found.')
  const row = await c.env.DB.prepare('SELECT content_type, bytes FROM uploads WHERE key = ?')
    .bind(match[1])
    .first<{ content_type: string; bytes: ArrayBuffer | number[] }>()
  if (!row || row.content_type !== TYPES[match[2] as Extension]) throw new ApiError(404, 'Not found.')
  // D1 hands a BLOB back as an array of bytes; the local one as a buffer. Either becomes bytes.
  const body = row.bytes instanceof ArrayBuffer ? new Uint8Array(row.bytes) : Uint8Array.from(row.bytes)
  return c.body(body, 200, {
    'Content-Type': row.content_type,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
  })
})

export default app
