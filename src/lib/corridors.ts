/** Financial centres, positioned by real longitude/latitude. Algiers is the
 *  home node — the globe opens on it and every corridor below runs to it.
 *  Ordered roughly west to east, which is only for reading the list; the
 *  globe places them by coordinate and does not care about the order.
 *
 *  `tz` is the IANA zone, not a fixed offset, because half of these observe
 *  daylight saving and on different dates: the gap between Algiers and London
 *  is one hour for most of the year and zero for the rest of it. The zone name
 *  lets Intl work that out per instant; a stored number could not.
 *
 *  `cc` keys the outline the readout draws — two cities can share one, as
 *  San Francisco and New York do. `country` is what the readout prints beside
 *  the city, kept short because it shares a line with the name; where it would
 *  only repeat the city, as with the two city-states here, it is left out. */
export const CENTRES = [
  {
    code: "ALG",
    name: "Algiers",
    lon: 3.06,
    lat: 36.75,
    home: true,
    tz: "Africa/Algiers",
    cc: "DZ",
    country: "Algeria",
  },
  {
    code: "SFO",
    name: "San Francisco",
    lon: -122.4,
    lat: 37.8,
    tz: "America/Los_Angeles",
    cc: "US",
    country: "USA",
  },
  {
    code: "MEX",
    name: "Mexico City",
    lon: -99.13,
    lat: 19.43,
    tz: "America/Mexico_City",
    cc: "MX",
    country: "Mexico",
  },
  {
    code: "BOG",
    name: "Bogotá",
    lon: -74.07,
    lat: 4.71,
    tz: "America/Bogota",
    cc: "CO",
    country: "Colombia",
  },
  {
    code: "NYC",
    name: "New York",
    lon: -74.0,
    lat: 40.7,
    tz: "America/New_York",
    cc: "US",
    country: "USA",
  },
  {
    code: "CCS",
    name: "Caracas",
    lon: -66.9,
    lat: 10.48,
    tz: "America/Caracas",
    cc: "VE",
    country: "Venezuela",
  },
  {
    code: "SAO",
    name: "São Paulo",
    lon: -46.6,
    lat: -23.6,
    tz: "America/Sao_Paulo",
    cc: "BR",
    country: "Brazil",
  },
  {
    code: "NKC",
    name: "Nouakchott",
    lon: -15.98,
    lat: 18.08,
    tz: "Africa/Nouakchott",
    cc: "MR",
    country: "Mauritania",
  },
  {
    code: "LON",
    name: "London",
    lon: -0.13,
    lat: 51.5,
    tz: "Europe/London",
    cc: "GB",
    country: "United Kingdom",
  },
  {
    code: "MAD",
    name: "Madrid",
    lon: -3.7,
    lat: 40.42,
    tz: "Europe/Madrid",
    cc: "ES",
    country: "Spain",
  },
  {
    code: "FRA",
    name: "Frankfurt",
    lon: 8.68,
    lat: 50.1,
    tz: "Europe/Berlin",
    cc: "DE",
    country: "Germany",
  },
  {
    code: "ROM",
    name: "Rome",
    lon: 12.5,
    lat: 41.9,
    tz: "Europe/Rome",
    cc: "IT",
    country: "Italy",
  },
  {
    code: "MOW",
    name: "Moscow",
    lon: 37.62,
    lat: 55.75,
    tz: "Europe/Moscow",
    cc: "RU",
    country: "Russia",
  },
  {
    code: "JNB",
    name: "Johannesburg",
    lon: 28.0,
    lat: -26.2,
    tz: "Africa/Johannesburg",
    cc: "ZA",
    country: "South Africa",
  },
  {
    code: "THR",
    name: "Tehran",
    lon: 51.39,
    lat: 35.69,
    tz: "Asia/Tehran",
    cc: "IR",
    country: "Iran",
  },
  {
    code: "DOH",
    name: "Doha",
    lon: 51.53,
    lat: 25.29,
    tz: "Asia/Qatar",
    cc: "QA",
    country: "Qatar",
  },
  {
    code: "BLR",
    name: "Bengaluru",
    lon: 77.6,
    lat: 13.0,
    tz: "Asia/Kolkata",
    cc: "IN",
    country: "India",
  },
  {
    code: "SGP",
    name: "Singapore",
    lon: 103.8,
    lat: 1.35,
    tz: "Asia/Singapore",
    cc: "SG",
  },
  {
    code: "HKG",
    name: "Hong Kong",
    lon: 114.2,
    lat: 22.3,
    tz: "Asia/Hong_Kong",
    cc: "HK",
  },
  {
    code: "PEK",
    name: "Beijing",
    lon: 116.41,
    lat: 39.9,
    tz: "Asia/Shanghai",
    cc: "CN",
    country: "China",
  },
  {
    code: "TYO",
    name: "Tokyo",
    lon: 139.7,
    lat: 35.7,
    tz: "Asia/Tokyo",
    cc: "JP",
    country: "Japan",
  },
  {
    code: "SYD",
    name: "Sydney",
    lon: 151.2,
    lat: -33.9,
    tz: "Australia/Sydney",
    cc: "AU",
    country: "Australia",
  },
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
  { from: 0, to: 3, period: 2.7, offset: 0.65 },
  { from: 0, to: 4, period: 3.1, offset: 0.6 },
  { from: 0, to: 5, period: 3.2, offset: 0.85 },
  { from: 0, to: 6, period: 3.5, offset: 0.25 },
  { from: 0, to: 7, period: 4.2, offset: 0.95 },
  { from: 0, to: 8, period: 4.3, offset: 0.45 },
  { from: 0, to: 9, period: 2.9, offset: 0.1 },
  { from: 0, to: 10, period: 3.3, offset: 0.7 },
  { from: 0, to: 11, period: 5.6, offset: 0.12 },
  { from: 0, to: 12, period: 4.6, offset: 0.5 },
  { from: 0, to: 13, period: 4.1, offset: 0.9 },
  { from: 0, to: 14, period: 2.6, offset: 0.15 },
  { from: 0, to: 15, period: 3.9, offset: 0.4 },
  { from: 0, to: 16, period: 4.9, offset: 0.2 },
  { from: 0, to: 17, period: 5.3, offset: 0.55 },
  { from: 0, to: 18, period: 5.9, offset: 0.3 },
  { from: 0, to: 19, period: 6.1, offset: 0.58 },
  { from: 0, to: 20, period: 2.4, offset: 0.75 },
  { from: 0, to: 21, period: 3.6, offset: 0.05 },
];
