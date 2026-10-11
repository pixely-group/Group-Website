/**
 * The site's own index, in one place.
 *
 * The footer lists these columns; the navigation opens the same ones as
 * sub-menus (Contact included), so they live here rather than in either of
 * them. Two lists that have to agree and are written twice will not stay in
 * agreement, and this one is read from both ends of the page.
 *
 * `href` is the section the column stands for. It is also what every link
 * inside the column points at today — the deck's services are chapters of one
 * page, not pages of their own — with the handful of exceptions below, where
 * a link has a section of its very own and it would be perverse to send it
 * somewhere else.
 */

import { topicHref } from "@/lib/contact";

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
      { label: "Payments", href: "/platform/payments" },
      { label: "eWallets", href: "/platform/ewallets" },
      /* The first service with a page of its own — the template the other
         five will follow. */
      { label: "Identity", href: "/platform/identity" },
      { label: "AI services", href: "/platform/ai" },
      { label: "Compliance", href: "/platform/compliance" },
      { label: "APIs and SDKs", href: "/platform/apis" },
    ],
  },
  {
    heading: "Solutions",
    href: "#solutions",
    note: "Who it is for, from first transaction to national scale.",
    links: [
      { label: "Startups", href: "/solutions/startups" },
      { label: "Enterprises", href: "/solutions/enterprises" },
      { label: "Platforms", href: "/solutions/platforms" },
      { label: "Financial teams", href: "/solutions/financial-teams" },
      { label: "Global", href: "/solutions/global" },
    ],
  },
  {
    heading: "Platform",
    href: "#network",
    note: "The rails underneath, and how to build on them.",
    links: [
      { label: "Network", href: "/platform/network" },
      { label: "Rails", href: "/platform/rails" },
      { label: "Ledger", href: "/platform/ledger" },
      { label: "Security", href: "/platform/security" },
      { label: "Developer access", href: "/developers" },
    ],
  },
  {
    heading: "Company",
    href: "#thesis",
    note: "The position, and the people holding it.",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Legal framework", href: "/legal-framework" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    heading: "Contact",
    href: "#contact",
    note: "Write to the team, or find an office.",
    links: [
      { label: "Platform enquiry", href: topicHref("platform") },
      { label: "Developer access", href: "/developers" },
      { label: "Partnerships", href: topicHref("partnerships") },
      { label: "Press", href: topicHref("press") },
      { label: "Careers", href: topicHref("careers") },
      { label: "Offices", href: "#offices" },
    ],
  },
  {
    heading: "Legal",
    href: "/privacy",
    note: "How Pixely treats your data, and the terms of the site.",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
];

/** The section a link actually lands on. */
export const linkHref = (column: MenuColumn, link: MenuLink) =>
  link.href ?? column.href;

/** The column a navigation item opens, matched on the section they share.
 *  Every item has one now, Contact included: its column lists the topics the
 *  contact form can be opened on, and the offices. */
export const columnFor = (href: string) =>
  MENU.find((column) => column.href === href);
