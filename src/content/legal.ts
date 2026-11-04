// NOTE: This privacy policy and these terms are a plain-language draft written from what the code
// actually does. They are not legal advice. Before relying on them, have someone qualified review
// them, ideally BU's student organization office or the Office of the General Counsel.
// When the data handling changes (a new form, a new provider, analytics), update the matching
// section here and bump EFFECTIVE_DATE.

import type { PageIntro } from './types'

export const CONTACT_EMAIL = 'hello@buproto.com'
export const EFFECTIVE_DATE = 'November 4, 2026'

/** A link inside legal copy. `/…` routes inside the site; anything else opens as a plain link. */
export interface LegalLink {
  label: string
  href: string
}

/** A run of text: plain, a link, or a bold lead-in like "Join form:". */
export type Inline = string | LegalLink | { strong: string }

/** One paragraph, or one list item. A string when it has no links or bold. */
export type Rich = string | readonly Inline[]

export type Block = Rich | { list: readonly Rich[] }

export interface LegalSection {
  /** The anchor for the contents list, e.g. `#collect`. */
  id: string
  title: string
  body: readonly Block[]
}

export interface LegalDoc {
  intro: PageIntro
  contentsLabel: string
  sections: readonly LegalSection[]
  /** The other document, linked at the bottom. */
  other: LegalLink
}

const email: LegalLink = { label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` }
const privacyLink: LegalLink = { label: 'Privacy Policy', href: '/privacy' }
const termsLink: LegalLink = { label: 'Terms', href: '/terms' }

export const PRIVACY: LegalDoc = {
  intro: {
    path: '~/proto/privacy',
    title: 'Privacy',
    lede: 'What BU Proto collects, why, who else touches it and how to get it changed or deleted. Short version: only what you type into our forms, no tracking, never sold.',
  },
  contentsLabel: 'On this page',
  other: { label: 'Read the Terms', href: '/terms' },
  sections: [
    {
      id: 'who',
      title: 'Who we are',
      body: [
        'BU Proto (a working name) is a student-run home base at Boston University for people who make things: weekly hack nights, group hackathon trips and demo nights. It’s run by students and isn’t an official part of BU, Spark! or Innovate@BU.',
        ['This policy covers buproto.com. When we say “we” or “us”, we mean the students who run it. Questions go to ', email, '.'],
      ],
    },
    {
      id: 'collect',
      title: 'What we collect',
      body: [
        'Only what you type into a form, plus what any website sees when you visit:',
        {
          list: [
            [{ strong: 'Joining.' }, ' Your name, BU email, year and track. If you join again with the same email, we update what we have instead of making a second entry.'],
            [
              { strong: 'The fund interest list.' },
              ' Your name, BU email, year, the hackathon or project you have in mind, what you’d spend the money on and a rough amount.',
            ],
            [{ strong: 'Event RSVPs.' }, ' Your name and an email address (any address works, not just BU).'],
            [
              { strong: 'Visiting the site.' },
              ' Like every website, our host receives your IP address, browser type and the pages you request. We use your IP address to limit how often one connection can send our forms, which keeps out spam.',
            ],
            [
              { strong: 'Admins.' },
              ' The few people who run the site sign in to a private portal with Google. From Google we get their name, email address, profile picture and Google account ID. We never see their Google password, and we don’t keep Google’s access tokens.',
            ],
          ],
        },
        'We don’t ask for anything else, and we don’t buy data about you from anyone.',
      ],
    },
    {
      id: 'use',
      title: 'How we use it',
      body: [
        {
          list: [
            'Member details let us email you about hack nights, trips and events, and help us plan things like team matching and which track needs what.',
            'Fund interest sign-ups tell us how much demand there is, which we show sponsors as totals, and let us email you when the fund opens or changes.',
            'RSVPs let us plan food and space, and email you about that event (a room change, a reminder).',
            'Request details keep the site running and safe: rate limiting, spotting abuse and fixing errors.',
          ],
        },
        'The people who run BU Proto can see what you sent us in the admin portal. They can add private notes, export the member list as a spreadsheet and send emails from it. We use it only for BU Proto.',
      ],
    },
    {
      id: 'share',
      title: 'Who we share it with',
      body: [
        'We don’t sell your information, rent it or share it for advertising. A few services do the work of running the site, and they handle data on our behalf:',
        {
          list: [
            [
              { strong: 'Cloudflare' },
              ' hosts the site and stores the database. Cloudflare also keeps short-lived request logs (IP address, browser, page) that we use to debug problems.',
            ],
            [{ strong: 'Resend' }, ' sends our emails, so it receives your name, email address and the message.'],
            [
              { strong: 'Google' },
              ' serves the site’s fonts, so your browser asks Google for them and Google sees your IP address and browser. Our emails load the same fonts when your mail app shows images. Google also handles admin sign-in.',
            ],
          ],
        },
        'Beyond that, we’d only share information if the law requires it, or with your OK. If a BU office takes BU Proto on officially one day, the records would move with it, and we’d update this page first.',
      ],
    },
    {
      id: 'google',
      title: 'Google user data',
      body: [
        'Only the people who run BU Proto sign in with Google, and only to reach the private admin portal. Visitors and members never sign in with Google.',
        {
          list: [
            [
              { strong: 'What we ask Google for.' },
              ' The basic sign-in scopes only: openid, email and profile. From those we receive your name, email address, whether Google has verified that address, your profile picture and your Google account ID. We don’t ask for, and can’t see, your Gmail, Drive, Calendar, contacts or anything else in your Google account.',
            ],
            [
              { strong: 'How we use it.' },
              ' To confirm who you are and check that your email address is on our list of admins, to show your name and picture in the portal, and to record which admin made a change or sent an email. Nothing else: not for advertising, not for profiling, and not to train any AI or machine-learning model.',
            ],
            [
              { strong: 'Sharing.' },
              ' We don’t sell, share or transfer Google user data to anyone. It’s stored in our own database on Cloudflare, which hosts the site for us.',
            ],
            [
              { strong: 'Storage and retention.' },
              ' Google’s access and ID tokens are used once, during sign-in, and then thrown away. We keep a session record (your email, name, picture and Google account ID) for up to 14 days; it’s deleted when an admin removes you, and it stops working when it expires or you sign out. Your email address stays on the admin list until you’re removed.',
            ],
            [
              { strong: 'Deleting it.' },
              ' Ask any admin to remove you, or email ',
              email,
              ', and we’ll delete your admin record and sessions. You can also revoke BU Proto’s access at any time from ',
              { label: 'your Google Account permissions', href: 'https://myaccount.google.com/permissions' },
              '.',
            ],
          ],
        },
        [
          'BU Proto’s use of information received from Google APIs adheres to the ',
          { label: 'Google API Services User Data Policy', href: 'https://developers.google.com/terms/api-services-user-data-policy' },
          ', including the Limited Use requirements.',
        ],
      ],
    },
    {
      id: 'storage',
      title: 'Cookies and local storage',
      body: [
        'The public site sets no cookies and runs no analytics, ads or third-party trackers.',
        'When you RSVP, your browser remembers it in local storage, on your own device, so the button still says you’re going after a reload. It holds only the event’s number, never your name or email. Clearing your browser’s site data removes it.',
        'Admins get a cookie when they sign in. It keeps them signed in for up to 14 days, can’t be read by scripts on the page and is cleared when they sign out. A second cookie lasts only a few minutes while the Google sign-in is in progress.',
      ],
    },
    {
      id: 'keep',
      title: 'How long we keep it',
      body: [
        'Member, fund interest and RSVP records stay until you ask us to delete them, or until we clear out old records ourselves. Unsubscribing stops the emails but keeps your record so we know not to email you. Admin sign-in sessions end after 14 days. Cloudflare’s request logs are kept only for a short time.',
      ],
    },
    {
      id: 'choices',
      title: 'Your choices',
      body: [
        {
          list: [
            [
              { strong: 'Unsubscribe.' },
              ' Every member email has a one-click unsubscribe link at the bottom. Joining again turns member emails back on. Emails about an event you RSVP’d to, or about the fund, don’t have that link: reply to one or email us and we’ll take you off.',
            ],
            [
              { strong: 'Get a copy, fix or delete.' },
              ' Email ',
              email,
              ' from the address you signed up with and we’ll send you what we have, correct it or delete it everywhere it appears. We aim to answer within a couple of weeks.',
            ],
            [
              { strong: 'Names and photos on the site.' },
              ' If you appear on the Board or Wins pages and want something changed or taken down, email us.',
            ],
          ],
        },
      ],
    },
    {
      id: 'age',
      title: 'Students and age',
      body: [
        'BU Proto is for Boston University students, and RSVPs are open to anyone coming to an event. The site isn’t meant for children under 13, and we don’t knowingly collect their information. If you think a child has sent us something, email us and we’ll delete it.',
        'We’re not the university, so what you send us isn’t part of your BU education record.',
      ],
    },
    {
      id: 'security',
      title: 'Security',
      body: [
        'Everything travels over HTTPS. Only signed-in admins can reach the portal, and the sign-in cookie can’t be read by scripts. The forms are rate limited and screened for spam bots. No system is perfectly secure, though, so please don’t put anything sensitive in a form: we never need passwords, ID numbers or financial details.',
      ],
    },
    {
      id: 'changes',
      title: 'Changes to this policy',
      body: [
        'If we change what we collect or how we use it, we’ll update this page and the date at the top. If a change is big, we’ll email members about it too.',
      ],
    },
    {
      id: 'contact',
      title: 'Contact',
      body: [['Questions, requests or worries: ', email, '. Real students read it. See also our ', termsLink, '.']],
    },
  ],
}

export const TERMS: LegalDoc = {
  intro: {
    path: '~/proto/terms',
    title: 'Terms',
    lede: 'The ground rules for using buproto.com and coming along to what we run. Plain words, not a contract-shaped wall of text.',
  },
  contentsLabel: 'On this page',
  other: { label: 'Read the Privacy Policy', href: '/privacy' },
  sections: [
    {
      id: 'what',
      title: 'What this site is',
      body: [
        'BU Proto (a working name) is a student-run home base at Boston University for people who make things. This site lists our hack nights, events and hackathon trips, shows what members have built, and has forms to join, RSVP and say you’d use the planned fund.',
        'It’s run by students. It isn’t an official BU site, and nothing here is official with Spark! or Innovate@BU yet. By using the site you agree to these terms. If you don’t, please don’t use it.',
      ],
    },
    {
      id: 'using',
      title: 'Using the site',
      body: [
        {
          list: [
            'Only put your own, real details in our forms. Don’t sign anyone else up.',
            'Don’t spam the forms, flood the site, try to break in or get around the rate limits. Each connection can send a form only so many times a minute.',
            'Don’t use the site for anything illegal, or to harass anyone.',
          ],
        },
        'We can remove sign-ups, block traffic or stop emailing anyone who misuses the site.',
      ],
    },
    {
      id: 'events',
      title: 'Events and trips',
      body: [
        'Going to a hack night, event or hackathon trip is your own choice, and you’re responsible for yourself while you’re there.',
        'Every hackathon has its own rules, code of conduct and terms, and so do venues and transport. Follow them: they decide what’s allowed, not us. An RSVP or a seat on a trip doesn’t guarantee you a place at an event that runs its own admissions.',
        'At anything BU Proto runs, treat people with respect. No harassment, discrimination or making anyone feel unwelcome. We may ask someone to leave, or stop inviting them, if they don’t.',
        'Plans change: times, rooms and trips can move or be cancelled. We’ll tell people who RSVP’d when we can.',
      ],
    },
    {
      id: 'fund',
      title: 'The fund',
      body: [
        'The Proto fund doesn’t exist yet. The form on the Grants page is only an interest list.',
        {
          list: [
            'Signing up isn’t an application, and it doesn’t make you eligible for anything.',
            'Nothing on the site is an offer or a promise of money. The amounts shown are a plan and may change.',
            'The fund may never open, or may open with different rules. If it does, it’ll have its own terms.',
          ],
        },
      ],
    },
    {
      id: 'content',
      title: 'Content and other sites',
      body: [
        'Project write-ups, photos and names belong to the people who made them. Please don’t reuse them without asking.',
        'We link to sites we don’t run, like MLH, Devpost, hackathons’ own pages, Google Maps and BU’s programs. Hackathon listings are partly gathered from public MLH and Devpost pages. We try to keep dates and details right, but always check the hackathon’s own site before you apply or travel. Those sites have their own terms and privacy policies.',
      ],
    },
    {
      id: 'admin',
      title: 'The admin portal',
      body: [
        'The admin portal is only for the people who run BU Proto and have been given access. Don’t try to get in otherwise.',
        [
          'Admins may use what people send in only for running BU Proto, as the ',
          privacyLink,
          ' describes, and must keep it private.',
        ],
      ],
    },
    {
      id: 'warranty',
      title: 'No warranty',
      body: [
        'We’re students doing this for free. The site and everything on it is provided as is: it may have mistakes, be out of date or go down, and we don’t promise otherwise.',
      ],
    },
    {
      id: 'liability',
      title: 'Limits on liability',
      body: [
        'As far as the law allows, BU Proto and the students who run it aren’t responsible for losses that come from using the site, relying on what it says, or going to events and hackathons, including ones run by others. This doesn’t take away any rights the law says can’t be taken away.',
      ],
    },
    {
      id: 'changes',
      title: 'Changes to these terms',
      body: [
        'We may update these terms. When we do, we’ll change the date at the top of this page. Using the site after that means you accept the new version.',
      ],
    },
    {
      id: 'contact',
      title: 'Contact',
      body: [['Questions about these terms: ', email, '. How we handle your information is in our ', privacyLink, '.']],
    },
  ],
}

/** The line under a form that collects personal details. */
export const PRIVACY_NOTE = {
  link: 'How we use this',
  href: '/privacy',
} as const

export const LEGAL_LINKS: readonly LegalLink[] = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
]
