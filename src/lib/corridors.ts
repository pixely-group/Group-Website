/** Financial centres, positioned by real longitude/latitude. Algiers is the
 *  home node — the globe opens on it and every corridor below runs to it.
 *  Ordered roughly west to east, which is only for reading the list; the
 *  globe places them by coordinate and does not care about the order. */
export const CENTRES = [
  { code: "ALG", name: "Algiers", lon: 3.06, lat: 36.75, home: true },
  { code: "SFO", name: "San Francisco", lon: -122.4, lat: 37.8 },
  { code: "MEX", name: "Mexico City", lon: -99.13, lat: 19.43 },
  { code: "HAV", name: "Havana", lon: -82.38, lat: 23.13 },
  { code: "BOG", name: "Bogotá", lon: -74.07, lat: 4.71 },
  { code: "NYC", name: "New York", lon: -74.0, lat: 40.7 },
  { code: "CCS", name: "Caracas", lon: -66.9, lat: 10.48 },
  { code: "BSB", name: "Brasília", lon: -47.88, lat: -15.79 },
  { code: "SAO", name: "São Paulo", lon: -46.6, lat: -23.6 },
  { code: "NKC", name: "Nouakchott", lon: -15.98, lat: 18.08 },
  { code: "DUB", name: "Dublin", lon: -6.26, lat: 53.35 },
  { code: "LON", name: "London", lon: -0.13, lat: 51.5 },
  { code: "BCN", name: "Barcelona", lon: 2.15, lat: 41.39 },
  { code: "FRA", name: "Frankfurt", lon: 8.68, lat: 50.1 },
  { code: "ROM", name: "Rome", lon: 12.5, lat: 41.9 },
  { code: "MOW", name: "Moscow", lon: 37.62, lat: 55.75 },
  { code: "JNB", name: "Johannesburg", lon: 28.0, lat: -26.2 },
  { code: "BLR", name: "Bengaluru", lon: 77.6, lat: 13.0 },
  { code: "SGP", name: "Singapore", lon: 103.8, lat: 1.35 },
  { code: "HKG", name: "Hong Kong", lon: 114.2, lat: 22.3 },
  { code: "PEK", name: "Beijing", lon: 116.41, lat: 39.9 },
  { code: "TYO", name: "Tokyo", lon: 139.7, lat: 35.7 },
  { code: "SYD", name: "Sydney", lon: 151.2, lat: -33.9 },
] as const;

export type Corridor = {
  from: number;
  to: number;
  /** Seconds for one packet to traverse. */
  period: number;
  offset: number;
};

/**
 * Indexes into CENTRES. Every corridor touches 0 — Algiers — so the movement
 * reads as one country trading with the world rather than a mesh with a
 * country somewhere in it.
 *
 * Periods are deliberately unrelated to each other. Round numbers, or any two
 * that divide, and the packets fall into step within a few seconds and the
 * whole thing pulses like a metronome; these drift against one another and
 * never quite repeat. Each city keeps the period it was given, so adding one
 * re-times nothing that was already running.
 */
export const CORRIDORS: Corridor[] = [
  { from: 0, to: 1, period: 1.7, offset: 0.0 },
  { from: 0, to: 2, period: 2.2, offset: 0.35 },
  { from: 0, to: 3, period: 2.6, offset: 0.15 },
  { from: 0, to: 4, period: 2.7, offset: 0.65 },
  { from: 0, to: 5, period: 3.1, offset: 0.6 },
  { from: 0, to: 6, period: 3.2, offset: 0.85 },
  { from: 0, to: 7, period: 3.9, offset: 0.4 },
  { from: 0, to: 8, period: 3.5, offset: 0.25 },
  { from: 0, to: 9, period: 4.2, offset: 0.95 },
  { from: 0, to: 10, period: 3.8, offset: 0.8 },
  { from: 0, to: 11, period: 4.3, offset: 0.45 },
  { from: 0, to: 12, period: 2.9, offset: 0.1 },
  { from: 0, to: 13, period: 3.3, offset: 0.7 },
  { from: 0, to: 14, period: 5.6, offset: 0.12 },
  { from: 0, to: 15, period: 4.6, offset: 0.5 },
  { from: 0, to: 16, period: 4.1, offset: 0.9 },
  { from: 0, to: 17, period: 4.9, offset: 0.2 },
  { from: 0, to: 18, period: 5.3, offset: 0.55 },
  { from: 0, to: 19, period: 5.9, offset: 0.3 },
  { from: 0, to: 20, period: 6.1, offset: 0.58 },
  { from: 0, to: 21, period: 2.4, offset: 0.75 },
  { from: 0, to: 22, period: 3.6, offset: 0.05 },
];
