/**
 * Tablet: a tablet lying on its back on a slab, hinged along its foot, and a
 * face on its own over it, off to one side and turned. The tablet rises under
 * the face and takes it in. The pointer is the applicant: the face follows it
 * across the screen, and inside the frame's reach it is taken: it comes
 * square, the frame takes the bright stroke, and a line runs down the face
 * turning it bright. The face then gives way to a tick and the button under
 * it takes the bright stroke: the session carries on from the tablet, which
 * lowers away. Left alone, the figure plays both parts over and over. The
 * slider is the reach, in world units: how far off the frame's centre a face
 * can be and still be taken.
 *
 * The pattern: a story told by one hand. A spring for the tablet's lean and
 * three for the face, a hit test on the plane the screen stands in (which
 * never moves), a clock that runs only while the face is square, and a paint
 * order that never changes: slab, tablet, lip, face, line, tick.
 */
const {
  Cam, bezier, circ, clamp, facing, fillet, fit, lerp, open, poly, prism, proj, rad, reducedMotion, ringAt, rings, rrect, seg,
  spring, stepS, disposer, mk, pointer, put, reflect, register, solid,
} = HL;

// The tablet: how wide, how tall and how thick, how high its hinge stands, and how far back it leans when it is up and when it is down.
const TW = 60, TH = 80, TT = 2.4, HZ = 3, UP = -14, DOWN = -90;
// The slab it lies on: its footprint and how thick.
const X0 = -8, X1 = TW + 8, Y0 = -TH - 7, Y1 = 11, BASE = 5;
// On the screen: the frame's centre and half its side. The face on its own: how far off the frame and turned how far, and how far the pointer may take it.
const FC = [30, 47.5], FH = 18, REST = [12, 6], TURN = 10, FAR = 17, SC = 0.25, TICK = 7;
// The read, in seconds from the face coming square: the line's run down it, done at T1, and how long the face takes to give way.
// Then how long the figure, left alone, waits lying down, waits standing before the face comes, and stands once it is done.
const LINE = [0.3, 1.25], T1 = 1.6, GONE = 0.3, PAUSE = 1.1, WAIT = 0.35, DWELL = 1.6, EASE = bezier(0.4, 0, 0.2, 1);

const box = (u0, v0, u1, v1, r) => fillet([[u0, v0], [u1, v0], [u1, v1], [u0, v1]], [r, r, r, r]);
const map = (pts, w) => pts.map((p) => w(p[0], p[1]));
const cls = (el, c) => { if (el.getAttribute("class") !== c) el.setAttribute("class", c); };

/** The face the flat drawings carry, stroke by stroke: runs of points in a box 74 wide and 104 tall, y down. */
const FACE = (() => {
  const d = "M36.78,2h0c14.88,0,26.96,12.08,26.96,26.96v22.61c0,14.88-12.08,26.96-26.96,26.96h0c-14.88,0-26.96-12.08-26.96-26.96v-22.61C9.83,14.08,21.9,2,36.78,2Z"
    + "M9.83,29.83c2.03-3.19,8.7-9.57,15.65-9.57,8.7,0,12.17,6.09,20.87,6.09,4.01,0,7.17-.52,9.49-1.68"
    + "M8.96,39.39c-3.84,0-6.96,3.31-6.96,7.39,0,4.08,3.11,7.39,6.96,7.39M64.61,54.17c3.84,0,6.96-3.31,6.96-7.39,0-4.08-3.11-7.39-6.96-7.39"
    + "M18.52,38.64c.87-.87,3.04-2.25,5.22-2.61,2.61-.43,5.22.43,6.09.87M55.04,38.52c-.87-.87-3.04-2.25-5.22-2.61-2.61-.43-5.22.43-6.09.87"
    + "M25.48,48.09v-5.22M48.09,48.09v-5.22M28.96,62.87c1.74,1.3,4.35,2.61,7.83,2.61,3.48,0,6.09-1.3,7.83-2.61"
    + "M3.3,102C7.8,85.5,21.5,79,36.79,79c15.31,0,29.01,6.5,33.51,23";
  const out = [];
  let run, x = 0, y = 0;
  for (const [, c, rest] of d.matchAll(/([MhvcCZ])([^MhvcCZ]*)/g)) {
    const a = (rest.match(/-?\d*\.?\d+/g) || []).map(Number);
    if (c === "M") out.push(run = [[x = a[0], y = a[1]]]);
    else if (c === "h") run.push([x += a[0], y]);
    else if (c === "v") run.push([x, y += a[0]]);
    else if (c === "Z") run.push(run[0]);
    else for (let i = 0; i < a.length; i += 6) {
      const q = a.slice(i, i + 6).map((n, k) => n + (c === "c" ? (k % 2 ? y : x) : 0));
      for (let k = 1; k <= 6; k++) {
        const t = k / 6, s = 1 - t;
        run.push([s * s * s * x + 3 * s * s * t * q[0] + 3 * s * t * t * q[2] + t * t * t * q[4], s * s * s * y + 3 * s * s * t * q[1] + 3 * s * t * t * q[3] + t * t * t * q[5]]);
      }
      x = q[4]; y = q[5];
    }
  }
  return out;
})();

/** The part of every run that lies above the height yc, cut where a run crosses it. */
function above(runs, yc) {
  const out = [];
  for (const run of runs) {
    let cur = null;
    run.forEach((p, i) => {
      const q = run[i - 1], on = p[1] < yc, was = i > 0 && q[1] < yc;
      if (i && on !== was) {
        const t = (yc - q[1]) / (p[1] - q[1]), x = [q[0] + (p[0] - q[0]) * t, yc];
        if (on) out.push(cur = [x]);
        else { cur.push(x); cur = null; }
      } else if (on && !cur) out.push(cur = []);
      if (on) cur.push(p);
    });
  }
  return out.filter((run) => run.length > 1);
}

/** The frame's four corners on the screen, each a run of points round its bend. */
const FRAME = [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([sx, sy]) => {
  const k = [FC[0] + sx * FH, FC[1] + sy * FH], run = [[k[0], k[1] - sy * 7]];
  for (let i = 0; i <= 5; i++) {
    const t = i / 5, s = 1 - t;
    run.push([k[0] - t * t * sx * 3.5, k[1] - s * s * sy * 3.5]);
  }
  run.push([k[0] - sx * 7, k[1]]);
  return run;
});
const PLATE = box(0, 0, TW, TH, 6);

/** A plate with a thickness: its back, the two ties where the sweep between back and face turns, and its face. w maps the face, wb the back. */
function slab(shape, w, wb) {
  const f = map(shape, w), b = map(shape, wb), dx = b[0][0] - f[0][0], dy = b[0][1] - f[0][1], side = (p) => p[0] * dy - p[1] * dx;
  let i = 0, j = 0;
  f.forEach((p, k) => { if (side(p) < side(f[i])) i = k; if (side(p) > side(f[j])) j = k; });
  return { rim: poly(b), ties: seg(f[i], b[i]) + seg(f[j], b[j]), face: poly(f) };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let R = value, active = false, up = false, want = REST, phase = 0, idle = 0, clock = 0, done = false, age = 1;
  let w = null, drawnLean = NaN, drawnScreen = "", drawnFace = "", shown = "", said = "";

  // The camera is fitted to the slab, and to the tablet standing.
  const C = Cam(45, 0.5, 1.92), sn = Math.sin(rad(UP)), cs = Math.cos(rad(UP));
  fit(C, [
    [X0, Y0, -BASE], [X1, Y1, -BASE], [X1, Y0, -BASE], [X0, Y1, -BASE],
    [0, TH * sn, HZ + TH * cs], [TW, TH * sn, HZ + TH * cs],
  ], 200, 164);
  const P = proj(C), front = facing(C);
  /** A point of the tablet leaning by deg about its hinge: u along it, v up it, t behind its face. */
  const plane = (deg, t) => { const s = Math.sin(rad(deg)), c = Math.cos(rad(deg)); return (u, v) => P(u, v * s - t * c, HZ + v * c + t * s); };
  // The plane the screen stands in when the tablet is up: the face lives in it, whatever the tablet is doing.
  const ws = plane(UP, 0);

  const g = mk("g", {}, svg);
  const [br, bi] = rings(X0, Y0, X1, Y1, 9, 2.2);
  reflect(svg, g, P, front, br, -BASE, 12);
  put(solid(g), prism(P, front, br, bi, -BASE, 0));
  // the bed the tablet lies down in
  mk("path", { d: poly(ringAt(P, rrect(-3, -TH - 3, TW + 3, -2, 8, 4), 0)), class: "nf lo" }, g);

  // The paint order never changes: the tablet and what is on its screen, the lip in front of its hinge, then the face, the line and the tick.
  const rim = mk("path", { class: "lo" }, g), plate = mk("path", { class: "sil" }, g);
  const dim = mk("path", { class: "nf lo" }, g), cam = mk("path", { class: "nf" }, g), frame = mk("path", { class: "nf" }, g);
  const aim = mk("path", { class: "nf dash" }, g), button = mk("path", { class: "nf" }, g);
  put(solid(g), prism(P, front, ...rings(5, 0.8, TW - 5, 5.6, 2.2, 1), 0, 5.2));
  const ink = mk("path", { class: "nf hi" }, g), lit = mk("path", { class: "nf hi" }, g), beam = mk("path", { class: "nf hi" }, g);
  const disc = mk("path", { class: "hi" }, g), check = mk("path", { class: "nf hi" }, g);
  const lean = spring(DOWN, { k: 46, c: 13.6 }), fu = spring(REST[0]), fv = spring(REST[1]), fr = spring(TURN), rr = spring(0), tk = spring(0, { k: 260, c: 22 });

  /** Redraws the tablet at its lean, with everything that is on its screen. False when it has not moved since it was last drawn. */
  function drawPlate() {
    if (lean.x === drawnLean) return false;
    drawnLean = lean.x;
    w = plane(lean.x, 0);
    const sl = slab(PLATE, w, plane(lean.x, TT));
    rim.setAttribute("d", sl.rim + sl.ties);
    plate.setAttribute("d", sl.face);
    // two lines of words and the bar at the foot, the camera, the frame's corners and the button
    dim.setAttribute("d", seg(w(18.5, 22.5), w(41.5, 22.5)) + seg(w(22, 18.5), w(38, 18.5)) + seg(w(24.5, 3.4), w(35.5, 3.4)));
    cam.setAttribute("d", poly(circ(0.9, 12).map((q) => w(TW / 2 + q.u, 75.4 + q.v))));
    frame.setAttribute("d", FRAME.map((run) => open(map(run, w))).join(""));
    button.setAttribute("d", poly(map(box(13.5, 7.5, 46.5, 13.5, 3), w)));
    return true;
  }

  /** What rides on the screen and changes on its own: the reach round the frame's centre, and the tick. */
  function drawScreen() {
    const key = [lean.x, rr.x, tk.x].join();
    if (key === drawnScreen) return;
    drawnScreen = key;
    const round = (r) => poly(circ(r, 40).map((q) => w(FC[0] + q.u, FC[1] + q.v)));
    aim.setAttribute("d", rr.x > 0.5 ? round(rr.x) : "");
    const r = tk.x > 0.4 ? tk.x : 0;
    disc.setAttribute("d", r ? round(r) : "");
    check.setAttribute("d", r ? open([[-0.46, -0.04], [-0.13, -0.37], [0.46, 0.3]].map((p) => w(FC[0] + p[0] * r, FC[1] + p[1] * r))) : "");
  }

  /** The face where its springs are, and the line on its way down it: above the line the face is bright. */
  function drawFace() {
    const gone = done && clock > T1 + GONE, p = done ? 1 : clamp((clock - LINE[0]) / (LINE[1] - LINE[0]), 0, 1);
    const key = gone ? "" : [fu.x, fv.x, fr.x, p].join();
    if (key === drawnFace) return;
    drawnFace = key;
    const c = Math.cos(rad(fr.x)), s = Math.sin(rad(fr.x));
    const to = (q) => { const e = (q[0] - 36.78) * SC, f = (52 - q[1]) * SC; return ws(FC[0] + fu.x + e * c + f * s, FC[1] + fv.x - e * s + f * c); };
    const v = lerp(FC[1] + FH - 2, FC[1] - FH + 2, EASE(p)), on = p > 0 && p < 1;
    ink.setAttribute("d", gone ? "" : FACE.map((run) => open(run.map(to))).join(""));
    lit.setAttribute("d", on ? above(FACE, 52 - (v - FC[1]) / SC).map((run) => open(run.map(to))).join("") : "");
    beam.setAttribute("d", on ? seg(ws(FC[0] - FH - 1.5, v), ws(FC[0] + FH + 1.5, v)) : "");
  }

  /** The one highlight: on the face while it is on its own, on the frame once it has it, back on the face as the line reads it, and then on the tick and the button. */
  function drawState(held) {
    const read1 = clock >= LINE[1], key = (held ? "h" : "") + (read1 ? "r" : "") + (done ? "!" : "") + (age < 0.05 ? "n" : "");
    if (key !== shown) {
      shown = key;
      cls(ink, done || age < 0.05 ? "nf lo" : held && !read1 ? "nf" : "nf hi");
      cls(frame, done ? "nf lo" : held ? "nf hi" : "nf");
      cls(button, done ? "nf hi" : "nf");
    }
    const text = done ? "done" : clock > 0 ? `read ${Math.round((clock / T1) * 100)}%` : "idle";
    if (text !== said) read.textContent = said = text;
  }

  /** Clears a finished read. The face it took comes back at (du, dv), dim for a moment before it is bright. */
  function reset(du, dv) {
    if (done) {
      fu.x = fu.t = du; fv.x = fv.t = dv; fr.x = fr.t = clamp(du / REST[0], -1.4, 1.4) * TURN;
      fu.v = fv.v = fr.v = 0; age = 0;
    }
    done = false; clock = 0;
  }

  const B = register(stage, (dt) => {
    const still = reducedMotion(), risen = Math.abs(lean.x - UP) < 1;
    // With no pointer on it the figure plays both parts: the tablet rises, the face comes into its frame, and once it is read a while the tablet lowers away.
    if (!active) {
      if (still) { up = true; want = REST; phase = 0; idle = 0; }
      else if (phase === 0) { up = false; want = REST; if ((idle += dt) > PAUSE) { phase = 1; idle = 0; } }
      else if (phase === 1) { up = true; if (risen && (idle += dt) > WAIT) want = [0, 0]; if (done && clock > T1 + DWELL) phase = 2; }
      else { up = false; want = REST; if (lean.x < DOWN + 1.5) { phase = 0; idle = 0; reset(REST[0], REST[1]); } }
    }
    lean.t = up ? UP : DOWN;
    // Inside the reach the frame takes the face, and it comes square.
    const held = up && !done && Math.hypot(want[0], want[1]) <= R;
    fu.t = held ? 0 : want[0];
    fv.t = held ? 0 : want[1];
    fr.t = held ? 0 : clamp(want[0] / REST[0], -1.4, 1.4) * TURN;
    let m = stepS(lean, dt);
    for (const sp of [fu, fv, fr]) if (stepS(sp, dt)) m = true;
    const square = held && risen && Math.hypot(fu.x, fv.x) < 0.5 && Math.abs(fr.x) < 1;
    if (done) clock = still ? T1 + GONE + 1 : clock + dt;
    else clock = square ? (still ? T1 + GONE + 1 : clock + dt) : 0;
    if (clock >= T1) done = true;
    age += dt;
    rr.t = held || done ? 0 : R;
    tk.t = done ? TICK : 0;
    if (stepS(rr, dt)) m = true;
    if (stepS(tk, dt)) m = true;
    drawPlate();
    drawScreen();
    drawFace();
    drawState(held);
    return m || age < 0.1 || (clock > 0 && clock < T1 + GONE + 0.1) || !(active || still);
  });
  bag.add(B.unregister);

  // The pointer is read on the plane the screen stands in: across it and up it, from the frame's centre.
  const o = ws(0, 0), eu = ws(1, 0), ev = ws(0, 1), ux = eu[0] - o[0], uy = eu[1] - o[1], vx = ev[0] - o[0], vy = ev[1] - o[1], det = ux * vy - uy * vx;
  bag.add(pointer(stage, {
    move: (p) => {
      const x = p[0] - o[0], y = p[1] - o[1], du = (x * vy - y * vx) / det - FC[0], dv = (ux * y - uy * x) / det - FC[1], k = Math.min(1, FAR / Math.hypot(du, dv));
      if (!active) reset(du * k, dv * k);
      want = [du * k, dv * k]; active = true; up = true;
      B.wake();
    },
    leave: () => { active = false; phase = 2; idle = 0; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v; B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "tablet",
  means: "A tablet rises under a face and takes it in: the face comes square in the frame, a line reads down it, and a tick takes its place.",
  rules: [1, 2, 3, 4],
  range: [5, 9, 13],
  mount,
});
