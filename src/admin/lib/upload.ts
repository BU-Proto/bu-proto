// Uploading a picture from the portal: shrink it in the browser, then send it to the Worker, which
// keeps it and answers with its address on the site (/api/uploads/<key>.<ext>).

import { UPLOAD_MAX_BYTES, UPLOAD_MAX_SIDE } from '../../../shared/constants'
import { api } from '../../lib/api'

/** What the file picker offers. HEIC (iPhone photos) only where the browser can read it. */
export const UPLOAD_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/avif'

/** True when any pixel is see-through, so a logo keeps its clear background (PNG, not JPEG). */
function hasAlpha(context: CanvasRenderingContext2D, width: number, height: number): boolean {
  const { data } = context.getImageData(0, 0, width, height)
  for (let index = 3; index < data.length; index += 4) if (data[index] < 255) return true
  return false
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))

/**
 * The picture at most UPLOAD_MAX_SIDE on its longest side, upright (phone photos carry a
 * rotation the browser applies), as a JPEG, or a PNG when it has see-through parts. Stepped down
 * in quality until it fits under the upload limit.
 */
export async function shrinkPicture(file: File): Promise<File> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('That file isn’t a picture this browser can open. Try a JPEG or PNG.')
  }
  const scale = Math.min(1, UPLOAD_MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Couldn’t prepare that picture. Try another browser.')
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const base = file.name.replace(/\.[^.]+$/, '') || 'picture'
  if (hasAlpha(context, width, height)) {
    const png = await toBlob(canvas, 'image/png')
    if (png && png.size <= UPLOAD_MAX_BYTES) return new File([png], `${base}.png`, { type: 'image/png' })
    // Too heavy as a PNG: fall through to a JPEG on white, which always fits.
    context.globalCompositeOperation = 'destination-over'
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
  }
  for (const quality of [0.86, 0.78, 0.68, 0.55]) {
    const jpeg = await toBlob(canvas, 'image/jpeg', quality)
    if (jpeg && jpeg.size <= UPLOAD_MAX_BYTES) return new File([jpeg], `${base}.jpg`, { type: 'image/jpeg' })
  }
  throw new Error('That picture is too big to upload, even shrunk. Try a smaller one.')
}

/** Shrink the picture, upload it, and answer with the address to put in the field. */
export async function uploadPicture(file: File): Promise<string> {
  const picture = await shrinkPicture(file)
  const form = new FormData()
  form.append('file', picture)
  const { url } = await api<{ url: string }>('/admin/uploads', { body: form })
  return url
}
