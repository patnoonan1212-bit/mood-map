import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { AttributionControl, Map as MapLibreMap, setWorkerUrl, type GeoJSONSource, type MapLayerMouseEvent } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { CellMood } from '../lib/aggregate'
import { CAMPUS } from '../lib/campus'
import { shares } from '../lib/feelings'
import { MOODS, type MoodId } from '../lib/moods'
import { PLACES, type PlaceMood } from '../lib/places'

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

/** Grows with zoom so glows and bubbles keep roughly the same size on the ground. */
const byZoom = (atZ13: number, atZ17: number) =>
  ['interpolate', ['exponential', 1.6], ['zoom'], 13, ['*', atZ13, ['get', 's']], 17, ['*', atZ17, ['get', 's']]] as unknown as number

/**
 * The mood layers, drawn on the ground beneath buildings and labels:
 *  - areas: every part of campus with enough check-ins, a gentle glow in its main mood
 *  - glow: a big soft halo around each popular place, which the areas melt into
 *  - bubble: a glossy colored bubble at the heart of each popular place, with a white rim
 *  - shine: a soft highlight on each bubble so it looks round
 *  - names: place names under the bubbles (they hide themselves where they would overlap)
 */
function addMoodLayers(map: MapLibreMap) {
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
        'circle-radius': byZoom(24, 157),
        'circle-blur': 1,
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.45, 17, 0.32],
        'circle-pitch-alignment': 'map',
      },
    },
    before,
  )
  map.addLayer(
    {
      id: `${SPOTS}-glow`,
      type: 'circle',
      source: SPOTS,
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': byZoom(50, 320),
        'circle-blur': 1,
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.62, 17, 0.45],
        'circle-pitch-alignment': 'map',
      },
    },
    before,
  )
  // Bubbles and names sit above everything so they're easy to see and tap.
  map.addLayer({
    id: `${SPOTS}-bubble`,
    type: 'circle',
    source: SPOTS,
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, ['*', 9, ['get', 'b']], 15, ['*', 15, ['get', 'b']], 17, ['*', 24, ['get', 'b']]],
      'circle-blur': 0.12,
      'circle-opacity': 0.92,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': ['case', ['boolean', ['get', 'selected'], false], 4, 2.5],
      'circle-stroke-opacity': 0.95,
    },
  })
  map.addLayer({
    id: `${SPOTS}-shine`,
    type: 'circle',
    source: SPOTS,
    paint: {
      'circle-color': '#ffffff',
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, ['*', 3.5, ['get', 'b']], 15, ['*', 6, ['get', 'b']], 17, ['*', 9, ['get', 'b']]],
      'circle-blur': 0.9,
      'circle-opacity': 0.75,
      'circle-translate': ['interpolate', ['linear'], ['zoom'], 13, ['literal', [-2.5, -2.5]], 15, ['literal', [-4.5, -4.5]], 17, ['literal', [-7, -7]]],
    },
  })
  // Place names, if the base map provides fonts.
  const font = map
    .getStyle()
    .layers?.map((l) => (l.type === 'symbol' ? (l.layout?.['text-font'] as string[] | undefined) : undefined))
    .find((f) => Array.isArray(f))
  if (map.getStyle().glyphs && font) {
    map.addLayer({
      id: `${SPOTS}-names`,
      type: 'symbol',
      source: SPOTS,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': font,
        'text-size': ['interpolate', ['linear'], ['zoom'], 13, 11, 16, 14],
        'text-offset': [0, 1.8],
        'text-anchor': 'top',
        'text-padding': 4,
        'symbol-sort-key': ['-', 0, ['get', 'total']],
      },
      paint: { 'text-color': '#2b2130', 'text-halo-color': '#ffffff', 'text-halo-width': 2 },
    })
  }
}

/** Layer data. `t` (ms) makes the glows breathe slowly. */
function moodData(cells: CellMood[], places: PlaceMood[], colors: Record<MoodId, string>, selectedId: string | null, t: number) {
  const breathe = (i: number, amount: number) => 1 + amount * Math.sin(t / 2600 + i * 1.3)
  const areas = cells.map((c, i) => ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: c.lngLat },
    properties: { color: colors[topMood(c.counts)], s: Math.min(1.5, 0.75 + Math.sqrt(c.total) / 8) * breathe(i, 0.05) },
  }))
  const spots = places.map((p, i) => ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: p.at },
    properties: {
      id: p.id,
      name: p.name,
      total: p.total,
      selected: p.id === selectedId,
      color: colors[topMood(p.counts)],
      s: Math.min(1.8, 0.7 + Math.sqrt(p.total) / 6) * breathe(i + 50, 0.08),
      // Bubble size: busier places get bigger bubbles; the chosen one grows a little.
      b: Math.min(1.5, 0.75 + Math.sqrt(p.total) / 14) * (p.id === selectedId ? 1.25 : 1) * breathe(i + 90, 0.03),
    },
  }))
  return {
    areas: { type: 'FeatureCollection' as const, features: areas },
    spots: { type: 'FeatureCollection' as const, features: spots },
  }
}

type Props = { cells: CellMood[]; places: PlaceMood[]; selectedId: string | null; onSelect: (id: string | null) => void }

// Room left for the cards floating over the map, in pixels.
const FIT_PADDING = { top: 230, bottom: 200, left: 40, right: 40 }

export function MoodMap({ cells, places, selectedId, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const readyRef = useRef(false)
  const data = useRef({ cells, places, selectedId })
  const colors = useRef(moodColors())
  const onSelectRef = useRef(onSelect)
  const reduce = useReducedMotion()
  data.current = { cells, places, selectedId }
  onSelectRef.current = onSelect

  const paint = (t: number) => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    const d = moodData(data.current.cells, data.current.places, colors.current, data.current.selectedId, t)
    ;(map.getSource(AREAS) as GeoJSONSource).setData(d.areas)
    ;(map.getSource(SPOTS) as GeoJSONSource).setData(d.spots)
  }
  const paintRef = useRef(paint)
  paintRef.current = paint

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
      addMoodLayers(map)
      readyRef.current = true
      paintRef.current(0)
    })

    // Tap a bubble to see that place; tap anywhere else to close it.
    const bubble = `${SPOTS}-bubble`
    map.on('click', (e) => {
      const hit = readyRef.current ? map.queryRenderedFeatures(e.point, { layers: [bubble] })[0] : undefined
      onSelectRef.current((hit?.properties?.id as string | undefined) ?? null)
    })
    map.on('mouseenter', bubble, (e: MapLayerMouseEvent) => {
      if (e.features?.length) map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', bubble, () => (map.getCanvas().style.cursor = ''))
    mapRef.current = map

    // Mood colors are a little brighter in dark mode.
    const observer = new MutationObserver(() => {
      colors.current = moodColors()
      paintRef.current(0)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    return () => {
      observer.disconnect()
      readyRef.current = false
      map.remove()
      mapRef.current = null
    }
  }, [])

  // New data from the time slider, or a new selection.
  useEffect(() => paintRef.current(performance.now()), [cells, places, selectedId])

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
      <div
        ref={el}
        className="h-full w-full"
        aria-label={`Map of ${CAMPUS.name}. Colored bubbles show how people feel at each place. Use the List view for the same information as text.`}
      />
    </div>
  )
}
