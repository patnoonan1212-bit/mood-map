// Pilot location: Penn State, University Park. Change these to move the whole app.
export const CAMPUS = {
  name: 'Penn State',
  areaName: 'Campus',
  center: [-77.862, 40.7995] as [number, number], // [longitude, latitude]
  zoom: 14.4,
  // The map covers State College and nearby neighborhoods, so off-campus moods show too.
  maxBounds: [
    [-78.0, 40.72],
    [-77.74, 40.88],
  ] as [[number, number], [number, number]],
}
