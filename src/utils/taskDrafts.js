import { todayKey } from './dates'

let nextKey = 0

export function createTaskDraft() {
  return { key: nextKey++, name: '', dueDate: '', hours: '', note: '' }
}

/**
 * Valida los borradores y devuelve { [key]: { name?, dueDate?, hours? } }.
 * Además de las reglas por campo, comprueba que las horas de un mismo día
 * no superen el límite diario (misma regla que usa el detalle del evento).
 */
export function validateTaskDrafts(drafts, limitHours) {
  const errors = {}
  const hoursByDate = {}
  const today = todayKey()

  for (const draft of drafts) {
    const row = {}
    if (!draft.name.trim()) row.name = 'Escribe el nombre de la gestión.'

    if (!draft.dueDate) row.dueDate = 'Elige la fecha de la gestión.'
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.dueDate)) row.dueDate = 'Ingresa una fecha válida.'
    else if (draft.dueDate < today) row.dueDate = 'La fecha de la gestión no puede ser anterior a hoy.'

    const hours = Number(draft.hours)
    if (draft.hours === '') row.hours = 'Escribe las horas estimadas.'
    else if (Number.isNaN(hours)) row.hours = 'Escribe un número válido de horas.'
    else if (hours <= 0) row.hours = 'Las horas estimadas deben ser mayores que 0.'

    if (!row.dueDate && !row.hours) {
      hoursByDate[draft.dueDate] = (hoursByDate[draft.dueDate] || 0) + hours
    }
    if (Object.keys(row).length) errors[draft.key] = row
  }

  for (const draft of drafts) {
    const total = hoursByDate[draft.dueDate]
    if (total > limitHours && !errors[draft.key]?.hours) {
      errors[draft.key] = {
        ...errors[draft.key],
        hours: `Ese día sumas ${Math.round(total * 10) / 10} h y tu límite es ${limitHours} h.`,
      }
    }
  }
  return errors
}
