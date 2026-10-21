interface ProgressBarProps {
  value: number
  label?: string
}

export function ProgressBar({ value, label = 'Прогресс' }: ProgressBarProps) {
  const safe = Math.max(0, Math.min(100, value))
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${safe}%`}
    >
      <div className="progress__bar" style={{ width: `${safe}%` }} />
    </div>
  )
}
