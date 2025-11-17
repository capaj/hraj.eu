import type { Register } from '@tanstack/react-router'
import {
  createStartHandler,
  defaultStreamHandler,
  type RequestHandler
} from '@tanstack/react-start/server'

import { setupLocaleFromRequest } from '~/modules/lingui/i18n.server'

const linguiStreamHandler: Parameters<typeof createStartHandler>[0] = async (
  context
) => {
  await setupLocaleFromRequest()
  return defaultStreamHandler(context)
}

const fetch = createStartHandler(linguiStreamHandler)

export type ServerEntry = { fetch: RequestHandler<Register> }

export function createServerEntry(entry: ServerEntry): ServerEntry {
  return {
    async fetch(...args) {
      return entry.fetch(...args)
    }
  }
}

export default createServerEntry({ fetch })
