import { msg } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { Check, Loader2, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { i18n } from '~/lib/i18n'
import { searchEventGuestUsers } from '~/server-functions/searchEventGuestUsers'
import type { EventGuestUserSearchResult } from '~/server-functions/searchEventGuestUsersHandler'
import { UserAvatar } from '../user/UserAvatar'

type GuestUserInputProps = {
  eventId: string
  value: string
  selectedUserId?: string
  placeholder: string
  canRemove: boolean
  onChange: (value: string) => void
  onSelect: (user: EventGuestUserSearchResult) => void
  onRemove: () => void
}

export function GuestUserInput({
  eventId,
  value,
  selectedUserId,
  placeholder,
  canRemove,
  onChange,
  onSelect,
  onRemove
}: GuestUserInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const liveQuery = value.startsWith('@') ? value.slice(1).trimStart() : ''

  useEffect(() => {
    if (selectedUserId || !liveQuery) {
      setDebouncedQuery('')
      return
    }

    const timeout = window.setTimeout(() => setDebouncedQuery(liveQuery), 150)
    return () => window.clearTimeout(timeout)
  }, [liveQuery, selectedUserId])

  const { data: users = [], isFetching } = useQuery({
    queryKey: ['event-guest-user-search', eventId, debouncedQuery],
    queryFn: () =>
      searchEventGuestUsers({
        data: { eventId, query: debouncedQuery }
      }),
    enabled: debouncedQuery.length >= 1 && !selectedUserId,
    staleTime: 30_000
  })

  useEffect(() => {
    setSelectedIndex(0)
  }, [debouncedQuery, users.length])

  const isSearchActive =
    isFocused && !selectedUserId && liveQuery.length >= 1
  const showDropdown =
    isSearchActive &&
    debouncedQuery === liveQuery &&
    (isFetching || users.length > 0)

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => window.setTimeout(() => setIsFocused(false), 150)}
        onKeyDown={(event) => {
          if (!showDropdown || users.length === 0) return

          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setSelectedIndex((current) => (current + 1) % users.length)
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setSelectedIndex(
              (current) => (current - 1 + users.length) % users.length
            )
          } else if (event.key === 'Enter' || event.key === 'Tab') {
            const selectedUser = users[selectedIndex]
            if (selectedUser) {
              event.preventDefault()
              onSelect(selectedUser)
              setIsFocused(false)
            }
          } else if (event.key === 'Escape') {
            event.preventDefault()
            setIsFocused(false)
          }
        }}
        placeholder={placeholder}
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        className={`w-full rounded-lg border pl-3 pr-16 py-2 text-sm focus:border-primary-500 focus:outline-none ${
          selectedUserId
            ? 'border-primary-300 bg-primary-50 text-primary-800'
            : 'border-gray-200'
        }`}
      />

      {selectedUserId && (
        <Check
          size={16}
          className="absolute right-9 top-1/2 -translate-y-1/2 text-primary-600"
          aria-label={i18n._(msg`Linked player`)}
        />
      )}

      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
        disabled={!canRemove}
        onClick={onRemove}
        aria-label={i18n._(msg`Remove`)}
      >
        <Trash2 size={16} />
      </button>

      {showDropdown && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {isFetching && users.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" />
              <Trans>Searching players...</Trans>
            </div>
          ) : (
            users.map((user, index) => (
              <button
                key={user.id}
                type="button"
                role="option"
                aria-selected={index === selectedIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(user)
                  setIsFocused(false)
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-gray-100 ${
                  index === selectedIndex ? 'bg-gray-100' : ''
                }`}
              >
                <UserAvatar user={user} className="h-8 w-8 shrink-0" />
                <span className="min-w-0 truncate text-sm font-medium text-gray-900">
                  {user.name}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
