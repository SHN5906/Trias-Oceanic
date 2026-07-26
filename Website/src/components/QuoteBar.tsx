import { useEffect, useRef, useState } from 'react'
import { quoteKey, type QuoteItem } from '../lib/quote'

// Bottom action bar for the catalogue. Renders nothing until something is
// selected, so it costs no screen space to visitors who never use it.
export default function QuoteBar({
  items,
  onRemove,
  onClear,
}: {
  items: QuoteItem[]
  onRemove: (key: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)
  const count = items.length

  // Keep the fixed bar from covering the end of the page. Measure the collapsed
  // row rather than hard-coding a height: it wraps to two lines on narrow
  // screens, and the expanded panel must not count toward the offset.
  useEffect(() => {
    document.body.classList.toggle('has-quote', count > 0)
    const row = rowRef.current
    if (!row) {
      document.documentElement.style.removeProperty('--qh')
      return
    }
    // getBoundingClientRect, not offsetHeight: the latter rounds, and a
    // rounded-down offset lets the bar clip the last pixel of the footer.
    const set = () =>
      document.documentElement.style.setProperty(
        '--qh',
        `${row.getBoundingClientRect().height}px`,
      )
    set()
    const ro = new ResizeObserver(set)
    ro.observe(row)
    return () => ro.disconnect()
  }, [count])

  useEffect(
    () => () => {
      document.body.classList.remove('has-quote')
      document.documentElement.style.removeProperty('--qh')
    },
    [],
  )

  // Collapse when the last item goes, so the panel isn't left open and empty.
  useEffect(() => {
    if (count === 0) setOpen(false)
  }, [count])

  if (count === 0) return null

  return (
    <div className="qbar" role="region" aria-label="Quote selection">
      {open && (
        <div className="wrap">
          <ul className="qbar-list" id="qbar-list">
            {items.map((item) => {
              const key = quoteKey(item)
              return (
                <li key={key}>
                  <span className="qbar-item">
                    <span className="qbar-item-n">{item.name}</span>
                    <span className="qbar-item-b">{item.brand}</span>
                  </span>
                  <button
                    type="button"
                    className="qbar-x"
                    onClick={() => onRemove(key)}
                    aria-label={`Remove ${item.name}`}
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
                      <path
                        d="M1 1l10 10M11 1L1 11"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="wrap qbar-in" ref={rowRef}>
        <button
          type="button"
          className="qbar-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="qbar-list"
        >
          <span className="qbar-count">{count}</span>{' '}
          {count === 1 ? 'product selected' : 'products selected'}
          <svg
            className={open ? 'qbar-chev open' : 'qbar-chev'}
            width="11"
            height="7"
            viewBox="0 0 12 8"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 6.5 6 1.5l5 5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="qbar-actions">
          <button type="button" className="qbar-clear" onClick={onClear}>
            Clear
          </button>
          <a className="btn btn-copper" href="/contact/">
            Request quote
          </a>
        </div>
      </div>
    </div>
  )
}
