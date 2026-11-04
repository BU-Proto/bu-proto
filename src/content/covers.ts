// Default cover photos for events with no photo of their own: Boston University buildings and
// views from Wikimedia Commons. Each is credited on the page, as its licence requires. A cover
// added in the portal always wins; swap these for Proto's own photos as they come in.

import type { EventKind } from '../../shared/constants'

export interface CoverPhoto {
  src: string
  alt: string
  author: string
  license: string
  /** The photo's page on Commons, for the credit link. */
  source: string
}

const commons = (path: string, file: string) =>
  `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/${file}/1920px-${file}`

const CDS: CoverPhoto = {
  src: commons('e/e2', 'Boston_University_Center_for_Computing_and_Data_Sciences_June_2025_1.jpg'),
  alt: 'The Center for Computing and Data Sciences on Commonwealth Avenue',
  author: '4300streetcar',
  license: 'CC BY 4.0',
  source: 'https://commons.wikimedia.org/wiki/File:Boston_University_Center_for_Computing_and_Data_Sciences_June_2025_1.jpg',
}

export const EVENT_COVERS: Record<EventKind, CoverPhoto> = {
  'Hack night': CDS,
  'Demo night': {
    src: commons('6/60', '2023-0323-Boston_University_Center_of_Computing_and_Data_Science.jpg'),
    alt: 'The Center for Computing and Data Sciences seen across the Charles River',
    author: 'Bobak Ha’Eri',
    license: 'CC BY 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:2023-0323-Boston_University_Center_of_Computing_and_Data_Science.jpg',
  },
  'Why hackathons': {
    src: commons('0/07', 'Boston_University_Marsh_Chapel%2C_Boston_MA.jpg'),
    alt: 'Marsh Chapel at Boston University',
    author: 'John Phelan',
    license: 'CC BY 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Boston_University_Marsh_Chapel,_Boston_MA.jpg',
  },
  Panel: {
    src: commons('7/72', 'Mugar_Memorial_Library_from_Commonwealth_Avenue%2C_July_2021.jpg'),
    alt: 'Mugar Memorial Library from Commonwealth Avenue',
    author: 'Pi.1415926535',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Mugar_Memorial_Library_from_Commonwealth_Avenue,_July_2021.jpg',
  },
  Workshop: {
    src: commons('2/2f', 'Boston_University_College_of_Arts_and_Sciences.jpg'),
    alt: 'The College of Arts and Sciences on Commonwealth Avenue',
    author: 'Fletcher6',
    license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Boston_University_College_of_Arts_and_Sciences.jpg',
  },
  'Prep night': {
    src: commons('3/37', 'Sunset_and_Photonics_Center.JPG'),
    alt: 'The Photonics Center at sunset',
    author: 'Pi.1415926535',
    license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Sunset_and_Photonics_Center.JPG',
  },
}

/** For hackathons without a cover: the BU Bridge, where every trip out of Boston starts. */
export const HACKATHON_COVER: CoverPhoto = {
  src: commons('8/81', 'Boston_University_Bridge_March_2025_1.jpg'),
  alt: 'The Boston University Bridge over the Charles River',
  author: '4300streetcar',
  license: 'CC BY 4.0',
  source: 'https://commons.wikimedia.org/wiki/File:Boston_University_Bridge_March_2025_1.jpg',
}
