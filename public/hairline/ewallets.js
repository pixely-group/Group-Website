/**
 * Wallet: a phone lying on its back on a slab, in a case whose far end is a
 * card sleeve holding a fan of four bank cards, each standing a step higher
 * than the one in front and leaning back a little more. The pointer is the
 * hand: the card under it rises up out of the sleeve, the cards behind it lean
 * further back and the ones in front come upright, staggered outwards from
 * it, and the picked card takes the bright stroke. Once it is fully up a tick
 * lands on its chip, and the phone's page dot for it comes on. Left alone, the
 * figure is its own hand and picks the cards in turn. The slider is how high
 * the picked card rises, in world units.
 *
 * The pattern: one of many, told by one hand. Tweens with a stagger by
 * distance, a hit test on static bands along the cards' RESTING top edges, a
 * tick sized by a spring, and a paint order that never changes: slab, sleeve's
 * far half, cards back to front, sleeve's near wall, phone.
 */
const {
  Cam, circ, clamp, facing, fillet, fit, hull, open, poly, prism, proj, rad, reducedMotion, ringAt, rings, rrect, run, seg,
  spring, stepS, tdone, tset, tval, tween, disposer, flatDot, mk, place, pointer, put, reflect, register, solid,
} = HL;

// The cards: width, height, thickness, where they start along x; each one's seat, its y in the sleeve, and its resting lean.
const N = 4, CW = 46, CH = 29, TK = 1.2, CX = 3, SEAT = [9, 6, 3, 1], YB = [8, 13.5, 19, 24.5], REST = [-20, -15, -10, -5], BACK = -10, FWD = 4;
// The sleeve along the phone's far end, the phone, and the slab under both.
const SY0 = 2, SY1 = 30, WH = 15, WT = 1.6, PY1 = 122, PW = 52, PT = 4, X0 = -5, X1 = 57, Y0 = -4, Y1 = 128, BASE = 5;
// The chip's centre on a card, the tick's radius, and the hand's timing: how long it waits between cards and holds one once ticked.
const CHIP = [11, 19.25], TICK = 5.8, PAUSE = 0.8, DWELL = 1.5, ORDER = [1, 3, 0, 2], STAG = 45;

const box = (u0, v0, u1, v1, r) => fillet([[u0, v0], [u1, v0], [u1, v1], [u0, v1]], [r, r, r, r]);
const map = (pts, w) => pts.map((p) => w(p[0], p[1]));
const cls = (el, c) => { if (el.getAttribute("class") !== c) el.setAttribute("class", c); };
const LR = (pts) => (pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse());
const SHAPE = box(0, 0, CW, CH, 3);
// What a bank card carries, through w, which maps the card's own (u, v): u along it, v up it.
const CHIPART = (w) => poly(map(box(6.5, 16, 15.5, 22.5, 1.2), w)) + seg(w(9.5, 16), w(9.5, 22.5)) + seg(w(12.5, 16), w(12.5, 22.5));
const STRIP = (w) => { let d = ""; for (let k = 0; k < 9; k++) d += seg(w(5 + k * 4 + (k >> 1) * 0.6, 9), w(6.8 + k * 4 + (k >> 1) * 0.6, 9)); return d; };
const PRINT = (w) => seg(w(5, 4.5), w(20, 4.5)) + seg(w(32, 4.5), w(41, 4.5));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let LIFT = value, act = -1, tc = -1, active = false, idle = -3.2, hold = 0, k = 0, field = "", lamp = -2;

  // The camera is fitted to the slab, and to the back card risen as high as the slider lets it.
  const C = Cam(45, 0.5, 1.9);
  fit(C, [[X0, Y0, -BASE], [X1, Y1, -BASE], [X1, Y0, -BASE], [X0, Y1, -BASE], [CX, YB[0], SEAT[0] + 24 + CH], [CX + CW, YB[0], SEAT[0] + 24 + CH]], 200, 156);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [sr, si] = rings(X0, Y0, X1, Y1, 9, 2.2);
  reflect(svg, g, P, front, sr, -BASE, 12);
  put(solid(g), prism(P, front, sr, si, -BASE, 0));

  // The sleeve's far half: its body, its mouth, and the floor seam along its far walls.
  const outer = rrect(0, SY0, PW, SY1, 5, 6), inner = rrect(WT, SY0 + WT, PW - WT, SY1 - WT, 5 - WT, 6);
  mk("path", { d: poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, WH)))), class: "sil" }, g);
  const mouth = mk("path", { d: poly(ringAt(P, inner, WH)), class: "nf hi" }, g);
  mk("path", { d: open(ringAt(P, run(inner, (q) => !front(q)), 2)), class: "nf lo" }, g);

  // The cards, back to front: a drop to the seat, the card's back and face, its print, number, chip, and the tick.
  const cards = [];
  for (let i = 0; i < N; i++) {
    const grp = mk("g", {}, g);
    const drops = mk("path", { class: "nf dash" }, grp), back = mk("path", { class: "lo" }, grp), face = mk("path", { class: "sil" }, grp);
    const print = mk("path", { class: "nf lo" }, grp), strip = mk("path", { class: "nf" }, grp), chip = mk("path", { class: "nf" }, grp);
    const disc = mk("path", { class: "hi" }, grp), check = mk("path", { class: "nf hi" }, grp);
    cards.push({ drops, back, face, print, strip, chip, disc, check, a: tween(REST[i]), z: tween(0), drawn: "" });
  }

  // The sleeve's near wall: one opaque piece from the mouth's front edge down to the slab, and a thumb cut in it.
  const iF = LR(ringAt(P, run(inner, front), WH)), oT = LR(ringAt(P, run(outer, front), WH)), oB = LR(ringAt(P, run(outer, front), 0));
  mk("path", { d: poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), class: "fo" }, g);
  mk("path", { d: open(oT), class: "nf lo" }, g);
  const lip = mk("path", { d: open(iF), class: "nf hi" }, g);
  mk("path", { d: open([oT[0], ...oB, oT[oT.length - 1]]), class: "nf sil" }, g);
  const cut = []; for (let s = 0; s <= 12; s++) { const t = Math.PI * s / 12; cut.push(P(PW / 2 - 7 * Math.cos(t), SY1, WH - 6 * Math.sin(t))); }
  mk("path", { d: open(cut), class: "nf lo" }, g);

  // The phone: its body, the screen inset, the camera, the page dots and the bar at its foot.
  const top = (x, y) => P(x, y, PT);
  put(solid(g), prism(P, front, rrect(0, SY1, PW, PY1, 9, 12), rrect(1.4, SY1 + 1.4, PW - 1.4, PY1 - 1.4, 7.6, 12), 0, PT));
  mk("path", { d: poly(map(box(3.2, SY1 + 3.2, PW - 3.2, PY1 - 3.2, 6.5), top)) + poly(circ(1.5, 14).map((q) => top(PW / 2 + q.u, SY1 + 8 + q.v))), class: "nf" }, g);
  mk("path", { d: seg(top(PW / 2 - 7, PY1 - 7.5), top(PW / 2 + 7, PY1 - 7.5)), class: "nf" }, g);
  const dots = [0, 1, 2, 3].map((i) => { const el = flatDot(g, C, 0.95, "dot off"); place(el, top(PW / 2 - 5.25 + i * 3.5, PY1 - 13)); return el; });

  /** Card i's plane at lean th and lift z: u along it, v up it, t behind its face. */
  const plane = (i, th, z, t) => { const s = Math.sin(rad(th)), c = Math.cos(rad(th)); return (u, v) => P(CX + u, YB[i] + v * s - t * c, SEAT[i] + z + v * c + t * s); };

  function drawCard(i, now) {
    const cd = cards[i], th = tval(cd.a, now), z = tval(cd.z, now), key = th + "," + z;
    if (key === cd.drawn) return;
    cd.drawn = key;
    const w = plane(i, th, z, 0);
    cd.back.setAttribute("d", poly(map(SHAPE, plane(i, th, z, TK))));
    cd.face.setAttribute("d", poly(map(SHAPE, w)));
    cd.print.setAttribute("d", PRINT(w));
    cd.strip.setAttribute("d", STRIP(w));
    cd.chip.setAttribute("d", CHIPART(w));
    cd.drops.setAttribute("d", z < 1 ? "" : [2, CW - 2].map((u) => seg(w(u, 0), P(CX + u, YB[i], SEAT[i]))).join(""));
  }

  /** The tick on card tc's chip, at the spring's radius. */
  function drawTick(now) {
    const key = [tc, tk.x, tc < 0 ? 0 : tval(cards[tc].a, now)].join();
    if (key === field) return;
    field = key;
    cards.forEach((cd) => { cd.disc.setAttribute("d", ""); cd.check.setAttribute("d", ""); });
    const r = tk.x > 0.4 ? tk.x : 0;
    if (tc < 0 || !r) return;
    const cd = cards[tc], w = plane(tc, tval(cd.a, now), tval(cd.z, now), 0);
    cd.disc.setAttribute("d", poly(circ(r, 40).map((q) => w(CHIP[0] + q.u, CHIP[1] + q.v))));
    cd.check.setAttribute("d", open([[-0.46, -0.04], [-0.13, -0.37], [0.46, 0.3]].map((p) => w(CHIP[0] + p[0] * r, CHIP[1] + p[1] * r))));
  }

  const tk = spring(0, { k: 260, c: 22 });
  const up = (now) => act >= 0 && tdone(cards[act].a, now) && tdone(cards[act].z, now);

  /** Picks card a (-1 puts them all back). The stagger spreads out from the card picked, or the one let go. */
  // Declared ahead: register() runs the first frame at once, and under reduced motion that frame already picks a card.
  let B = null;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    cards.forEach((cd, i) => {
      const delay = Math.abs(i - from) * STAG;
      tset(cd.a, a < 0 ? REST[i] : i < a ? REST[i] + BACK : i > a ? FWD : 0, now, delay);
      tset(cd.z, a === i ? LIFT : 0, now, delay);
      cd.face.classList.toggle("hi", i === a);
    });
    cls(mouth, a < 0 ? "nf hi" : "nf");
    cls(lip, a < 0 ? "nf hi" : "nf");
    B?.wake();
  }

  B = register(stage, (dt, now) => {
    const still = reducedMotion();
    // With no pointer on it the figure is its own hand: it waits, picks the next card, holds it once ticked, and puts it back.
    if (!active) {
      if (still) setActive(ORDER[0]);
      else if (act < 0) { if ((idle += dt) > PAUSE) { setActive(ORDER[k]); k = (k + 1) % N; hold = 0; } }
      else if (up(now) && tk.x > TICK * 0.9 && (hold += dt) > DWELL) { setActive(-1); idle = 0; }
    }
    // The tick waits until the picked card is fully up, and moves to a new card only once it has gone from the old one.
    if (tc !== act && tk.x < 0.4) tc = act;
    tk.t = tc >= 0 && tc === act && up(now) ? TICK : 0;
    let m = stepS(tk, dt);
    cards.forEach((cd, i) => { drawCard(i, now); if (!tdone(cd.a, now) || !tdone(cd.z, now)) m = true; });
    drawTick(now);
    const on = tk.x > TICK * 0.5 ? tc : -1;
    if (on !== lamp) { lamp = on; dots.forEach((el, i) => cls(el, i === on ? "dot m" : "dot off")); }
    return m || !(active || still);
  });
  bag.add(B.unregister);

  // Hit bands along the cards' RESTING top edges: they never move, and nothing draws them.
  const T = REST.map((th, i) => plane(i, th, 0, 0)(CW / 2, CH));
  const e0 = P(0, 0, 0), e1 = P(1, 0, 0), el = Math.hypot(e1[0] - e0[0], e1[1] - e0[1]), ex = [(e1[0] - e0[0]) / el, (e1[1] - e0[1]) / el], nx = [-ex[1], ex[0]];
  const dist = (p, q) => (p[0] - q[0]) * nx[0] + (p[1] - q[1]) * nx[1], along = (p, q) => (p[0] - q[0]) * ex[0] + (p[1] - q[1]) * ex[1];
  const LOW = dist(P(PW / 2, SY1, WH), T[N - 1]), HALF = (CW / 2) * el + 4;
  function hit(p) {
    let best = -1, bd = Infinity;
    T.forEach((q, i) => { const d = Math.abs(dist(p, q)); if (d < bd) { bd = d; best = i; } });
    if (Math.abs(along(p, T[best])) > HALF || dist(p, T[0]) < -14 || dist(p, T[N - 1]) > LOW) return -1;
    return best;
  }

  bag.add(pointer(stage, {
    move: (p) => { active = true; const a = hit(p); setActive(a); read.textContent = a < 0 ? "rest" : `card ${a + 1}`; },
    leave: () => { active = false; idle = 0; setActive(-1); read.textContent = "rest"; B.wake(); },
  }));
  read.textContent = "rest";
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { LIFT = v; if (act >= 0) tset(cards[act].z, LIFT, performance.now(), 0); B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "wallet",
  means: "A phone with a fan of cards in its sleeve: the card picked rises out, its neighbours part, and a tick lands on its chip.",
  rules: [1, 2, 4, 5],
  range: [12, 18, 24],
  tour: [[276, 110], [253, 133], [287, 100], null],
  mount,
});
