import { useCallback } from 'react'
import { canChange, whoCanChange, type Gate } from '../../../shared/access'
import { useSession } from './session'

// The portal's side of who can change what (shared/access.ts). The Worker checks every write
// too; this is so a button someone can't use says so instead of failing when pressed.

/** can(gate) → whether the signed-in admin may make that change. */
export function useCan(): (gate: Gate) => boolean {
  const { me } = useSession()
  return useCallback((gate: Gate) => canChange(me, gate), [me])
}

/**
 * Props for a control behind a gate: disabled, with a title saying who can, when the signed-in
 * admin can't. Spread onto a button: <button {...gated('fund')}>.
 */
export function useGated(): (gate: Gate) => { disabled?: boolean; title?: string; 'aria-disabled'?: boolean } {
  const can = useCan()
  return useCallback((gate: Gate) => (can(gate) ? {} : { disabled: true, title: whoCanChange(gate), 'aria-disabled': true }), [can])
}
