import { Trans } from '@lingui/react/macro'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

export function AboutPresskit() {
  return (
    <section className="pb-16 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/20 pt-8 sm:flex-row sm:items-center">
          <h2 className="text-xl font-semibold">
            <Trans>Media & brand resources</Trans>
          </h2>
          <Link
            to="/presskit"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/30 px-5 py-2 font-medium transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <Trans>Presskit</Trans>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
