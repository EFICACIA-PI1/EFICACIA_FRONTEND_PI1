const dateFmt = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const dateShortFmt = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const dateToastFmt = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
})

const dateLongFmt = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function parseLocal(iso) {
  return new Date(`${iso}T00:00:00`)
}

export function formatDate(iso) {
  if (!iso) return ''
  return dateFmt.format(parseLocal(iso))
}

export function formatDateShort(iso) {
  if (!iso) return ''
  return dateShortFmt.format(parseLocal(iso))
}

export function formatDateToast(iso) {
  if (!iso) return ''
  return dateToastFmt.format(parseLocal(iso))
}

export function formatDateLong(iso) {
  if (!iso) return ''
  return dateLongFmt.format(parseLocal(iso))
}