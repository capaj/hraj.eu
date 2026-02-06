import React, { useEffect, useRef, useState } from 'react'
import { UserAvatar } from '../user/UserAvatar'
import { User } from '../../types'

interface MentionDropdownProps {
  users: Array<Pick<User, 'id' | 'name' | 'image' | 'email'>>
  searchQuery: string
  onSelect: (user: Pick<User, 'id' | 'name' | 'image' | 'email'>) => void
  onClose: () => void
  position: { top: number; left: number }
}

export const MentionDropdown: React.FC<MentionDropdownProps> = ({
  users,
  searchQuery,
  onSelect,
  onClose,
  position
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase()
    const name = user.name?.toLowerCase() || ''
    const email = user.email?.toLowerCase() || ''

    // Split name into parts for first/last name matching
    const nameParts = name.split(/\s+/)

    return (
      name.includes(query) ||
      email.includes(query) ||
      nameParts.some((part) => part.startsWith(query))
    )
  })

  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredUsers.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < filteredUsers.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredUsers.length - 1
          )
          break
        case 'Enter':
        case 'Tab':
          e.preventDefault()
          if (filteredUsers[selectedIndex]) {
            onSelect(filteredUsers[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [filteredUsers, selectedIndex, onSelect, onClose])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (filteredUsers.length === 0) {
    return null
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 w-64 max-h-48 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200"
      style={{ top: position.top, left: position.left }}
    >
      {filteredUsers.slice(0, 5).map((user, index) => (
        <button
          key={user.id}
          type="button"
          onClick={() => onSelect(user)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 transition-colors ${
            index === selectedIndex ? 'bg-gray-100' : ''
          }`}
        >
          <UserAvatar user={user} className="w-8 h-8" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </div>
            {user.email && (
              <div className="text-xs text-gray-500 truncate">{user.email}</div>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
