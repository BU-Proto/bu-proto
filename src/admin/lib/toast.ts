import { createContext, useContext } from 'react'

export type ToastTone = 'ok' | 'error' | 'info'

export interface ToastInput {
  text: string
  /** A second, quieter line: what to do about it, or what it affected. */
  detail?: string
  tone?: ToastTone
  /** One thing to do from the toast ("Undo", "View"). */
  action?: { label: string; onAction: () => void }
}

export type PushToast = (toast: ToastInput | string) => void

export const ToastContext = createContext<PushToast | null>(null)

/** Announce that something finished: `toast('Event saved')`, or an object for errors and actions. */
export function useToast(): PushToast {
  const push = useContext(ToastContext)
  if (!push) throw new Error('useToast needs the admin shell above it.')
  return push
}
