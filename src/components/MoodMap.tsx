import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { AttributionControl, Map as MapLibreMap, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { CellMood } from '../lib/aggregate'
import { CAMPUS } from '../lib/campus'
import { MOODS, type MoodId } from '../lib/moods'

setWorkerUrl(workerUrl)

// Free map tiles, no account or key needed. We recolor this style to match the app.
const BASE_STYLE = 'https://tiles.openfreemap.org/styles/positron'
const SOURCE = 'moods'

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
    if (layer.id === 'mood-clouds') continue
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

/** Current mood colors from the design tokens (they differ between light and dark). */
const moodColors = () => Object.fromEntries(MOODS.map((m) => [m.id, cssVar(m.cssVar)])) as Record<MoodId, string>

/**
 * Mood clouds: every area becomes a few soft, blurred puffs, one per mood that people there
 * picked, sized by how many picked it. Puffs from neighbouring areas overlap into one cloudy layer.
 */
function addMoodLayer(map: MapLibreMap) {
  map.addSource(SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
  map.addLayer({
    id: 'mood-clouds',
    type: 'circle',
    source: SOURCE,
    paint: {
      'circle-color': ['get', 'color'],
      // `s` is the puff size. Radius doubles with each zoom level so clouds keep their ground size.
      'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 13, ['*', 20, ['get', 's']], 17, ['*', 320, ['get', 's']]],
      'circle-blur': 1,
      'circle-opacity': 0.62,
      'circle-pitch-alignment': 'map',
    },
  })
}

// Each mood's puff sits a little off the area's center in its own direction, so mixed areas swirl.
const OFFSET_ANGLE = Object.fromEntries(MOODS.map((m, i) => [m.id, (i / MOODS.length) * Math.PI * 2])) as Record<MoodId, number>
const OFFSET_DEG = 0.00055

/** Cells as soft puffs, gently drifting and breathing over time (`t` in ms). */
function toGeoJSON(cells: CellMood[], colors: Record<MoodId, string>, t: number) {
  const features = []
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i]
    const phase = i * 1.7
    const driftX = Math.sin(t / 5200 + phase) * 0.00016
    const driftY = Math.cos(t / 6100 + phase) * 0.00011
    const moods = MOODS.filter((m) => c.counts[m.id] > 0).sort((a, b) => c.counts[a.id] - c.counts[b.id])
    for (const m of moods) {
      const share = c.counts[m.id] / c.total
      const away = (1 - share) * OFFSET_DEG
      const a = OFFSET_ANGLE[m.id] + phase
      const breath = 1 + 0.09 * Math.sin(t / 2300 + phase + OFFSET_ANGLE[m.id])
      // Size grows with the number of check-ins, but gently (square root), and stays in a pleasant range.
      const s = Math.min(1.7, Math.max(0.55, Math.sqrt(c.counts[m.id]) / 2.6)) * breath
      features.push({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [c.lngLat[0] + driftX + Math.cos(a) * away * 1.3, c.lngLat[1] + driftY + Math.sin(a) * away],
        },
        properties: { color: colors[m.id], s },
      })
    }
  }
  return { type: 'FeatureCollection' as const, features }
}

export function MoodMap({ cells }: { cells: CellMood[] }) {
  const el = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const readyRef = useRef(false)
  const cellsRef = useRef(cells)
  const colorsRef = useRef<Record<MoodId, string>>(moodColors())
  const reduce = useReducedMotion()

  cellsRef.current = cells

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
    mapRef.current = map

    map.on('load', () => {
      recolorBaseMap(map)
      addMoodLayer(map)
      readyRef.current = true
      ;(map.getSource(SOURCE) as GeoJSONSource).setData(toGeoJSON(cellsRef.current, colorsRef.current, performance.now()))
    })

    // Re-paint when the light/dark theme changes.
    const observer = new MutationObserver(() => {
      if (!readyRef.current) return
      recolorBaseMap(map)
      colorsRef.current = moodColors()
      ;(map.getSource(SOURCE) as GeoJSONSource).setData(toGeoJSON(cellsRef.current, colorsRef.current, performance.now()))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    return () => {
      observer.disconnect()
      readyRef.current = false
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Push new data when the time slider moves.
  useEffect(() => {
    const map = mapRef.current
    if (map && readyRef.current) (map.getSource(SOURCE) as GeoJSONSource).setData(toGeoJSON(cells, colorsRef.current, performance.now()))
  }, [cells])

  // Breathing and drifting.
  useEffect(() => {
    if (reduce) return
    let raf = 0
    let last = 0
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick)
      if (t - last < 66) return // about 15 updates a second is plenty for slow motion
      last = t
      const map = mapRef.current
      if (!map || !readyRef.current) return
      ;(map.getSource(SOURCE) as GeoJSONSource).setData(toGeoJSON(cellsRef.current, colorsRef.current, t))
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduce])

  return (
    <div className="absolute inset-0 bg-[var(--map-land)]" role="img" aria-label={`Map of ${CAMPUS.name} showing the mood of each area as soft colored clouds`}>
      {/* MapLibre makes its container position: relative, so it gets its own full-size box. */}
      <div ref={el} className="h-full w-full" />
    </div>
  )
}
