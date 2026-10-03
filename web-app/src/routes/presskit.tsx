import { createFileRoute } from '@tanstack/react-router'
import { PresskitPage } from '~/pages/PresskitPage'
import { buildSeoMeta, canonicalLink, SITE_NAME, SITE_URL } from '~/lib/seo'

export const Route = createFileRoute('/presskit')({
  head: () => ({
    meta: buildSeoMeta({
      title: `Presskit & brand assets | ${SITE_NAME}`,
      description: 'Download the official hraj.eu logos, brand colors, and presskit. Meet the community bringing amateur players together through team sports.',
      url: `${SITE_URL}/presskit`,
      image: `${SITE_URL}/brand/hraj-social.png`
    }),
    links: [canonicalLink('/presskit')]
  }),
  component: PresskitPage
})
