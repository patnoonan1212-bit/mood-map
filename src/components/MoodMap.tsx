import { useEffect, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { AttributionControl, Map as MapLibreMap, Marker, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { CAMPUS } from '../lib/campus'
import { PLACES } from '../lib/places'
import { headline } from '../lib/feelings'
import type { PlaceMood } from '../lib/places'
import { MoodRing } from './MoodRing'

setWorkerUrl(workerUrl)

// Free map tiles, no account or key needed. We recolor this style to match the app.
const BASE_STYLE = 'https://tiles.openfreemap.org/styles/positron'

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/** Paint the base map in the app's soft palette and hide most labels, so the moods are the star. */
function recolorBaseMap(map: MapLibreMap) {
  const c = {
    land: cssVar('--map-land'),
    water: cssVar('--map-water'),
    park: cssVar('--map-park'),
    road: cssVar('--map-road'),
    building: cssVar('--map-building'),
    label: cssVar('--map-label'),
  }
  for (const layer of map.getStyle().layers ?? []) {
    const src = 'source-layer' in layer ? layer['source-layer'] : undefined
    const set = (prop: string, value: unknown) => {
      try {
        map.setPaintProperty(layer.id, prop as never, value as never)
      } catch {
        /* a layer that doesn't support this property keeps its own look */
      }
    }
    switch (layer.type) {
      case 'background':
        set('background-color', c.land)
        break
      case 'fill':
        if (src === 'water') set('fill-color', c.water)
        else if (src === 'park' || src === 'landcover') set('fill-color', c.park)
        else if (src === 'building') set('fill-color', c.building)
        else set('fill-color', c.land)
        set('fill-outline-color', 'rgba(0,0,0,0)')
        break
      case 'fill-extrusion':
        map.setLayoutProperty(layer.id, 'visibility', 'none')
        break
      case 'line':
        if (src === 'boundary') map.setLayoutProperty(layer.id, 'visibility', 'none')
        else set('line-color', src === 'waterway' ? c.water : c.road)
        break
      case 'symbol': {
        // Keep only street names and place names, softly.
        const keep = src === 'transportation_name' || src === 'place'
        map.setLayoutProperty(layer.id, 'visibility', keep ? 'visible' : 'none')
        if (keep) {
          set('text-color', c.label)
          set('text-halo-color', c.land)
          set('text-halo-width', 1.4)
        }
        break
      }
    }
  }
}

/** Bubble size grows with the number of check-ins, gently. */
const bubbleSize = (total: number) => Math.round(Math.min(70, 40 + Math.sqrt(total) * 3.5))

/**
 * One place: a mood ring with a name tag underneath. The ring shrinks a little when zoomed out
 * (the map sets --bubble-scale), and name tags hide when zoomed far out so bubbles don't crowd.
 */
function Bubble({ place, selected, index }: { place: PlaceMood; selected: boolean; index: number }) {
  const size = bubbleSize(place.total)
  const scale = selected ? 'calc(var(--bubble-scale, 1) * 1.2)' : 'var(--bubble-scale, 1)'
  return (
    <span className="mood-bubble relative block" style={{ animationDelay: `${(index % 5) * -0.7}s`, width: size + 8, height: size + 8 }}>
      <span
        className="block rounded-full bg-surface p-1 transition-transform duration-300"
        style={{
          transform: `scale(${scale})`,
          boxShadow: selected ? '0 0 0 3px var(--ink), var(--shadow-lift)' : 'var(--shadow-lift)',
        }}
      >
        <MoodRing counts={place.counts} size={size} ring={Math.max(5, size / 11)} />
      </span>
      <span
        className={`bubble-label absolute left-1/2 -translate-x-1/2 rounded-full bg-surface px-2.5 py-0.5 text-xs font-extrabold whitespace-nowrap text-ink shadow-soft ${selected ? 'is-selected' : ''}`}
        style={{ top: `calc(50% + ${(size + 8) / 2}px * ${scale} + 4px)` }}
      >
        {place.name}
      </span>
    </span>
  )
}

type Props = { places: PlaceMood[]; selectedId: string | null; onSelect: (id: string | null) => void }

// Room left for the cards floating over the map, in pixels.
const FIT_PADDING = { top: 230, bottom: 200, left: 40, right: 40 }

type Pin = { marker: Marker; root: Root; el: HTMLButtonElement }

export function MoodMap({ places, selectedId, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const pins = useRef(new Map<string, Pin>())
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const scaleRef = useRef(1)

  /**
   * Show as many name tags as fit. Busiest places claim space first; a tag that would overlap
   * an earlier tag or bubble is hidden (the chosen place always keeps its tag).
   */
  const declutter = () => {
    const map = mapRef.current
    if (!map) return
    const taken: { x1: number; y1: number; x2: number; y2: number }[] = []
    const hits = (r: (typeof taken)[number]) => taken.some((t) => r.x1 < t.x2 && r.x2 > t.x1 && r.y1 < t.y2 && r.y2 > t.y1)
    const ordered = [...places].sort((a, b) => Number(b.id === selectedId) - Number(a.id === selectedId) || b.total - a.total)
    for (const p of ordered) {
      const { x, y } = map.project(p.at)
      const r = ((bubbleSize(p.total) + 8) / 2) * scaleRef.current
      taken.push({ x1: x - r, y1: y - r, x2: x + r, y2: y + r })
    }
    for (const p of ordered) {
      const pin = pins.current.get(p.id)
      if (!pin) continue
      const { x, y } = map.project(p.at)
      const r = ((bubbleSize(p.total) + 8) / 2) * scaleRef.current
      const w = p.name.length * 7 + 22
      const label = { x1: x - w / 2, y1: y + r + 4, x2: x + w / 2, y2: y + r + 26 }
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
    const map = new MapLibreMap({
      container: el.current,
      style: BASE_STYLE,
      center: CAMPUS.center,
      zoom: CAMPUS.zoom,
      minZoom: 13,
      maxZoom: 17.5,
      maxBounds: CAMPUS.maxBounds,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
    })
    map.addControl(new AttributionControl({ compact: true }), 'top-right')
    map.on('load', () => recolorBaseMap(map))

    // Bubbles shrink a little when zoomed out; name tags that would overlap are hidden.
    const fitBubbles = () => {
      const scale = Math.min(1.1, Math.max(0.78, 0.78 + (map.getZoom() - 14) * 0.2))
      scaleRef.current = scale
      el.current?.style.setProperty('--bubble-scale', scale.toFixed(3))
    }
    let raf = 0
    map.on('zoom', fitBubbles)
    map.on('move', () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => declutterRef.current())
    })

    // Frame the central campus places between the top card and the bottom controls.
    const core = PLACES.filter((p) => p.core)
    const lngs = core.map((p) => p.at[0])
    const lats = core.map((p) => p.at[1])
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: FIT_PADDING, duration: 0 },
    )
    fitBubbles()
    map.on('click', () => onSelectRef.current(null))
    mapRef.current = map

    // Re-paint when the light/dark theme changes.
    const observer = new MutationObserver(() => map.isStyleLoaded() && recolorBaseMap(map))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    const current = pins.current
    return () => {
      observer.disconnect()
      for (const p of current.values()) {
        p.marker.remove()
        queueMicrotask(() => p.root.unmount())
      }
      current.clear()
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Add, update and remove the place bubbles.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const seen = new Set<string>()
    places.forEach((place, i) => {
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
        const marker = new Marker({ element: button, anchor: 'center' })
          .setLngLat(place.at)
          .addTo(map)
        pin = { marker, root: createRoot(button), el: button }
        pins.current.set(place.id, pin)
      }
      pin.el.setAttribute('aria-label', `${place.name}: ${headline(place.counts).toLowerCase()}, ${place.total} check-ins`)
      pin.el.setAttribute('aria-pressed', String(place.id === selectedId))
      pin.el.style.zIndex = place.id === selectedId ? '5' : '1'
      pin.root.render(<Bubble place={place} selected={place.id === selectedId} index={i} />)
    })
    for (const [id, pin] of pins.current) {
      if (seen.has(id)) continue
      pin.marker.remove()
      queueMicrotask(() => pin.root.unmount())
      pins.current.delete(id)
    }
    declutterRef.current()
  }, [places, selectedId])

  // Glide to a place when it's chosen, keeping it above the details card.
  useEffect(() => {
    const map = mapRef.current
    const place = places.find((p) => p.id === selectedId)
    if (!map || !place) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    map.easeTo({
      center: place.at,
      zoom: Math.max(map.getZoom(), 15.6),
      padding: { top: 200, bottom: 440, left: 0, right: 0 },
      duration: reduce ? 0 : 700,
    })
    // places changes every hour of the slider; only react to a new selection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  return (
    <div className="absolute inset-0 isolate bg-[var(--map-land)]">
      {/* MapLibre makes its container position: relative, so it gets its own full-size box. */}
      <div ref={el} className="h-full w-full" aria-label={`Map of ${CAMPUS.name}. Each bubble is a place on campus and shows how people there feel.`} />
    </div>
  )
}
