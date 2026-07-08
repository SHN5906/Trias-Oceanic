import { useState } from 'react'

// Submission endpoint. Set VITE_FORM_ENDPOINT in .env:
//   - now:   a Formspree form URL (https://formspree.io/f/xxxxxxxx)
//   - later: a serverless function backed by a Resend API key — the
//     component posts the same FormData, so only this URL changes.
const ENDPOINT =
  import.meta.env.VITE_FORM_ENDPOINT ?? 'https://formspree.io/f/your-form-id'

const SCOPES = [
  'General enquiry',
  'Fire suppression',
  'Drilling rigs & tooling',
  'Drilling fluids',
  'Spare parts',
  'Other',
] as const

// The catalogue's "Request a quote" links land here with ?product=&brand=.
const SCOPE_BY_BRAND: Record<string, (typeof SCOPES)[number]> = {
  'Muster Fire': 'Fire suppression',
  'Son-Mak': 'Drilling rigs & tooling',
  'JS Explo': 'Drilling rigs & tooling',
  SinoMud: 'Drilling fluids',
}

function prefillFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const product = params.get('product')
  const brand = params.get('brand')
  if (!product) return { scope: SCOPES[0], message: undefined }
  return {
    scope: (brand && SCOPE_BY_BRAND[brand]) || SCOPES[0],
    message: `Quote request: ${product}${brand ? ` (${brand})` : ''}.\n\nQuantity, site location, timeline: `,
  }
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [prefill] = useState(prefillFromUrl)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    // Honeypot: bots fill hidden fields, humans don't.
    if ((form.elements.namedItem('website') as HTMLInputElement)?.value) return
    setStatus('submitting')
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      })
      if (res.ok) {
        setStatus('success')
        form.reset()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="cform-done" role="status">
        <p className="eyebrow" style={{ color: 'var(--copper)' }}>
          Message sent
        </p>
        <p className="lead">Thanks, we'll get back to you within one business day.</p>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setStatus('idle')}
          style={{ marginTop: 22 }}
        >
          Send another
        </button>
      </div>
    )
  }

  return (
    <form className="cform" onSubmit={handleSubmit}>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="cform-hp"
      />
      <div className="cform-row">
        <label className="field">
          <span>Name *</span>
          <input name="name" type="text" autoComplete="name" placeholder="Your full name" required />
        </label>
        <label className="field">
          <span>Email *</span>
          <input name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
        </label>
        <label className="field">
          <span>Company</span>
          <input name="company" type="text" autoComplete="organization" placeholder="Organisation" />
        </label>
        <label className="field">
          <span>Role</span>
          <input name="role" type="text" autoComplete="organization-title" placeholder="Your position" />
        </label>
      </div>
      <label className="field">
        <span>Scope of work</span>
        <select name="scope" defaultValue={prefill.scope}>
          {SCOPES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>What you need *</span>
        <textarea
          name="message"
          rows={5}
          defaultValue={prefill.message}
          placeholder="Equipment, quantities, site location, timeline…"
          required
        />
      </label>
      <div>
        <button className="btn btn-copper" type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending…' : 'Send enquiry'}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
        {status === 'error' && (
          <p className="cform-error" role="alert">
            Something went wrong. Please try again or email us directly.
          </p>
        )}
      </div>
    </form>
  )
}
