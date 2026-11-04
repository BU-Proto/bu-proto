import ui from './ui.module.css'

/** Marks made-up content (anything with `placeholder: true`); renders nothing for real content. */
export function SampleTag({ show = true }: { show?: boolean }) {
  if (!show) return null
  return (
    <span className={ui.sample} title="Made-up sample content. Replace before launch.">
      sample
    </span>
  )
}
