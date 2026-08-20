/**
 * Algeria on the globe. The border is simplified — enough vertices that the
 * country is recognisable at the size it is drawn, not a survey. Points are
 * [longitude, latitude] and run anticlockwise from the north-west.
 *
 * The shape matters: Algeria is the largest country in Africa and its outline
 * is distinctive enough to read without any neighbouring landmass drawn, which
 * is what lets the globe stay abstract everywhere else.
 */
export const ALGERIA_BORDER: [number, number][] = [
  [-2.2, 35.1],
  [-1.7, 34.0],
  [-1.2, 32.1],
  [-3.7, 30.9],
  [-5.0, 29.0],
  [-8.7, 27.3],
  [-8.7, 24.8],
  [-4.8, 24.9],
  [1.2, 20.7],
  [3.1, 19.7],
  [3.3, 18.9],
  [5.8, 19.4],
  [10.0, 24.5],
  [11.9, 23.5],
  [9.9, 26.5],
  [9.8, 29.4],
  [9.5, 30.2],
  [8.0, 32.5],
  [8.2, 34.6],
  [7.5, 36.9],
  [5.0, 36.8],
  [3.1, 36.8],
  [0.1, 35.9],
  [-1.2, 35.6],
];

/** The capital, and the point the globe is turned to face. */
export const ALGIERS = { name: "Algiers", lon: 3.06, lat: 36.75 };

/** Where the country's own network reaches, north to deep south. */
export const CITIES = [
  { name: "Algiers", lon: 3.06, lat: 36.75 },
  { name: "Oran", lon: -0.64, lat: 35.7 },
  { name: "Constantine", lon: 6.61, lat: 36.37 },
  { name: "Annaba", lon: 7.77, lat: 36.9 },
  { name: "Béchar", lon: -2.22, lat: 31.62 },
  { name: "Ouargla", lon: 5.33, lat: 31.95 },
  { name: "Tamanrasset", lon: 5.53, lat: 22.79 },
  { name: "Adrar", lon: -0.29, lat: 27.87 },
] as const;

/** Degrees, the point the camera looks at. */
export const FOCUS = { lon: 2.6, lat: 28 };
