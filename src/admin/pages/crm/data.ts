import type { Admin, Org } from '../../../../shared/api'
import { useApi } from '../people/useApi'

// What the People and Orgs pickers list.

/** Value for "make a new org" in the org picker; never a real id. */
export const NEW_ORG = 'new'

/** The admins' emails, owners first, for the owner picker. Fetched once it's needed. */
export function useTeam(enabled = true): string[] {
  const { data } = useApi<{ items: Admin[] }>(enabled ? '/admin/admins' : null)
  return (data?.items ?? []).map((admin) => admin.email)
}

/** Every org by name, for the org picker. Fetched once it's needed. */
export function useOrgList(enabled = true) {
  const { data, reload, setData } = useApi<{ items: Org[] }>(enabled ? '/admin/orgs' : null)
  return { orgs: data?.items ?? [], reload, setData }
}
