import { lazy, Suspense, useEffect, useRef, useState } from 'react'

// maplibre-gl weighs ~1 MB, so the map lives in its own chunk
// (DistributionMapCanvas) that only downloads when the frame approaches the
// viewport. The frame itself has fixed dimensions (.dmap-frame in index.css),
// so the swap placeholder → map causes zero layout shift.
const MapCanvas = lazy(() => import('./DistributionMapCanvas'))

export default function DistributionMap() {
  const frameRef = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '400px 0px' },
    )
    io.observe(frame)
    return () => io.disconnect()
  }, [])

  return (
    <div className="dmap">
      <div ref={frameRef} className="dmap-frame">
        <span className="dmap-ph" aria-hidden="true">
          Distribution map
        </span>
        {near && (
          <Suspense fallback={null}>
            <MapCanvas />
          </Suspense>
        )}
      </div>
    </div>
  )
}
