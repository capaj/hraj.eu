import {
  useId,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction
} from 'react'
import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { msg } from '@lingui/core/macro'
import { ImagePlus, Info, Loader2, X } from 'lucide-react'
import { i18n } from '~/lib/i18n'
import type { User } from '~/types'
import {
  COMMENT_IMAGE_TYPES,
  MAX_COMMENT_IMAGES,
  MAX_COMMENT_IMAGE_BYTES,
  MAX_COMMENT_TEXT_LENGTH,
  joinCommentImages,
  splitCommentImages
} from '~/utils/eventCommentImages'
import { GiphyPicker } from '../ui/GiphyPicker'
import { MentionDropdown } from '../ui/MentionDropdown'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

export function EventCommentComposer({
  value,
  onChange,
  label,
  eventId,
  users,
  disabled = false,
  autoFocus = false,
  uploadImages,
  onUploadingChange
}: {
  value: string
  onChange: Dispatch<SetStateAction<string>>
  label: string
  eventId: string
  users: User[]
  disabled?: boolean
  autoFocus?: boolean
  uploadImages: (data: FormData) => Promise<{ urls: string[] }>
  onUploadingChange: (uploading: boolean) => void
}) {
  useLingui()
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const uploadInFlight = useRef(false)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [mention, setMention] = useState<{
    query: string
    start: number
  } | null>(null)
  const { images } = splitCommentImages(value)
  const text = value
    .split(/\r?\n/)
    .filter((line) => !images.includes(line.trim()))
    .join('\n')
  const uploadDisabled =
    disabled || uploading || images.length >= MAX_COMMENT_IMAGES

  const attach = async (files: File[]) => {
    if (disabled || uploadInFlight.current || files.length === 0) return
    setError('')
    if (images.length + files.length > MAX_COMMENT_IMAGES) {
      setError(i18n._(msg`You can attach up to 4 pictures per comment.`))
      return
    }
    if (files.some((file) => !COMMENT_IMAGE_TYPES.includes(file.type))) {
      setError(i18n._(msg`Choose JPEG, PNG, WebP, or GIF pictures.`))
      return
    }
    if (
      files.some(
        (file) => file.size === 0 || file.size > MAX_COMMENT_IMAGE_BYTES
      )
    ) {
      setError(
        i18n._(msg`Each picture must be nonempty and no larger than 10 MB.`)
      )
      return
    }
    uploadInFlight.current = true
    setUploading(true)
    onUploadingChange(true)
    try {
      const data = new FormData()
      data.set('eventId', eventId)
      files.forEach((file) => data.append('images', file))
      const result = await uploadImages(data)
      onChange((previous) => {
        const current = splitCommentImages(previous)
        return joinCommentImages(current.text, [
          ...current.images,
          ...result.urls
        ])
      })
    } catch {
      setError(i18n._(msg`Pictures could not be uploaded. Please try again.`))
    } finally {
      uploadInFlight.current = false
      setUploading(false)
      onUploadingChange(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={i18n._(msg`Comment formatting`)}
              className="rounded p-1 text-gray-400 hover:text-gray-600"
            >
              <Info size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <Trans>
              Supports **bold**, *italic*, __underline__, @mentions, and GIFs.
            </Trans>
          </TooltipContent>
        </Tooltip>
      </div>
      <div
        className={`relative rounded-xl border transition-colors ${dragging ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' : 'border-gray-200 bg-white'}`}
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes('Files')) return
          event.preventDefault()
          event.dataTransfer.dropEffect = uploadDisabled ? 'none' : 'copy'
          if (!uploadDisabled) setDragging(true)
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setDragging(false)
        }}
        onDrop={(event) => {
          if (!event.dataTransfer.types.includes('Files')) return
          event.preventDefault()
          setDragging(false)
          void attach(Array.from(event.dataTransfer.files))
        }}
        onPaste={(event) => {
          const files = Array.from(event.clipboardData.items)
            .filter((item) => item.kind === 'file')
            .map((item) => item.getAsFile())
            .filter((file): file is File => !!file)
          if (!files.length) return // Preserve normal text pasting.
          event.preventDefault()
          void attach(files)
        }}
      >
        <textarea
          id={id}
          ref={textareaRef}
          // Keep the exact draft text while typing, including spaces and newlines.
          value={text}
          onChange={(event) => {
            const next = event.target.value
            onChange((previous) => {
              const currentImages = splitCommentImages(previous).images
              return currentImages.length
                ? `${next}\n${currentImages.join('\n')}`
                : next
            })
            const match = next
              .slice(0, event.target.selectionStart)
              .match(/@(\S*)$/)
            setMention(
              match
                ? {
                    query: match[1],
                    start: event.target.selectionStart - match[0].length
                  }
                : null
            )
          }}
          onBlur={() => setTimeout(() => setMention(null), 150)}
          placeholder={i18n._(
            msg`Share updates, ask questions, or tag players with @Name.`
          )}
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`}
          className="block w-full resize-y rounded-t-xl bg-transparent p-3 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          rows={3}
          disabled={disabled}
          autoFocus={autoFocus}
        />
        {mention && (
          <MentionDropdown
            users={users}
            searchQuery={mention.query}
            position={{ top: 40, left: 12 }}
            onSelect={(user) => {
              const before = text.slice(0, mention.start)
              const after = text.slice(mention.start + mention.query.length + 1)
              onChange(
                joinCommentImages(`${before}@${user.name} ${after}`, images)
              )
              setMention(null)
              requestAnimationFrame(() => {
                textareaRef.current?.focus()
                const cursor = before.length + user.name.length + 2
                textareaRef.current?.setSelectionRange(cursor, cursor)
              })
            }}
            onClose={() => setMention(null)}
          />
        )}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-3 px-3 pb-3">
            {images.map((url, index) => (
              <div key={`${url}-${index}`} className="relative">
                <img
                  src={url}
                  alt={i18n._(msg`Attached picture ${index + 1}`)}
                  className="h-24 w-28 rounded-lg border border-gray-200 object-cover"
                />
                <button
                  type="button"
                  disabled={disabled || uploading}
                  aria-label={i18n._(msg`Remove picture ${index + 1}`)}
                  onClick={() =>
                    onChange((previous) => {
                      const current = splitCommentImages(previous)
                      return joinCommentImages(
                        current.text,
                        current.images.filter((_, i) => i !== index)
                      )
                    })
                  }
                  className="absolute -right-2 -top-2 rounded-full bg-gray-800 p-1 text-white hover:bg-gray-600 disabled:opacity-50"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-2 py-2">
          <input
            ref={inputRef}
            type="file"
            accept={COMMENT_IMAGE_TYPES.join(',')}
            multiple
            disabled={uploadDisabled}
            className="hidden"
            aria-label={i18n._(msg`Choose pictures`)}
            onChange={(event) => {
              void attach(Array.from(event.target.files || []))
              event.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploadDisabled}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ImagePlus size={16} />
            )}
            {uploading ? (
              <Trans>Uploading pictures...</Trans>
            ) : (
              <Trans>Add pictures</Trans>
            )}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowGifPicker(!showGifPicker)}
              disabled={disabled}
              title={i18n._(msg`Add GIF`)}
              className="rounded px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            >
              GIF
            </button>
            {showGifPicker && (
              <GiphyPicker
                onSelect={(url) => {
                  onChange((previous) => `${previous.trim()}\n${url}`.trim())
                  setShowGifPicker(false)
                }}
                onClose={() => setShowGifPicker(false)}
              />
            )}
          </div>
          <span
            className={`ml-auto text-xs ${text.length > MAX_COMMENT_TEXT_LENGTH ? 'text-red-600' : 'text-gray-400'}`}
          >
            {text.length}/{MAX_COMMENT_TEXT_LENGTH}
          </span>
        </div>
      </div>
      <p id={`${id}-hint`} className="text-xs leading-relaxed text-gray-500">
        <Trans>
          Choose pictures, drag them here, or paste with Ctrl+V / ⌘V. Up to 4
          pictures, 10 MB each.
        </Trans>
      </p>
      {uploading && (
        <p role="status" className="text-xs text-primary-600">
          <Trans>Uploading pictures...</Trans>
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
