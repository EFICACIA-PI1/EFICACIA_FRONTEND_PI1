// Valores aceptados por el backend (Event.event_type) con su etiqueta visible.
export const EVENT_TYPE_OPTIONS = [
  { value: 'boda', label: 'Boda' },
  { value: 'social', label: 'Social' },
  { value: 'corporativo', label: 'Corporativo' },
  { value: 'cumpleanos', label: 'Cumpleaños' },
  { value: 'otro', label: 'Otro' },
]

export function eventTypeLabel(value) {
  return EVENT_TYPE_OPTIONS.find((option) => option.value === value)?.label || value
}
