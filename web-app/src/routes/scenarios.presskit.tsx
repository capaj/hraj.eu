import { createFileRoute, notFound } from '@tanstack/react-router'
import { PresskitPage } from '~/pages/PresskitPage'

export const Route = createFileRoute('/scenarios/presskit')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  head: () => ({
    meta: [
      { title: 'Soccer ball & play logo · Presskit preview' },
      { name: 'robots', content: 'noindex, nofollow' }
    ]
  }),
  component: PresskitPage
})
