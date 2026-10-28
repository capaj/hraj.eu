import React from 'react'
import { msg } from '@lingui/core/macro'
import { i18n } from '~/lib/i18n'
import { isCommentImageUrl } from '~/utils/eventCommentImages'

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const buildMentionRegex = (names: string[]) => {
  if (names.length === 0) return null
  const escapedNames = names
    .map((name) => name.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((name) => escapeRegExp(name))
  if (escapedNames.length === 0) return null
  return new RegExp(`@(${escapedNames.join('|')})`, 'gi')
}

const renderMentions = (text: string, mentionRegex: RegExp | null) => {
  if (!mentionRegex) return [text]
  mentionRegex.lastIndex = 0
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = mentionRegex.exec(text)) !== null) {
    const matchIndex = match.index
    if (matchIndex > lastIndex) {
      nodes.push(text.slice(lastIndex, matchIndex))
    }
    nodes.push(
      <span
        key={`mention-${matchIndex}-${match[0]}`}
        className="font-semibold text-primary-600"
      >
        {match[0]}
      </span>
    )
    lastIndex = matchIndex + match[0].length
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }
  return nodes
}

const commentUrlRegex = /(?:https?:\/\/|www\.)[^\s<]+/gi
const trailingUrlPunctuationRegex = /[),.!?:;]+$/

const renderPlainTextSegments = (
  text: string,
  mentionRegex: RegExp | null
): React.ReactNode[] => {
  commentUrlRegex.lastIndex = 0

  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = commentUrlRegex.exec(text)) !== null) {
    const matchIndex = match.index
    const rawUrl = match[0]
    const url = rawUrl.replace(trailingUrlPunctuationRegex, '')
    const trailingPunctuation = rawUrl.slice(url.length)

    if (matchIndex > lastIndex) {
      nodes.push(
        ...renderMentions(text.slice(lastIndex, matchIndex), mentionRegex)
      )
    }

    const href = url.startsWith('www.') ? `https://${url}` : url
    nodes.push(
      <a
        key={`comment-link-${matchIndex}-${url}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        className="text-primary-600 underline hover:text-primary-700 break-words"
      >
        {url}
      </a>
    )

    if (trailingPunctuation) {
      nodes.push(trailingPunctuation)
    }

    lastIndex = matchIndex + rawUrl.length
  }

  if (lastIndex < text.length) {
    nodes.push(...renderMentions(text.slice(lastIndex), mentionRegex))
  }

  return nodes.length > 0 ? nodes : [text]
}

const renderMarkdownSegments = (
  text: string,
  mentionRegex: RegExp | null
): React.ReactNode[] => {
  const patterns = [
    { type: 'bold', regex: /\*\*(.+?)\*\*/s },
    { type: 'underline', regex: /__(.+?)__/s },
    { type: 'italic', regex: /\*(.+?)\*/s }
  ]

  let earliestMatch:
    | { type: string; match: RegExpExecArray; index: number }
    | undefined

  for (const pattern of patterns) {
    const match = pattern.regex.exec(text)
    if (
      match &&
      (earliestMatch === undefined || match.index < earliestMatch.index)
    ) {
      earliestMatch = { type: pattern.type, match, index: match.index }
    }
  }

  if (!earliestMatch) {
    return renderPlainTextSegments(text, mentionRegex)
  }

  const before = text.slice(0, earliestMatch.index)
  const after = text.slice(earliestMatch.index + earliestMatch.match[0].length)
  const inner = earliestMatch.match[1]

  const nodes: React.ReactNode[] = []
  if (before) {
    nodes.push(...renderPlainTextSegments(before, mentionRegex))
  }

  const innerNodes = renderMarkdownSegments(inner, mentionRegex)

  if (earliestMatch.type === 'bold') {
    nodes.push(
      <strong key={`bold-${earliestMatch.index}`}>{innerNodes}</strong>
    )
  } else if (earliestMatch.type === 'underline') {
    nodes.push(
      <span key={`underline-${earliestMatch.index}`} className="underline">
        {innerNodes}
      </span>
    )
  } else if (earliestMatch.type === 'italic') {
    nodes.push(<em key={`italic-${earliestMatch.index}`}>{innerNodes}</em>)
  }

  if (after) {
    nodes.push(...renderMarkdownSegments(after, mentionRegex))
  }

  return nodes
}

const isGifUrl = (text: string): boolean => {
  const trimmed = text.trim()
  return (
    /^https?:\/\/.*\.(gif|webp)(\?.*)?$/i.test(trimmed) ||
    /^https?:\/\/media[0-9]*\.giphy\.com\//i.test(trimmed)
  )
}

export const renderCommentContent = (
  content: string,
  mentionRegex: RegExp | null
) => {
  const lines = content.split(/\r?\n/)
  return lines.flatMap<React.ReactNode>((line, lineIndex) => {
    const trimmedLine = line.trim()

    if (isCommentImageUrl(trimmedLine)) {
      return [
        <a
          key={`picture-${lineIndex}`}
          href={trimmedLine}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block w-fit max-w-full"
        >
          <img
            src={trimmedLine}
            alt={i18n._(msg`Comment picture`)}
            className="max-h-80 max-w-full rounded-lg object-contain"
            loading="lazy"
          />
        </a>
      ]
    }

    // Preserve existing GIF embeds.
    if (isGifUrl(trimmedLine)) {
      const nodes: React.ReactNode[] = [
        <img
          key={`gif-${lineIndex}`}
          src={trimmedLine}
          alt="GIF"
          className="max-w-full max-h-64 rounded-lg mt-2"
          loading="lazy"
        />
      ]
      if (lineIndex < lines.length - 1) {
        nodes.push(<br key={`line-break-${lineIndex}`} />)
      }
      return nodes
    }

    const nodes = renderMarkdownSegments(line, mentionRegex)
    if (lineIndex < lines.length - 1) {
      nodes.push(<br key={`line-break-${lineIndex}`} />)
    }
    return nodes
  })
}
