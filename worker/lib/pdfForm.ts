import {
  EncryptedPDFError,
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFHexString,
  PDFName,
  PDFOptionList,
  PDFRadioGroup,
  PDFSignature,
  PDFString,
  PDFTextField,
  StandardFonts,
  type PDFField,
} from 'pdf-lib'
import type { FormAnswer, FormField } from '../../shared/api'
import { ApiError } from './http'

// A PDF form's own boxes (its AcroForm fields): read them so Claude knows what's asked, and fill
// them from Claude's answers. The filled copy keeps its boxes, so anyone can still change a value
// before it goes out. A signature box is never filled, whatever it's asked to hold.

/** Box names and tooltips that mean a signature or initials, even on a plain text box. */
const SIGNATURE = /\b(sign(ature)?|signed by|initials?)\b/i

/**
 * Whether a box is for a signature: a signature field, or any box but a checkbox whose name or
 * tooltip says so. Names are split into words first ("officer_signature", "OfficerSignature"),
 * or the word match would miss them.
 */
function isSignature(field: PDFField, label: string): boolean {
  if (field instanceof PDFSignature) return true
  if (field instanceof PDFCheckBox) return false
  const words = `${field.getName()} ${label}`.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_.\-[\]]+/g, ' ')
  return SIGNATURE.test(words)
}

const LOCKED = 'That PDF is locked (encrypted), so its boxes can’t be filled. Ask them for an unlocked copy.'

async function load(bytes: Uint8Array): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false })
  } catch (error) {
    if (error instanceof EncryptedPDFError) throw new ApiError(422, LOCKED, { file: LOCKED })
    throw new ApiError(422, 'That file couldn’t be read as a PDF.', { file: 'Not a readable PDF' })
  }
}

/** A field's tooltip (its "alternate name"), which usually says what the box is for. */
function tooltip(field: PDFField): string {
  const value = field.acroField.dict.lookup(PDFName.of('TU'))
  return value instanceof PDFString || value instanceof PDFHexString ? value.decodeText().trim() : ''
}

function fieldType(field: PDFField, label: string): Pick<FormField, 'type' | 'options' | 'multi'> | null {
  if (isSignature(field, label)) return { type: 'signature' }
  if (field instanceof PDFTextField) return { type: field.isMultiline() ? 'paragraph' : 'text' }
  if (field instanceof PDFCheckBox) return { type: 'checkbox' }
  if (field instanceof PDFDropdown) return { type: 'choice', options: field.getOptions() }
  if (field instanceof PDFRadioGroup) return { type: 'choice', options: field.getOptions() }
  if (field instanceof PDFOptionList) return { type: 'choice', options: field.getOptions(), multi: field.isMultiselect() }
  return null // buttons and anything else a person can't fill
}

/** Every box a person fills on the form, with its page and place so it can be matched to its printed label. */
export async function readPdfFields(bytes: Uint8Array): Promise<FormField[]> {
  const doc = await load(bytes)
  const pages = doc.getPages()
  const fields: FormField[] = []
  for (const field of doc.getForm().getFields()) {
    const label = tooltip(field)
    const type = fieldType(field, label)
    if (!type) continue
    const widget = field.acroField.getWidgets()[0]
    let page: number | undefined
    let rect: FormField['rect']
    if (widget) {
      const ref = doc.context.getObjectRef(widget.dict)
      const index = pages.findIndex((candidate) => (ref ? candidate.node.Annots()?.asArray().includes(ref) : false))
      if (index >= 0) page = index + 1
      const { x, y, width, height } = widget.getRectangle()
      rect = [Math.round(x), Math.round(y), Math.round(width), Math.round(height)]
    }
    fields.push({ name: field.getName(), label: label === field.getName() ? '' : label, ...type, ...(page && { page }), ...(rect && { rect }) })
  }
  return fields
}

const YES = /^(yes|y|true|x|checked|on|1)$/i

/**
 * The form with each answer in its box. Returns what couldn't go in (a value that isn't one of a
 * choice's options, text longer than its box allows, a box that isn't on the form) so the
 * teammate is told, never a silent gap.
 */
export async function fillPdf(bytes: Uint8Array, answers: FormAnswer[]): Promise<{ bytes: Uint8Array; problems: string[] }> {
  const doc = await load(bytes)
  const form = doc.getForm()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  // Helvetica only draws what its encoding has; anything else would stop the save.
  const drawable = new Set(font.getCharacterSet())
  const clean = (value: string) =>
    [...value.replace(/\r\n?/g, '\n')].map((char) => (char === '\n' || drawable.has(char.codePointAt(0) ?? 0) ? char : '?')).join('')

  const problems: string[] = []
  for (const answer of answers) {
    const field = form.getFieldMaybe(answer.field)
    if (!field) {
      problems.push(`“${answer.field}” isn’t a box on this form`)
      continue
    }
    const label = tooltip(field)
    if (isSignature(field, label)) {
      problems.push(`${label || answer.field}: a signature is left for a person`)
      continue
    }
    const value = answer.value.trim()
    try {
      if (field instanceof PDFTextField) {
        const max = field.getMaxLength()
        if (max !== undefined && value.length > max) {
          problems.push(`${label || answer.field}: “${value}” is longer than its box allows (${max})`)
          continue
        }
        field.setText(clean(value) || undefined)
      } else if (field instanceof PDFCheckBox) {
        if (YES.test(value)) field.check()
        else field.uncheck()
      } else if (field instanceof PDFDropdown || field instanceof PDFRadioGroup) {
        if (!value) field.clear()
        else if (field.getOptions().includes(value)) field.select(value)
        else if (field instanceof PDFDropdown && field.isEditable()) field.select(clean(value))
        else problems.push(`${label || answer.field}: “${value}” isn’t one of its options`)
      } else if (field instanceof PDFOptionList) {
        const picked = value ? value.split(';').map((item) => item.trim()).filter(Boolean) : []
        const unknown = picked.filter((item) => !field.getOptions().includes(item))
        if (unknown.length) problems.push(`${label || answer.field}: “${unknown.join('”, “')}” isn’t one of its options`)
        else if (picked.length) field.select(picked)
        else field.clear()
      }
    } catch (error) {
      problems.push(`${label || answer.field}: ${error instanceof Error ? error.message : 'couldn’t be filled'}`)
    }
  }
  form.updateFieldAppearances(font)
  return { bytes: await doc.save({ updateFieldAppearances: false }), problems }
}
