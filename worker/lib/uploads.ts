// Where uploaded files live: the UPLOADS R2 bucket. Pictures from the portal (board portraits,
// event covers, win photos) under pictures/<key>.<ext>, and role applications' résumés under
// resumes/<application id>.pdf.
//
// Before R2 they were kept in D1: pictures in uploads.bytes, résumés cut into parts in
// role_application_resume_parts. Anything still there is served from D1 until it's moved, and
// moveUploadsToR2 (run by the daily cron) moves it a batch at a time, leaving uploads rows as a
// record with no bytes and dropping the résumé parts.

export const PICTURE_TYPES = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const
export type PictureExtension = keyof typeof PICTURE_TYPES

export const pictureKey = (key: string, extension: PictureExtension) => `pictures/${key}.${extension}`
export const resumeKey = (applicationId: number) => `resumes/${applicationId}.pdf`

/** D1 hands a BLOB back as an array of bytes; the local one as a buffer. Either becomes bytes. */
export const blobBytes = (value: ArrayBuffer | number[]) => (value instanceof ArrayBuffer ? new Uint8Array(value) : Uint8Array.from(value))

const extensionOf = (contentType: string) =>
  (Object.keys(PICTURE_TYPES) as PictureExtension[]).find((extension) => PICTURE_TYPES[extension] === contentType) ?? null

/** Copies one picture still held in D1 into R2, then empties its bytes in D1. */
export async function movePicture(env: Env, row: { key: string; content_type: string; bytes: ArrayBuffer | number[] }) {
  const extension = extensionOf(row.content_type)
  if (!extension) return
  await env.UPLOADS.put(pictureKey(row.key, extension), blobBytes(row.bytes), { httpMetadata: { contentType: row.content_type } })
  await env.DB.prepare("UPDATE uploads SET bytes = X'' WHERE key = ?").bind(row.key).run()
}

/** Removes these applications' résumés from R2. */
export async function deleteResumes(env: Env, applicationIds: number[]) {
  if (applicationIds.length > 0) await env.UPLOADS.delete(applicationIds.map(resumeKey))
}

/** Moves up to `limit` pictures and `limit` résumés still held in D1 into R2. */
export async function moveUploadsToR2(env: Env, limit = 50) {
  const pictures = await env.DB.prepare('SELECT key, content_type, bytes FROM uploads WHERE length(bytes) > 0 LIMIT ?')
    .bind(limit)
    .all<{ key: string; content_type: string; bytes: ArrayBuffer | number[] }>()
  for (const row of pictures.results) await movePicture(env, row)

  const resumes = await env.DB.prepare('SELECT DISTINCT application_id FROM role_application_resume_parts LIMIT ?')
    .bind(limit)
    .all<{ application_id: number }>()
  for (const { application_id: id } of resumes.results) {
    const parts = await env.DB.prepare('SELECT data FROM role_application_resume_parts WHERE application_id = ? ORDER BY part')
      .bind(id)
      .all<{ data: ArrayBuffer | number[] }>()
    const file = await new Blob(parts.results.map(({ data }) => blobBytes(data))).arrayBuffer()
    await env.UPLOADS.put(resumeKey(id), file, { httpMetadata: { contentType: 'application/pdf' } })
    await env.DB.prepare('DELETE FROM role_application_resume_parts WHERE application_id = ?').bind(id).run()
  }
  if (pictures.results.length > 0 || resumes.results.length > 0) {
    console.log(`Moved ${pictures.results.length} pictures and ${resumes.results.length} résumés from D1 to R2.`)
  }
}
