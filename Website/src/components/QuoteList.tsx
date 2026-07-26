import { formatQuote, quoteKey, type QuoteItem } from '../lib/quote'

// "Your selection" block, rendered inside the contact <form> so its hidden
// field ships with the submission. Lines stay removable up to the send.
export default function QuoteList({
  items,
  onRemove,
}: {
  items: QuoteItem[]
  onRemove: (key: string) => void
}) {
  if (items.length === 0) return null

  return (
    <div className="qlist">
      <p className="eyebrow">
        Your selection · {items.length} {items.length === 1 ? 'product' : 'products'}
      </p>
      <ul className="qlist-items">
        {items.map((item) => {
          const key = quoteKey(item)
          return (
            <li key={key}>
              <span className="qlist-item">
                <span className="qlist-item-n">{item.name}</span>
                <span className="qlist-item-b">{item.brand}</span>
              </span>
              <button
                type="button"
                className="qlist-x"
                onClick={() => onRemove(key)}
                aria-label={`Remove ${item.name} from the selection`}
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
      <input type="hidden" name="products" value={formatQuote(items)} />
    </div>
  )
}
