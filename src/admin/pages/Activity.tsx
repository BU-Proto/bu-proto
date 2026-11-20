import ui from '../admin.module.css'
import { PageHeader } from '../components/PageHeader'

// Placeholder from the CRM foundation commit.
export function Component() {
  return (
    <div className={ui.page}>
      <PageHeader title="Activity" />
    </div>
  )
}
