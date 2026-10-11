/**
 * Vault: a small, rounded, premium safe on little feet on a low slab, its
 * door an inset panel on its front face with a thin gap all round, a hinge
 * line down one side, a dial ringed with ticks and a short handle beside it.
 * A thin slot runs along its top face, and a report, a thin plate with three
 * lines of print and a seal, is held upright over it, turned a little. The
 * pointer is the hand: its height over the slot lowers the report, which
 * turns square on its way down. Inside the reach it is filed: it slides down
 * into the slot until it is gone, cut at the top face so nothing of it shows
 * inside the safe. Then the dial turns on a spring, the handle turns a
 * quarter, the three bolt lights come on in turn, the door takes the bright
 * stroke and a tick lands on top beside the slot. Left alone, it files,
 * locks, holds, unlocks and lifts the report out. The slider is the reach.
 * The pattern is reader.js's: one hand, a hit test on the slot's own vertical.
 */
const {
  Cam, circ, clamp, facing, fillet, fit, hull, open, poly, prism, proj, rad, reducedMotion, rings, seg,
  spring, stepS, disposer, mk, pointer, put, reflect, register, solid,
} = HL;

// The safe: depth, width, height, where it stands, its corner. The slab under it and its margin.
const BX = 64, BY = 72, H = 45, FZ = 0, RB = 9, SB = 4, M = 16, TOP = FZ + H;
// The report: width, height, thickness; the slot's line and centre; how high it is held at rest, off its slot and turned how far; how high the hand reaches.
const DW = 30, DH = 24, T = 1.2, XS = 29, YC = 36, HOLD = 6, OFF = [1, 4], YAW = -12, MAXH = 40, DEEP = DH + 1.5;
// On the door (u to the right along the face, v up it): the door, the dial and its radius, the handle's hub, where the bolt lights start along its foot.
const DOOR = [10, 5, BY - 10, H - 5], DIAL = [28, 22.5], DR = 9.5, HUB = [49, 23.5], BOLT = 42, TURN = -120, TICK = 6, TXY = [47, YC];
// The lock, in seconds from the report being filed; how long the figure, left alone, holds it locked, and how long it holds the report up.
const TD = 0.1, TH = 0.65, TB = 0.9, STEP = 0.16, T1 = 1.55, DWELL = 1.3, PAUSE = 1.2;

const box = (u0, v0, u1, v1, r) => fillet([[u0, v0], [u1, v0], [u1, v1], [u0, v1]], [r, r, r, r]);
const map = (pts, w) => pts.map((p) => w(p[0], p[1]));
const cls = (el, c) => { if (el.getAttribute("class") !== c) el.setAttribute("class", c); };
const DOC = box(0, 0, DW, DH, 3), SEAL = box(5, 4, 14, 11, 1.4);

/** The part of a closed outline at or above v = vc, cut along it. */
function clipV(pts, vc) {
  if (vc <= 0) return pts;
  const out = [];
  pts.forEach((a, i) => {
    const b = pts[(i + 1) % pts.length], ia = a[1] >= vc, ib = b[1] >= vc;
    if (ia) out.push(a);
    if (ia !== ib) { const t = (vc - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, vc]); }
  });
  return out;
}
/** One segment of the report, cut at v = vc. */
function cut(a, b, vc, m) {
  if (a[1] < vc && b[1] < vc) return "";
  const lo = a[1] < b[1] ? a : b, hi = lo === a ? b : a;
  if (lo[1] >= vc) return seg(m(...a), m(...b));
  const t = (vc - lo[1]) / (hi[1] - lo[1]);
  return seg(m(lo[0] + (hi[0] - lo[0]) * t, vc), m(...hi));
}
/** A plate with a thickness: its back, the two ties where the sweep between back and face turns, and its face. */
function slab(shape, w, wb) {
  const f = map(shape, w), b = map(shape, wb), dx = b[0][0] - f[0][0], dy = b[0][1] - f[0][1], side = (p) => p[0] * dy - p[1] * dx;
  let i = 0, j = 0;
  f.forEach((p, k) => { if (side(p) < side(f[i])) i = k; if (side(p) > side(f[j])) j = k; });
  return { rim: poly(b), ties: seg(f[i], b[i]) + seg(f[j], b[j]), face: poly(f) };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let R = value, active = false, hand = MAXH, going = false, idle = -3, clock = 0, drawn = NaN, lock = "", shown = "", said = "";

  // Where a point (u, v, t) of the report lies with its foot z over the top face: u across it, v up it, t out of its face.
  const pose = (z) => {
    const f = clamp(z / HOLD, 0, 1), a = rad(YAW * f), s = Math.sin(a), c = Math.cos(a), cx = XS + OFF[0] * f, cy = YC + OFF[1] * f;
    return (u, v, t) => [cx + (u - DW / 2) * s + t * c, cy - (u - DW / 2) * c + t * s, TOP + z + v];
  };
  const C = Cam(45, 0.5, 1.9), held = pose(HOLD);
  fit(C, [[-M, -M, -SB], [BX + M, BY + M, -SB], [BX + M, -M, -SB], [-M, BY + M, -SB], [0, 0, TOP],
    ...[[0, DH], [DW, DH]].map(([u, v]) => held(u, v, 0))], 200, 166);
  const P = proj(C), front = facing(C), top = (x, y) => P(x, y, TOP);
  const F = (u, v, d) => P(BX + d, BY - u, FZ + v);

  const g = mk("g", {}, svg);
  const [sr, si] = rings(-M, -M, BX + M, BY + M, 12, 2.2);
  reflect(svg, g, P, front, sr, -SB, 12);
  put(solid(g), prism(P, front, sr, si, -SB, 0));
  put(solid(g), prism(P, front, ...rings(0, 0, BX, BY, RB, 2.2), FZ, TOP));

  // The door: the gap round it, the panel, the hinge line down its left side, the dial's ticks and the bolt lights.
  const face = (pts, d) => poly(pts.map((p) => F(p[0], p[1], d)));
  mk("path", { d: face(box(DOOR[0] - 1.8, DOOR[1] - 1.8, DOOR[2] + 1.8, DOOR[3] + 1.8, 6.5), 0), class: "nf" }, g);
  const door = mk("path", { d: face(box(...DOOR, 5), 0), class: "nf" }, g);
  let ticks = seg(F(DOOR[0] + 3, DOOR[1] + 5, 0), F(DOOR[0] + 3, DOOR[3] - 5, 0));
  for (let k = 0; k < 8; k++) { const a = rad(90 + k * 45), q = (r) => F(DIAL[0] + r * Math.cos(a), DIAL[1] + r * Math.sin(a), 0); if (k && k !== 2) ticks += seg(q(DR + 2), q(DR + 3.8)); }
  mk("path", { d: ticks, class: "nf lo" }, g);
  mk("path", { d: seg(F(DIAL[0], DIAL[1] + DR + 2, 0), F(DIAL[0], DIAL[1] + DR + 4.2, 0)), class: "nf" }, g);
  const bolts = [BOLT, BOLT + 6.5, BOLT + 13].map((u) => mk("path", { d: face(circ(1.4, 14).map((q) => [u + q.u, DOOR[1] + 4.5 + q.v]), 0), class: "dot off" }, g));

  // The dial and the handle: each a short solid standing out of the door, redrawn as it turns.
  const dial = solid(g), index = mk("path", { class: "nf" }, g), handle = solid(g);
  const knob = (el, pts, inner, d) => { el.sil.setAttribute("d", poly(hull(pts.map((p) => F(...p, 0)).concat(pts.map((p) => F(...p, d)))))); el.cr.setAttribute("d", poly(inner.map((p) => F(...p, d)))); };
  const ring = (r, o) => circ(r, 40).map((q) => [o[0] + q.u, o[1] + q.v]);
  knob(dial, ring(DR, DIAL), ring(DR - 1.6, DIAL), 3.5);

  // The slot along the top face, then the report's drops, the report, and the tick beside the slot.
  mk("path", { d: poly(map(box(XS - 1.8, YC - DW / 2 - 3.5, XS + 1.8, YC + DW / 2 + 3.5, 1.8), top)), class: "nf" }, g);
  const drops = mk("path", { class: "nf dash" }, g), back = mk("path", { class: "lo" }, g), sheet = mk("path", { class: "sil hi" }, g);
  const print = mk("path", { class: "nf lo" }, g), seal = mk("path", { class: "nf" }, g);
  const disc = mk("path", { class: "hi" }, g), check = mk("path", { class: "nf hi" }, g);
  const h = spring(HOLD, { k: 90, c: 19 }), dl = spring(0), hd = spring(90), tk = spring(0, { k: 260, c: 22 });

  /** Redraws the report at its height, cut at the top face: whatever has gone into the slot is not drawn. Unmoved, it keeps its paths. */
  function drawDoc() {
    const z = h.x;
    if (z === drawn) return;
    drawn = z;
    const vc = -z, at = pose(Math.max(0, z)), w = (t) => (u, v) => P(...at(u, v + Math.min(0, z), t));
    if (vc >= DH - 0.3) { for (const el of [back, sheet, print, seal, drops]) el.setAttribute("d", ""); return; }
    const sl = slab(clipV(DOC, vc), w(T / 2), w(-T / 2)), m = w(T / 2);
    back.setAttribute("d", sl.rim + sl.ties);
    sheet.setAttribute("d", sl.face);
    print.setAttribute("d", [[DH - 6, DW - 6], [DH - 10, DW - 9], [DH - 14, DW - 14]].map(([v, u]) => cut([6, v], [u, v], vc, m)).join(""));
    const sp = clipV(SEAL, vc);
    seal.setAttribute("d", (sp.length > 2 ? poly(map(sp, m)) : "") + cut([8, 4], [8, 11], vc, m) + cut([11, 4], [11, 11], vc, m));
    // where the report goes in, and the two drops that tie it there
    drops.setAttribute("d", z < 1 ? "" : seg(P(...at(2, -z, 0)), P(...at(DW - 2, -z, 0))) + [2, DW - 2].map((u) => seg(P(...at(u, -z, 0)), P(...at(u, 0, 0)))).join(""));
  }

  /** The dial at its turn with its index, the handle at its turn, and the tick on the top face. Unchanged, they keep their paths. */
  function drawLock() {
    const key = [dl.x, hd.x, tk.x].join();
    if (key === lock) return;
    lock = key;
    const a = rad(90 + dl.x), ix = (r) => F(DIAL[0] + r * Math.cos(a), DIAL[1] + r * Math.sin(a), 3.5);
    index.setAttribute("d", seg(ix(2), ix(DR - 2.6)));
    const b = rad(hd.x), c = Math.cos(b), s = Math.sin(b), rot = (pts) => pts.map(([u, v]) => [HUB[0] + u * c - v * s, HUB[1] + u * s + v * c]);
    knob(handle, rot(box(-6.5, -3, 6.5, 3, 3)), rot(box(-5.1, -1.6, 5.1, 1.6, 1.6)), 4);
    const r = tk.x > 0.4 ? tk.x : 0, wt = (u, v) => top(TXY[0] + u, TXY[1] + v);
    disc.setAttribute("d", r ? poly(circ(r, 40).map((q) => wt(q.u, q.v))) : "");
    // the tick lies on the top face, turned an eighth so that it faces the page squarely
    check.setAttribute("d", r ? open([[-0.46, 0.04], [-0.13, 0.37], [0.46, -0.3]].map((p) => wt((p[0] + p[1]) * r * Math.SQRT1_2, (p[1] - p[0]) * r * Math.SQRT1_2))) : "");
  }

  /** The one highlight: on the report's edge while it is held and filed, on the dial's index as it turns, then on the door and its tick. */
  function drawState(want) {
    const turning = clock > 0 && clock < T1, done = clock >= T1, key = [turning, done, ...[0, 1, 2].map((i) => clock >= TB + i * STEP)].join();
    if (key !== shown) {
      shown = key;
      cls(index, turning ? "nf hi" : "nf");
      cls(door, done ? "nf hi" : "nf");
      bolts.forEach((el, i) => cls(el, clock >= TB + i * STEP ? "dot" : "dot off"));
    }
    const text = !active ? "rest" : done ? "locked" : want ? "filing" : "held";
    if (text !== said) read.textContent = said = text;
  }

  const B = register(stage, (dt) => {
    const still = reducedMotion();
    // With no pointer on it the figure is its own hand: it holds the report up, files it and locks, holds, unlocks and lifts it out.
    if (!active) {
      if (still) { going = false; idle = 0; }
      else if (going) { if (clock > T1 + DWELL) { going = false; idle = 0; } }
      else if ((idle += dt) > PAUSE) going = true;
      hand = going ? 0 : MAXH;
    }
    // Inside the reach the report is filed; out of it, the safe unlocks before the report comes back up.
    const want = hand <= R, open1 = dl.x > -6 && hd.x > 84;
    h.t = want || !open1 ? -DEEP : HOLD * clamp((hand - R) / (MAXH - R), 0, 1);
    let m = stepS(h, dt);
    clock = want && h.x < -DEEP + 0.4 ? (still ? T1 + 1 : clock + dt) : 0;
    dl.t = clock > TD ? TURN : 0;
    hd.t = clock > TH ? 0 : 90;
    tk.t = clock >= T1 ? TICK : 0;
    for (const sp of [dl, hd, tk]) if (stepS(sp, dt)) m = true;
    drawDoc();
    drawLock();
    drawState(want);
    return m || (clock > 0 && clock < T1) || !(active || still);
  });
  bag.add(B.unregister);

  // The hand's height is read off the slot's own vertical, through its middle.
  const y0 = top(XS, YC)[1], up = P(0, 0, 1)[1] - P(0, 0, 0)[1];
  bag.add(pointer(stage, {
    move: (p) => { hand = clamp((p[1] - y0) / up, 0, MAXH); active = true; B.wake(); },
    leave: () => { active = false; going = false; idle = 0; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v; B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "vault",
  means: "A report is filed into the slot of a small safe: the dial turns, the handle locks, the bolts light, and a tick lands on top.",
  rules: [1, 3, 4, 5],
  range: [8, 14, 20],
  tour: [[200, 60], [200, 100], [200, 125], null],
  mount,
});
