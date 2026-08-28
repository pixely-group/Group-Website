/**
 * The wire between the page's Get started buttons and the sign-in panel.
 *
 * The panel lives in the navigation, the buttons live in chapters, and a
 * context provider wrapping the whole page for two callers would be a lot
 * of ceremony for one signal. This is the signal: any button calls
 * `openAuth`, the navigation listens, the panel opens on the promised pane.
 *
 * A module-level set works because every party is a client component
 * importing this same module instance; nothing here runs on the server.
 */

export type AuthMode = "in" | "up";

type Listener = (mode: AuthMode) => void;

const listeners = new Set<Listener>();

export function openAuth(mode: AuthMode) {
  listeners.forEach((listen) => listen(mode));
}

export function onOpenAuth(listen: Listener): () => void {
  listeners.add(listen);
  return () => {
    listeners.delete(listen);
  };
}
