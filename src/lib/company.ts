/**
 * Who Pixely is, in law and on the map: the two companies, their offices and
 * how to reach them. One place, because the footer, the contact section, the
 * About page and three legal documents all print these, and an address that
 * is typed six times is wrong in one of them by the second edit.
 *
 * The UK entity is exactly as Companies House records it
 * (find-and-update.company-information.service.gov.uk/company/11595193):
 * PIXELY LTD, private limited company, incorporated 28 September 2018,
 * registered office Oakwood House, 422 Hackney Road, London E2 7SY, SIC 63110
 * (data processing, hosting and related activities) and 74100 (specialised
 * design activities). The Algerian entity is as the client gave it.
 *
 * PIXELY LTD operates the website, and its terms are governed by the law of
 * England and Wales (the client's decision, 11 October 2026).
 */

export const COMPANIES_HOUSE_URL =
  "https://find-and-update.company-information.service.gov.uk/company/11595193";

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
    city: "London",
    country: "United Kingdom",
    entity: "PIXELY LTD",
    address: ["Oakwood House", "422 Hackney Road", "London E2 7SY", "United Kingdom"],
    registration: { label: "Company no.", value: "11595193", href: COMPANIES_HOUSE_URL },
    note: "Registered office · England and Wales",
    tz: "Europe/London",
  },
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
