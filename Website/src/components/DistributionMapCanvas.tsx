import { useEffect, useRef } from 'react'
import {
  Map as MaplibreMap,
  Marker,
  LngLatBounds,
  type FilterSpecification,
  type GeoJSONSource,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// Interactive vector map (MapLibre GL + OpenFreeMap free tiles), recoloured
// at runtime to the Field Survey palette so the map stays consistent with the
// rest of the site. No API key: OpenFreeMap (https://openfreemap.org) serves
// OSM-derived vector tiles publicly; ODbL attribution is surfaced via the
// compact attribution control.
//
// Anchored coordinates:
//   Singapore     1.29° N, 103.85° E — Trias Oceanic HQ
//   Lihir Island  3.09° S, 152.64° E — MS Holding, New Ireland Province, PNG
const SINGAPORE: [number, number] = [103.85, 1.29]
const LIHIR: [number, number] = [152.64, -3.09]

// Local place names we label ourselves — hide the duplicate OSM labels.
// Singapore is a city-state (city AND country label); Londolovit is the main
// town on Lihir.
const OWN_LABELS = ['Singapore', 'Lihir', 'Lihir Island', 'Londolovit']

export default function DistributionMapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MaplibreMap | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (mapRef.current) return // singleton — StrictMode fires effects twice in dev

    // Palette read from the design tokens (src/index.css) at runtime.
    const styles = getComputedStyle(document.documentElement)
    const token = (name: string, fallback: string) =>
      styles.getPropertyValue(name).trim() || fallback
    const WHITE = token('--white', '#ffffff')
    const MIST = token('--mist', '#f1f4f3')
    const LINE = token('--line', '#e2e7e4')
    const MUTE = token('--mute', '#4b5a54')
    const SUBTLE = token('--subtle', '#8a968f')
    const COPPER = token('--copper', '#b5793f')

    const map = new MaplibreMap({
      container,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [128, -1],
      zoom: 3,
      attributionControl: { compact: true },
      cooperativeGestures: true,
      pitchWithRotate: false,
      dragRotate: false,
    })
    // keep bearing locked at 0 — the arrowhead rotation below assumes
    // screen north === map north
    map.touchZoomRotate.disableRotation()
    map.keyboard.disableRotation()
    mapRef.current = map

    map.on('load', () => {
      const layers = map.getStyle()?.layers ?? []

      for (const layer of layers) {
        const { id, type } = layer
        try {
          if (type === 'background') {
            map.setPaintProperty(id, 'background-color', WHITE)
            continue
          }
          if (type === 'fill') {
            if (/water|ocean|sea|lake|river/i.test(id)) {
              map.setPaintProperty(id, 'fill-color', LINE)
              map.setPaintProperty(id, 'fill-opacity', 1)
            } else if (/park|forest|wood|grass|landcover/i.test(id)) {
              map.setPaintProperty(id, 'fill-color', MIST)
              map.setPaintProperty(id, 'fill-opacity', 0.6)
            } else {
              map.setPaintProperty(id, 'fill-color', WHITE)
              map.setPaintProperty(id, 'fill-opacity', 1)
            }
            continue
          }
          if (type === 'line') {
            if (/admin|boundary|country|state/i.test(id)) {
              map.setPaintProperty(id, 'line-color', SUBTLE)
              map.setPaintProperty(id, 'line-width', 0.7)
              map.setPaintProperty(id, 'line-opacity', 0.6)
            } else if (/water|river|stream|coast/i.test(id)) {
              map.setPaintProperty(id, 'line-color', LINE)
            } else {
              map.setPaintProperty(id, 'line-color', LINE)
              map.setPaintProperty(id, 'line-opacity', 0.5)
            }
            continue
          }
          if (type === 'symbol') {
            map.setPaintProperty(id, 'text-color', MUTE)
            map.setPaintProperty(id, 'text-halo-color', WHITE)
            map.setPaintProperty(id, 'text-halo-width', 1.2)

            // Drop the OSM labels duplicating our own markers; continent /
            // ocean / sea labels stay so the surrounding cartography
            // (Indonesia, Papua New Guinea, Malaysia…) keeps showing.
            if (/place|poi|city|town|country/i.test(id) && !/continent|ocean|sea/i.test(id)) {
              try {
                const existing = map.getFilter(id)
                const notOurs = [
                  '!',
                  [
                    'in',
                    ['coalesce', ['get', 'name:latin'], ['get', 'name'], ''],
                    ['literal', OWN_LABELS],
                  ],
                ] as unknown as FilterSpecification
                map.setFilter(
                  id,
                  existing
                    ? (['all', existing, notOurs] as unknown as FilterSpecification)
                    : notOurs,
                )
              } catch {
                // some layers reject filter changes — ignore
              }
            }
          }
        } catch {
          // some layers don't accept certain paint keys — ignore quietly
        }
      }

      // Arced route Singapore → Lihir, dashed copper. A true great circle is
      // almost a straight line at these latitudes, so we bow a Bézier north
      // of the chord for the classic flight-route relief.
      const route = arcRoute(SINGAPORE, LIHIR, 64, 0.18)
      map.addSource('route', { type: 'geojson', data: lineString(route) })
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round' },
        paint: {
          'line-color': COPPER,
          'line-width': 1.6,
          'line-dasharray': [0.7, 1.7],
          'line-opacity': 0.9,
        },
      })

      // Arrowhead terminating the line a constant 22 px short of the
      // destination square AT EVERY ZOOM: walk the route backwards in screen
      // space, anchor the arrow at that point, rotate it along the local
      // segment, and trim the dashed line to it. Re-run on every zoom (a pan
      // doesn't change screen-space distances; bearing is locked at 0).
      const arrow = document.createElement('div')
      arrow.className = 'dmap-arrow'
      const arrowMarker = new Marker({
        element: arrow,
        rotationAlignment: 'map',
        pitchAlignment: 'map',
      })
        .setLngLat(LIHIR)
        .addTo(map)

      const ARROW_BACK = 22
      const positionArrow = () => {
        let prev = map.project(LIHIR)
        let acc = 0
        for (let i = route.length - 2; i >= 0; i--) {
          const p = map.project(route[i])
          const seg = Math.hypot(p.x - prev.x, p.y - prev.y)
          if (seg > 0 && acc + seg >= ARROW_BACK) {
            const f = (ARROW_BACK - acc) / seg
            const x = prev.x + (p.x - prev.x) * f
            const y = prev.y + (p.y - prev.y) * f
            const anchor = map.unproject([x, y])
            arrowMarker
              .setLngLat(anchor)
              // screen angle anchor → next point toward Lihir, clockwise from north
              .setRotation((Math.atan2(prev.x - x, y - prev.y) * 180) / Math.PI)
            ;(map.getSource('route') as GeoJSONSource).setData(
              lineString([...route.slice(0, i + 1), [anchor.lng, anchor.lat]]),
            )
            return
          }
          acc += seg
          prev = p
        }
      }
      map.on('zoom', positionArrow)

      // Markers — Singapore label above the dot (the route leaves below-right),
      // Lihir label below (the route arrives from above-left)
      new Marker({ element: makeMarker('Trias Oceanic', 'Singapore (HQ)', 'above') })
        .setLngLat(SINGAPORE)
        .addTo(map)
      new Marker({ element: makeMarker('MS Holding', 'Lihir Island, PNG', 'below') })
        .setLngLat(LIHIR)
        .addTo(map)

      // MapLibre opens the compact attribution on first load; collapse it to
      // the ⓘ toggle (it covers a fifth of the map on phones — ODbL stays a
      // click away).
      container
        .querySelector('.maplibregl-ctrl-attrib')
        ?.classList.remove('maplibregl-compact-show')

      // Frame the whole arc (its apex rises above Singapore's latitude);
      // asymmetric padding keeps the DOM labels (above Singapore, below
      // Lihir) inside the frame down to 320 px wide.
      map.resize() // re-measure in case layout moved between init and load
      const small = container.clientWidth < 560
      map.fitBounds(route.reduce((bb, p) => bb.extend(p), new LngLatBounds()), {
        padding: small
          ? { top: 56, right: 60, bottom: 76, left: 60 }
          : { top: 72, right: 110, bottom: 104, left: 110 },
        maxZoom: 5,
        duration: 0,
      })
      positionArrow()
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="dmap-canvas"
      role="img"
      aria-label="Map of Southeast Asia and the Pacific showing the active distribution route from Trias Oceanic headquarters in Singapore to MS Holding on Lihir Island, Papua New Guinea"
    />
  )
}

// Survey-point marker (square dot + pulsing square halo + two-line label),
// built as a real DOM tree — styles live in src/index.css (.dmap-*).
function makeMarker(title: string, sub: string, labelAt: 'above' | 'below'): HTMLElement {
  const root = document.createElement('div')
  root.className = 'dmap-marker'

  const halo = document.createElement('div')
  halo.className = 'dmap-halo'

  const dot = document.createElement('div')
  dot.className = 'dmap-dot'

  const label = document.createElement('div')
  label.className = `dmap-label ${labelAt === 'above' ? 'up' : 'down'}`

  const titleEl = document.createElement('div')
  titleEl.className = 'dmap-label-t'
  titleEl.textContent = title

  const subEl = document.createElement('div')
  subEl.className = 'dmap-label-s'
  subEl.textContent = sub

  label.append(titleEl, subEl)
  root.append(halo, dot, label)
  return root
}

// Sample N points along a quadratic Bézier between two lon/lat pairs, with
// the control point pushed perpendicular to the chord (north side) by
// `bow` × chord length. Drawn in lng/lat space — fine near the equator where
// Mercator distortion is negligible, and the map never rotates.
function arcRoute(
  a: [number, number],
  b: [number, number],
  steps: number,
  bow: number,
): [number, number][] {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy)
  let px = -dy / len
  let py = dx / len
  if (py < 0) {
    px = -px
    py = -py
  }
  const cx = (a[0] + b[0]) / 2 + px * len * bow
  const cy = (a[1] + b[1]) / 2 + py * len * bow

  const points: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const u = 1 - t
    points.push([
      u * u * a[0] + 2 * u * t * cx + t * t * b[0],
      u * u * a[1] + 2 * u * t * cy + t * t * b[1],
    ])
  }
  return points
}

function lineString(coordinates: [number, number][]) {
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'LineString' as const, coordinates },
  }
}
