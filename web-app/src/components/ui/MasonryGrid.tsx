import { useEffect, useRef, type ReactNode } from 'react'
import { clsx } from 'clsx'

interface MasonryGridProps {
  children: ReactNode
  className?: string
  columns?: number
  columnGap?: number
  rowGap?: number
  desktopBreakpoint?: number
  wideColumns?: number
  wideBreakpoint?: number
}

/**
 * A small, responsive masonry layout that balances cards across independent
 * columns without leaving holes. On narrow screens it remains a normal stack.
 */
export const MasonryGrid = ({
  children,
  className,
  columns = 2,
  columnGap = 32,
  rowGap = 24,
  desktopBreakpoint = 1024,
  wideColumns,
  wideBreakpoint = 1536
}: MasonryGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const desktopQuery = window.matchMedia(
      `(min-width: ${desktopBreakpoint}px)`
    )
    const wideQuery = window.matchMedia(`(min-width: ${wideBreakpoint}px)`)
    let animationFrame: number | undefined

    const getItems = () =>
      Array.from(container.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement
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

        const requestedColumns =
          wideColumns !== undefined && wideQuery.matches ? wideColumns : columns
        const activeColumns = Math.max(1, Math.floor(requestedColumns))
        const visibleItems = items.filter((item) => item.offsetParent !== null)
        const columnWidth =
          (container.clientWidth - columnGap * (activeColumns - 1)) /
          activeColumns

        container.style.position = 'relative'

        for (const item of visibleItems) {
          item.style.position = 'absolute'
          item.style.width = `${columnWidth}px`
        }

        const itemHeights = visibleItems.map(
          (item) => item.getBoundingClientRect().height + rowGap
        )
        const assignments = Array.from({ length: visibleItems.length }, () => 0)
        const columnHeights = Array.from({ length: activeColumns }, () => 0)
        const fixedItemCount = Math.min(activeColumns, visibleItems.length)

        for (let index = 0; index < fixedItemCount; index += 1) {
          assignments[index] = index
          columnHeights[index] = itemHeights[index]
        }

        const remainingItemCount = visibleItems.length - fixedItemCount
        const searchCombinations = activeColumns ** remainingItemCount

        if (searchCombinations <= 100_000) {
          let bestAssignments = [...assignments]
          let bestRange = Number.POSITIVE_INFINITY
          let bestMaximum = Number.POSITIVE_INFINITY

          const searchAssignments = (itemIndex: number) => {
            if (itemIndex === visibleItems.length) {
              const maximum = Math.max(...columnHeights)
              const range = maximum - Math.min(...columnHeights)

              if (
                range < bestRange ||
                (range === bestRange && maximum < bestMaximum)
              ) {
                bestAssignments = [...assignments]
                bestRange = range
                bestMaximum = maximum
              }
              return
            }

            for (let column = 0; column < activeColumns; column += 1) {
              assignments[itemIndex] = column
              columnHeights[column] += itemHeights[itemIndex]
              searchAssignments(itemIndex + 1)
              columnHeights[column] -= itemHeights[itemIndex]
            }
          }

          searchAssignments(fixedItemCount)
          assignments.splice(0, assignments.length, ...bestAssignments)
        } else {
          for (
            let itemIndex = fixedItemCount;
            itemIndex < visibleItems.length;
            itemIndex += 1
          ) {
            let shortestColumn = 0

            for (let column = 1; column < activeColumns; column += 1) {
              if (columnHeights[column] < columnHeights[shortestColumn]) {
                shortestColumn = column
              }
            }

            assignments[itemIndex] = shortestColumn
            columnHeights[shortestColumn] += itemHeights[itemIndex]
          }
        }

        columnHeights.fill(0)

        visibleItems.forEach((item, itemIndex) => {
          const targetColumn = assignments[itemIndex]
          const top = columnHeights[targetColumn]
          const left = targetColumn * (columnWidth + columnGap)

          item.style.left = `${left}px`
          item.style.top = `${top}px`

          columnHeights[targetColumn] = top + itemHeights[itemIndex]
        })

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
    wideQuery.addEventListener('change', layoutItems)
    layoutItems()

    return () => {
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame)
      }
      desktopQuery.removeEventListener('change', layoutItems)
      wideQuery.removeEventListener('change', layoutItems)
      resizeObserver.disconnect()
      resetLayout()
    }
  }, [
    children,
    columnGap,
    columns,
    desktopBreakpoint,
    rowGap,
    wideBreakpoint,
    wideColumns
  ])

  return (
    <div
      ref={containerRef}
      data-masonry-grid
      className={clsx('flex flex-col gap-6', className)}
    >
      {children}
    </div>
  )
}
