/**
 * Modules: a low base board on a slab, with a row of four shallow slots along
 * it, each with a connector notch towards the board's front edge. Three slots
 * hold a module, a rounded block with a seam round its sides and a light on
 * top, each a little taller or shorter than the next. The fourth slot, at the
 * near end, is empty, and its rim is the bright mark at rest. The pointer is
 * the hand: its height over the empty slot is the fourth module's, and the
 * module turns square on its way down. Inside the reach it is seated and
 * clicks in, settling a little on its spring. Its light comes on, the lights
 * run out to the other modules staggered by distance, the trace along the
 * board's front edge goes bright in the same order, and a tick lands on the
 * board at the row's far end. Left alone, the figure seats the module, holds,
 * lifts it and pauses. The slider is the stagger step, in milliseconds.
 *
 * The pattern is reader.js's: one hand, a spring for the module's height, a
 * hit test on the slot's own vertical (which never moves), a clock that runs
 * only while the module is seated, and a paint order that never changes.
 */
const {
  Cam, circ, clamp, extremes, facing, fillet, fit, open, poly, prism, proj, rad, reducedMotion, ringAt, rings, rrect, run, seg,
  spring, stepS, disposer, flatDot, mk, place, pointer, put, reflect, register, solid,
} = HL;

// The board, its height, the slab under it and its margin. The slots: where the first starts, their size and pitch, their y, and how deep.
const BL = 154, BD = 50, BZ = 6, SB = 4, M = 6, X0 = 25, SW = 26, PITCH = 32, Y0 = 8, DEEP = 1.6;
// The modules: footprint, corner, heights (the last is the one in the hand), where the hand holds it and how far it is turned.
const MW = 22, MR = 5, H = [15, 20, 12, 16], HOLD = 28, OFF = [1, -7], YAW = -14, SINK = 0.9, REACH = 7;
// The trace's y along the front edge; the tick's place at the row's far end and its radius.
const TY = 43, TXY = [12, 30], TICK = 6;
// The story, in seconds from the module seating: when its light comes on; how long the figure, left alone, holds it seated once live, and holds it up.
const TL = 0.3, DWELL = 1.6, PAUSE = 1.3, A = 3;

const cls = (el, c) => { if (el.getAttribute("class") !== c) el.setAttribute("class", c); };
const cx = (i) => X0 + i * PITCH + SW / 2, CY = Y0 + SW / 2;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let step = value / 1000, active = false, hand = HOLD, going = false, idle = -2, clock = 0, drawn = NaN, field = "", shown = "", said = "";
  const done = () => TL + A * step + 0.2;

  // The camera is fitted to the slab, and to the module where the hand holds it.
  const C = Cam(45, 0.5, 1.78);
  fit(C, [[-M, -M, -SB], [BL + M, BD + M, -SB], [BL + M, -M, -SB], [-M, BD + M, -SB],
    [cx(A) + OFF[0] - MW, CY + OFF[1] - MW, BZ + HOLD + H[A]], [cx(A) + OFF[0] + MW, CY + OFF[1] - MW, BZ + HOLD + H[A]]], 200, 168);
  const P = proj(C), front = facing(C), top = (x, y) => P(x, y, BZ);

  const g = mk("g", {}, svg);
  const [sr, si] = rings(-M, -M, BL + M, BD + M, 12, 2.2);
  reflect(svg, g, P, front, sr, -SB, 12);
  put(solid(g), prism(P, front, sr, si, -SB, 0));
  put(solid(g), prism(P, front, ...rings(0, 0, BL, BD, 10, 2), 0, BZ));

  // The slots: a rounded rim with a notch out of its front edge; the empty one also shows the far walls of its floor.
  const rim = (i) => {
    const x0 = X0 + i * PITCH, x1 = x0 + SW, y1 = Y0 + SW, c = cx(i);
    const pts = [[x0, Y0], [x1, Y0], [x1, y1], [c + 4.5, y1], [c + 4.5, y1 + 3.2], [c - 4.5, y1 + 3.2], [c - 4.5, y1], [x0, y1]];
    return poly(fillet(pts, [6, 6, 6, 1, 1.2, 1.2, 1, 6]).map((p) => top(p[0], p[1])));
  };
  mk("path", { d: rim(0) + rim(1) + rim(2), class: "nf" }, g);
  const slot = mk("path", { d: rim(A), class: "nf hi" }, g);
  const floor = rrect(X0 + A * PITCH, Y0, X0 + A * PITCH + SW, Y0 + SW, 6, 4);
  mk("path", { d: open(ringAt(P, run(floor, (q) => !front(q)), BZ - DEEP)), class: "nf lo" }, g);

  // The trace along the front edge, one length under each module; then the tick's place at the far end.
  const trace = [0, 1, 2, 3].map((i) => mk("path", { d: seg(top(i ? X0 + i * PITCH - 3 : X0 - 2, TY), top(X0 + i * PITCH + SW + (i < 3 ? 3 : 2), TY)), class: "nf lo" }, g));
  const disc = mk("path", { class: "hi" }, g), check = mk("path", { class: "nf hi" }, g);

  // A module: its solid, the seam round its sides, and its light.
  const [mr, mi] = rings(-MW / 2, -MW / 2, MW / 2, MW / 2, MR, 1.6);
  const turn = (ring, a, ox, oy) => {
    const c = Math.cos(a), s = Math.sin(a);
    return ring.map((q) => ({ u: ox + q.u * c - q.v * s, v: oy + q.u * s + q.v * c, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c }));
  };
  const module = (ring, inner, z0, z1, el) => {
    put(el.s, prism(P, front, ring, inner, z0, z1));
    el.seam.setAttribute("d", open(ringAt(P, run(ring, front), z1 - 4)));
  };
  const mods = [0, 1, 2, 3].map((i) => {
    const el = { s: solid(g) }, last = i === A;
    if (last) el.drops = mk("path", { class: "nf dash" }, g), g.append(el.s.g);
    el.seam = mk("path", { class: "nf lo" }, el.s.g);
    el.dot = flatDot(el.s.g, C, 1.6, "dot off");
    if (!last) {
      module(turn(mr, 0, cx(i), CY), turn(mi, 0, cx(i), CY), BZ, BZ + H[i], el);
      place(el.dot, P(cx(i), CY, BZ + H[i]));
    }
    return el;
  });
  const held = mods[A];
  const h = spring(HOLD, { k: 90, c: 19 }), tk = spring(0, { k: 260, c: 22 });

  /** Redraws the fourth module at its height: off its seat and turned by as much as it is up. Unmoved, it keeps its paths. */
  function drawModule() {
    const z = h.x;
    if (z === drawn) return;
    drawn = z;
    const f = clamp(z / HOLD, 0, 1), a = rad(YAW * f), ox = cx(A) + OFF[0] * f, oy = CY + OFF[1] * f;
    const ring = turn(mr, a, ox, oy), zt = BZ + z + H[A];
    module(ring, turn(mi, a, ox, oy), BZ + Math.max(0, z), zt, held);
    place(held.dot, P(ox, oy, zt));
    // its footprint on the board, and the three drops that tie it there
    held.drops.setAttribute("d", z < 1 ? "" : poly(ringAt(P, ring, BZ)) + extremes(P, ring).map((q) => seg(P(q.u, q.v, BZ), P(q.u, q.v, BZ + z))).join(""));
  }

  /** The tick, lying on the board at the row's far end, turned an eighth to face the page squarely. */
  function drawTick() {
    const key = String(tk.x);
    if (key === field) return;
    field = key;
    const r = tk.x > 0.4 ? tk.x : 0, w = (u, v) => top(TXY[0] + u, TXY[1] + v);
    disc.setAttribute("d", r ? poly(circ(r, 40).map((q) => w(q.u, q.v))) : "");
    check.setAttribute("d", r ? open([[-0.46, 0.04], [-0.13, 0.37], [0.46, -0.3]].map((p) => w((p[0] + p[1]) * r * Math.SQRT1_2, (p[1] - p[0]) * r * Math.SQRT1_2))) : "");
  }

  /** The one highlight: the empty slot at rest, the module while the hand brings it, then the lights, the trace and the tick. */
  function drawState() {
    const on = (i) => clock >= TL + Math.abs(i - A) * step, seated = clock > 0, live = clock >= done();
    const moving = !seated && (active || going), key = [moving, seated, live, 0, 1, 2, 3].map((v, k) => (k > 2 ? on(v) : v)).join();
    if (key !== shown) {
      shown = key;
      cls(slot, moving || seated ? "nf" : "nf hi");
      held.s.sil.classList.toggle("hi", moving || (seated && !on(A)));
      mods.forEach((el, i) => { cls(el.dot, on(i) ? "dot" : "dot off"); cls(trace[i], on(i) ? "nf hi" : "nf lo"); });
    }
    const text = !active ? "rest" : live ? "live" : seated ? "linking" : "module 4";
    if (text !== said) read.textContent = said = text;
  }

  const B = register(stage, (dt) => {
    const still = reducedMotion();
    // With no pointer on it the figure is its own hand: it holds the module up, seats it until live and a while after, and lifts it.
    if (!active) {
      if (still) { going = false; idle = 0; }
      else if (going) { if (clock > done() + DWELL) { going = false; idle = 0; } }
      else if ((idle += dt) > PAUSE) going = true;
      hand = going ? 0 : HOLD;
    }
    // Inside the reach the module is seated: it clicks in a little past flush, and settles back.
    h.t = hand <= REACH ? (clock > 0 && clock < 0.14 ? -SINK : 0) : hand;
    let m = stepS(h, dt);
    clock = h.x < 0.3 ? (still ? done() + 1 : clock + dt) : 0;
    tk.t = clock >= done() ? TICK : 0;
    if (stepS(tk, dt)) m = true;
    drawModule();
    drawTick();
    drawState();
    return m || (clock > 0 && clock < done()) || !(active || still);
  });
  bag.add(B.unregister);

  // The hand's height is read off the empty slot's own vertical, through its middle.
  const y0 = top(cx(A), CY)[1], up = P(0, 0, 1)[1] - P(0, 0, 0)[1];
  bag.add(pointer(stage, {
    move: (p) => { hand = clamp((p[1] - y0) / up, 0, HOLD); active = true; B.wake(); },
    leave: () => { active = false; going = false; idle = 0; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { step = v / 1000; B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "modules",
  means: "A module is seated in the last slot of a board: the lights run out along the row, the trace goes live, and a tick lands.",
  rules: [1, 2, 4, 5],
  range: [90, 160, 240],
  tour: [[282, 140], [282, 168], [282, 192], null],
  mount,
});
