/**
 * The fraud chapter's live wire: a stream of verdicts ticking past, in
 * the voice of the front page's event-stream panel — mono micro-type,
 * a pulsing dot, verdicts wearing their colours. The rows are sample
 * events (the same way the front page's treasury mock shows sample
 * activity), written to show the shape of the thing: signal, what it
 * saw, what the policy did about it.
 *
 * The list is rendered twice and slid by half its height on a linear
 * loop — a seamless vertical marquee. Reduced motion never starts the
 * animation, and the first screenful of rows simply stands.
 */

const ROWS: [string, string, "CLEARED" | "REFUSED"][] = [
  ["document.forensics", "screen recapture", "REFUSED"],
  ["nfc.auth", "signature verified", "CLEARED"],
  ["liveness", "single capture, live", "CLEARED"],
  ["velocity", "face seen under another name", "REFUSED"],
  ["ocr.crosscheck", "zones agree", "CLEARED"],
  ["device.intel", "emulator detected", "REFUSED"],
  ["watchlist", "no match", "CLEARED"],
  ["injection.defence", "virtual camera feed", "REFUSED"],
  ["mrz.checksum", "digits agree", "CLEARED"],
  ["face.match", "portrait and person agree", "CLEARED"],
];

export default function SignalStream() {
  return (
    <div className="flex h-full min-h-[320px] flex-col rounded-(--radius-panel) border border-(--line) bg-(--surface) p-6">
      <p className="type-label flex items-center justify-between border-b border-(--line) pb-4 text-(--faint)">
        Signal stream
        <span aria-hidden className="size-1.5 animate-pulse bg-accent" />
      </p>
      <div
        className="relative mt-4 flex-1 overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
        }}
      >
        <div className="signal-stream">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1}>
              {ROWS.map(([signal, saw, verdict]) => (
                <li
                  key={signal}
                  className="flex items-baseline justify-between gap-4 py-2.5 font-mono text-[0.7rem] tracking-[0.04em]"
                >
                  <span className="shrink-0 text-(--fg)">{signal}</span>
                  <span className="flex-1 truncate text-right text-(--faint)">
                    {saw}
                  </span>
                  <span
                    className={
                      verdict === "CLEARED"
                        ? "shrink-0 text-(--color-positive)"
                        : "shrink-0 text-(--color-negative)"
                    }
                  >
                    {verdict}
                  </span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
