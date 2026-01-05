import { format } from 'date-fns'

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function createEventSlug(
  title: string,
  date: string | Date,
  id?: string
): string {
  const safeTitle = normalize(title || 'event') || 'event'
  const dateString =
    typeof date === 'string'
      ? date
      : format(date, 'yyyy-MM-dd')

  const base = `${safeTitle}-${dateString}`
  const suffix = id ? `-${id.slice(0, 6)}` : ''

  return `${base}${suffix}`
}
