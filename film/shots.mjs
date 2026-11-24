// The home page montage, shot by shot (docs/hero-montage.md has the plan, the sources and the
// licences). render.mjs cuts the film from this list. A shot whose file isn't in film/ yet renders
// as a labelled placeholder, so the same list makes the animatic now and the film later.
//
// at and dur are seconds; they must run on from each other and end at 29. src paths are relative
// to film/. A card is the small label set low in the frame: what started here, where, when.

export const FPS = 30
export const LENGTH = 35

/** The line the prompt bar types at the start, and lands back on at the end of the recap. */
export const PROMPT = 'Everyone can build anything'

/** Blurred behind the prompt bar, drifting past. */
export const DRIFT_WORDS = ['Comm Ave', 'Kendall', 'Back Bay', 'Harvard Yard', 'the Charles', 'Allston']

export const END_LINE = 'Started at BU. Open to Boston.'

// Paced to be read: a shot with a card holds long enough to read it and see what it shows (1.7 s
// or more); shots without one stay quick. A chapter label sits small in the corner, so it's always
// clear which part of the story you're in.

/** @typedef {{ id: string, at: number, dur: number, part: string, kind: 'opener' | 'still' | 'clip' | 'thenNow' | 'roll' | 'recap' | 'end', note: string, chapter?: string, src?: string, srcs?: string[], then?: string, in?: number, speed?: number, card?: string, cardAt?: number, cardFor?: number, names?: string[], logo?: string, cuts?: { src: string, in?: number, speed?: number }[], flashOut?: boolean }} Shot */

// A card is "Name / where / when": the name set large in the middle, where and when small under
// it, over the shot dimmed. Names are set in our own type, except where a company has approved
// its logo for this film (logo, from film/brand/): Meta has. Keep each approval in writing with
// the project (docs/hero-montage.md). film/brand/ stays out of git like the clips.

/**
 * The WHOOP beat: WHOOP's own pictures, a body shot and two of its athletes, which WHOOP approved
 * for this film (the approval covers the athletes' photos too; keep it in writing). Any of the
 * other files in brand/whoop/ and brand/whoop-ambassadors/ can be swapped in.
 */
const WHOOP_STILLS = ['brand/whoop/whoop-body-4.jpg', "brand/whoop-ambassadors/Sha'Carri_Richardson.jpg", 'brand/whoop-ambassadors/Cristiano_Ronaldo.jpeg']

/** @type {Shot[]} */
export const SHOTS = [
  { id: 'opener', at: 0, dur: 2.6, part: 'Opening', kind: 'opener', note: 'A prompt bar types the line; Boston names drift behind it', flashOut: true },

  { id: 'maps', at: 2.6, dur: 2.0, part: 'Then', chapter: 'THEN', kind: 'still', note: 'Old maps of Boston, 1722 to 1900, the shoreline filling in', srcs: ['archive/map-1722.jpg', 'archive/map-1852.jpg', 'archive/map-1900.jpg'], card: 'Boston / Founded 1630' },
  { id: 'harbor', at: 4.6, dur: 1.0, part: 'Then', chapter: 'THEN', kind: 'still', note: 'The harbour full of masts, c. 1906', src: 'archive/harbor-1906.jpg' },
  { id: 'bell', at: 5.6, dur: 2.0, part: 'Then', chapter: 'THEN', kind: 'still', note: "Bell's notebook, March 10, 1876", src: 'archive/bell-notebook-1876.jpg', card: 'The telephone / A BU professor / 1876' },
  { id: 'terminal', at: 7.6, dur: 2.0, part: 'Then', chapter: 'THEN', kind: 'clip', note: 'A vintage terminal, green text, an @ typed', src: 'clips/terminal-vintage.mp4', card: 'Network email and the @ / Cambridge / 1971' },
  { id: 'then-now', at: 9.6, dur: 1.6, part: 'Then and now', chapter: 'THEN / NOW', kind: 'thenNow', note: 'Back Bay from the State House dome, c. 1906, dissolving into Back Bay from the air today', src: 'archive/back-bay-1906.jpg', then: 'clips/back-bay-aerial.mp4' },

  { id: 'charles-dawn', at: 11.2, dur: 0.9, part: 'Now', chapter: 'NOW', kind: 'clip', note: 'Boston from the air at sunrise', src: 'clips/boston-sunrise-aerial.mp4', speed: 1.3 },
  { id: 'green-line', at: 12.1, dur: 0.9, part: 'Now', chapter: 'NOW', kind: 'clip', note: 'A Green Line train at a street stop', src: 'clips/green-line.mp4', speed: 1.2 },
  { id: 'night', at: 13.0, dur: 0.9, part: 'Now', chapter: 'NOW', kind: 'clip', note: 'Boston from the air at night, the river and its lit bridges', src: 'clips/boston-night-aerial.mp4', speed: 1.2, flashOut: true },

  { id: 'robot-arm', at: 13.9, dur: 1.5, part: 'What started here', chapter: 'WHAT STARTED HERE', kind: 'clip', note: 'A robot arm at work in a lab', src: 'clips/robot-arm.mp4', card: 'Boston Dynamics / MIT / 1992' },
  { id: 'dorm', at: 15.4, dur: 1.5, part: 'What started here', chapter: 'WHAT STARTED HERE', kind: 'clip', note: "A dorm room at night, a laptop's glow on a face", src: 'clips/dorm-laptop.mp4', card: 'Meta / Started as Facebook / A Harvard dorm / 2004', logo: 'brand/meta-lockup-white.svg' },
  // Moderna's own footage, approved for this film: its vials on the line, then a robot pipetting in its lab.
  { id: 'moderna', at: 16.9, dur: 1.5, part: 'What started here', chapter: 'WHAT STARTED HERE', kind: 'clip', note: "Moderna's vials on the line, then its lab robot", cuts: [{ src: 'brand/moderna/moderna-vaccine-vials.mov', in: 0.4 }, { src: 'brand/moderna/moderna-b-roll-nov-2020.mov', in: 142 }], card: 'Moderna / Cambridge / 2010' },
  // iRobot's own Roomba film, approved for this film: crossing a sunlit floor, then its green scan.
  // This copy is the small one (420x236, 15 fps); swap in the full-resolution file when iRobot sends it.
  { id: 'vacuum', at: 18.4, dur: 1.5, part: 'What started here', chapter: 'WHAT STARTED HERE', kind: 'clip', note: 'The Roomba crossing a sunlit floor, then its green scan', cuts: [{ src: 'brand/irobot/roomba-max-705-overview.mp4', in: 22.6 }, { src: 'brand/irobot/roomba-max-705-overview.mp4', in: 52.0 }], card: 'iRobot / The Roomba / MIT roboticists / 1990' },
  { id: 'code', at: 19.9, dur: 1.5, part: 'What started here', chapter: 'WHAT STARTED HERE', kind: 'clip', note: 'Code scrolling on a screen in a dark room', src: 'clips/code.mp4', card: 'Dropbox / MIT students in Cambridge / 2007' },
  { id: 'speaker', at: 21.4, dur: 1.5, part: 'What started here', chapter: 'WHAT STARTED HERE', kind: 'clip', note: 'A speaker cone pulsing, close up', src: 'clips/speaker.mp4', card: 'Bose / MIT professor Amar Bose / 1964' },
  { id: 'whoop', at: 22.9, dur: 2.1, part: 'What started here', chapter: 'WHAT STARTED HERE', kind: 'still', note: "WHOOP's own pictures: the strap mid-workout, Sha'Carri Richardson, Cristiano Ronaldo", srcs: WHOOP_STILLS, card: 'WHOOP / Harvard / 2012' },
  { id: 'more', at: 25.0, dur: 2.0, part: 'What started here', chapter: 'WHAT STARTED HERE', kind: 'roll', note: 'More names, faster and faster, over the city at night', src: 'clips/boston-night-aerial.mp4', in: 6, names: ['HubSpot', 'Wayfair', 'Reddit', 'Zipcar', 'Akamai', 'Polaroid', 'Harmonix', 'DraftKings'], flashOut: true },

  { id: 'apollo', at: 27.0, dur: 4.0, part: 'Liftoff', chapter: 'LIFTOFF', kind: 'clip', note: 'Apollo 11: ignition, liftoff, the climb (NASA)', src: 'clips/apollo-11-launch.mp4', card: "Apollo's guidance computer / Designed at MIT / 1969", cardAt: 1.0, cardFor: 2.8, flashOut: true },

  { id: 'recap', at: 31.0, dur: 2.2, part: 'Recap', kind: 'recap', note: 'Six shots again in negative, a quarter second each, then the prompt bar' },
  { id: 'end', at: 33.2, dur: 1.8, part: 'End', kind: 'end', note: "Proto's mark and the line" },
]

/** The shots the recap flashes through, in order, before it lands back on the prompt bar. */
export const RECAP = ['maps', 'bell', 'terminal', 'robot-arm', 'dorm', 'apollo']
