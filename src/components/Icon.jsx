import {
  Book,
  Calendar,
  CalendarCheck,
  Check,
  Clock,
  EditPencil,
  Folder,
  GraphUp,
  InfoCircle,
  LogOut,
  Menu,
  Plus,
  Refresh,
  Search,
  SunLight,
  Trash,
  User,
  WarningTriangle,
  Xmark,
} from 'iconoir-react'

// Nombre semántico -> icono de Iconoir (https://iconoir.com). Los iconos heredan el color del texto.
const ICONS = {
  today: CalendarCheck,
  events: Folder,
  plus: Plus,
  progress: GraphUp,
  logout: LogOut,
  clock: Clock,
  calendar: Calendar,
  alert: WarningTriangle,
  check: Check,
  search: Search,
  sun: SunLight,
  close: Xmark,
  menu: Menu,
  book: Book,
  info: InfoCircle,
  postpone: Refresh,
  trash: Trash,
  user: User,
  edit: EditPencil,
}

export default function Icon({ name, className = 'w-5 h-5', ...props }) {
  const Component = ICONS[name]
  if (!Component) return null
  return <Component className={`shrink-0 ${className}`} aria-hidden="true" focusable="false" {...props} />
}
