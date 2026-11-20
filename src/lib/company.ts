/**
 * Who Pixely is, in law and on the map: the company, its office and how to
 * reach it. One place, because the footer, the contact section, the About
 * page and three legal documents all print these, and an address that is
 * typed six times is wrong in one of them by the second edit.
 *
 * The Algerian entity is as the client gave it: SARL PIXELY, Zone
 * Industrielle Rouiba, Section 7, Groupe 338, Rouiba, Algiers, registered
 * on the registre de commerce under RC 16/00–1054407 B25.
 *
 * SARL PIXELY operates the website, and its terms are governed by Algerian
 * law.
 */

export type Office = {
  /** The short name an office goes by on the page. */
  city: string;
  country: string;
  /** The legal entity at this address. */
  entity: string;
  /** Address lines, as they would be written on an envelope. */
  address: string[];
  /** Registration, printed as it is officially written. */
  registration: { label: string; value: string; href?: string };
  /** Optional: what the address is in law. */
  note?: string;
  phone?: { display: string; tel: string };
  email?: string;
  /** IANA zone, for the office's local time. */
  tz: string;
};

export const OFFICES: Office[] = [
  {
    city: "Algiers",
    country: "Algeria",
    entity: "SARL PIXELY",
    address: ["Zone Industrielle Rouiba", "Section 7, Groupe 338", "Rouiba, Algiers", "Algeria"],
    registration: { label: "RC", value: "16/00–1054407 B25" },
    phone: { display: "+213 (0) 5565 26391", tel: "+213556526391" },
    email: "contact@pixely.dz",
    tz: "Africa/Algiers",
  },
];

/** The company that operates the website and whose terms govern its use. */
export const OPERATOR = OFFICES[0];

/** Where the contact form's messages are delivered (CONTACT_INBOX overrides). */
export const CONTACT_INBOX = "hello@pixely.com";

/** The public address for questions about personal data and these documents. */
export const PRIVACY_EMAIL = "contact@pixely.dz";

/** When the legal documents were last revised, printed on each of them. */
export const LEGAL_UPDATED = "11 October 2026";

/** The site's public address: canonical URLs, Open Graph, the sitemap.
 *  pixely.com (bare) is redirected here by the host. */
export const SITE_URL = "https://www.pixely.com";
