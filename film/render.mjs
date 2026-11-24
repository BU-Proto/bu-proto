// Cuts the home page montage from film/shots.mjs. Needs ffmpeg and rsvg-convert
// (brew install ffmpeg-full librsvg) and the Inter and JetBrains Mono fonts installed. It uses
// Homebrew's ffmpeg-full when it's there, for its better scalers, and plain ffmpeg otherwise.
//
//   node film/render.mjs          the full film: both cuts and the poster
//   node film/render.mjs wide     the 16:9 cut only (or: phone)
//   node film/render.mjs basic    the basic cut, from the footage on hand (add wide or phone too)
//
// Everything lands in film/out/. While any source is missing from film/, that shot renders as a
// labelled placeholder and the files are named animatic*. Once every source is in place they're
// boston-montage.mp4, boston-montage-phone.mp4 and boston-montage-poster.jpg, ready to copy into
// public/media/ (see docs/hero-montage.md).
//
// Text is drawn as SVG and rendered to PNG by rsvg-convert (Pango and HarfBuzz, the same shaping a
// browser does), which gives real kerning, letter-spacing and soft shadows. Each shot is cut to its own file first; the recap is built from those, and
// the grade and grain go on once, over the whole film.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BASIC_LENGTH, BASIC_RECAP, BASIC_SHOTS, DRIFT_WORDS, END_LINE, FPS, LENGTH, PROMPT, PROMPT_PAUSE_AT, RECAP, SHOTS } from './shots.mjs'

const ARGS = process.argv.slice(2)
/** Which film: the full one from SHOTS, or the basic one from what we hold today. */
const CUT = ARGS.includes('basic')
  ? { name: 'basic', shots: BASIC_SHOTS, length: BASIC_LENGTH, recap: BASIC_RECAP }
  : { name: 'full', shots: SHOTS, length: LENGTH, recap: RECAP }

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const OUT = join(HERE, 'out')
const WORK = join(HERE, '.work')

const SIZES = {
  wide: { name: 'wide', w: 1920, h: 1080, maxrate: 3.3, file: 'boston-montage' },
  phone: { name: 'phone', w: 1080, h: 1350, maxrate: 1.8, file: 'boston-montage-phone' },
}

/** Black and white with warm highlights, a little contrast, grain and a soft vignette. */
const GRADE = [
  'hue=s=0',
  'colorbalance=rh=0.10:gh=0.04:bh=-0.08:rm=0.04:bm=-0.04',
  'eq=contrast=1.08',
  'noise=alls=10:allf=t',
  'vignette=angle=PI/5',
  'format=yuv420p',
].join(',')

/** Frames in the recap for each shot it flashes through. */
const RECAP_FRAMES = 8

// ---- Helpers ------------------------------------------------------------------------------------

const frameAt = (seconds) => Math.round(seconds * FPS)
const framesOf = (shot) => frameAt(shot.at + shot.dur) - frameAt(shot.at)
const has = (path) => Boolean(path) && existsSync(join(HERE, path))
const esc = (text) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')

function run(command, args) {
  try {
    execFileSync(command, args, { stdio: ['ignore', 'ignore', 'pipe'] })
  } catch (error) {
    process.stderr.write(String(error.stderr ?? error))
    throw new Error(`${command} failed`)
  }
}

const FFMPEG = existsSync('/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg') ? '/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg' : 'ffmpeg'
const ffmpeg = (args) => run(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args])

function png(svgText, file) {
  const source = file.replace(/\.png$/, '.svg')
  writeFileSync(source, svgText)
  run('rsvg-convert', ['-o', file, source])
  return file
}

const svg = (s, body, background) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${s.w}" height="${s.h}" viewBox="0 0 ${s.w} ${s.h}">` +
  (background ? `<rect width="100%" height="100%" fill="${background}"/>` : '') +
  `${body}</svg>`

function wrap(text, width) {
  const lines = []
  for (const word of text.split(' ')) {
    const last = lines.at(-1)
    if (last && `${last} ${word}`.length <= width) lines[lines.length - 1] = `${last} ${word}`
    else lines.push(word)
  }
  return lines
}

/** Every shot must start where the one before ended, and the last must end at LENGTH. */
function checkTimeline() {
  let at = 0
  for (const shot of CUT.shots) {
    if (Math.abs(shot.at - at) > 1e-6) throw new Error(`${shot.id} starts at ${shot.at}, expected ${at}`)
    at = Math.round((shot.at + shot.dur) * 1000) / 1000
  }
  if (Math.abs(at - CUT.length) > 1e-6) throw new Error(`the shots end at ${at}, expected ${CUT.length}`)
}

// ---- Drawn frames -------------------------------------------------------------------------------

/**
 * The prompt bar over drifting, blurred Boston names, at time t into the opener. Without the bar
 * it's the names alone, the ground for a card whose company we have no footage of yet.
 */
function promptFrame(s, typed, cursor, t, bar = true) {
  const wide = s.w > s.h
  const barW = Math.round(s.w * (wide ? 0.7 : 0.88))
  const barH = Math.round(s.h * (wide ? 0.11 : 0.076))
  const x = Math.round((s.w - barW) / 2)
  const y = Math.round((s.h - barH) / 2)
  const size = Math.round(barH * 0.36)
  const baseline = y + barH / 2 + size * 0.36
  const words = DRIFT_WORDS.map((word, index) => {
    const row = index % 3
    const startX = s.w * ((index * 0.41 + row * 0.17) % 1) - s.w * 0.15
    const drift = s.w * (0.05 + 0.02 * row) * t
    const wordY = s.h * (0.22 + row * 0.3)
    return `<text x="${(startX - drift).toFixed(1)}" y="${wordY.toFixed(1)}" font-family="Inter" font-weight="300" font-size="${Math.round(s.h * 0.12)}" fill="#fff" fill-opacity="0.22">${esc(word)}</text>`
  })
  return svg(
    s,
    `<defs><filter id="blur" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="${(s.h * 0.009).toFixed(1)}"/></filter></defs>` +
      `<g filter="url(#blur)">${words.join('')}</g>` +
      (bar ?
      // A slow push in on the bar, as if the camera were leaning towards it.
      `<g transform="translate(${s.w / 2} ${s.h / 2}) scale(${(1 + 0.03 * t).toFixed(4)}) translate(${-s.w / 2} ${-s.h / 2})">` +
      `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="${barH / 2}" fill="#1a1a1a" stroke="#fff" stroke-opacity="0.14" stroke-width="1.5"/>` +
      `<text x="${x + barH * 0.4}" y="${baseline + size * 0.06}" font-family="Inter" font-weight="300" font-size="${Math.round(size * 1.35)}" fill="#fff" fill-opacity="0.8">+</text>` +
      `<text x="${x + barH * 1.0}" y="${baseline}" font-family="Inter" font-size="${size}" fill="#fff">${esc(typed)}<tspan font-weight="200" fill-opacity="${cursor ? 0.9 : 0}">|</tspan></text></g>` : ''),
    '#000',
  )
}

/**
 * A card: the name set large in the middle of the frame, where and when small under it in
 * JetBrains Mono. "Boston Dynamics / MIT / 1992" sets Boston Dynamics over "MIT · 1992". With no
 * detail it's the name alone, as in the closing roll of names.
 */
function cardFrame(s, card, logo) {
  const wide = s.w > s.h
  const [name, ...rest] = card.split(' / ')
  const detail = rest.join('  ·  ').toUpperCase()
  const room = s.w * (wide ? 0.84 : 0.86)
  const nameSize = Math.min(s.h * (wide ? 0.105 : 0.072), room / (name.length * 0.56))
  const detailSize = detail ? Math.min(s.h * (wide ? 0.026 : 0.021), room / (detail.length * 0.68)) : 0
  const middle = s.h * 0.5
  const nameY = middle + nameSize * 0.3 - (detail ? detailSize * 1.1 : 0)
  const detailY = nameY + nameSize * 0.45 + detailSize * 1.5
  const name_ = (fill, opacity, extra = '') =>
    `<text x="${s.w / 2}" y="${nameY.toFixed(1)}" text-anchor="middle" font-family="Inter" font-weight="600" font-size="${nameSize.toFixed(1)}" letter-spacing="${(-nameSize * 0.025).toFixed(1)}" fill="${fill}" fill-opacity="${opacity}" ${extra}>${esc(name)}</text>`
  const detail_ = (fill, opacity, extra = '') =>
    detail
      ? `<text x="${s.w / 2}" y="${detailY.toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono" font-weight="500" font-size="${detailSize.toFixed(1)}" letter-spacing="${(detailSize * 0.12).toFixed(1)}" fill="${fill}" fill-opacity="${opacity}" ${extra}>${esc(detail)}</text>`
      : ''
  const shade = 'filter="url(#shade)"'
  if (logo) {
    // An approved logo takes the name's place. Its artwork sits in the middle third of its box.
    const art = readFileSync(join(HERE, logo), 'utf8')
    const [, , boxW, boxH] = (/viewBox="([^"]+)"/.exec(art)?.[1] ?? '0 0 100 100').split(/\s+/).map(Number)
    const width = s.w * (wide ? 0.42 : 0.72)
    const height = (width * boxH) / boxW
    const top = middle - height / 2 - (detail ? detailSize * 1.2 : 0)
    const inner = art.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
    const logoDetailY = top + height * 0.68 + detailSize * 2
    return svg(
      s,
      `<defs><filter id="shade" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="${(detailSize * 0.5).toFixed(1)}"/></filter></defs>` +
        `<svg x="${((s.w - width) / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${width.toFixed(1)}" height="${height.toFixed(1)}" viewBox="0 0 ${boxW} ${boxH}">${inner}</svg>` +
        detail_('#000', 0.55, shade).replace(/y="[^"]+"/, `y="${logoDetailY.toFixed(1)}"`) +
        detail_('#fff', 0.8).replace(/y="[^"]+"/, `y="${logoDetailY.toFixed(1)}"`),
    )
  }
  return svg(
    s,
    `<defs><filter id="shade" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="${(nameSize * 0.22).toFixed(1)}"/></filter></defs>` +
      name_('#000', 0.55, shade) +
      detail_('#000', 0.55, shade) +
      name_('#fff', 0.97) +
      detail_('#fff', 0.8),
  )
}

/** The closing roll: each name in turn, rising into place over its first frames. */
function rollFrames(s, dir, names, frames) {
  mkdirSync(dir, { recursive: true })
  for (let n = 0; n < frames; n += 1) {
    const index = Math.min(names.length - 1, Math.floor((n * names.length) / frames))
    const start = Math.ceil((index * frames) / names.length)
    const settle = Math.min(1, (n - start + 1) / 3)
    const lift = (1 - settle) * s.h * 0.04
    const card = cardFrame(s, names[index]).replace('<defs>', `<g transform="translate(0 ${lift.toFixed(1)})" opacity="${(0.35 + 0.65 * settle).toFixed(2)}"><defs>`).replace('</svg>', '</g></svg>')
    png(card, join(dir, `r${String(n).padStart(3, '0')}.png`))
  }
  return join(dir, 'r%03d.png')
}

/** The chapter a shot is in, small in the top corner: THEN, NOW, WHAT STARTED HERE, LIFTOFF. */
function chapterFrame(s, chapter) {
  const wide = s.w > s.h
  const margin = Math.round(s.w * (wide ? 0.05 : 0.07))
  const size = Math.round(s.h * (wide ? 0.022 : 0.019))
  const y = Math.round(margin * (wide ? 1.0 : 1.3) + size)
  return svg(
    s,
    `<rect x="${margin}" y="${(y - size * 0.75).toFixed(1)}" width="${Math.round(size * 1.6)}" height="${Math.max(2, Math.round(size * 0.1))}" fill="#fff" fill-opacity="0.85"/>` +
      `<text x="${margin + size * 2.2}" y="${y}" font-family="JetBrains Mono" font-weight="500" font-size="${size}" letter-spacing="${(size * 0.18).toFixed(1)}" fill="#fff" fill-opacity="0.85">${esc(chapter)}</text>`,
  )
}

/** A shot that isn't in film/ yet: what goes there, when, and the file it's waiting for. */
function placeholderFrame(s, shot, index, waiting) {
  const wide = s.w > s.h
  const size = Math.round(s.h * (wide ? 0.042 : 0.034))
  const lines = wrap(shot.note, wide ? 34 : 26)
  const top = (shot.card || shot.names ? s.h * 0.2 : s.h * 0.42) - ((lines.length - 1) * size * 1.25) / 2
  const mono = Math.round(s.h * 0.018)
  const label = `${String(index + 1).padStart(2, '0')}   ${shot.at.toFixed(1)}s   ${shot.dur.toFixed(2)}s   ${shot.part.toUpperCase()}`
  return svg(
    s,
    `<rect x="${s.w * 0.03}" y="${s.h * 0.03}" width="${s.w * 0.94}" height="${s.h * 0.94}" fill="none" stroke="#fff" stroke-opacity="0.08"/>` +
      `<text x="${s.w * 0.94}" y="${s.h * 0.93}" text-anchor="end" font-family="JetBrains Mono" font-size="${mono}" fill="#fff" fill-opacity="0.5" letter-spacing="1">${esc(label)}</text>` +
      lines
        .map(
          (line, row) =>
            `<text x="${s.w / 2}" y="${(top + row * size * 1.25).toFixed(1)}" text-anchor="middle" font-family="Inter" font-weight="300" font-size="${size}" fill="#fff" fill-opacity="0.8">${esc(line)}</text>`,
        )
        .join('') +
      waiting
        .map(
          (path, row) =>
            `<text x="${s.w / 2}" y="${(top + lines.length * size * 1.25 + size * 0.6 + row * mono * 1.6).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono" font-size="${mono}" fill="#fff" fill-opacity="0.4">film/${esc(path)}</text>`,
        )
        .join(''),
    '#151515',
  )
}

/** Proto's mark and name, with the line under them. */
function endFrame(s) {
  const seal = readFileSync(join(ROOT, 'public/proto-seal.svg'), 'utf8')
  const viewBox = /viewBox="([^"]+)"/.exec(seal)?.[1] ?? '0 0 100 100'
  const inner = seal.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  const wide = s.w > s.h
  const size = Math.round(s.h * (wide ? 0.085 : 0.07))
  const mark = Math.round(size * 1.05)
  const nameWidth = size * 2.55
  const gap = size * 0.32
  const left = (s.w - (mark + gap + nameWidth)) / 2
  const middle = s.h * 0.47
  return svg(
    s,
    `<svg x="${left.toFixed(1)}" y="${(middle - mark / 2).toFixed(1)}" width="${mark}" height="${mark}" viewBox="${viewBox}">${inner}</svg>` +
      `<text x="${(left + mark + gap).toFixed(1)}" y="${(middle + size * 0.36).toFixed(1)}" font-family="Inter" font-weight="500" font-size="${size}" letter-spacing="${(-size * 0.02).toFixed(1)}" fill="#fff">Proto</text>` +
      `<text x="${s.w / 2}" y="${(middle + size * 1.45).toFixed(1)}" text-anchor="middle" font-family="Inter" font-weight="300" font-size="${Math.round(size * 0.36)}" fill="#fff" fill-opacity="0.72">${esc(END_LINE)}</text>`,
    '#000',
  )
}

// ---- Shots --------------------------------------------------------------------------------------

/** Scaled with Lanczos and full chroma, then cropped to fill the frame. */
const SCALE_FLAGS = 'flags=lanczos+accurate_rnd+full_chroma_int'
const cover = (s) => `scale=${s.w}:${s.h}:force_original_aspect_ratio=increase:${SCALE_FLAGS},crop=${s.w}:${s.h},setsar=1`
const pushIn = (s, frames) =>
  `scale=${s.w * 2}:${s.h * 2}:force_original_aspect_ratio=increase:${SCALE_FLAGS},crop=${s.w * 2}:${s.h * 2},` +
  `zoompan=z='1+0.07*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${s.w}x${s.h}:fps=${FPS},setsar=1`
const clipFilter = (s, speed = 1) => `setpts=(PTS-STARTPTS)/${speed},fps=${FPS},${cover(s)}`

/** The sources a shot is waiting for, if any. */
function missing(shot) {
  const wanted = [...(shot.srcs ?? []), ...(shot.cuts ?? []).map((cut) => cut.src), shot.src, shot.then, shot.logo].filter(Boolean)
  return wanted.filter((path) => !has(path))
}

/**
 * The opener as a sequence of drawn frames: the line typed out, with a beat after "anything"
 * before "in Boston", then the cursor blinking after it.
 */
function openerFrames(s, dir, frames) {
  mkdirSync(dir, { recursive: true })
  const typeFrom = 8
  const typeTo = Math.round(frames * 0.8)
  const pause = Math.round(FPS * 0.3)
  const rate = PROMPT.length / (typeTo - typeFrom - pause)
  const firstPart = PROMPT_PAUSE_AT / rate
  const typedAt = (k) => {
    if (k < 0) return 0
    if (k < firstPart) return Math.round(k * rate)
    if (k < firstPart + pause) return PROMPT_PAUSE_AT
    return Math.min(PROMPT.length, PROMPT_PAUSE_AT + Math.round((k - firstPart - pause) * rate))
  }
  for (let n = 0; n < frames; n += 1) {
    const typed = PROMPT.slice(0, typedAt(n - typeFrom))
    const typing = n >= typeFrom && n < typeTo
    const cursor = typing || Math.floor(n / 8) % 2 === 0
    png(promptFrame(s, typed, cursor, n / FPS), join(dir, `f${String(n).padStart(3, '0')}.png`))
  }
  return join(dir, 'f%03d.png')
}

function renderShot(s, shot, index, dir) {
  const frames = framesOf(shot)
  const file = join(dir, `${String(index).padStart(2, '0')}-${shot.id}.mp4`)
  const inputs = []
  const graph = []
  const waiting = missing(shot)

  if (shot.kind === 'type' || shot.base === 'drift') {
    inputs.push(['-framerate', String(FPS), '-i', driftFrames(s, join(dir, `${shot.id}-drift`), frames, shot.at)])
    graph.push(`[0]format=yuv420p,setsar=1[base]`)
  } else if (shot.kind === 'opener') {
    inputs.push(['-framerate', String(FPS), '-i', openerFrames(s, join(dir, 'opener'), frames)])
    graph.push(`[0]format=yuv420p,setsar=1[base]`)
  } else if (shot.kind === 'end') {
    inputs.push(['-loop', '1', '-framerate', String(FPS), '-t', String(shot.dur), '-i', png(endFrame(s), join(dir, 'end.png'))])
    graph.push(`[0]fade=t=in:st=0:d=0.3,format=yuv420p[base]`)
  } else if (waiting.length > 0) {
    const card = png(placeholderFrame(s, shot, index, waiting), join(dir, `${shot.id}-placeholder.png`))
    inputs.push(['-loop', '1', '-framerate', String(FPS), '-t', String(shot.dur + 0.5), '-i', card])
    graph.push(`[0]format=yuv420p,setsar=1[base]`)
  } else if (shot.kind === 'still') {
    const sources = shot.srcs ?? [shot.src]
    const each = sources.map((_, k) => Math.round(((k + 1) * frames) / sources.length) - Math.round((k * frames) / sources.length))
    sources.forEach((path, k) => {
      inputs.push(['-i', join(HERE, path)])
      graph.push(`[${k}]${pushIn(s, each[k])}[s${k}]`)
    })
    graph.push(`${sources.map((_, k) => `[s${k}]`).join('')}concat=n=${sources.length}:v=1:a=0[base]`)
  } else if (shot.kind === 'clip' || shot.kind === 'roll') {
    // One clip, or several cuts sharing the shot's time equally.
    const cuts = shot.cuts ?? [{ src: shot.src, in: shot.in, speed: shot.speed }]
    const each = cuts.map((_, k) => Math.round(((k + 1) * frames) / cuts.length) - Math.round((k * frames) / cuts.length))
    cuts.forEach((cut, k) => {
      const speed = cut.speed ?? 1
      inputs.push(['-ss', String(cut.in ?? 0), '-t', String((each[k] / FPS) * speed + 0.5), '-i', join(HERE, cut.src)])
      graph.push(`[${k}]${clipFilter(s, speed)},tpad=stop_mode=clone:stop_duration=1,trim=end_frame=${each[k]},setpts=PTS-STARTPTS[c${k}]`)
    })
    graph.push(`${cuts.map((_, k) => `[c${k}]`).join('')}concat=n=${cuts.length}:v=1:a=0[base]`)
  } else if (shot.kind === 'thenNow') {
    inputs.push(['-i', join(HERE, shot.src)])
    inputs.push(['-ss', String(shot.in ?? 0), '-t', String(shot.dur + 0.5), '-i', join(HERE, shot.then)])
    graph.push(`[0]${pushIn(s, frames)}[then]`)
    graph.push(`[1]${clipFilter(s)},format=yuva420p,fade=t=in:st=${(shot.dur * 0.3).toFixed(2)}:d=${(shot.dur * 0.5).toFixed(2)}:alpha=1[now]`)
    graph.push(`[then][now]overlay=format=auto[base]`)
  }

  let last = 'base'
  // Big type needs a quieter picture under it. The drifting names are quiet already.
  if ((shot.card || shot.names) && shot.kind !== 'type' && shot.base !== 'drift') {
    graph.push(`[${last}]drawbox=x=0:y=0:w=iw:h=ih:color=black@0.45:t=fill[dimmed]`)
    last = 'dimmed'
  }
  if (shot.names) {
    const k = inputs.length
    inputs.push(['-framerate', String(FPS), '-i', rollFrames(s, join(dir, shot.id), shot.names, frames)])
    graph.push(`[${last}][${k}]overlay=format=auto[rolled]`)
    last = 'rolled'
  }
  if (shot.chapter) {
    const k = inputs.length
    inputs.push(['-loop', '1', '-framerate', String(FPS), '-t', String(shot.dur + 0.5), '-i', png(chapterFrame(s, shot.chapter), join(dir, `${shot.id}-chapter.png`))])
    graph.push(`[${last}][${k}]overlay=format=auto:shortest=1[chaptered]`)
    last = 'chaptered'
  }
  if (shot.card) {
    const k = inputs.length
    const at = shot.cardAt ?? 0.04
    const until = at + (shot.cardFor ?? shot.dur)
    inputs.push(['-loop', '1', '-framerate', String(FPS), '-t', String(shot.dur + 0.5), '-i', png(cardFrame(s, shot.card, shot.logo), join(dir, `${shot.id}-card.png`))])
    graph.push(`[${k}]format=rgba,fade=t=in:st=${at}:d=0.12:alpha=1[card]`)
    graph.push(`[${last}][card]overlay=format=auto:enable='between(t,${at},${until.toFixed(2)})'[carded]`)
    last = 'carded'
  }
  // Two white frames to cut out on, where a part ends on a flash.
  const flash = shot.flashOut ? `,drawbox=x=0:y=0:w=iw:h=ih:color=white:t=fill:enable='gte(n,${frames - 2})'` : ''
  graph.push(`[${last}]tpad=stop_mode=clone:stop_duration=2,trim=end_frame=${frames},setpts=PTS-STARTPTS${flash},format=yuv420p[v]`)

  ffmpeg([...inputs.flat(), '-filter_complex', graph.join(';'), '-map', '[v]', '-frames:v', String(frames), '-r', String(FPS), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', file])
  return { file, frames, placeholder: waiting.length > 0 && shot.kind !== 'opener' && shot.kind !== 'end', waiting }
}

/** The Boston names drifting, blurred, with no bar: from `start` seconds on, so each shot differs. */
function driftFrames(s, dir, frames, start) {
  mkdirSync(dir, { recursive: true })
  for (let n = 0; n < frames; n += 1) png(promptFrame(s, '', false, start + n / FPS, false), join(dir, `d${String(n).padStart(3, '0')}.png`))
  return join(dir, 'd%03d.png')
}

/** The recap: a few frames from the middle of each shot in the cut's recap, in negative, then the bar. */
function renderRecap(s, shot, index, dir, rendered) {
  const frames = framesOf(shot)
  const file = join(dir, `${String(index).padStart(2, '0')}-${shot.id}.mp4`)
  const inputs = []
  const graph = []
  CUT.recap.forEach((id, k) => {
    const source = rendered.get(id)
    const from = Math.max(0, Math.floor(source.frames / 2 - RECAP_FRAMES / 2))
    inputs.push(['-i', source.file])
    graph.push(`[${k}]trim=start_frame=${from}:end_frame=${from + RECAP_FRAMES},setpts=PTS-STARTPTS,negate[r${k}]`)
  })
  const barFrames = frames - CUT.recap.length * RECAP_FRAMES
  if (barFrames < FPS * 0.3) throw new Error('the recap is too short for its shots and the bar')
  const bar = png(promptFrame(s, PROMPT, true, 2), join(dir, 'recap-bar.png'))
  inputs.push(['-loop', '1', '-framerate', String(FPS), '-t', String(barFrames / FPS + 0.5), '-i', bar])
  graph.push(`[${CUT.recap.length}]format=yuv420p,trim=end_frame=${barFrames},setpts=PTS-STARTPTS[bar]`)
  const letterbox = `drawbox=x=0:y=0:w=iw:h=ih*0.11:color=black:t=fill,drawbox=x=0:y=ih*0.89:w=iw:h=ih*0.11:color=black:t=fill`
  graph.push(`${CUT.recap.map((_, k) => `[r${k}]`).join('')}[bar]concat=n=${CUT.recap.length + 1}:v=1:a=0,${letterbox},format=yuv420p[v]`)
  ffmpeg([...inputs.flat(), '-filter_complex', graph.join(';'), '-map', '[v]', '-frames:v', String(frames), '-r', String(FPS), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', file])
  return { file, frames, placeholder: false, waiting: [] }
}

// ---- The film -----------------------------------------------------------------------------------

function renderSize(s) {
  const dir = join(WORK, s.name)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  const rendered = new Map()
  const order = []
  CUT.shots.forEach((shot, index) => {
    process.stdout.write(`  ${s.name} ${String(index + 1).padStart(2, '0')} ${shot.id}\n`)
    const result = shot.kind === 'recap' ? renderRecap(s, shot, index, dir, rendered) : renderShot(s, shot, index, dir)
    rendered.set(shot.id, result)
    order.push(result)
  })

  const animatic = order.some((shot) => shot.placeholder)
  const name = animatic ? `animatic${CUT.name === 'basic' ? '-basic' : ''}${s.name === 'wide' ? '' : '-phone'}` : s.file
  const list = join(dir, 'list.txt')
  writeFileSync(list, order.map((shot) => `file '${shot.file}'`).join('\n'))
  const output = join(OUT, `${name}.mp4`)
  const rate = `${s.maxrate}M`
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-vf', GRADE, '-r', String(FPS), '-frames:v', String(frameAt(CUT.length)), '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-maxrate', rate, '-bufsize', `${s.maxrate * 2}M`, '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output])

  if (s.name === 'wide') {
    // The poster is the moment the line is typed out, before anything moves.
    const poster = join(OUT, animatic ? 'animatic-poster.jpg' : 'boston-montage-poster.jpg')
    const typedOut = (CUT.shots[0].dur - 0.35).toFixed(2)
    ffmpeg(['-ss', typedOut, '-i', output, '-frames:v', '1', '-q:v', '5', poster])
  }
  const waiting = [...new Set(order.flatMap((shot) => shot.waiting))]
  return { output, waiting }
}

checkTimeline()
mkdirSync(OUT, { recursive: true })
const which = ARGS.find((arg) => arg !== 'basic')
const sizes = which ? [SIZES[which]] : [SIZES.wide, SIZES.phone]
if (sizes.some((size) => !size)) throw new Error(`unknown argument "${which}": use wide, phone or basic`)

let waiting = []
for (const size of sizes) {
  const result = renderSize(size)
  const megabytes = statSync(result.output).size / 1024 / 1024
  process.stdout.write(`${result.output.replace(`${ROOT}/`, '')}: ${megabytes.toFixed(1)} MB\n`)
  waiting = result.waiting
}
if (waiting.length > 0) {
  process.stdout.write(`\nAn animatic: ${waiting.length} sources still to add to film/:\n${waiting.map((path) => `  ${path}`).join('\n')}\n`)
}
