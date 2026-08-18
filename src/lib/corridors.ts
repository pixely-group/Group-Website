/** Financial centres, positioned by real longitude/latitude. */
export const CENTRES = [
  { code: "SFO", name: "San Francisco", lon: -122.4, lat: 37.8 },
  { code: "NYC", name: "New York", lon: -74.0, lat: 40.7 },
  { code: "SAO", name: "São Paulo", lon: -46.6, lat: -23.6 },
  { code: "LON", name: "London", lon: -0.13, lat: 51.5 },
  { code: "FRA", name: "Frankfurt", lon: 8.68, lat: 50.1 },
  { code: "JNB", name: "Johannesburg", lon: 28.0, lat: -26.2 },
  { code: "DXB", name: "Dubai", lon: 55.3, lat: 25.2 },
  { code: "BLR", name: "Bengaluru", lon: 77.6, lat: 13.0 },
  { code: "SGP", name: "Singapore", lon: 103.8, lat: 1.35 },
  { code: "HKG", name: "Hong Kong", lon: 114.2, lat: 22.3 },
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

/** Indexes into CENTRES. Chosen to read as real trade corridors. */
export const CORRIDORS: Corridor[] = [
  { from: 1, to: 3, period: 3.1, offset: 0 },
  { from: 0, to: 1, period: 2.4, offset: 0.4 },
  { from: 3, to: 4, period: 1.8, offset: 0.15 },
  { from: 3, to: 6, period: 3.6, offset: 0.6 },
  { from: 4, to: 6, period: 3.2, offset: 0.25 },
  { from: 6, to: 7, period: 2.6, offset: 0.7 },
  { from: 7, to: 8, period: 2.8, offset: 0.1 },
  { from: 8, to: 9, period: 1.9, offset: 0.5 },
  { from: 9, to: 10, period: 2.5, offset: 0.85 },
  { from: 8, to: 11, period: 3.4, offset: 0.3 },
  { from: 1, to: 2, period: 3.0, offset: 0.55 },
  { from: 3, to: 5, period: 3.8, offset: 0.2 },
  { from: 0, to: 10, period: 4.2, offset: 0.75 },
  { from: 10, to: 8, period: 2.2, offset: 0.35 },
  { from: 1, to: 4, period: 3.3, offset: 0.9 },
];
