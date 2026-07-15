import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/funil/pos/$')({
  component: PosRedirect,
})

function PosRedirect() {
  const { _splat } = Route.useParams()
  useEffect(() => {
    const path = (_splat || '').replace(/\/$/, '')
    window.location.replace(`/funil/pos/${path}/index.html${window.location.search}`)
  }, [_splat])
  return null
}
