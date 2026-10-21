import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { useToast } from '../store/toastStore'

export function Toasts() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.kind}`}>
          {toast.kind === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="toast__message">{toast.message}</span>
          <button
            type="button"
            className="toast__close"
            onClick={() => dismiss(toast.id)}
            aria-label="Скрыть уведомление"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
