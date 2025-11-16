import React, { useState } from 'react'
import { Badge } from './Badge'
import { X, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './dropdown-menu'
import { cn } from '~/lib/utils'

interface TagInputProps {
  options: ReadonlyArray<{ id: string; name: string; icon?: string }>
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export const TagInput: React.FC<TagInputProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Add...',
  className
}) => {
  const [open, setOpen] = useState(false)

  const addTag = (tagId: string) => {
    if (!selected.includes(tagId)) {
      onChange([...selected, tagId])
    }
    setOpen(false)
  }

  const removeTag = (tagId: string) => {
    onChange(selected.filter((id) => id !== tagId))
  }

  const availableOptions = options.filter((opt) => !selected.includes(opt.id))

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 rounded-md border border-gray-300 p-2 min-h-[42px]',
          className
        )}
      >
        {selected.map((tagId) => {
          const option = options.find((opt) => opt.id === tagId)
          if (!option) return null
          return (
            <Badge
              key={tagId}
              variant="info"
              className="flex items-center gap-1 px-2 py-1"
            >
              {option.icon && <span>{option.icon}</span>}
              <span>{option.name}</span>
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(tagId)
                }}
              />
            </Badge>
          )
        })}
        <div className="flex-1 min-w-[100px]">
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="w-full border-0 focus-visible:ring-0 text-left text-gray-500 text-sm outline-none cursor-pointer flex items-center"
            >
              <span className="flex-1">
                {availableOptions.length > 0 ? placeholder : 'All selected'}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
        </div>
      </div>
      <DropdownMenuContent 
        className="w-[200px] max-h-[300px] overflow-y-auto"
        align="start"
        sideOffset={4}
      >
        {availableOptions.length > 0 ? (
          availableOptions.map((opt) => (
            <DropdownMenuItem
              key={opt.id}
              onSelect={() => addTag(opt.id)}
              className="cursor-pointer"
            >
              <span className="mr-2">{opt.icon}</span>
              {opt.name}
            </DropdownMenuItem>
          ))
        ) : (
          <div className="px-2 py-1.5 text-sm text-gray-500">
            All options selected
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

