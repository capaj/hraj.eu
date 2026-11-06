import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trans, useLingui } from '@lingui/react/macro'
import { ShieldBan } from 'lucide-react'
import { toast } from 'sonner'
import type { BlockableUser } from '~/lib/organizerBlocks'
import { Button } from '../ui/Button'

export function BlockPlayerButton({ player, onBlock }: {
  player: BlockableUser
  onBlock: (userId: string) => Promise<void>
}) {
  const { t } = useLingui()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  useEffect(() => {
    if (open) dialog.current?.showModal()
  }, [open])
  const close = () => {
    if (pending) return
    dialog.current?.close()
    setOpen(false)
  }
  const block = async () => {
    setPending(true)
    setFailed(false)
    try {
      await onBlock(player.id)
      dialog.current?.close()
      setOpen(false)
      toast.success(t`Player blocked from all your events.`)
    } catch {
      setFailed(true)
    } finally {
      setPending(false)
    }
  }
  return (
    <>
      <Button type="button" variant="ghost" size="sm" className="shrink-0 text-red-600 hover:bg-red-50"
        aria-label={t`Block ${player.name} from all my events`}
        onClick={() => { setFailed(false); setOpen(true) }}>
        <ShieldBan size={16} className="mr-1.5" aria-hidden="true" />
        <Trans>Block</Trans>
      </Button>
      {open && createPortal(
        <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId}
          className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-2xl border-0 bg-white p-6 text-gray-900 shadow-xl backdrop:bg-black/50"
          onCancel={(event) => { event.preventDefault(); close() }} onClose={() => setOpen(false)}>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <ShieldBan size={24} aria-hidden="true" />
          </div>
          <h2 id={titleId} className="text-xl font-semibold">
            <Trans>Block {player.name}?</Trans>
          </h2>
          <div id={descriptionId} className="mt-3 space-y-3 text-sm leading-6 text-gray-600">
            <p><Trans>They will no longer see or join any events you organize, even with a direct link. They will not receive notifications about your events, including venue and city subscriptions.</Trans></p>
            <p><Trans>Their upcoming bookings, including guests, will be cancelled. Existing payments stay in your records; refunds are not automatic.</Trans></p>
            <p><Trans>You can unblock them in your profile settings.</Trans></p>
          </div>
          {failed && <p role="alert" className="mt-4 text-sm text-red-700"><Trans>Could not update blocked players. Please try again.</Trans></p>}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" disabled={pending} onClick={close} autoFocus><Trans>Cancel</Trans></Button>
            <Button type="button" variant="danger" disabled={pending} onClick={block}>
              {pending ? <Trans>Saving...</Trans> : <Trans>Block from all my events</Trans>}
            </Button>
          </div>
        </dialog>, document.body
      )}
    </>
  )
}
