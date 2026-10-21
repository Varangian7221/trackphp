import { createContext, useContext } from 'react'

export interface Toast {
  id: number
  message: string
  kind: 'success' | 'error'
}

export interface ToastContextValue {
  toasts: Toast[]
  notify: (message: string, kind?: Toast['kind']) => void
  dismiss: (id: number) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast должен использоваться внутри ToastProvider')
  return ctx
}
