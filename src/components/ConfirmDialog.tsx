import { useRef } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  title: string
  message: ReactNode
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Удалить',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  return (
    <Modal title={title} onClose={onCancel} titleId="confirm-title">
      <div className="modal__body confirm">
        <p className="confirm__icon" aria-hidden="true">
          <AlertTriangle size={22} />
        </p>
        <div className="confirm__text">{message}</div>
        <div className="modal__actions">
          <button type="button" className="button button--ghost" onClick={onCancel} ref={cancelRef}>
            Отмена
          </button>
          <button type="button" className="button button--danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
