import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { createRoot, type Root } from 'react-dom/client'
import { AttributionControl, Map as MapLibreMap, Marker, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { CellMood } from '../lib/aggregate'
import { CAMPUS } from '../lib/campus'
import { headline, shares } from '../lib/feelings'
import { MOODS, type MoodId } from '../lib/moods'
import { PLACES, type PlaceMood } from '../lib/places'
import { MoodFace } from './MoodFace'

setWorkerUrl(workerUrl)

// Free, colorful street map (parks, water, 3D buildings). No account or key needed.
const BASE_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const AREAS = 'mood-areas'
const SPOTS = 'mood-spots'

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
const moodColors = () => Object.fromEntries(MOODS.map((m) => [m.id, cssVar(m.cssVar)])) as Record<MoodId, string>
const topMood = (counts: CellMood['counts']): MoodId => shares(counts)[0].mood.id

/** Tidy the base map: keep streets, parks, water and buildings; drop busy shop and transit icons. */
function tidyBaseMap(map: MapLibreMap) {
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.type !== 'symbol') continue
    const src = 'source-layer' in layer ? layer['source-layer'] : undefined
    if (src === 'poi' || src === 'aerodrome_label' || src === 'mountain_peak' || layer.id.includes('shield')) {
      map.setLayoutProperty(layer.id, 'visibility', 'none')
    }
  }
}

/**
 * Two layers of soft glow, drawn on the ground beneath buildings and labels:
 *  - areas: every part of campus with enough check-ins, a gentle glow in its main mood
 *  - spots: the popular places, a bigger, stronger glow that the areas around them melt into
 */
function addGlowLayers(map: MapLibreMap) {
  const before = map.getStyle().layers?.find((l) => l.type === 'symbol' || l.type === 'fill-extrusion')?.id
  map.addSource(AREAS, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
  map.addSource(SPOTS, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
  map.addLayer(
    {
      id: AREAS,
      type: 'circle',
      source: AREAS,
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': ['interpolate', ['exponential', 1.6], ['zoom'], 13, ['*', 24, ['get', 's']], 17, ['*', 157, ['get', 's']]],
        'circle-blur': 1,
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.42, 17, 0.3],
        'circle-pitch-alignment': 'map',
      },
    },
    before,
  )
  map.addLayer(
    {
      id: SPOTS,
      type: 'circle',
      source: SPOTS,
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': ['interpolate', ['exponential', 1.6], ['zoom'], 13, ['*', 46, ['get', 's']], 17, ['*', 301, ['get', 's']]],
        'circle-blur': 1,
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.6, 17, 0.42],
        'circle-pitch-alignment': 'map',
      },
    },
    before,
  )
}

/** Glow features. `t` (ms) makes them breathe slowly. */
function glowData(cells: CellMood[], places: PlaceMood[], colors: Record<MoodId, string>, t: number) {
  const breathe = (i: number, amount: number) => 1 + amount * Math.sin(t / 2600 + i * 1.3)
  const areas = cells.map((c, i) => ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: c.lngLat },
    properties: { color: colors[topMood(c.counts)], s: Math.min(1.5, 0.75 + Math.sqrt(c.total) / 8) * breathe(i, 0.05) },
  }))
  const spots = places.map((p, i) => ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: p.at },
    properties: { color: colors[topMood(p.counts)], s: Math.min(1.8, 0.7 + Math.sqrt(p.total) / 6) * breathe(i + 50, 0.08) },
  }))
  return {
    areas: { type: 'FeatureCollection' as const, features: areas },
    spots: { type: 'FeatureCollection' as const, features: spots },
  }
}

/** A place marker in the style of a map app: a face in a white circle, with the name beside it. */
function PlaceMarker({ place, selected }: { place: PlaceMood; selected: boolean }) {
  const mood = topMood(place.counts)
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="grid size-11 shrink-0 place-items-center rounded-full bg-white transition-transform duration-300"
        style={{
          transform: selected ? 'scale(1.25)' : undefined,
          boxShadow: `0 0 0 ${selected ? 3 : 2}px var(--mood-${mood}), 0 6px 16px rgb(40 30 50 / 0.25)`,
        }}
      >
        <MoodFace mood={mood} className="size-10" />
      </span>
      <span className="place-name text-[13px] leading-tight font-extrabold whitespace-nowrap text-[#2b2130]">{place.name}</span>
    </span>
  )
}

type Props = { cells: CellMood[]; places: PlaceMood[]; selectedId: string | null; onSelect: (id: string | null) => void }
type Pin = { marker: Marker; root: Root; el: HTMLButtonElement }

// Room left for the cards floating over the map, in pixels.
const FIT_PADDING = { top: 230, bottom: 200, left: 30, right: 60 }

export function MoodMap({ cells, places, selectedId, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const readyRef = useRef(false)
  const pins = useRef(new Map<string, Pin>())
  const data = useRef({ cells, places })
  const colors = useRef(moodColors())
  const onSelectRef = useRef(onSelect)
  const reduce = useReducedMotion()
  data.current = { cells, places }
  onSelectRef.current = onSelect

  const paint = (t: number) => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    const d = glowData(data.current.cells, data.current.places, colors.current, t)
    ;(map.getSource(AREAS) as GeoJSONSource).setData(d.areas)
    ;(map.getSource(SPOTS) as GeoJSONSource).setData(d.spots)
  }
  const paintRef = useRef(paint)
  paintRef.current = paint

  /** Place names show where they fit; busiest places get first pick, the chosen one always shows. */
  const declutter = () => {
    const map = mapRef.current
    if (!map) return
    const taken: { x1: number; y1: number; x2: number; y2: number }[] = []
    const hits = (r: (typeof taken)[number]) => taken.some((o) => r.x1 < o.x2 && r.x2 > o.x1 && r.y1 < o.y2 && r.y2 > o.y1)
    const ordered = [...data.current.places].sort((a, b) => Number(b.id === selectedId) - Number(a.id === selectedId) || b.total - a.total)
    for (const p of ordered) {
      const { x, y } = map.project(p.at)
      taken.push({ x1: x - 24, y1: y - 24, x2: x + 24, y2: y + 24 })
    }
    for (const p of ordered) {
      const pin = pins.current.get(p.id)
      if (!pin) continue
      const { x, y } = map.project(p.at)
      const label = { x1: x + 26, y1: y - 10, x2: x + 30 + p.name.length * 7.4, y2: y + 10 }
      const show = p.id === selectedId || !hits(label)
      pin.el.dataset.label = show ? 'shown' : 'hidden'
      if (show) taken.push(label)
    }
  }
  const declutterRef = useRef(declutter)
  declutterRef.current = declutter

  // Create the map once.
  useEffect(() => {
    if (!el.current) return
    const core = PLACES.filter((p) => p.core)
    const map = new MapLibreMap({
      container: el.current,
      style: BASE_STYLE,
      bounds: [
        [Math.min(...core.map((p) => p.at[0])), Math.min(...core.map((p) => p.at[1]))],
        [Math.max(...core.map((p) => p.at[0])), Math.max(...core.map((p) => p.at[1]))],
      ],
      fitBoundsOptions: { padding: FIT_PADDING },
      pitch: 40,
      minZoom: 13,
      maxZoom: 18,
      maxPitch: 60,
      maxBounds: CAMPUS.maxBounds,
      attributionControl: false,
      dragRotate: false,
    })
    map.addControl(new AttributionControl({ compact: true }), 'top-right')
    map.on('load', () => {
      tidyBaseMap(map)
      addGlowLayers(map)
      readyRef.current = true
      paintRef.current(0)
      declutterRef.current()
    })
    map.on('click', () => onSelectRef.current(null))
    let raf = 0
    map.on('move', () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => declutterRef.current())
    })
    mapRef.current = map

    // Mood colors are a little brighter in dark mode.
    const observer = new MutationObserver(() => {
      colors.current = moodColors()
      paintRef.current(0)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    const current = pins.current
    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
      for (const p of current.values()) {
        p.marker.remove()
        queueMicrotask(() => p.root.unmount())
      }
      current.clear()
      readyRef.current = false
      map.remove()
      mapRef.current = null
    }
  }, [])

  // New data from the time slider.
  useEffect(() => paintRef.current(performance.now()), [cells, places])

  // The glows breathe slowly.
  useEffect(() => {
    if (reduce) return
    let raf = 0
    let last = 0
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick)
      if (t - last < 80) return
      last = t
      paintRef.current(t)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduce])

  // Place markers.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const seen = new Set<string>()
    for (const place of places) {
      seen.add(place.id)
      let pin = pins.current.get(place.id)
      if (!pin) {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'mood-pin'
        button.addEventListener('click', (e) => {
          e.stopPropagation()
          onSelectRef.current(place.id)
        })
        // Anchor on the face (22px in from the left edge) so it sits exactly on the place.
        const marker = new Marker({ element: button, anchor: 'left', offset: [-22, 0] }).setLngLat(place.at).addTo(map)
        pin = { marker, root: createRoot(button), el: button }
        pins.current.set(place.id, pin)
      }
      pin.el.setAttribute('aria-label', `${place.name}: ${headline(place.counts).toLowerCase()}, ${place.total} check-ins`)
      pin.el.setAttribute('aria-pressed', String(place.id === selectedId))
      pin.el.style.zIndex = place.id === selectedId ? '5' : '1'
      pin.root.render(<PlaceMarker place={place} selected={place.id === selectedId} />)
    }
    for (const [id, pin] of pins.current) {
      if (seen.has(id)) continue
      pin.marker.remove()
      queueMicrotask(() => pin.root.unmount())
      pins.current.delete(id)
    }
    declutterRef.current()
  }, [places, selectedId])

  // Glide to a chosen place, keeping it above the details card.
  useEffect(() => {
    const map = mapRef.current
    const place = data.current.places.find((p) => p.id === selectedId)
    if (!map || !place) return
    map.easeTo({
      center: place.at,
      zoom: Math.max(map.getZoom(), 16),
      padding: { top: 200, bottom: 440, left: 0, right: 0 },
      duration: reduce ? 0 : 800,
    })
  }, [selectedId, reduce])

  return (
    <div className="absolute inset-0 isolate bg-[#f2efe9]">
      {/* MapLibre makes its container position: relative, so it gets its own full-size box. */}
      <div ref={el} className="h-full w-full" aria-label={`Map of ${CAMPUS.name}. Colored glows show how people feel in each area.`} />
    </div>
  )
}
