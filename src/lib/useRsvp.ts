// The state behind one event's RSVP, shared by its button and its form (components/Rsvp.tsx).
// "Going" is remembered in localStorage so it survives a reload.

import { useId, useRef, useState } from 'react'
import type { RsvpResult } from '../../shared/api'
import { api } from './api'

const rsvpKey = (id: number) => `proto:rsvp:${id}`

// localStorage throws in some private modes; an RSVP that isn't remembered is still an RSVP.
function rememberedGoing(id: number): boolean {
  try {
    return localStorage.getItem(rsvpKey(id)) === '1'
  } catch {
    return false
  }
}

function rememberGoing(id: number) {
  try {
    localStorage.setItem(rsvpKey(id), '1')
  } catch {
    // Nothing to do: the button still shows the RSVP until the page is left.
  }
}

export function useRsvp(event: { id: number; title: string; registerUrl?: string | null }) {
  const [going, setGoing] = useState(() => rememberedGoing(event.id))
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const formId = useId()

  const close = () => {
    setOpen(false)
    requestAnimationFrame(() => buttonRef.current?.focus())
  }

  const submit = async (values: Record<string, string>) => {
    await api<RsvpResult>(`/events/${event.id}/rsvp`, { body: values })
    rememberGoing(event.id)
    setGoing(true)
    close()
  }

  return { event, going, open, setOpen, close, submit, buttonRef, formId }
}

export type RsvpState = ReturnType<typeof useRsvp>
