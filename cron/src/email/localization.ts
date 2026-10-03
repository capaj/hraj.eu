export type EmailLocale = 'cs' | 'en'

// Scheduled messages use Czech, matching the app's default locale.
// A caller can choose English explicitly when a recipient locale is available.
export function getEmailCopy(locale: EmailLocale = 'cs') {
  if (locale === 'en') {
    return {
      greeting: (name: string | null) => name?.trim() ? `Hi ${name.trim()},` : 'Hi,',
      confirmed: 'Event confirmed',
      confirmedSuffix: 'is confirmed.',
      confirmedSubject: (title: string) => `Event confirmed: ${title}`,
      confirmedIntro: (title: string) => `Your event is confirmed: ${title}`,
      cancelled: 'Event cancelled',
      cancelledSuffix: 'was cancelled.',
      cancelledSubject: (title: string) => `Event cancelled: ${title}`,
      cancelledIntro: (title: string) => `Your event was cancelled: ${title}`,
      when: 'When',
      where: 'Where',
      reason: 'Reason',
      minimumParticipants: 'Minimum participants not reached',
      viewEvent: 'View event',
      calendar: 'We attached a calendar file so you can add it to Google Calendar.',
      citySubject: (city: string) => `New upcoming events in ${city}`,
      cityIntro: (city: string) => `New events were added in ${city}:`,
      seeAllEvents: 'See all events',
      venueSubject: (venue: string) => `New upcoming events at ${venue}`,
      venueIntro: (venue: string) => `New events were added at ${venue}:`,
      browseVenues: 'Browse all venues',
      commentsHeading: (title: string) => `New comments on ${title}`,
      commentsSubject: (count: number, title: string) => `${count} new ${count === 1 ? 'comment' : 'comments'} on ${title}`,
      commentsIntro: (count: number) => `There ${count === 1 ? 'is' : 'are'} ${count} new ${count === 1 ? 'comment' : 'comments'} in the event discussion.`,
      moreComments: (count: number) => `...and ${count} more ${count === 1 ? 'comment' : 'comments'}.`,
      openDiscussion: 'Open the event discussion',
      unsubscribe: 'You can turn off all event emails in your profile settings.'
    }
  }

  const comments = (count: number) => {
    if (count === 1) return 'nový komentář'
    if (count >= 2 && count <= 4) return 'nové komentáře'
    return 'nových komentářů'
  }

  const moreComments = (count: number) => {
    if (count === 1) return `…a ${count} další komentář.`
    if (count <= 4) return `…a ${count} další komentáře.`
    return `…a ${count} dalších komentářů.`
  }
  const added = (count: number) => {
    if (count === 1) return 'přibyl'
    if (count <= 4) return 'přibyly'
    return 'přibylo'
  }

  return {
    greeting: (name: string | null) => name?.trim() ? `Ahoj ${name.trim()},` : 'Ahoj,',
    confirmed: 'Událost potvrzena',
    confirmedSuffix: 'je potvrzena.',
    confirmedSubject: (title: string) => `Událost potvrzena: ${title}`,
    confirmedIntro: (title: string) => `Tvoje událost je potvrzena: ${title}`,
    cancelled: 'Událost zrušena',
    cancelledSuffix: 'byla zrušena.',
    cancelledSubject: (title: string) => `Událost zrušena: ${title}`,
    cancelledIntro: (title: string) => `Tvoje událost byla zrušena: ${title}`,
    when: 'Kdy',
    where: 'Kde',
    reason: 'Důvod',
    minimumParticipants: 'Nebyl dosažen minimální počet účastníků',
    viewEvent: 'Zobrazit událost',
    calendar: 'V příloze najdeš soubor pro přidání události do Google Kalendáře.',
    citySubject: (city: string) => `Nové nadcházející události – ${city}`,
    cityIntro: (city: string) => `Přibyly nové události ve městě ${city}:`,
    seeAllEvents: 'Zobrazit všechny události',
    venueSubject: (venue: string) => `Nové nadcházející události – ${venue}`,
    venueIntro: (venue: string) => `Přibyly nové události na sportovišti ${venue}:`,
    browseVenues: 'Procházet všechna sportoviště',
    commentsHeading: (title: string) => `Nové komentáře – ${title}`,
    commentsSubject: (count: number, title: string) => `${count} ${comments(count)} – ${title}`,
    commentsIntro: (count: number) => `V diskuzi k události ${added(count)} ${count} ${comments(count)}.`,
    moreComments,
    openDiscussion: 'Otevřít diskuzi k události',
    unsubscribe: 'E-maily o událostech můžeš vypnout v nastavení svého profilu.'
  }
}

export function formatEmailDate(date: string, locale: EmailLocale = 'cs') {
  // Date-only fields have no timezone; use UTC to preserve their calendar day.
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  })
}
