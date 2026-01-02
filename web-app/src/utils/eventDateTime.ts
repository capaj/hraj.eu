import dayjs from 'dayjs'

type EventDateLike = {
  date: Date | string
  startTime?: string
}

export const getEventDateTime = (event: EventDateLike): Date => {
  const base = dayjs(event.date)
  const [hours = 0, minutes = 0] = (event.startTime || '00:00')
    .split(':')
    .map(Number)
  const withTime = base
    .hour(Number.isFinite(hours) ? hours : 0)
    .minute(Number.isFinite(minutes) ? minutes : 0)
    .second(0)
    .millisecond(0)
  return withTime.isValid() ? withTime.toDate() : new Date()
}
