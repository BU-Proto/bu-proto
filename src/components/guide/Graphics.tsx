// The guides' diagrams, drawn in HTML and CSS rather than as pictures so the words stay real
// text: readable at any width, searchable and read out by screen readers. The numbers come from
// `content/guides/graphics.ts`.

import type { ReactNode } from 'react'
import { useId } from 'react'
import { Link } from 'react-router'
import { ANGLES, DEMO_CLOCK, DEMO_PATH, EVENT_SHAPE, ROLES, SCORECARD, WEEKEND, WIN_INDEX } from '../../content/guides/graphics'
import type { GraphicName } from '../../content/guides/types'
import { winHref, winThumb } from '../../content/guides/wins'
import styles from './Graphics.module.css'

/** A share of the whole, as a percentage for `left` and `width`. */
const pct = (part: number, whole: number) => `${(part / whole) * 100}%`

function Frame({ title, caption, children }: { title: string; caption: string; children: ReactNode }) {
  const id = useId()
  return (
    <figure className={styles.graphic} aria-labelledby={id} data-fog-clear>
      <p id={id} className={styles.title}>
        {title}
      </p>
      {children}
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  )
}

function hours(from: number, to: number) {
  return `${from}–${to}h`
}

/** How to win: the phases of the weekend as bars on one clock, with the checkpoints across them. */
function Weekend() {
  const { hours: total, days, ticks, phases, milestones } = WEEKEND
  const lines = (
    <span className={styles.lines} aria-hidden="true">
      {milestones.map((m) => (
        <span key={m.at} className={styles.line} style={{ left: pct(m.at, total) }} />
      ))}
    </span>
  )
  return (
    <Frame title={WEEKEND.title} caption={WEEKEND.caption}>
      <div className={styles.gantt}>
        <div className={styles.ganttRow} aria-hidden="true">
          <span />
          <span className={styles.axis}>
            {days.map((day) => (
              <span key={day.label} className={styles.day} style={{ left: pct(day.from, total), width: pct(day.to - day.from, total) }}>
                {day.label}
              </span>
            ))}
            {ticks.map((tick) => (
              <span key={tick} className={styles.tick} style={{ left: pct(tick, total) }}>
                {tick}h
              </span>
            ))}
          </span>
        </div>

        <ol className={styles.phases}>
          {phases.map((phase, index) => (
            <li key={phase.label} className={styles.ganttRow}>
              <span className={styles.phaseText}>
                <span className={styles.phaseHead}>
                  <span className={styles.phaseName}>{phase.label}</span>
                  <span className={styles.mono}>{hours(phase.from, phase.to)}</span>
                </span>
                <span className={styles.phaseNote}>{phase.note}</span>
              </span>
              <span className={styles.track} aria-hidden="true">
                {lines}
                <span
                  className={styles.bar}
                  data-last={index === phases.length - 1}
                  style={{ left: pct(phase.from, total), width: pct(phase.to - phase.from, total) }}
                />
              </span>
            </li>
          ))}
        </ol>

        <div className={styles.ganttRow}>
          <span />
          <ul className={styles.milestones}>
            {milestones.map((m) => (
              <li
                key={m.at}
                className={styles.milestone}
                data-row={m.row}
                data-end={m.at / total > 0.7}
                style={{ left: pct(m.at, total) }}
              >
                <span className={styles.mono}>{m.at}h</span> {m.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Frame>
  )
}

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** Demo: three minutes as one bar, numbered parts, the demo moment bracketed over it. */
function DemoClock() {
  const { seconds, segments, spare, moment } = DEMO_CLOCK
  const used = segments[segments.length - 1].to
  return (
    <Frame title={DEMO_CLOCK.title} caption={DEMO_CLOCK.caption}>
      <div className={styles.clock} aria-hidden="true">
        <span className={styles.moment} style={{ left: pct(moment.from, seconds), width: pct(moment.to - moment.from, seconds) }}>
          <span>{moment.label}</span>
        </span>
        <span className={styles.clockBar}>
          {segments.map((segment, index) => (
            <span
              key={segment.label}
              className={styles.segment}
              data-main={segment.label === 'The demo'}
              style={{ width: pct(segment.to - segment.from, seconds) }}
            >
              {index + 1}
            </span>
          ))}
          <span className={styles.spare} style={{ width: pct(seconds - used, seconds) }} />
        </span>
        <span className={styles.clockTicks}>
          {[0, 30, 60, 90, 120, 150, 180].map((s) => (
            <span key={s} style={{ left: pct(s, seconds) }}>
              {clock(s)}
            </span>
          ))}
        </span>
      </div>

      <ol className={styles.legend}>
        {segments.map((segment, index) => (
          <li key={segment.label}>
            <span className={styles.legendNumber} aria-hidden="true">
              {index + 1}
            </span>
            <span className={styles.mono}>
              {clock(segment.from)}–{clock(segment.to)}
            </span>
            <span>
              <strong>{segment.label}.</strong> {segment.note}
            </span>
          </li>
        ))}
        <li data-quiet>
          <span className={styles.legendNumber} aria-hidden="true" />
          <span className={styles.mono}>
            {clock(used)}–{clock(seconds)}
          </span>
          <span>
            <strong>{spare.label}.</strong> {spare.note}
          </span>
        </li>
      </ol>
    </Frame>
  )
}

/** First hackathon: the weekend's stops on one line, building drawn long. */
function EventShape() {
  return (
    <Frame title={EVENT_SHAPE.title} caption={EVENT_SHAPE.caption}>
      <ol className={styles.stops}>
        {EVENT_SHAPE.stops.map((stop) => (
          <li key={stop.label} className={styles.stop} data-long={Boolean(stop.long)}>
            <span className={styles.stopDot} aria-hidden="true" />
            <span className={styles.stopName}>{stop.label}</span>
            <span className={styles.stopNote}>{stop.note}</span>
          </li>
        ))}
      </ol>
    </Frame>
  )
}

/** Judging: criteria down the side, the parts of the demo across, a mark where one answers the other. */
function Scorecard() {
  return (
    <Frame title={SCORECARD.title} caption={SCORECARD.caption}>
      <div className={styles.scroll}>
        <table className={styles.matrix}>
          <thead>
            <tr>
              <td />
              {SCORECARD.parts.map((part) => (
                <th key={part} scope="col">
                  {part}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SCORECARD.rows.map((row) => (
              <tr key={row.criterion}>
                <th scope="row">{row.criterion}</th>
                {SCORECARD.parts.map((part) => (
                  <td key={part}>{row.answers.includes(part) ? <Dot label={SCORECARD.markLabel} /> : null}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Frame>
  )
}

function Dot({ label }: { label: string }) {
  return (
    <span className={styles.dot}>
      <span className={styles.srOnly}>{label}</span>
    </span>
  )
}

/** Ideas: the wins down the side and the angles across, so the overlaps show. */
function AngleMap() {
  const wins = WIN_INDEX.wins.map(({ win }) => win)
  const anglesOf = (id: number) => ANGLES.angles.filter((angle) => angle.wins.some((w) => w.id === id))
  const stacked = wins.filter((win) => anglesOf(win.id).length > 1).length
  return (
    <Frame title={ANGLES.title} caption={ANGLES.caption(stacked, wins.length)}>
      <div className={styles.scroll}>
        <table className={`${styles.matrix} ${styles.angleMatrix}`}>
          <thead>
            <tr>
              <td />
              {ANGLES.angles.map((angle) => (
                <th key={angle.id} scope="col" className={styles.angleHead}>
                  <a href={`#${angle.id}`}>
                    <span>{angle.label}</span>
                  </a>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {wins.map((win) => (
              <tr key={win.id}>
                <th scope="row">
                  <Link className={styles.winCell} to={winHref(win)}>
                    <img src={winThumb(win.cover)} alt="" loading="lazy" width={333} height={222} />
                    <span>{win.project}</span>
                  </Link>
                </th>
                {ANGLES.angles.map((angle) => (
                  <td key={angle.id}>{angle.wins.some((w) => w.id === win.id) ? <Dot label={angle.label} /> : null}</td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">{ANGLES.totalLabel}</th>
              {ANGLES.angles.map((angle) => (
                <td key={angle.id} className={styles.mono}>
                  {angle.wins.length}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </Frame>
  )
}

/** Winning projects: the ten covers as a contents page for the breakdowns below. */
function WinIndex() {
  return (
    <Frame title={WIN_INDEX.title} caption={WIN_INDEX.caption}>
      <ol className={styles.index}>
        {WIN_INDEX.wins.map(({ win, id }) => (
          <li key={win.id}>
            <a className={styles.indexLink} href={`#${id}`}>
              <img src={winThumb(win.cover)} alt="" loading="lazy" width={333} height={222} />
              <span className={styles.indexName}>{win.project}</span>
              <span className={styles.indexMeta}>{win.prize}</span>
              <span className={styles.indexEvent}>{win.event}</span>
            </a>
          </li>
        ))}
      </ol>
    </Frame>
  )
}

/** Team: the four roles down the side, the weekend across, the last column shared by everyone. */
function Roles() {
  const last = ROLES.phases.length - 1
  return (
    <Frame title={ROLES.title} caption={ROLES.caption}>
      <div className={styles.scroll}>
        <table className={`${styles.matrix} ${styles.roles}`}>
          <thead>
            <tr>
              <td />
              {ROLES.phases.map((phase, index) => (
                <th key={phase} scope="col" data-shared={index === last}>
                  {phase}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLES.rows.map((row) => (
              <tr key={row.role}>
                <th scope="row">{row.role}</th>
                {row.cells.map((cell, index) => (
                  <td key={ROLES.phases[index]} data-shared={index === last} data-phase={ROLES.phases[index]}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Frame>
  )
}

/** Shipping: the demo path as a line of steps, each drawn by whether it's real, faked or cut. */
function DemoPath() {
  return (
    <Frame title={DEMO_PATH.title} caption={DEMO_PATH.caption}>
      <ol className={styles.path}>
        {DEMO_PATH.steps.map((step) => (
          <li key={step.label} className={styles.pathStep} data-status={step.status}>
            <span className={styles.pathMark} aria-hidden="true" />
            <span className={styles.pathName}>{step.label}</span>
            <span className={styles.pathStatus}>{DEMO_PATH.status[step.status]}</span>
            <span className={styles.pathNote}>{step.note}</span>
          </li>
        ))}
      </ol>
    </Frame>
  )
}

const GRAPHICS: Record<GraphicName, () => ReactNode> = {
  weekend: Weekend,
  angles: AngleMap,
  'demo-clock': DemoClock,
  'win-index': WinIndex,
  'event-shape': EventShape,
  scorecard: Scorecard,
  roles: Roles,
  'demo-path': DemoPath,
}

export function Graphic({ name }: { name: GraphicName }) {
  const Drawn = GRAPHICS[name]
  return <Drawn />
}
