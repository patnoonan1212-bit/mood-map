import { cellToLatLng, latLngToCell } from 'h3-js'

/**
 * Privacy grid. Every check-in is snapped to a hexagon on the device, before anything is sent.
 * H3 resolution 9 hexagons are about 175 m across edge to edge (two or three campus blocks).
 */
export const GRID_RESOLUTION = 9

/** The smallest number of check-ins an area needs before its mood is shown. */
export const MIN_CHECKINS_TO_SHOW = 5

export const toCell = (lat: number, lng: number) => latLngToCell(lat, lng, GRID_RESOLUTION)

/** Center of a cell as [longitude, latitude], the order maps use. */
export const cellCenter = (cell: string): [number, number] => {
  const [lat, lng] = cellToLatLng(cell)
  return [lng, lat]
}
