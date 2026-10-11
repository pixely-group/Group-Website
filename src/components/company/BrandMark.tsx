/**
 * The wordmark, as a specimen. It is set from the shipped type — the
 * navigation's own setting, `type-headline` in capitals with the brand's full
 * stop, the square on the baseline in the accent — rather than as an image,
 * so it cannot drift from the mark at the top of the page. Beside it, the
 * short form the bar contracts to as it gathers: P and the square.
 */
function Mark({ short = false }: { short?: boolean }) {
  return (
    <span
      className="type-headline inline-flex items-baseline"
      style={{ lineHeight: 1, letterSpacing: "0.06em" }}
    >
      {short ? "P" : "Pixely"}
      <span
        aria-hidden
        className="inline-block bg-accent"
        style={{ width: "0.17em", height: "0.17em", marginLeft: "0.12em" }}
      />
    </span>
  );
}

export default function BrandMark() {
  return (
    <div className="grid gap-px border-y border-(--line) bg-(--line) sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <figure data-fade className="flex min-h-[15rem] flex-col justify-between bg-theme p-7 sm:min-h-[19rem] lg:p-10">
        <figcaption className="type-label text-(--faint)">The wordmark</figcaption>
        <p
          role="img"
          aria-label="Pixely wordmark"
          className="text-[clamp(2.8rem,9vw,7.5rem)]"
        >
          <Mark />
        </p>
      </figure>
      <figure data-fade className="flex min-h-[12rem] flex-col justify-between bg-theme p-7 sm:min-h-[19rem] lg:p-10">
        <figcaption className="type-label text-(--faint)">The short form</figcaption>
        <p
          role="img"
          aria-label="Pixely short form: P and the full stop"
          className="text-[clamp(2.8rem,9vw,7.5rem)]"
        >
          <Mark short />
        </p>
      </figure>
    </div>
  );
}
