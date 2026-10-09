import { useState } from 'react'
import { formatDateLong } from '../utils/format'
import { toDateKey } from '../utils/dates'

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

function dateFromKey(key) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function monthKey(date) {
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), 1))
}

export default function CalendarPicker({ value, onChange, min, max }) {
  const [month, setMonth] = useState(() => dateFromKey(value || min || toDateKey(new Date())))
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstDay = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const offset = (firstDay.getDay() + 6) % 7
  const monthTitle = new Intl.DateTimeFormat('es-CO', {
    month: 'long',
    year: 'numeric',
  }).format(firstDay)
  const capitalizedTitle = `${monthTitle[0].toLocaleUpperCase('es-CO')}${monthTitle.slice(1)}`

  const previousMonth = new Date(year, monthIndex - 1, 1)
  const previousMonthEnd = toDateKey(new Date(year, monthIndex, 0))
  const nextMonth = new Date(year, monthIndex + 1, 1)
  const nextMonthStart = toDateKey(nextMonth)
  const nextMonthEnd = toDateKey(new Date(year, monthIndex + 2, 0))
  const canGoPrevious = (!min || previousMonthEnd >= min) && (!max || monthKey(previousMonth) <= max)
  const canGoNext = (!max || nextMonthStart <= max) && (!min || nextMonthEnd >= min)

  const blanks = Array.from({ length: offset }, (_, index) => `blank-${index}`)
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1)

  return (
    <div className="rounded-xl border border-edge bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          aria-label="Mes anterior"
          disabled={!canGoPrevious}
          onClick={() => setMonth(previousMonth)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full text-xl text-navy hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ‹
        </button>
        <h3 className="text-sm font-semibold text-navy font-display">{capitalizedTitle}</h3>
        <button
          type="button"
          aria-label="Mes siguiente"
          disabled={!canGoNext}
          onClick={() => setMonth(nextMonth)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full text-xl text-navy hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="py-2 text-xs font-medium text-muted">
            {weekday}
          </span>
        ))}
        {blanks.map((blank) => <span key={blank} aria-hidden="true" />)}
        {days.map((day) => {
          const dateKey = toDateKey(new Date(year, monthIndex, day))
          const selected = dateKey === value
          const outsideRange = (min && dateKey < min) || (max && dateKey > max)
          return (
            <button
              key={dateKey}
              type="button"
              aria-label={formatDateLong(dateKey)}
              aria-pressed={selected}
              disabled={Boolean(outsideRange)}
              onClick={() => onChange(dateKey)}
              className={`mx-auto inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium disabled:opacity-35 disabled:cursor-not-allowed ${
                selected ? 'bg-primary text-white' : 'text-navy hover:bg-gray-50'
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}