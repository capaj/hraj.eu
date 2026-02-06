import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Trans } from '@lingui/react/macro'
import { msg } from '@lingui/core/macro'
import { i18n } from '~/lib/i18n'

const GIPHY_API_KEY = 'gxVx9SjsgMqGcJdm7xhj92RofacMBT7V'
const GIPHY_API_URL = 'https://api.giphy.com/v1/gifs'

interface GiphyImage {
  id: string
  title: string
  images: {
    fixed_height: {
      url: string
      width: string
      height: string
    }
    fixed_height_small: {
      url: string
      width: string
      height: string
    }
    original: {
      url: string
      width: string
      height: string
    }
  }
}

interface GiphyPickerProps {
  onSelect: (gifUrl: string) => void
  onClose: () => void
}

export const GiphyPicker: React.FC<GiphyPickerProps> = ({
  onSelect,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [gifs, setGifs] = useState<GiphyImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  const fetchTrending = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${GIPHY_API_URL}/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`
      )
      if (!response.ok) throw new Error('Failed to fetch GIFs')
      const data = (await response.json()) as { data: GiphyImage[] }
      setGifs(data.data)
    } catch {
      setError(i18n._(msg`Failed to load GIFs`))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const searchGifs = useCallback(async (query: string) => {
    if (!query.trim()) {
      fetchTrending()
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${GIPHY_API_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`
      )
      if (!response.ok) throw new Error('Failed to search GIFs')
      const data = (await response.json()) as { data: GiphyImage[] }
      setGifs(data.data)
    } catch {
      setError(i18n._(msg`Failed to search GIFs`))
    } finally {
      setIsLoading(false)
    }
  }, [fetchTrending])

  useEffect(() => {
    fetchTrending()
  }, [fetchTrending])

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchGifs(searchQuery)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, searchGifs])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const handleGifClick = (gif: GiphyImage) => {
    onSelect(gif.images.fixed_height.url)
  }

  const renderGifContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-sm text-red-500">
          {error}
        </div>
      )
    }

    if (gifs.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-sm text-gray-500">
          <Trans>No GIFs found</Trans>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 gap-2">
        {gifs.map((gif) => (
          <button
            key={gif.id}
            type="button"
            onClick={() => handleGifClick(gif)}
            className="relative aspect-video rounded overflow-hidden hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <img
              src={gif.images.fixed_height_small.url}
              alt={gif.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
    >
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            <Trans>Choose a GIF</Trans>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X size={16} />
          </button>
        </div>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={i18n._(msg`Search GIFs...`)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
            autoFocus
          />
        </div>
      </div>

      <div className="h-64 overflow-y-auto p-2">
        {renderGifContent()}
      </div>

      <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <a
          href="https://giphy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center"
        >
          <img
            src="https://giphy.com/static/img/giphy-logo-square-social.png"
            alt="Powered by GIPHY"
            className="h-4"
          />
          <span className="ml-1 text-xs text-gray-500">Powered by GIPHY</span>
        </a>
      </div>
    </div>
  )
}
