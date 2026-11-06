import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useAuthSession } from '~/lib/auth-client'
import type { BlockableUser } from '~/lib/organizerBlocks'
import { getOrganizerBlocks, searchBlockableUsers, setOrganizerBlock } from '~/server-functions/organizerBlocks'
import { OrganizerBlocksCard } from './OrganizerBlocksCard'
import { BlockPlayerButton } from './BlockPlayerButton'

const searchUsers = (query: string) => searchBlockableUsers({ data: { query } })

function useChangeBlock() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useCallback(async (userId: string, blocked: boolean) => {
    await setOrganizerBlock({ data: { userId, blocked } })
    await queryClient.invalidateQueries({ queryKey: ['organizer-blocks'] })
    await router.invalidate()
  }, [queryClient, router])
}

export function ConnectedOrganizerBlocksCard() {
  const session = useAuthSession()
  const userId = session.data?.user?.id
  const blocks = useQuery({
    queryKey: ['organizer-blocks', userId],
    queryFn: () => getOrganizerBlocks(),
    enabled: !!userId
  })
  const onChange = useChangeBlock()
  if (!userId) return null
  return <OrganizerBlocksCard key={userId} blockedUsers={blocks.data ?? []}
    searchUsers={searchUsers} onChange={onChange} loading={blocks.isPending} loadFailed={blocks.isError} />
}

export function ConnectedEventBlockPlayerButton({ players }: { players: BlockableUser[] }) {
  const onChange = useChangeBlock()
  return <BlockPlayerButton players={players} onBlock={(id) => onChange(id, true)} />
}
