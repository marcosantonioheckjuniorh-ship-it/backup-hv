import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/funil/$page')({
  component: FunilRedirect,
})

function FunilRedirect() {
  const { page } = Route.useParams()
  useEffect(() => {
    window.location.replace(`/funil/${page}/index.html${window.location.search}`)
  }, [page])
  return null
}
