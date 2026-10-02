import { useEffect } from 'react'

const APP_NAME = 'EFICACIA'

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : `${APP_NAME} · Organizador de eventos`
  }, [title])
}
