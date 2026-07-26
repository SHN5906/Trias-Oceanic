import { useCallback, useEffect, useMemo, useState } from 'react'
import { MAX_ITEMS, quoteKey, readQuote, saveQuote, type QuoteItem } from './quote'

// React binding over the sessionStorage-backed selection. Both the catalogue
// and the contact page mount their own copy: they are separate documents in
// this static MPA, so there is nothing to keep in sync at runtime.
//
// `seed` folds an extra item in at mount, synchronously. The contact page uses
// it for legacy /contact/?product=&brand= deep links, which must be part of the
// very first render so the derived "scope of work" is right.
export function useQuote(seed?: QuoteItem | null) {
  const [items, setItems] = useState<QuoteItem[]>(() => {
    const stored = readQuote()
    if (!seed) return stored
    if (stored.some((p) => quoteKey(p) === quoteKey(seed))) return stored
    return stored.length >= MAX_ITEMS ? stored : [...stored, seed]
  })

  // Persistence belongs here, not inside the state updaters: writing to storage
  // mid-render is a side effect, and StrictMode double-invokes updaters to
  // surface exactly that. This also persists a seeded legacy item.
  useEffect(() => {
    saveQuote(items)
  }, [items])

  // Membership lookup for the 242 product cards.
  const keys = useMemo(() => new Set(items.map(quoteKey)), [items])

  // Functional updates keep these callbacks referentially stable, which is what
  // lets ProductCard's memo() actually hold.
  const toggle = useCallback((item: QuoteItem) => {
    setItems((prev) => {
      const k = quoteKey(item)
      if (prev.some((p) => quoteKey(p) === k)) return prev.filter((p) => quoteKey(p) !== k)
      return prev.length >= MAX_ITEMS ? prev : [...prev, item]
    })
  }, [])

  const remove = useCallback((key: string) => {
    setItems((prev) => prev.filter((p) => quoteKey(p) !== key))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  return { items, keys, toggle, remove, clear }
}
