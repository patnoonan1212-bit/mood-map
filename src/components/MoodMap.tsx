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
// The map uses its own richer versions of the mood colors (see --map-mood-* in tokens.css).
const moodColors = () => Object.fromEntries(MOODS.map((m) => [m.id, cssVar(`--map-mood-${m.id}`)])) as Record<MoodId, string>
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
 * The mood layers, from the ground up:
 *  - areas: every part of campus with enough check-ins glows in ALL its moods, each puff sized by
 *    that mood's share, so a mixed area looks mixed
 *  - mix: the same, bigger and stronger, around each popular place; the areas melt into it
 *  - pins: a small glossy pin on each place in its main mood color, with a soft shadow, a white
 *    rim, a shine and a slow pulse ring, plus the place name under it
 */
const PINS = 'mood-pins'

function addMoodLayers(map: MapLibreMap) {
  const before = map.getStyle().layers?.find((l) => l.type === 'symbol' || l.type === 'fill-extrusion')?.id
  for (const id of [AREAS, SPOTS, PINS]) map.addSource(id, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
  map.addLayer(
    {
      id: AREAS,
      type: 'circle',
      source: AREAS,
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': byZoom(22, 145),
        'circle-blur': 0.9,
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.55, 17, 0.4],
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
        'circle-radius': byZoom(40, 260),
        'circle-blur': 0.85,
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.78, 17, 0.6],
        'circle-pitch-alignment': 'map',
      },
    },
    before,
  )
  // Pins sit above the buildings so they're always easy to see and tap.
  const pinR = (r13: number, r15: number, r17: number, prop = 'b') =>
    ['interpolate', ['linear'], ['zoom'], 13, ['*', r13, ['get', prop]], 15, ['*', r15, ['get', prop]], 17, ['*', r17, ['get', prop]]] as unknown as number
  map.addLayer({
    id: `${PINS}-pulse`,
    type: 'circle',
    source: PINS,
    paint: {
      'circle-color': 'rgba(0,0,0,0)',
      'circle-radius': pinR(5, 7, 10, 'pulse'),
      'circle-stroke-color': ['get', 'color'],
      'circle-stroke-width': 2,
      'circle-stroke-opacity': ['get', 'pulseOpacity'],
    },
  })
  map.addLayer({
    id: `${PINS}-shadow`,
    type: 'circle',
    source: PINS,
    paint: {
      'circle-color': '#2b2130',
      'circle-radius': pinR(6.5, 8.5, 11.5),
      'circle-blur': 0.6,
      'circle-opacity': 0.35,
      'circle-translate': [0, 2.5],
    },
  })
  map.addLayer({
    id: `${PINS}-dot`,
    type: 'circle',
    source: PINS,
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': pinR(5, 7, 10),
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': ['case', ['boolean', ['get', 'selected'], false], 3.5, 2.5],
    },
  })
  map.addLayer({
    id: `${PINS}-shine`,
    type: 'circle',
    source: PINS,
    paint: {
      'circle-color': '#ffffff',
      'circle-radius': pinR(1.6, 2.2, 3),
      'circle-blur': 0.4,
      'circle-opacity': 0.85,
      'circle-translate': ['interpolate', ['linear'], ['zoom'], 13, ['literal', [-1.5, -1.5]], 17, ['literal', [-3.2, -3.2]]],
    },
  })
  // Place names, if the base map provides fonts.
  const font = map
    .getStyle()
    .layers?.map((l) => (l.type === 'symbol' ? (l.layout?.['text-font'] as string[] | undefined) : undefined))
    .find((f) => Array.isArray(f))
  if (map.getStyle().glyphs && font) {
    map.addLayer({
      id: `${PINS}-names`,
      type: 'symbol',
      source: PINS,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': font,
        'text-size': ['interpolate', ['linear'], ['zoom'], 13, 11, 16, 13],
        'text-offset': [0, 1.1],
        'text-anchor': 'top',
        'text-padding': 4,
        'symbol-sort-key': ['-', 0, ['get', 'total']],
      },
      paint: { 'text-color': '#2b2130', 'text-halo-color': '#ffffff', 'text-halo-width': 2 },
    })
  }
}

// Each mood's puff sits a little off-center in its own direction, so mixes swirl instead of stacking.
const ANGLE = Object.fromEntries(MOODS.map((m, i) => [m.id, (i / MOODS.length) * Math.PI * 2])) as Record<MoodId, number>
const METER = 1 / 111_320

/** One soft puff per mood present, sized by its share. Smaller shares are drawn last so they stay visible. */
function mixPuffs(
  center: [number, number],
  counts: CellMood['counts'],
  colors: Record<MoodId, string>,
  size: number,
  spreadM: number,
  minShare: number,
  phase: number,
  t: number,
) {
  const total = MOODS.reduce((n, m) => n + counts[m.id], 0)
  const lngScale = 1 / Math.cos((center[1] * Math.PI) / 180)
  return MOODS.filter((m) => counts[m.id] / total >= minShare)
    .sort((a, b) => counts[b.id] - counts[a.id])
    .map((m) => {
      const share = counts[m.id] / total
      const a = ANGLE[m.id] + phase + t / 9000 // the whole mix turns very slowly
      const away = (1 - share) * spreadM
      const breath = 1 + 0.07 * Math.sin(t / 2400 + phase + ANGLE[m.id])
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [center[0] + Math.cos(a) * away * METER * lngScale, center[1] + Math.sin(a) * away * METER],
        },
        properties: { color: colors[m.id], s: size * (0.45 + Math.sqrt(share) * 0.75) * breath },
      }
    })
}

/** Layer data. `t` (ms) drives the slow breathing, swirling and the pin pulse. */
function moodData(cells: CellMood[], places: PlaceMood[], colors: Record<MoodId, string>, selectedId: string | null, t: number) {
  const areas = cells.flatMap((c, i) => mixPuffs(c.lngLat, c.counts, colors, Math.min(1.4, 0.7 + Math.sqrt(c.total) / 9), 45, 0.15, i * 1.7, t))
  const spots = places.flatMap((p, i) => mixPuffs(p.at, p.counts, colors, Math.min(1.7, 0.75 + Math.sqrt(p.total) / 7), 80, 0.08, i * 2.3, t))
  const pins = places.map((p, i) => {
    const cycle = ((t / 2600 + i * 0.37) % 1 + 1) % 1 // 0 to 1, a little out of step per place
    return {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: p.at },
      properties: {
        id: p.id,
        name: p.name,
        total: p.total,
        selected: p.id === selectedId,
        color: colors[topMood(p.counts)],
        b: (p.id === selectedId ? 1.3 : 1) * Math.min(1.25, 0.85 + Math.sqrt(p.total) / 30),
        pulse: (p.id === selectedId ? 1.3 : 1) * Math.min(1.25, 0.85 + Math.sqrt(p.total) / 30) * (1 + cycle * 1.6),
        pulseOpacity: t ? 0.7 * (1 - cycle) : 0,
      },
    }
  })
  const fc = <T,>(features: T[]) => ({ type: 'FeatureCollection' as const, features })
  return { areas: fc(areas), spots: fc(spots), pins: fc(pins) }
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
    ;(map.getSource(PINS) as GeoJSONSource).setData(d.pins)
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
    const bubble = `${PINS}-dot`
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
  useEffect(() => paintRef.current(reduce ? 0 : performance.now()), [cells, places, selectedId, reduce])

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
