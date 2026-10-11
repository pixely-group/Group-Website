/**
 * Chat: the client's render, in Hairline. A phone on a slab, bubbles proud of its screen as glass pills; the robot at its right; the AI
 * tile floating behind it, bobbing and swaying. The robot reads the user's bubble, the reply grows in place and types while the antenna
 * and the AI light, and the tile spins once (the AI kicking in); a tick lands on the reply, the next bubble grows in, and it starts again.
 * The pointer is the user: the eyes follow it; over the phone the answer plays. The slider is the eyes' travel. Paint order never
 * changes: slab, tile, phone, bubbles, robot. Springs for the gaze, the bubbles' growth in place and the spin's settle; one clock.
 */
const { Cam, EASE_LIFT, bezier, circ, clamp, facing, fillet, fit, hull, open, poly, prism, proj, rad, reducedMotion, rrect, run, seg,
  spring, stepS, disposer, mk, pointer, put, reflect, register, solid } = HL;

// The phone: width, height, thickness, corner, how far back it leans, which way it faces, how high it stands; its foot [u0, u1, n0, n1, h].
const PW = 50, PH = 86, PT = 4, PR = 9, LEAN = 8, FACE = 65, Z0 = 3, FOOT = [-4, PW + 4, -PT - 1, 8, 5];
// The slab, in the phone's own (along, out), and how deep it is. The bubbles: how far proud of the screen, how thick.
const SLAB = [-16, PW + 100, -24, 38], SB = 4, BZ = 4, BT = 2.4;
// The bubbles [u0, v0, u1, v1], the lengths of their lines, and the corner each grows from: the user's, the reply, the user's next.
const BUB = [[-8, 57, 32, 72], [14, 35, 62, 54], [-6, 17, 34, 29]], LINES = [[1, 0.6], [1, 0.85, 0.6], [0.8]], FROM = [[0, 0], [1, 0], [0, 0]];
// The robot: its middle in the phone's (along, out), its facing, how far it turns to look; width, height, depth; visor rim, screen, eye.
const RU = PW + 36, RN = 16, YAW = 72, TURN = 8, HW = 54, HH = 42, HD = 36, RIM = [46, 34, 15], SCR = [40, 28, 12.5], EYE = [9.5, 15, 4.8], EX = 8;
// The chat, in seconds: the eyes narrow on the question, the reply grows, its lines type, it is done, the next bubble comes, all reset.
// The floating tile behind the robot: its middle (along, out, up), width, height, thickness, letters' size and baseline; bob, sway, roll; spin.
const TU = 130, TN = -16, TZ = 31, TW = 36, TH = 42, TT = 4.5, LS = 0.88, LZ = -9.5, BOB = 2.5, SWAY = 12, ROLL = 6, SPIN = 0.8, PAST = 6;
// The letters, heavy, in their own (across, up): A's outline and its small counter, turned the other way so it is a hole, then I.
const A = [[-12.5, 0], [-4.2, 22], [4.2, 22], [12.5, 0], [4, 0], [2.87, 3], [-2.87, 3], [-4, 0]], AC = [[0, 10.6], [-1.55, 6.5], [1.55, 6.5]];
const GLYPHS = [[A, -6], [AC, -6], [[[-4.6, 0], [4.6, 0], [4.6, 22], [-4.6, 22]], 14]];
const READ = [0.2, 0.8], GROW = 0.8, TYPE = 1.1, LINE = 0.7, DONE = TYPE + 3 * LINE, THIRD = 3.9, HOLD = 4.6, RESET = 5.8, LOOP = 6.8, TICK = 5.5;

const box = (u0, v0, u1, v1, r) => fillet([[u0, v0], [u1, v0], [u1, v1], [u0, v1]], [r, r, r, r], 6); const cls = (el, c) => { if (el.getAttribute("class") !== c) el.setAttribute("class", c); };
const W3 = (o, a, b, c) => (u, v, w = 0) => [0, 1, 2].map((i) => o[i] + u * a[i] + v * b[i] + w * c[i]);
/** A solid from rings of screen points, the last facing the page: the hull, and the last ring where it is not on the hull. */
function shell(rs) {
  const h = hull(rs.flat()), on = new Set(h), last = rs[rs.length - 1], r = run(last, (p) => !on.has(p));
  return { sil: poly(h), crease: r.length === last.length ? poly(r) : open(r) };
}
/** A plate with a thickness, as tablet.js draws it: its back, the two ties where the sweep turns, and its face. */
function slab(f, b) {
  const dx = b[0][0] - f[0][0], dy = b[0][1] - f[0][1], side = (p) => p[0] * dy - p[1] * dx;
  let i = 0, j = 0;
  f.forEach((p, k) => { if (side(p) < side(f[i])) i = k; if (side(p) > side(f[j])) j = k; });
  return { rim: poly(b) + seg(f[i], b[i]) + seg(f[j], b[j]), face: poly(f) };
}
const inside = (h, p) => {
  const x = h.map((a, i) => { const b = h[(i + 1) % h.length]; return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); });
  return x.every((v) => v >= 0) || x.every((v) => v <= 0);
};

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let TR = value, active = false, ptr = null, t = 0, last = 0, drawn = "", said = "", shown = "";

  const f = rad(FACE), L = rad(LEAN), a = [Math.sin(f), -Math.cos(f), 0], n = [Math.cos(f), Math.sin(f), 0], UP = [0, 0, 1];
  const up = [-n[0] * Math.sin(L), -n[1] * Math.sin(L), Math.cos(L)], ground = W3([0, 0, 0], a, n, UP);
  const phone = (w) => W3([0, 0, Z0], a, up, n), at = (u, v, w = 0) => P(...phone()(u, v, w));
  const head = (yaw) => { const y = rad(YAW + yaw); return W3(ground(RU, RN, HH / 2), [Math.sin(y), -Math.cos(y), 0], UP, [Math.cos(y), Math.sin(y), 0]); };
  const h0 = head(0);

  // The camera is fitted to the slab, the phone's top and the antenna.
  const C = Cam(45, 0.5, 1.5);
  fit(C, [[SLAB[0], SLAB[2]], [SLAB[1], SLAB[2]], [SLAB[0], SLAB[3]], [SLAB[1], SLAB[3]]].map(([u, v]) => ground(u, v, -SB))
    .concat([phone()(0, PH), phone()(PW, PH), h0(HW / 2 + 5, HH / 2 + 10, 0), ground(TU + TW / 2, TN, TZ + TH / 2 + BOB)]), 200, 168);
  const P = proj(C), front = facing(C), F = (w) => (u, v, d) => P(...w(u, v, d));

  // The slab, turned square to the phone.
  const turn = (ring) => ring.map((q) => { const p = ground(q.u, q.v); return { u: p[0], v: p[1], nu: q.nu * a[0] + q.nv * n[0], nv: q.nu * a[1] + q.nv * n[1] }; });
  const g = mk("g", {}, svg), sr = turn(rrect(SLAB[0], SLAB[2], SLAB[1], SLAB[3], 16, 6)), si = turn(rrect(SLAB[0] + 2.2, SLAB[2] + 2.2, SLAB[1] - 2.2, SLAB[3] - 2.2, 13.8, 6));
  reflect(svg, g, P, front, sr, -SB, 12);
  put(solid(g), prism(P, front, sr, si, -SB, 0));

  // The tile floats behind the robot: a soft footprint on the slab, then the glass plate (back, ties, face) and the letters' relief over it.
  const foot = mk("path", { class: "nf lo" }, g), trim = mk("path", { class: "lo" }, g), tface = mk("path", { class: "sil" }, g);
  const layers = ["lo", "fo", "fo", "fo", "sil"].map((c) => mk("path", { class: c }, g)), letters = layers[4], DEPTH = [0, 0.45, 0.9, 1.35, 1.8];
  const PLATE = box(-TW / 2, -TH / 2, TW / 2, TH / 2, 10), GL = GLYPHS.map(([pts, du]) => fillet(pts, pts.map(() => 0.9), 2).map(([x, y]) => [(x + du) * LS, y * LS + LZ]));
  /** The tile turned by yaw about its upright axis and rolled in its own plane, its middle bobbing by z: (x across, y up, w out) to the page. */
  function drawTile(yaw, roll, z) {
    const cy = Math.cos(rad(yaw)), sy = Math.sin(rad(yaw)), cr = Math.cos(rad(roll)), sr = Math.sin(rad(roll)), o = ground(TU, TN, TZ + z);
    const T = (x, y, w) => { const X = x * cr - y * sr, Y = x * sr + y * cr, u = X * cy - w * sy, v = X * sy + w * cy; return P(o[0] + u * a[0] + v * n[0], o[1] + u * a[1] + v * n[1], o[2] + Y); };
    const fr = PLATE.map(([x, y]) => T(x, y, TT / 2)), bk = PLATE.map(([x, y]) => T(x, y, -TT / 2));
    let area = 0; fr.forEach((p, i) => { const q = fr[(i + 1) % fr.length]; area += p[0] * q[1] - q[0] * p[1]; });
    // the face toward the page is drawn last; from behind, the letters' layers are seen the other way round, mirrored through the glass
    const sl = area < 0 ? slab(fr, bk) : slab(bk, fr), d = area < 0 ? DEPTH : DEPTH.slice().reverse();
    trim.setAttribute("d", sl.rim); tface.setAttribute("d", sl.face);
    layers.forEach((el, i) => el.setAttribute("d", GL.map((pts) => poly(pts.map(([x, y]) => T(x, y, TT / 2 + d[i])))).join("")));
    const k = 1 - 0.12 * (z / BOB), c = ground(TU, TN, 0);
    foot.setAttribute("d", poly(circ(1, 40).map((q) => P(c[0] + (q.u * TW * 0.38 * a[0] + q.v * 6 * n[0]) * k, c[1] + (q.u * TW * 0.38 * a[1] + q.v * 6 * n[1]) * k, 0))));
  }

  // The phone: a plate with a thickness, its screen, the camera island, the input bar and its send arrow.
  const plate = box(0, 0, PW, PH, PR), map = (pts, w) => pts.map(([u, v]) => w(u, v));
  const ph = slab(map(plate, (u, v) => at(u, v, 0)), map(plate, (u, v) => at(u, v, -PT)));
  mk("path", { d: ph.rim, class: "lo" }, g); mk("path", { d: ph.face, class: "sil" }, g);
  const scr = (pts) => poly(map(pts, (u, v) => at(u, v)));
  mk("path", { d: scr(box(3, 3, PW - 3, PH - 3, PR - 2.5)), class: "nf lo" }, g);
  mk("path", { d: scr(box(PW / 2 - 7, PH - 10, PW / 2 + 7, PH - 6, 2)) + scr(box(5, 6, PW - 5, 14, 4)), class: "nf" }, g);
  mk("path", { d: scr(fillet([[PW - 13, 7.7], [PW - 7.5, 10], [PW - 13, 12.3], [PW - 11.6, 10]], [0.5, 0.5, 0.5, 0.3], 2)), class: "nf" }, g);

  // The bubbles, each grown about its corner by s: back and ties, face, and its lines.
  const bubbles = BUB.map((b, i) => ({ b, i, rim: mk("path", { class: "lo" }, g), face: mk("path", { class: "sil" }, g), ink: mk("path", { class: "nf" }, g), typed: mk("path", { class: "nf hi" }, g), s: spring(i ? 0 : 1), d: "" }));
  const bw = (b, i, s) => { const cu = b[FROM[i][0] ? 2 : 0], cv = b[1]; return (u, v, w) => at(cu + (u - cu) * s, cv + (v - cv) * s, BZ + w); };
  const lineAt = (b, i, k) => { const h = b[3] - b[1], m = LINES[i].length, v = b[3] - h / 2 + ((m - 1) / 2 - k) * 4.6, u0 = b[0] + h * 0.42; return [u0, lerp(u0, b[2] - h * 0.42, LINES[i][k]), v]; };
  const lerp = (x, y, k) => x + (y - x) * k;
  function drawBubble(B, typing) {
    const { b, i } = B, s = B.s.x, key = s < 0.04 ? "" : [s, typing].join();
    if (key === B.d) return; B.d = key;
    const w = bw(b, i, s), shape = box(...b, (b[3] - b[1]) / 2), sl = slab(map(shape, (u, v) => w(u, v, BT)), map(shape, (u, v) => w(u, v, 0)));
    B.rim.setAttribute("d", key ? sl.rim : ""); B.face.setAttribute("d", key ? sl.face : "");
    const segs = LINES[i].map((_, k) => { const [u0, u1, v] = lineAt(b, i, k), p = i === 1 ? typing[k] : 1; return p > 0.02 ? seg(w(u0, v, BT), w(lerp(u0, u1, p), v, BT)) : ""; });
    // the reply's lines are bright while they type, plain once written; the user's are plain
    const live = i === 1 && typing.some((p) => p > 0 && p < 1);
    B.ink.setAttribute("d", key && !live ? segs.join("") : "");
    B.typed.setAttribute("d", key && live ? segs.join("") : "");
  }
  // The foot the phone stands in, in front of its lowest edge.
  put(solid(g), shell([0, FOOT[4]].map((z) => turn(rrect(FOOT[0], FOOT[2], FOOT[1], FOOT[3], 3, 4)).map((q) => P(q.u, q.v, z)))));
  const RB = BUB[1], TC = [RB[2] - 4, RB[3] - 2], disc = mk("path", { class: "hi" }, g), check = mk("path", { class: "nf hi" }, g);

  // The robot, nearest: body, antenna, ear disc on its right, then the visor's rim and screen and the two eyes.
  const body = solid(g), stalk = solid(g), ball = mk("path", { class: "sil" }, g), ear = solid(g);
  const rim = mk("path", { class: "nf" }, g), vis = mk("path", { class: "nf lo" }, g), eyes = mk("path", { class: "hi" }, g);
  const dot = (p, r) => circ(r * C.S, 24).map((q) => [p[0] + q.u, p[1] + q.v]);
  const base = rrect(-HW / 2, -HH / 2, HW / 2, HH / 2, 20, 14), lobe = circ(8.5, 40);
  // the body is an egg: seven sections from back to face, fullest a little ahead of the middle
  const EGG = [0, 1, 2, 3, 4, 5, 6].map((k) => { const d = -HD / 2 + (k * HD) / 6; return [d, 0.72 + 0.28 * Math.sqrt(Math.max(0, 1 - ((d - HD * 0.05) / (HD * 0.55)) ** 2))]; });
  const MU = SCR[0] / 2 - EX - EYE[0] / 2 - 2.5, MV = SCR[1] / 2 - EYE[1] / 2 - 2.5;
  function drawHead(yaw, du, dv, k) {
    const key = [yaw, du, dv, k].map((x) => x.toFixed(2)).join();
    if (key === drawn) return; drawn = key;
    const w = F(head(yaw)), fw = (u, v) => w(u, v, HD / 2 + 0.05);
    body.sil.setAttribute("d", shell(EGG.map(([d, s]) => base.map((q) => w(q.u * s, q.v * s, d)))).sil);
    const b0 = w(HW / 2 + 1.5, 6, 0), b1 = w(HW / 2 + 4.5, HH / 2 + 8, -1.5);
    stalk.sil.setAttribute("d", poly(hull(dot(b0, 1.3).concat(dot(b1, 1.3)))));
    ball.setAttribute("d", poly(dot(b1, 3.2)));
    put(ear, shell([HW / 2 - 2, HW / 2 + 3].map((u) => lobe.map((q) => w(u, q.v, q.u)))));
    const rr = (W, H, r, cu = 0, cv = 0) => poly(rrect(cu - W / 2, cv - H / 2, cu + W / 2, cv + H / 2, r, 10).map((q) => fw(q.u, q.v)));
    rim.setAttribute("d", rr(...RIM)); vis.setAttribute("d", rr(...SCR));
    const eh = Math.max(0.8, EYE[1] * k);
    eyes.setAttribute("d", rr(EYE[0], eh, EYE[2], du - EX, dv) + rr(EYE[0], eh, EYE[2], du + EX, dv));
  }

  // The gaze is read on the visor's REST plane; the phone is picked from its rest outline, bubbles grown in full.
  const f0 = F(h0), o0 = f0(0, 0, HD / 2), ex0 = f0(1, 0, HD / 2).map((q, i) => q - o0[i]), ey0 = f0(0, 1, HD / 2).map((q, i) => q - o0[i]);
  const det = ex0[0] * ey0[1] - ex0[1] * ey0[0];
  const onVisor = (p) => { const x = p[0] - o0[0], y = p[1] - o0[1]; return [(x * ey0[1] - y * ey0[0]) / det, (ex0[0] * y - ex0[1] * x) / det]; };
  const hit = hull(map(plate, (u, v) => at(u, v)).concat(...BUB.map((b, i) => map(box(...b, 5), (u, v) => at(u, v, BZ)))));
  const MID = BUB.map((b) => at((b[0] + b[2]) / 2, (b[1] + b[3]) / 2, BZ));

  const gu = spring(0), gv = spring(0), yw = spring(0), tk = spring(0, { k: 260, c: 22 }), ys = Object.assign(spring(PAST, { k: 120, c: 9 }), { t: 0 }), EIO = bezier(0.65, 0, 0.35, 1); const B = register(stage, (dt, now) => {
    // the chat's clock keeps the wall's time, so a busy page does not slow the story; a wake-up never jumps it more than a frame or two
    const still = reducedMotion(), step = Math.min(0.1, Math.max(dt, (now - last) / 1000));
    last = now;
    // One clock for the chat: alone it loops; under the pointer it runs while the pointer is on the phone and holds once answered.
    if (still) t = DONE + 0.5;
    else if (!active) t = (t + step) % LOOP;
    else if (inside(hit, ptr)) t = t >= RESET ? 0 : Math.min(t + step, HOLD);
    const typing = [0, 1, 2].map((k) => (t >= RESET ? 0 : EASE_LIFT(clamp((t - TYPE - k * LINE) / LINE, 0, 1))));
    const done = t >= DONE && t < RESET, writing = t >= TYPE && t < DONE;
    bubbles[1].s.t = t >= GROW && t < RESET ? 1 : 0;
    bubbles[2].s.t = t >= THIRD && t < RESET ? 1 : 0;
    tk.t = done ? TICK : 0;
    let m = false;
    for (const s of [gu, gv, yw, tk, bubbles[1].s, bubbles[2].s]) if (stepS(s, dt)) m = true;
    bubbles.forEach((b) => drawBubble(b, typing));
    // Where the eyes go: the pointer, or alone, the bubble the chat is on; read on the visor's plane and eased to a far end.
    const aim = active ? ptr : MID[t < GROW || t >= RESET ? 0 : t < THIRD ? 1 : 2], [u, v] = onVisor(aim);
    gu.t = u / Math.hypot(u, 40); gv.t = v / Math.hypot(v, 40); yw.t = -gu.t * TURN;
    const sq = t > READ[0] && t < GROW ? EASE_LIFT(clamp((t - READ[0]) / 0.35, 0, 1)) * (1 - EASE_LIFT(clamp((t - READ[1] + 0.2) / 0.2, 0, 1))) : 0;
    drawHead(yw.x, clamp(gu.x * TR, -MU, MU), clamp(gv.x * TR * 0.7, -MV, MV), 1 - 0.5 * sq);
    // The tile: an ambient bob and sway; as the reply starts typing, one full turn that runs a few degrees past and settles back.
    const sp = t - TYPE, s = now / 1000;
    if (sp < 0 || t >= RESET) { ys.x = PAST; ys.v = 0; } else if (sp >= SPIN && stepS(ys, dt)) m = true;
    const spin = still || sp < 0 || t >= RESET ? 0 : sp < SPIN ? (360 + PAST) * EIO(sp / SPIN) : ys.x;
    if (still) drawTile(8, 0, 0); else drawTile(spin + SWAY * Math.sin(s * 2.03), ROLL * Math.sin(s * 1.46 + 1), BOB * Math.sin(s * 2.4));
    const r = tk.x > 0.4 ? tk.x : 0, tw = (p, q) => at(TC[0] + p, TC[1] + q, BZ + BT + 0.1);
    disc.setAttribute("d", r ? poly(circ(r, 32).map((q) => tw(q.u, q.v))) : "");
    check.setAttribute("d", r ? open([[-0.46, -0.04], [-0.13, -0.37], [0.46, 0.3]].map((p) => tw(p[0] * r, p[1] * r))) : "");
    // The one highlight: the eyes while it reads; the lines and the antenna's ball while it types; the reply and its tick once done.
    const key = (writing ? "w" : "") + (done ? "d" : "");
    if (key !== shown) {
      shown = key; cls(eyes, key ? "sil" : "hi"); cls(ball, writing ? "dot" : "sil"); cls(letters, writing ? "hi" : "sil"); cls(bubbles[1].face, done ? "hi" : "sil");
    }
    const text = !active ? "rest" : t < TYPE ? "asking" : t < DONE ? "typing" : "answered";
    if (text !== said) read.textContent = said = text;
    return m || !still;
  });
  bag.add(B.unregister);
  bag.add(pointer(stage, {
    move: (p) => { ptr = p; active = true; B.wake(); },
    leave: () => { active = false; B.wake(); } }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { TR = v; drawn = ""; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "chat",
  means: "A robot reads the user's message on a phone; its reply grows in and types while the AI tile lights, and a tick lands once answered.",
  rules: [1, 4, 5, 8],
  range: [3, 5, 7],
  tour: [[165, 186], [183, 144], [330, 120], null],
  mount,
});
