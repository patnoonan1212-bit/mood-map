// Pilot location: Penn State, University Park. Change these to move the whole app.
export const CAMPUS = {
  name: 'Penn State',
  areaName: 'Campus',
  center: [-77.862, 40.7995] as [number, number], // [longitude, latitude]
  zoom: 14.4,
  // People can't scroll the map far away from the pilot area.
  maxBounds: [
    [-77.92, 40.765],
    [-77.81, 40.835],
  ] as [[number, number], [number, number]],
}
