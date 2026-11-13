import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import styles from './FileDrop.module.css'

export interface FileDropCopy {
  /** The empty state: "Drop your résumé here, or" then the underlined words. */
  prompt: string
  choose: string
  /** What it takes, under the prompt: "PDF, up to 5 MB". */
  rules: string
  /** While a file is held over it. */
  over: string
  /** Under a chosen file's name, after its size. */
  replace: string
  remove: string
  wrongType: string
  tooBig: string
}

interface FileDropProps {
  /** The field's name in the form; the server's complaint about it comes back under the same key. */
  name: string
  /** The one MIME type it takes, and the extension that goes with it (".pdf"). */
  type: string
  extension: string
  maxBytes: number
  required?: boolean
  copy: FileDropCopy
  /** The chosen file, or null when it's cleared or refused. <Form> only gathers text, so the page keeps the file. */
  onFile: (file: File | null) => void
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

/** "184 KB", "1.2 MB". */
const fileSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`)

/**
 * A place to put one file: drop it on, or click anywhere to choose it. Underneath it's an ordinary
 * file input stretched over the whole area and made see-through, so the click, the drop, the
 * keyboard and the form's own "required" check are all the browser's. Meant to sit inside a
 * <Field>, whose label names it.
 */
export function FileDrop({ name, type, extension, maxBytes, required, copy, onFile, ...aria }: FileDropProps) {
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [problem, setProblem] = useState('')
  const [over, setOver] = useState(false)

  const clear = () => {
    if (input.current) input.current.value = ''
    setFile(null)
    onFile(null)
  }

  const change = (event: ChangeEvent<HTMLInputElement>) => {
    setOver(false)
    const chosen = event.currentTarget.files?.[0]
    if (!chosen) return clear()
    const rightType = chosen.type === type || chosen.name.toLowerCase().endsWith(extension)
    const wrong = !rightType ? copy.wrongType : chosen.size > maxBytes ? copy.tooBig : ''
    setProblem(wrong)
    // A file it can't take isn't kept: the area goes back to empty and says why.
    if (wrong) return clear()
    setFile(chosen)
    onFile(chosen)
  }

  // Only a held file lights it up, not a dragged link or a text selection.
  const dragOver = (event: DragEvent) => setOver(event.dataTransfer.types.includes('Files'))
  // While another file is on its way in, the last one's refusal is old news.
  const refusal = over ? '' : problem

  return (
    <span
      className={styles.drop}
      data-state={over ? 'over' : file ? 'filled' : 'empty'}
      data-problem={refusal ? '' : undefined}
      onDragEnter={dragOver}
      onDragOver={dragOver}
      onDragLeave={() => setOver(false)}
      onDrop={() => setOver(false)}
    >
      <input
        ref={input}
        className={styles.input}
        name={name}
        type="file"
        accept={`${type},${extension}`}
        required={required}
        onChange={change}
        {...aria}
      />

      <svg className={styles.page} viewBox="0 0 32 40" aria-hidden="true" focusable="false">
        <path d="M5 1.5h14.5L30.5 12.5V35A3.5 3.5 0 0 1 27 38.5H5A3.5 3.5 0 0 1 1.5 35V5A3.5 3.5 0 0 1 5 1.5Z" />
        <path d="M19.5 1.5V9A3.5 3.5 0 0 0 23 12.5h7.5" />
        {file ? <path className={styles.tick} d="M10 24.5l4.5 4.5 8-9" /> : <path d="M9 21.5h14M9 27.5h9" />}
      </svg>

      {file && !over ? (
        <>
          <span className={styles.text}>
            <span className={styles.name}>{file.name}</span>
            <span className={styles.rules}>
              {fileSize(file.size)}. {copy.replace}
            </span>
          </span>
          <button type="button" className={styles.remove} onClick={clear}>
            {copy.remove}
          </button>
        </>
      ) : (
        <span className={styles.text}>
          <span className={styles.prompt}>
            {over ? (
              copy.over
            ) : (
              <>
                {copy.prompt} <span className={styles.choose}>{copy.choose}</span>
              </>
            )}
          </span>
          {/* Said to screen readers when it changes: the refusal isn't the browser's own message. */}
          <span className={refusal ? styles.problem : styles.rules} role={refusal ? 'alert' : undefined}>
            {refusal || copy.rules}
          </span>
        </span>
      )}
    </span>
  )
}
