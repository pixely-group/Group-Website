/**
 * What the contact form can be about, shared by the form, the route that
 * delivers it, and the menu links that open it on a topic.
 *
 * A link opens the form on a topic by pointing at that topic's anchor,
 * `#contact-<id>`. The contact section carries one invisible anchor per
 * topic, so the chrome's own in-page scroll lands on it as on any section,
 * and the form hears which one through `onContactTopic`. From another page
 * the same href arrives as a hash on load, which the form reads too.
 */

export const TOPICS = [
  { id: "platform", label: "Platform enquiry", hint: "Payments, wallets, identity, AI or compliance for your business." },
  { id: "partnerships", label: "Partnership", hint: "Banks, institutions and technology partners." },
  { id: "press", label: "Press", hint: "Interviews, briefings and media enquiries." },
  { id: "careers", label: "Careers", hint: "Working at Pixely in London or Algiers." },
] as const;

export type TopicId = (typeof TOPICS)[number]["id"];

export const topicHref = (id: TopicId) => `#contact-${id}`;

const EVENT = "pixely:contact-topic";

/** Called by the chrome when its scroll lands on a topic's anchor. */
export function announceTopic(el: Element) {
  const id = (el as HTMLElement).dataset?.contactTopic;
  if (id) window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));
}

/** The form's side of it: returns the unsubscribe. */
export function onContactTopic(fn: (id: TopicId) => void) {
  const handler = (e: Event) => fn((e as CustomEvent<TopicId>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
