const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

/** «21 октября» для YYYY-MM-DD, либо пустая строка для некорректных значений. */
export function formatDate(value: string | null): string {
  if (!value) return ''
  const date = parseISODate(value)
  if (!date) return ''
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}`
}

/** «21 октября 2026» для YYYY-MM-DD. */
export function formatDateFull(value: string | null): string {
  if (!value) return ''
  const date = parseISODate(value)
  if (!date) return ''
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]} ${date.getFullYear()}`
}

export function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatDueDate(value: string | null, today: string): string {
  if (!value) return 'Без срока'
  const formatted = formatDateFull(value)
  if (!formatted) return 'Без срока'
  if (value === today) return `Сегодня, ${formatted}`
  return formatted
}
