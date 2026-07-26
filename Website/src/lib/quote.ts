// Quote selection: the products a visitor stacks up in the catalogue before
// sending one enquiry from /contact/.
//
// An item stores the *display* brand and name rather than a catalogue
// reference, so the contact page can render the selection without importing
// src/data/products.ts (84 kB it has no other use for). brand + name is unique
// across the 242 catalogue entries, so it doubles as the dedupe key.

export type QuoteItem = { brand: string; name: string }

const KEY = 'trias.quote'

/** Past this a "quote request" is a catalogue dump, not an enquiry. */
export const MAX_ITEMS = 50

export const quoteKey = (item: QuoteItem) => `${item.brand}|${item.name}`

const isItem = (x: unknown): x is QuoteItem =>
  !!x &&
  typeof (x as QuoteItem).brand === 'string' &&
  typeof (x as QuoteItem).name === 'string'

// sessionStorage throws in some privacy modes and when the quota is full.
// A selection that does not survive navigation beats a page that fails to render.
export function readQuote(): QuoteItem[] {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isItem).slice(0, MAX_ITEMS)
  } catch {
    return []
  }
}

export function saveQuote(items: QuoteItem[]): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // selection still works in-page, it just won't survive the next page load
  }
}

/** One product per line, for the hidden Formspree field. */
export const formatQuote = (items: QuoteItem[]) =>
  items.map((i, n) => `${n + 1}. ${i.name} (${i.brand})`).join('\n')
