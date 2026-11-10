import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { CONTENT_RESOURCES, RESOURCE_SPECS, type Member } from '../../../shared/api'
import { api } from '../../lib/api'
import type { ContentRow } from '../lib/content'
import { COMMAND_KEYS } from '../lib/keys'
import { NAV_ITEMS, type Icon } from '../nav'
import { ArrowOutIcon, ImportIcon, PlusIcon, ReturnIcon, SearchIcon, SignOutIcon } from './icons'
import { Kbd } from './Kbd'
import styles from './CommandMenu.module.css'

interface Command {
  id: string
  group: 'Go to' | 'Create' | 'Records' | 'Account'
  label: string
  /** Quieter text after the label: what kind of thing it is. */
  hint?: string
  /** Extra words that should find it. */
  keywords?: string
  icon: Icon
  run: () => void
}

interface CommandMenuProps {
  open: boolean
  onClose: () => void
  onSignOut: () => void
}

interface Records {
  content: { resource: (typeof CONTENT_RESOURCES)[number]; rows: ContentRow[] }[]
  members: Member[]
}

/** How well a command matches: lower is better, null is no match. Every typed word has to appear. */
function rank(command: Command, words: string[]): number | null {
  const label = command.label.toLowerCase()
  const all = `${label} ${command.hint?.toLowerCase() ?? ''} ${command.keywords?.toLowerCase() ?? ''}`
  if (!words.every((word) => all.includes(word))) return null
  if (label.startsWith(words[0])) return 0
  if (label.split(/\s+/).some((part) => part.startsWith(words[0]))) return 1
  return label.includes(words[0]) ? 2 : 3
}

const GROUP_ORDER: Command['group'][] = ['Go to', 'Create', 'Records', 'Account']
const MAX_RECORDS = 8

/**
 * The portal's command menu: every page, the things you can make, and (once you type) any event,
 * hackathon, win, board member or member by name. A modal <dialog>, so the browser traps focus
 * and Escape closes it. It opens without animation, since it's almost always opened from the
 * keyboard, many times a session.
 */
export function CommandMenu({ open, onClose, onSignOut }: CommandMenuProps) {
  const navigate = useNavigate()
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const listId = useId()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [records, setRecords] = useState<Records | null>(null)

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) {
      setQuery('')
      setActive(0)
      element.showModal()
      input.current?.focus()
    }
    if (!open && element.open) element.close()
  }, [open])

  // Names to search, fetched each time the menu opens so a row made a minute ago is there.
  // The lists are small (tens of rows), and a failed one just leaves its records out.
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const { signal } = controller
    Promise.all([
      Promise.all(
        CONTENT_RESOURCES.map((resource) =>
          api<{ items: ContentRow[] }>(`/admin/content/${resource}`, { signal })
            .then((body) => ({ resource, rows: body.items }))
            .catch(() => ({ resource, rows: [] as ContentRow[] })),
        ),
      ),
      api<{ items: Member[] }>('/admin/members', { signal })
        .then((body) => body.items)
        .catch(() => [] as Member[]),
    ]).then(([content, members]) => {
      if (!signal.aborted) setRecords({ content, members })
    })
    return () => controller.abort()
  }, [open])

  const commands = useMemo<Command[]>(() => {
    const go = (to: string) => () => navigate(to)
    const pages: Command[] = NAV_ITEMS.flatMap((item) => [
      { id: item.to, group: 'Go to' as const, label: item.label, icon: item.icon, run: go(item.to) },
      ...(item.tabs ?? []).slice(1).map((tab) => ({
        id: tab.to,
        group: 'Go to' as const,
        label: tab.command ?? `${item.label}: ${tab.label}`,
        keywords: `${item.label} ${tab.label}`,
        icon: tab.label === 'Import' ? ImportIcon : item.icon,
        run: go(tab.to),
      })),
    ])
    const create: Command[] = NAV_ITEMS.flatMap((item) =>
      item.create ? [{ id: item.create.to, group: 'Create' as const, label: item.create.label, keywords: 'add create', icon: PlusIcon, run: go(item.create.to) }] : [],
    )
    const found: Command[] = records
      ? [
          ...records.content.flatMap(({ resource, rows }) => {
            const spec = RESOURCE_SPECS[resource]
            const icon = NAV_ITEMS.find((item) => item.to === `/admin/${resource}`)?.icon ?? SearchIcon
            return rows.map((row) => ({
              id: `${resource}/${row.id}`,
              group: 'Records' as const,
              label: String(row[spec.titleKey] ?? `${spec.singular} ${row.id}`),
              hint: row.published ? spec.singular : `${spec.singular}, draft`,
              icon,
              run: go(`/admin/${resource}/${row.id}`),
            }))
          }),
          ...records.members.map((member) => ({
            id: `members/${member.id}`,
            group: 'Records' as const,
            label: member.name,
            hint: 'Member',
            keywords: member.email,
            icon: NAV_ITEMS.find((item) => item.to === '/admin/members')?.icon ?? SearchIcon,
            run: go(`/admin/members/${member.id}`),
          })),
        ]
      : []
    const account: Command[] = [
      {
        id: 'site',
        group: 'Account',
        label: 'View the site',
        keywords: 'public open buproto',
        icon: ArrowOutIcon,
        run: () => window.open('/', '_blank', 'noreferrer'),
      },
      { id: 'sign-out', group: 'Account', label: 'Sign out', keywords: 'log out logout', icon: SignOutIcon, run: onSignOut },
    ]
    return [...pages, ...create, ...found, ...account]
  }, [navigate, onSignOut, records])

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    // Nothing typed: the pages and actions, in the sidebar's order. Records need a name to look for.
    if (words.length === 0) return commands.filter((command) => command.group !== 'Records')
    const ranked = commands
      .map((command) => ({ command, score: rank(command, words) }))
      .filter((entry): entry is { command: Command; score: number } => entry.score !== null)
      .sort((a, b) => a.score - b.score)
      .map(({ command }) => command)
    // Pages and actions all show; records are the long tail, so only the best few do.
    const records = ranked.filter((command) => command.group === 'Records').slice(0, MAX_RECORDS)
    return [...ranked.filter((command) => command.group !== 'Records'), ...records].sort(
      (a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group),
    )
  }, [commands, query])

  const current = Math.min(active, Math.max(0, results.length - 1))

  // Keep the highlighted row in view as the arrows move it.
  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [current, results])

  function run(command: Command) {
    onClose()
    command.run()
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (results.length === 0) return
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((current + step + results.length) % results.length)
    } else if (event.key === 'Home' || event.key === 'End') {
      if (results.length === 0) return
      event.preventDefault()
      setActive(event.key === 'Home' ? 0 : results.length - 1)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const command = results[current]
      if (command) run(command)
    }
  }

  const groups = GROUP_ORDER.map((group) => ({ group, items: results.filter((command) => command.group === group) })).filter(
    (entry) => entry.items.length > 0,
  )

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label="Command menu"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      // A click on the backdrop lands on the dialog element itself.
      onClick={(event) => {
        if (event.target === dialog.current) onClose()
      }}
    >
      <div className={styles.panel} onKeyDown={onKeyDown}>
        <div className={styles.search}>
          <SearchIcon className={styles.searchIcon} />
          <input
            ref={input}
            className={styles.input}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
            }}
            placeholder="Search pages, events, members…"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[current] ? `${listId}-${results[current].id}` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <Kbd>esc</Kbd>
        </div>

        <div ref={list} id={listId} className={styles.list} role="listbox" aria-label="Results">
          {groups.length === 0 ? (
            <p className={styles.none}>Nothing matches “{query.trim()}”.</p>
          ) : (
            groups.map(({ group, items }) => (
              <div key={group} role="group" aria-label={group} className={styles.group}>
                <p className={styles.heading} aria-hidden="true">
                  {group}
                </p>
                {items.map((command) => {
                  const index = results.indexOf(command)
                  const CommandIcon = command.icon
                  return (
                    <div
                      key={command.id}
                      id={`${listId}-${command.id}`}
                      role="option"
                      aria-selected={index === current}
                      className={styles.item}
                      // Only real pointer movement moves the highlight, so the list scrolling
                      // under a still pointer doesn't steal it from the arrow keys.
                      onPointerMove={() => index !== current && setActive(index)}
                      onClick={() => run(command)}
                    >
                      <CommandIcon className={styles.itemIcon} />
                      <span className={styles.itemLabel}>{command.label}</span>
                      {command.hint && <span className={styles.itemHint}>{command.hint}</span>}
                      <ReturnIcon className={styles.itemGo} />
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className={styles.foot} aria-hidden="true">
          <span>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> to move
          </span>
          <span>
            <Kbd>↵</Kbd> to open
          </span>
          <span className={styles.footEnd}>
            <Kbd>{COMMAND_KEYS}</Kbd> from anywhere
          </span>
        </div>
      </div>
    </dialog>
  )
}
