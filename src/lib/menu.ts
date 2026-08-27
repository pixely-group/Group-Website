/**
 * The site's own index, in one place.
 *
 * The footer has always listed these five columns; the navigation now opens
 * the same five as sub-menus, so they live here rather than in either of
 * them. Two lists that have to agree and are written twice will not stay in
 * agreement, and this one is read from both ends of the page.
 *
 * `href` is the section the column stands for. It is also what every link
 * inside the column points at today — the deck's services are chapters of one
 * page, not pages of their own — with the handful of exceptions below, where
 * a link has a section of its very own and it would be perverse to send it
 * somewhere else.
 */

export type MenuLink = {
  label: string;
  /** Defaults to the column's own href. */
  href?: string;
};

export type MenuColumn = {
  heading: string;
  href: string;
  /** One line, for the sub-menu's header. The footer does not show it: it has
   *  five columns side by side and the headings carry each other. A panel
   *  opened on its own has nothing beside it to be read against. */
  note: string;
  links: MenuLink[];
};

export const MENU: MenuColumn[] = [
  {
    heading: "Product",
    href: "#product",
    note: "The six services the platform is built from.",
    links: [
      { label: "Payments" },
      { label: "eWallets" },
      /* Identity has the network chapter to itself, and the navigation's own
         Identity item already points there. */
      { label: "Identity", href: "#network" },
      { label: "AI services" },
      { label: "Compliance", href: "#security" },
      { label: "APIs and SDKs" },
    ],
  },
  {
    heading: "Solutions",
    href: "#solutions",
    note: "Who it is for, from first transaction to national scale.",
    links: [
      { label: "Startups" },
      { label: "Enterprises" },
      { label: "Platforms" },
      { label: "Financial teams" },
      { label: "Global", href: "#global" },
    ],
  },
  {
    heading: "Platform",
    href: "#network",
    note: "The rails underneath, and how to build on them.",
    links: [
      { label: "Network" },
      { label: "Rails" },
      { label: "Ledger", href: "#product" },
      { label: "API reference" },
      { label: "Status" },
      { label: "Changelog" },
    ],
  },
  {
    heading: "Company",
    href: "#thesis",
    note: "The position, and the people holding it.",
    links: [
      { label: "About" },
      { label: "Careers" },
      { label: "Press" },
      { label: "Customers", href: "#metrics" },
      { label: "Contact", href: "#resources" },
    ],
  },
  {
    heading: "Resources",
    href: "#security",
    note: "How it is secured, documented and governed.",
    links: [
      { label: "Documentation" },
      { label: "Guides" },
      { label: "Security" },
      { label: "Compliance" },
      { label: "Legal", href: "#resources" },
    ],
  },
];

/** The section a link actually lands on. */
export const linkHref = (column: MenuColumn, link: MenuLink) =>
  link.href ?? column.href;

/** The column a navigation item opens, matched on the section they share.
 *  Contact has none: it points at the foot of the page, which is where the
 *  whole index already is. */
export const columnFor = (href: string) =>
  MENU.find((column) => column.href === href);
