/**
 * Payments: a countertop payment terminal on a low slab, and a bank card held
 * over it. The terminal is longer than it is wide: a paper roll rises at its
 * back, a screen sits in its far half and a keypad of twelve keys in its near
 * half. The pointer is the hand: its height over the terminal is the card's,
 * and the card turns square on its way down. Inside the reach of the field
 * the card is taken and laid flat on the screen, rings run out from its chip
 * while the payment goes through and the terminal's lights come on in turn.
 * When it is done a tick lands on the screen beside the card, and the screen
 * takes the bright stroke. Left alone, the figure taps the card, holds it,
 * lifts it and pauses. The slider is the reach of the field, in world units.
 *
 * The pattern is reader.js's: one hand, a spring for the card's height, a hit
 * test on the terminal's own vertical (which never moves), a clock that runs
 * only while the card is down, and a paint order that never changes.
 */
const {
  Cam, circ, clamp, extremes, facing, fillet, fit, hull, lerp, open, poly, prism, proj, rad, reducedMotion, ringAt, rings, seg,
  spring, stepS, disposer, flatDot, mk, place, pointer, put, reflect, register, solid,
} = HL;

// The terminal: its footprint, its height, the slab under it. The card, and where it lies on the screen: its centre, how the hand holds it.
const TL = 94, TW = 72, TZ = 8, SB = 4, M = 5, CW = 80, CH = 50, T = 1.2, CX = 43, CY = 8, HOLD = 25, OFF = [6, -7], YAW = -10;
// The paper roll at the back: its axis, radius and ends. The screen, and the tick's place on it beside the card.
const HX = 10, HR = 6, HY = [8, 64], SCR = [21, 8, 51, 64], TICK = 6, TXY = [36, 56.5];
// The payment, in seconds from the card coming down; how long the figure, left alone, keeps it down once paid, and how long it holds it up.
const T0 = 0.2, T1 = 1.8, RUN = 1, EVERY = 0.4, DWELL = 1.5, PAUSE = 1.3;
const CHIP = [15.5, 20.5];

const box = (u0, v0, u1, v1, r) => fillet([[u0, v0], [u1, v0], [u1, v1], [u0, v1]], [r, r, r, r]);
const map = (pts, w) => pts.map((p) => w(p[0], p[1]));
const cls = (el, c) => { if (el.getAttribute("class") !== c) el.setAttribute("class", c); };

/** What a bank card carries, each as a path through m, which maps the card's own (u, v): the chip, the number, and one short line of print. */
const CHIPART = (m) => poly(map(box(8, 15, 23, 26, 1.8), m)) + seg(m(13, 15), m(13, 26)) + seg(m(18, 15), m(18, 26));
const NUMBER = (m) => { let d = ""; for (let g = 0; g < 4; g++) for (let k = 0; k < 4; k++) d += seg(m(8 + g * 17 + k * 3.6, 35), m(10.2 + g * 17 + k * 3.6, 35)); return d; };
const PRINT = (m) => seg(m(8, 42.5), m(30, 42.5));

/** Where a point (u, v) of the card lies when the hand holds it at f (0 laid on the screen, 1 held up): turned a quarter to lie across the terminal, then by the hand's yaw. */
function pose(f) {
  const a = rad(YAW * f), c = Math.cos(a), s = Math.sin(a), ox = CX + OFF[0] * f, oy = CY + OFF[1] * f;
  const at = (u, v) => { const x = v - CH / 2, y = CW / 2 - u; return [ox + x * c - y * s, oy + x * s + y * c]; };
  const turn = (ring) => ring.map((q) => { const p = at(q.u, q.v), nx = q.nv, ny = -q.nu; return { u: p[0], v: p[1], nu: nx * c - ny * s, nv: nx * s + ny * c }; });
  return { at, turn };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let R = value, active = false, hand = HOLD, going = false, idle = -1.2, clock = 0, drawn = NaN, field = "", shown = "", said = "";

  // The camera is fitted to the slab, and to the card where the hand holds it.
  const C = Cam(45, 0.5, 1.9), hi = pose(1).at;
  fit(C, [[-M, -M, -SB], [TL + M, TW + M, -SB], [TL + M, -M, -SB], [-M, TW + M, -SB],
    ...[[0, 0], [CW, 0], [0, CH], [CW, CH]].map(([u, v]) => [...hi(u, v), TZ + HOLD + T])], 200, 166);
  const P = proj(C), front = facing(C), top = (x, y) => P(x, y, TZ);

  const g = mk("g", {}, svg);
  const [sr, si] = rings(-M, -M, TL + M, TW + M, 12, 2.2);
  reflect(svg, g, P, front, sr, -SB, 12);
  put(solid(g), prism(P, front, sr, si, -SB, 0));
  put(solid(g), prism(P, front, ...rings(0, 0, TL, TW, 12, 2), 0, TZ));

  // The paper roll: a half round lying across the back, its near end as the crease, and the tear bar on its shoulder.
  const arc = (y) => { const out = []; for (let k = 0; k <= 12; k++) { const t = (Math.PI * k) / 12; out.push(P(HX + HR * Math.cos(t), y, TZ + HR * Math.sin(t))); } return out; };
  const roll = solid(g);
  roll.sil.setAttribute("d", poly(hull(arc(HY[0]).concat(arc(HY[1])))));
  roll.cr.setAttribute("d", open(arc(HY[1])));
  const bar = (y) => P(HX + HR * 0.5, y, TZ + HR * 0.87);
  mk("path", { d: seg(bar(HY[0] + 3), bar(HY[1] - 3)), class: "nf" }, g);

  // The screen in the far half, the twelve keys in the near half, three to a row across the terminal, and four lights between them.
  const screen = mk("path", { d: poly(map(box(...SCR, 4), top)), class: "nf" }, g);
  let keys = "";
  for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) keys += poly(map(box(58 + r * 8.4, 12 + k * 17.5, 64 + r * 8.4, 25 + k * 17.5, 2.2), top));
  mk("path", { d: keys, class: "nf" }, g);
  const lights = [0, 1, 2, 3].map((i) => { const el = flatDot(g, C, 1.15, i ? "dot off" : "dot m"); place(el, top(54.5, 51 + i * 5.5)); return el; });

  // The paint order never changes: the card's drops, the card, the field over it, then the tick on the screen.
  const drops = mk("path", { class: "nf dash" }, g), card = solid(g), [cr, ci] = rings(0, 0, CW, CH, 5, 1.6);
  const print = mk("path", { class: "nf lo" }, card.g), number = mk("path", { class: "nf" }, card.g), chip = mk("path", { class: "nf hi" }, card.g);
  const reach = mk("path", { class: "nf dash" }, g), waves = [0, 1, 2].map(() => mk("path", { class: "nf hi" }, g));
  const disc = mk("path", { class: "hi" }, g), check = mk("path", { class: "nf hi" }, g);
  const h = spring(HOLD, { k: 90, c: 19 }), rr = spring(0), tk = spring(0, { k: 260, c: 22 });

  /** Redraws the card at its height: off its seat and turned by as much as it is up. A card that has not moved keeps its paths. */
  function drawCard() {
    const z = Math.max(0, h.x);
    if (z === drawn) return;
    drawn = z;
    const { at, turn } = pose(z / HOLD), ring = turn(cr), m = (u, v) => P(...at(u, v), TZ + z + T);
    put(card, prism(P, front, ring, turn(ci), TZ + z, TZ + z + T));
    print.setAttribute("d", PRINT(m));
    number.setAttribute("d", NUMBER(m));
    chip.setAttribute("d", CHIPART(m));
    // its footprint on the terminal, and the three drops that tie it there
    drops.setAttribute("d", z < 1 ? "" : poly(ringAt(P, ring, TZ)) + extremes(P, ring).map((q) => seg(P(q.u, q.v, TZ), P(q.u, q.v, TZ + z))).join(""));
  }

  /** The field round the chip of the card as it lies, the rings on their way out, and the tick on the screen. Unchanged, it keeps its paths. */
  function drawField() {
    const key = [rr.x, tk.x, clock < T1 ? clock : -1].join();
    if (key === field) return;
    field = key;
    const c0 = pose(0).at(...CHIP), m = (u, v) => P(c0[0] + u, c0[1] + v, TZ + T), round = (r) => poly(circ(r, 48).map((q) => m(q.u, q.v)));
    reach.setAttribute("d", rr.x > 0.5 ? round(rr.x) : "");
    waves.forEach((el, i) => {
      const p = (clock - T0 - i * EVERY) / RUN, on = clock < T1 && p > 0 && p < 1;
      el.setAttribute("d", on ? round(lerp(5, R, p)) : "");
      cls(el, !on || p < 0.55 ? "nf hi" : p < 0.82 ? "nf" : "nf lo");
    });
    const r = tk.x > 0.4 ? tk.x : 0, w = (u, v) => top(TXY[0] + u, TXY[1] + v);
    disc.setAttribute("d", r ? poly(circ(r, 40).map((q) => w(q.u, q.v))) : "");
    // the tick lies on the screen, turned an eighth so that it faces the page squarely
    check.setAttribute("d", r ? open([[-0.46, 0.04], [-0.13, 0.37], [0.46, -0.3]].map((p) => w((p[0] + p[1]) * r * Math.SQRT1_2, (p[1] - p[0]) * r * Math.SQRT1_2))) : "");
  }

  /** The one highlight: on the chip while the card is in the hand and while it pays, then on the screen and its tick. */
  function drawState() {
    const down = clock > 0, done = clock >= T1, key = (down ? "d" : "u") + (clock > T1 / 2 ? "h" : "") + (done ? "!" : "");
    if (key !== shown) {
      shown = key;
      cls(chip, done ? "nf" : "nf hi");
      cls(screen, done ? "nf hi" : "nf");
      cls(lights[1], down ? "dot" : "dot off");
      cls(lights[2], clock > T1 / 2 ? "dot" : "dot off");
      cls(lights[3], done ? "dot" : "dot off");
    }
    const text = !active ? "rest" : done ? "paid" : down ? `pay ${Math.round((clock / T1) * 100)}%` : "held";
    if (text !== said) read.textContent = said = text;
  }

  const B = register(stage, (dt) => {
    const still = reducedMotion();
    // With no pointer on it the figure is its own hand: it holds the card up, taps it down until paid and a while after, and lifts it.
    if (!active) {
      if (still) { going = false; idle = 0; }
      else if (going) { if (clock > T1 + DWELL) { going = false; idle = 0; } }
      else if ((idle += dt) > PAUSE) going = true;
      hand = going ? 0 : HOLD;
    }
    // Inside the reach the field takes the card, and it is laid flat.
    h.t = hand <= R ? 0 : hand;
    let m = stepS(h, dt);
    clock = h.x < 0.3 ? (still ? T1 + 1 : clock + dt) : 0;
    rr.t = clock > 0 && clock < T1 ? R : 0;
    tk.t = clock >= T1 ? TICK : 0;
    if (stepS(rr, dt)) m = true;
    if (stepS(tk, dt)) m = true;
    drawCard();
    drawField();
    drawState();
    return m || (clock > 0 && clock < T1) || !(active || still);
  });
  bag.add(B.unregister);

  // The hand's height is read off the terminal's own vertical, through the middle of its screen.
  const y0 = top((SCR[0] + SCR[2]) / 2, (SCR[1] + SCR[3]) / 2)[1], up = P(0, 0, 1)[1] - P(0, 0, 0)[1];
  bag.add(pointer(stage, {
    move: (p) => { hand = clamp((p[1] - y0) / up, 0, HOLD); active = true; B.wake(); },
    leave: () => { active = false; going = false; idle = 0; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v; B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "payments",
  means: "A bank card is tapped on a payment terminal: rings run out from its chip as the payment goes through, and a tick lands on the screen.",
  rules: [1, 3, 4, 5],
  range: [12, 18, 26],
  tour: [[205, 95], [205, 135], [195, 168], null],
  mount,
});
