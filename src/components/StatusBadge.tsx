import { STATUS_LABELS } from '../types'
import type { TaskStatus } from '../types'

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`badge badge--${status}`}>
      <span className="badge__dot" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  )
}
