import { useEffect, useRef, type ReactNode } from 'react'
import { clsx } from 'clsx'

interface MasonryGridProps {
  children: ReactNode
  className?: string
  columns?: number
  columnGap?: number
  rowGap?: number
  desktopBreakpoint?: number
}

/**
 * A small, responsive masonry layout for cards with different column spans.
 * On narrow screens it remains a normal vertical stack, preserving DOM order.
 */
export const MasonryGrid = ({
  children,
  className,
  columns = 5,
  columnGap = 32,
  rowGap = 24,
  desktopBreakpoint = 1024
}: MasonryGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const desktopQuery = window.matchMedia(
      `(min-width: ${desktopBreakpoint}px)`
    )
    let animationFrame: number | undefined

    const getItems = () =>
      Array.from(container.children).filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement && child.dataset.masonrySpan !== undefined
      )

    const resetLayout = () => {
      container.style.height = ''
      container.style.position = ''

      for (const item of getItems()) {
        item.style.left = ''
        item.style.position = ''
        item.style.top = ''
        item.style.width = ''
      }
    }

    const layoutItems = () => {
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame)
      }

      animationFrame = window.requestAnimationFrame(() => {
        const items = getItems()

        if (!desktopQuery.matches || container.clientWidth === 0) {
          resetLayout()
          return
        }

        const visibleItems = items.filter((item) => item.offsetParent !== null)
        const columnWidth =
          (container.clientWidth - columnGap * (columns - 1)) / columns
        const columnHeights = Array.from({ length: columns }, () => 0)

        container.style.position = 'relative'

        for (const item of visibleItems) {
          const requestedSpan = Number(item.dataset.masonrySpan)
          const span = Math.min(
            columns,
            Math.max(1, Number.isFinite(requestedSpan) ? requestedSpan : 1)
          )
          let startColumn = 0
          let top = Number.POSITIVE_INFINITY

          for (let candidate = 0; candidate <= columns - span; candidate += 1) {
            const candidateTop = Math.max(
              ...columnHeights.slice(candidate, candidate + span)
            )

            if (candidateTop < top) {
              startColumn = candidate
              top = candidateTop
            }
          }

          const width = columnWidth * span + columnGap * (span - 1)
          const left = startColumn * (columnWidth + columnGap)

          item.style.left = `${left}px`
          item.style.position = 'absolute'
          item.style.top = `${top}px`
          item.style.width = `${width}px`

          const bottom = top + item.getBoundingClientRect().height + rowGap
          for (let column = startColumn; column < startColumn + span; column += 1) {
            columnHeights[column] = bottom
          }
        }

        for (const item of items) {
          if (!visibleItems.includes(item)) {
            item.style.left = ''
            item.style.position = ''
            item.style.top = ''
            item.style.width = ''
          }
        }

        container.style.height = `${Math.max(
          0,
          Math.max(...columnHeights) - rowGap
        )}px`
      })
    }

    const resizeObserver = new ResizeObserver(layoutItems)
    resizeObserver.observe(container)
    getItems().forEach((item) => resizeObserver.observe(item))
    desktopQuery.addEventListener('change', layoutItems)
    layoutItems()

    return () => {
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame)
      }
      desktopQuery.removeEventListener('change', layoutItems)
      resizeObserver.disconnect()
      resetLayout()
    }
  }, [children, columnGap, columns, desktopBreakpoint, rowGap])

  return (
    <div ref={containerRef} className={clsx('flex flex-col gap-6', className)}>
      {children}
    </div>
  )
}
