"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "@/lib/rng";

/**
 * The verification, performed. One particle system plays five acts as the
 * scroll drives it — the same GPU-morph grammar as the network scene
 * (per-particle staggered easing between formations, comet flows, a
 * camera that dollies per stage, the graph swinging opposite the copy):
 *
 *   0  DOCUMENT — the ID, fully formed from the first frame: outline,
 *      portrait, title, aligned label-and-value rows, three rows of
 *      machine characters — with the reader's pass sweeping the
 *      machine zone alone, between its two rules.
 *   1  OCR — the phone scanning the document: the card whole under a
 *      reticle, the phone beside it, and three streams of print
 *      lifting off the page into the screen's fields as they commit.
 *   2  NEAR FIELD — the tap: everything becomes the concentric field
 *      around a bright chip cluster, rippling outward from the centre.
 *   3  FACE — the contour face: thirty-odd horizontal slices of a head,
 *      nose bulging the front arcs, eyes and mouth carried by the
 *      signal particles, a halo ring orbiting while the scan crest
 *      climbs it.
 *   4  MATCH — the face steps aside and its document self forms
 *      opposite; packets run the bridge between them, and where they
 *      agree, the verdict square burns green.
 *
 * All positions are precomputed once (seeded, so server and client would
 * agree if it ever rendered there) and the morph runs entirely in the
 * vertex shader — scroll scrubs one uniform.
 */

export type IdentityBusRef = { current: IdentityBus };
export type IdentityBus = {
  /** 0..1 across the whole narrative (mapped to 5 stages in-scene). */
  progress: number;
  pointer: [number, number];
  /** 1 where the copy column alternates sides and the subject must swing
   *  clear of it; 0 where copy overlays it full-width. */
  spread: number;
};

const INK = new THREE.Color("#0a0a0b");

const N = 9000;
const SIGNAL = Math.floor(N * 0.24);
const VERDICT = 300;

/** Head profile: half-width of the face at height y (y in [-2.3, 2.3]). */
function faceProfile(y: number) {
  const crown = 1 - THREE.MathUtils.smoothstep(y, 1.1, 2.35);
  const jaw = 1 - THREE.MathUtils.smoothstep(-y, 0.9, 2.45);
  return 0.5 + 1.28 * Math.min(crown, jaw);
}

type Model = {
  forms: Float32Array[]; // five formations, N*3 each
  info: Float32Array; // rand, role(0 base / 1 signal), verdict flag
};

function buildModel(): Model {
  const rand = mulberry32(20260829);
  const forms = Array.from({ length: 5 }, () => new Float32Array(N * 3));
  const info = new Float32Array(N * 3);

  const set = (arr: Float32Array, i: number, x: number, y: number, z: number) => {
    arr[i * 3] = x;
    arr[i * 3 + 1] = y;
    arr[i * 3 + 2] = z;
  };

  for (let i = 0; i < N; i += 1) {
    const isSignal = i < SIGNAL;
    const isVerdict = isSignal && i >= SIGNAL - VERDICT;
    const u = isSignal ? i / SIGNAL : (i - SIGNAL) / (N - SIGNAL);
    const r = rand();
    info.set([rand(), isSignal ? 1 : 0, isVerdict ? 1 : 0], i * 3);

    /* ——— 0 DOCUMENT ——— */
    if (isVerdict) {
      // The check digits: the last two character blocks of each row,
      // set in the same dot-matrix as the text they check.
      const row = Math.floor(u * 300) % 3;
      const cell = Math.floor(rand() * 2);
      const sub = Math.floor(rand() * 9);
      set(
        forms[0],
        i,
        2.75 + cell * 0.215 + ((sub % 3) - 1) * 0.048 + (rand() - 0.5) * 0.014,
        -1.34 - row * 0.27 + (Math.floor(sub / 3) - 1) * 0.054 + (rand() - 0.5) * 0.014,
        (rand() - 0.5) * 0.03,
      );
    } else if (isSignal) {
      // Machine characters, written like real MRZ: letter blocks first,
      // then runs of chevrons in the filler positions — the < < < < that
      // makes a machine zone recognisable at a glance.
      const row = i % 3;
      const cell = Math.floor(rand() * 26);
      const chev =
        (row === 0 && cell >= 14) ||
        (row === 1 && cell >= 17) ||
        (row === 2 && (cell === 6 || cell === 7 || cell >= 12));
      let dx: number;
      let dy: number;
      if (chev) {
        // Dots sampled along the two strokes of a "<".
        const t2 = rand();
        if (t2 < 0.5) {
          dx = 0.055 - t2 * 2 * 0.11;
          dy = -0.06 + t2 * 2 * 0.06;
        } else {
          dx = -0.055 + (t2 - 0.5) * 2 * 0.11;
          dy = (t2 - 0.5) * 2 * 0.06;
        }
        dx += (rand() - 0.5) * 0.012;
        dy += (rand() - 0.5) * 0.012;
      } else {
        const sub = Math.floor(rand() * 9);
        dx = ((sub % 3) - 1) * 0.048 + (rand() - 0.5) * 0.014;
        dy = (Math.floor(sub / 3) - 1) * 0.054 + (rand() - 0.5) * 0.014;
      }
      set(
        forms[0],
        i,
        -3.0 + cell * 0.215 + dx,
        -1.34 - row * 0.27 + dy,
        (rand() - 0.5) * 0.03,
      );
    } else if (u < 0.2) {
      // Outline: the card's own perimeter, drawn tight. Each edge re-zeroes
      // the parameter — carried raw, the odd branches kept drawing past
      // their corner and the left edge ran a bar straight up out of the
      // card.
      const t = rand() * 2;
      const w = 3.4;
      const h = 2.2;
      const along = (t % 0.5) * 2;
      if (t < 0.5) set(forms[0], i, -w + along * 2 * w, h, 0);
      else if (t < 1) set(forms[0], i, w, h - along * 2 * h, 0);
      else if (t < 1.5) set(forms[0], i, w - along * 2 * w, -h, 0);
      else set(forms[0], i, -w, -h + along * 2 * h, 0);
      forms[0][i * 3] += (rand() - 0.5) * 0.03;
      forms[0][i * 3 + 1] += (rand() - 0.5) * 0.03;
    } else if (u < 0.34) {
      // Portrait, head: a ring, not a smudge — outlines survive
      // distance where fills blur.
      const a = rand() * Math.PI * 2;
      set(
        forms[0],
        i,
        -2.2 + Math.cos(a) * 0.5 + (rand() - 0.5) * 0.05,
        0.72 + Math.sin(a) * 0.56 + (rand() - 0.5) * 0.05,
        (rand() - 0.5) * 0.05,
      );
    } else if (u < 0.44) {
      // Portrait, shoulders: the bust arc under the head.
      const t = rand() * 2 - 1;
      set(
        forms[0],
        i,
        -2.2 + Math.sin(t * 1.25) * 0.72 + (rand() - 0.5) * 0.04,
        -0.62 + Math.cos(t * 1.25) * 0.42 + (rand() - 0.5) * 0.04,
        (rand() - 0.5) * 0.05,
      );
    } else if (u < 0.52) {
      // The document's own title, across the top of the card.
      set(
        forms[0],
        i,
        -3.0 + rand() * 3.3,
        1.8 + (rand() - 0.5) * 0.035,
        (rand() - 0.5) * 0.04,
      );
    } else if (u < 0.8) {
      // The fields, minimal the way the user wants the card: three rows
      // beside the photo — label then value, every row starting where
      // every other row starts — and clear air between them and the
      // machine zone below.
      const row = Math.floor(rand() * 3);
      const isLabel = rand() < 0.3;
      // Longest line first — the name — then shorter details under it.
      const valueEnd = 2.6 - row * 0.65;
      set(
        forms[0],
        i,
        isLabel ? -1.1 + rand() * 0.62 : -0.28 + rand() * valueEnd,
        1.32 - row * 0.5 + (rand() - 0.5) * 0.03,
        (rand() - 0.5) * 0.04,
      );
    } else {
      // The freed fill budget joins the machine zone, writing the same
      // text: blocks where the letters are, chevrons where the filler is.
      const row = Math.floor(rand() * 3);
      const cell = Math.floor(rand() * 26);
      const chev =
        (row === 0 && cell >= 14) ||
        (row === 1 && cell >= 17) ||
        (row === 2 && (cell === 6 || cell === 7 || cell >= 12));
      let dx: number;
      let dy: number;
      if (chev) {
        const t2 = rand();
        if (t2 < 0.5) {
          dx = 0.055 - t2 * 2 * 0.11;
          dy = -0.06 + t2 * 2 * 0.06;
        } else {
          dx = -0.055 + (t2 - 0.5) * 2 * 0.11;
          dy = (t2 - 0.5) * 2 * 0.06;
        }
        dx += (rand() - 0.5) * 0.012;
        dy += (rand() - 0.5) * 0.012;
      } else {
        const sub = Math.floor(rand() * 9);
        dx = ((sub % 3) - 1) * 0.048 + (rand() - 0.5) * 0.014;
        dy = (Math.floor(sub / 3) - 1) * 0.054 + (rand() - 0.5) * 0.014;
      }
      set(
        forms[0],
        i,
        -3.0 + cell * 0.215 + dx,
        -1.34 - row * 0.27 + dy,
        (rand() - 0.5) * 0.03,
      );
    }

    /* ——— 1 OCR: the phone scanning the document ——— */
    {
      // The scene from the SDK reference: the document under the camera
      // at the left, the phone at the right, and the print streaming off
      // the page into the screen's fields.
      const DC = [-1.2, -0.35] as const; // document centre
      const DS = 0.58; // document scale
      if (isVerdict) {
        // Extraction confirmed, at the last field's end.
        set(
          forms[1],
          i,
          2.55 + rand() * 0.28,
          -0.45 + (rand() - 0.5) * 0.2,
          (rand() - 0.5) * 0.08,
        );
      } else if (isSignal) {
        // The lift: three streams of print leaving the page, each bound
        // for its own field on the screen.
        const stream = i % 3;
        const t = rand();
        const x0 = DC[0] + 1.5;
        const y0 = DC[1] + (0.75 - stream * 0.6) * DS * 1.6;
        const cx = 0.35;
        const cy = 1.35 - stream * 0.85;
        const x1 = 1.28;
        const y1 = 1.15 - stream * 0.8;
        const q = (a: number, c: number, b: number) =>
          (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;
        set(
          forms[1],
          i,
          q(x0, cx, x1) + (rand() - 0.5) * 0.05,
          q(y0, cy, y1) + (rand() - 0.5) * 0.05,
          (rand() - 0.5) * 0.06,
        );
      } else if (r < 0.62) {
        // The document itself, whole under the reticle: title, portrait,
        // aligned rows, machine zone — the act-0 card at reading distance.
        const sub = rand();
        if (sub < 0.16) {
          const t2 = rand() * 2;
          const w = 3.4 * DS;
          const h = 2.2 * DS;
          const along = (t2 % 0.5) * 2;
          let x = 0;
          let y = 0;
          if (t2 < 0.5) {
            x = -w + along * 2 * w;
            y = h;
          } else if (t2 < 1) {
            x = w;
            y = h - along * 2 * h;
          } else if (t2 < 1.5) {
            x = w - along * 2 * w;
            y = -h;
          } else {
            x = -w;
            y = -h + along * 2 * h;
          }
          set(forms[1], i, DC[0] + x, DC[1] + y, (rand() - 0.5) * 0.04);
        } else if (sub < 0.3) {
          const a = rand() * Math.PI * 2;
          set(
            forms[1],
            i,
            DC[0] - 2.2 * DS + Math.cos(a) * 0.5 * DS,
            DC[1] + 0.72 * DS + Math.sin(a) * 0.56 * DS,
            (rand() - 0.5) * 0.04,
          );
        } else if (sub < 0.4) {
          const t3 = rand() * 2 - 1;
          set(
            forms[1],
            i,
            DC[0] - 2.2 * DS + Math.sin(t3 * 1.25) * 0.72 * DS,
            DC[1] - 0.62 * DS + Math.cos(t3 * 1.25) * 0.42 * DS,
            (rand() - 0.5) * 0.04,
          );
        } else if (sub < 0.52) {
          set(
            forms[1],
            i,
            DC[0] + (-3.0 + rand() * 3.3) * DS,
            DC[1] + 1.8 * DS + (rand() - 0.5) * 0.03,
            (rand() - 0.5) * 0.04,
          );
        } else if (sub < 0.8) {
          const row = Math.floor(rand() * 3);
          const isLabel = rand() < 0.3;
          const valueEnd = 2.6 - row * 0.65;
          set(
            forms[1],
            i,
            DC[0] +
              (isLabel ? -1.1 + rand() * 0.62 : -0.28 + rand() * valueEnd) *
                DS,
            DC[1] + (1.32 - row * 0.5) * DS + (rand() - 0.5) * 0.025,
            (rand() - 0.5) * 0.04,
          );
        } else {
          const row = Math.floor(rand() * 3);
          const cell = Math.floor(rand() * 26);
          set(
            forms[1],
            i,
            DC[0] + (-3.0 + cell * 0.215) * DS + (rand() - 0.5) * 0.03,
            DC[1] + (-1.34 - row * 0.27) * DS + (rand() - 0.5) * 0.025,
            (rand() - 0.5) * 0.03,
          );
        }
      } else {
        // The screen: the same person arriving as text, field by field.
        const row = Math.floor(rand() * 3);
        set(
          forms[1],
          i,
          1.35 + rand() * (1.15 + (row === 1 ? 0.18 : 0)),
          1.15 - row * 0.8 + (rand() - 0.5) * 0.07,
          (rand() - 0.5) * 0.06,
        );
      }
    }

    /* ——— 2 NEAR FIELD ——— */
    {
      if (isSignal && !isVerdict && u < 0.4) {
        // The chip: a dense bright heart.
        const a = rand() * Math.PI * 2;
        const rr = Math.sqrt(rand()) * 0.42;
        set(forms[2], i, Math.cos(a) * rr, Math.sin(a) * rr, (rand() - 0.5) * 0.2);
      } else {
        // The field: concentric rings, thin in z.
        const ring = 0.7 + Math.floor(rand() * 8) * 0.52 + (rand() - 0.5) * 0.07;
        const a = rand() * Math.PI * 2;
        set(
          forms[2],
          i,
          Math.cos(a) * ring,
          Math.sin(a) * ring * 0.92,
          (rand() - 0.5) * 0.16,
        );
      }
    }

    /* ——— 3 FACE ——— */
    {
      if (isSignal && !isVerdict) {
        if (u < 0.3) {
          // Eyes: two watching clusters, small and dense.
          const side = u < 0.15 ? -1 : 1;
          const a = rand() * Math.PI * 2;
          const rr = Math.sqrt(rand()) * 0.13;
          set(
            forms[3],
            i,
            side * 0.6 + Math.cos(a) * rr,
            0.5 + Math.sin(a) * rr * 0.7,
            1.18 + (rand() - 0.5) * 0.05,
          );
        } else if (u < 0.52) {
          // The mouth: corners up. A liveness check is not an interrogation.
          const a = -0.5 + rand();
          set(
            forms[3],
            i,
            a * 1.05,
            -1.14 + a * a * 0.72 + (rand() - 0.5) * 0.045,
            1.2 - Math.abs(a) * 0.3,
          );
        } else {
          // The halo: the scan's own orbit, standing off the face.
          const a = rand() * Math.PI * 2;
          set(
            forms[3],
            i,
            Math.cos(a) * 2.45,
            0.1 + Math.sin(a) * 2.45,
            (rand() - 0.5) * 0.1,
          );
        }
      } else if (isVerdict) {
        // Waiting below the chin, dim until its act.
        set(
          forms[3],
          i,
          (rand() - 0.5) * 0.4,
          -2.95 + (rand() - 0.5) * 0.4,
          (rand() - 0.5) * 0.1,
        );
      } else {
        // Contour slices: the head as horizontal section lines.
        const slice = Math.floor(rand() * 34);
        const y = -2.3 + (slice / 33) * 4.6;
        const prof = faceProfile(y);
        const a = rand() * Math.PI * 2;
        let z = Math.sin(a) * prof * 0.8;
        const x = Math.cos(a) * prof;
        // The nose: the front of the middle slices pushed out.
        if (z > 0 && Math.abs(x) < 0.42 && y > -0.7 && y < 0.35) {
          z += 0.48 * (1 - Math.abs(x) / 0.42) * (1 - Math.abs(y + 0.18) / 1.05);
        }
        set(forms[3], i, x, y, z);
      }
    }

    /* ——— 4 MATCH ——— */
    {
      if (isVerdict) {
        // Agreement: the square on the bridge.
        set(
          forms[4],
          i,
          0.15 + (rand() - 0.5) * 0.4,
          (rand() - 0.5) * 0.4,
          (rand() - 0.5) * 0.14,
        );
      } else if (isSignal) {
        if (u < 0.56) {
          // The bridge: three lanes of clumped packets between the
          // subjects — traffic, not a dotted line.
          const lane = (Math.floor(rand() * 3) - 1) * 0.18;
          const clump = Math.floor(rand() * 6);
          set(
            forms[4],
            i,
            -1.25 + clump * 0.47 + rand() * 0.22,
            lane + (rand() - 0.5) * 0.04,
            (rand() - 0.5) * 0.08,
          );
        } else if (u < 0.82) {
          // The live subject's eyes — without them the right mass was a
          // hedgehog, not a person.
          const side = u < 0.69 ? -1 : 1;
          const a = rand() * Math.PI * 2;
          const rr = Math.sqrt(rand()) * 0.1;
          set(
            forms[4],
            i,
            2.55 + side * 0.44 + Math.cos(a) * rr,
            0.52 + Math.sin(a) * rr * 0.7,
            0.95 + (rand() - 0.5) * 0.05,
          );
        } else {
          // And the same smile the face wore for liveness.
          const a = -0.5 + rand();
          set(
            forms[4],
            i,
            2.55 + a * 0.8,
            -0.68 + a * a * 0.5 + (rand() - 0.5) * 0.04,
            0.95 - Math.abs(a) * 0.24,
          );
        }
      } else if (r < 0.45) {
        // The document self: the act-0 card in miniature, so the left
        // subject is unmistakably the document.
        const kind = rand();
        if (kind < 0.28) {
          // Head ring.
          const a = rand() * Math.PI * 2;
          set(
            forms[4],
            i,
            -3.2 + Math.cos(a) * 0.32 + (rand() - 0.5) * 0.03,
            0.62 + Math.sin(a) * 0.36 + (rand() - 0.5) * 0.03,
            (rand() - 0.5) * 0.05,
          );
        } else if (kind < 0.42) {
          // Shoulders.
          const t = rand() * 2 - 1;
          set(
            forms[4],
            i,
            -3.2 + Math.sin(t * 1.25) * 0.46 + (rand() - 0.5) * 0.03,
            -0.22 + Math.cos(t * 1.25) * 0.28 + (rand() - 0.5) * 0.03,
            (rand() - 0.5) * 0.05,
          );
        } else if (kind < 0.66) {
          // Data rows beside the portrait.
          const row = Math.floor(rand() * 3);
          set(
            forms[4],
            i,
            -2.62 + rand() * 0.9,
            0.86 - row * 0.42 + (rand() - 0.5) * 0.03,
            (rand() - 0.5) * 0.05,
          );
        } else if (kind < 0.82) {
          // Its machine line, quantised like the big one.
          const cell = Math.floor(rand() * 12);
          set(
            forms[4],
            i,
            -3.6 + cell * 0.18 + (rand() - 0.5) * 0.04,
            -1.05 + (rand() - 0.5) * 0.04,
            (rand() - 0.5) * 0.04,
          );
        } else {
          // Its card edge.
          const t = rand() * 2;
          const w = 1.15;
          const h = 1.55;
          const along = (t % 0.5) * 2;
          let x = 0;
          let y = 0;
          if (t < 0.5) {
            x = -w + along * 2 * w;
            y = h;
          } else if (t < 1) {
            x = w;
            y = h - along * 2 * h;
          } else if (t < 1.5) {
            x = w - along * 2 * w;
            y = -h;
          } else {
            x = -w;
            y = -h + along * 2 * h;
          }
          set(forms[4], i, -2.75 + x, 0.1 + y, (rand() - 0.5) * 0.04);
        }
      } else {
        // The live self: the same contour face, smaller, standing right.
        const slice = Math.floor(rand() * 30);
        const y = -1.85 + (slice / 29) * 3.7;
        const prof = faceProfile(y * 1.24) * 0.8;
        const a = rand() * Math.PI * 2;
        let z = Math.sin(a) * prof * 0.8;
        const x = Math.cos(a) * prof;
        if (z > 0 && Math.abs(x) < 0.34 && y > -0.56 && y < 0.28) {
          z += 0.34 * (1 - Math.abs(x) / 0.34);
        }
        set(forms[4], i, 2.55 + x, 0.2 + y, z);
      }
    }
  }

  return { forms, info };
}

const VERTEX = /* glsl */ `
  attribute vec3 aP0;
  attribute vec3 aP1;
  attribute vec3 aP2;
  attribute vec3 aP3;
  attribute vec3 aP4;
  attribute vec3 aInfo; // rand, role, verdict
  // Explicit precision: these uniforms also appear in the fragment stage,
  // and a mismatched default breaks program linking.
  uniform mediump float uProgress; // 0..4
  uniform mediump float uTime;
  uniform mediump float uPixelRatio;
  varying float vRand;
  varying float vRole;
  varying float vVerdict;
  varying vec3 vPos;
  varying float vLit;
  varying float vHot;
  varying float vPing;

  vec3 pick(float s) {
    float f = clamp(s, 0.0, 4.0);
    int i = int(floor(min(f, 3.0)));
    float t = f - float(i);
    // Hold, then travel: each act stands for most of its interval and
    // crosses in the last third — so every formation is actually seen,
    // and the copy crossfade lands on a formed subject, not a cloud.
    // Per-particle stagger keeps the crossing a wave, not a cut.
    t = clamp((t - (0.58 + aInfo.x * 0.14)) / 0.28, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    vec3 a; vec3 b;
    if (i == 0) { a = aP0; b = aP1; }
    else if (i == 1) { a = aP1; b = aP2; }
    else if (i == 2) { a = aP2; b = aP3; }
    else { a = aP3; b = aP4; }
    return mix(a, b, t);
  }

  void main() {
    // Fully formed from the first frame — the user's own note: the
    // document is simply there. The scroll turns the pages; it never
    // builds the furniture.
    vec3 pos = pick(uProgress);
    // Breath: nothing organic is perfectly still. (Grain lives in the
    // fragment's alpha flicker — positional static blurred the contours.)
    pos += 0.04 * vec3(
      sin(uTime * 0.7 + aInfo.x * 43.0),
      cos(uTime * 0.6 + aInfo.x * 29.0),
      sin(uTime * 0.8 + aInfo.x * 61.0)
    );
    // The machine zone's own clock — the swipe: a VERTICAL bar of light
    // spanning all three lines at once, travelling LEFT TO RIGHT the way
    // a document is actually swiped. The unread text ahead of the bar is
    // a ghost — barely there, so the bar has something to reveal — the
    // bar itself is a hot column, and behind it a trail of light decays
    // into the steady read-state. Characters swell AND lift as the bar
    // takes them; the right end closes with the zone holding lit while
    // the check digits burn green, then the swipe begins again.
    // No wholesale highlight, ever: the zone is ghost text at rest. The
    // bar sweeps left and right, back and forth, and the only light in
    // the zone is the bar itself and a short wake trailing BEHIND its
    // direction of travel — what it has passed falls straight back to
    // ghost. Each time it lands on the right end, the check digits alone
    // flash green.
    float waveX = sin(uTime * 0.7) * 2.9;
    float dirS = sign(cos(uTime * 0.7) + 0.0001);
    float inZone = step(-2.02, pos.y) * (1.0 - step(-1.2, pos.y));
    float w0v = max(0.0, 1.0 - abs(uProgress) * 1.4);
    float back = (waveX - pos.x) * dirS;
    vLit = step(0.0, back) * exp(-max(back, 0.0) * 1.4) * inZone * w0v;
    vHot = exp(-pow((pos.x - waveX) * 3.0, 2.0)) * inZone * w0v;
    vPing = smoothstep(0.86, 0.985, sin(uTime * 0.7)) * w0v;
    // The bar is felt, not just seen: the characters under it ripple up.
    pos.y += vHot * 0.055;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = 2.5 + aInfo.y * 1.25 + aInfo.z * 1.2;
    float pulse = 0.88 + 0.12 * sin(uTime * 1.3 + aInfo.x * 40.0);
    // The pop: a character swells under the bar as it is taken.
    gl_PointSize = size * uPixelRatio * (10.0 / -mv.z) * pulse
      * (1.0 + vHot * 1.5);
    vRand = aInfo.x;
    vRole = aInfo.y;
    vVerdict = aInfo.z;
    vPos = pos;
  }
`;

const FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform mediump float uProgress;
  uniform mediump float uTime;
  varying float vRand;
  varying float vRole;
  varying float vVerdict;
  varying vec3 vPos;
  varying float vLit;
  varying float vHot;
  varying float vPing;

  // Sharper than the morph: an act's light belongs to its act. At each
  // act's centre this is exactly 1, so tightening the tails never changes
  // how an act looks when it is fully on stage.
  float win(float k) { return max(0.0, 1.0 - abs(uProgress - k) * 1.4); }

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.1, d);

    float w0 = win(0.0);
    float w1 = win(1.0);
    float w2 = win(2.0);
    float w3 = win(3.0);
    float w4 = win(4.0);

    // The acts' own light — all of it on the clock, so every act is
    // visibly working even when the scroll is standing still. The machine
    // zone's read arrives from the vertex stage as vLit / vHot / vPing.
    // The commit: the phone's fields lighting in sequence as they fill.
    float rowIdx = floor(clamp((1.15 - vPos.y) / 0.8 + 0.5, 0.0, 2.99));
    float sweepRow = fract(uTime / 3.2) * 4.5 - 0.75;
    float commit = exp(-pow((rowIdx - sweepRow) * 1.1, 2.0)) * w1 * step(0.9, vPos.x);
    float ripple = pow(0.5 + 0.5 * sin(length(vPos.xy) * 2.8 - uTime * 2.1), 6.0) * w2;
    float scan = pow(0.5 + 0.5 * sin(vPos.y * 2.2 - uTime * 1.7), 10.0) * w3;
    // Packets serve two acts: the lift up to the screen, the bridge
    // between the subjects — and they run both ways, because the
    // comparison is a conversation.
    float dir = mix(-1.0, 1.0, step(0.5, fract(vRand * 7.3)));
    float packet = pow(smoothstep(0.42, 0.0, fract(vPos.x * 0.42 * dir - uTime * 0.55 - vRand * 3.0)), 2.0)
      * (w4 + 0.85 * w1);

    float alpha = 0.32 + 0.10 * vRand;
    alpha += vRole * (0.26 + 0.5 * commit + 0.2 * w1);
    // The screen's arriving text holds its own light beside the streams.
    alpha += (1.0 - vRole)
      * (0.45 * commit + 0.2 * w1 * step(0.9, vPos.x));
    // The read: unread text is a ghost the bar reveals; taken characters
    // hold their light; the bar itself burns.
    float zoneMask = w0 * step(-2.02, vPos.y) * (1.0 - step(-1.2, vPos.y));
    float ghost = zoneMask * (1.0 - clamp(vLit * 2.6 + vHot * 2.0, 0.0, 1.0));
    alpha *= 1.0 - 0.72 * ghost;
    alpha += 0.9 * vLit + 1.9 * vHot;
    alpha += ripple * (0.35 + vRole * 0.5);
    alpha += scan * 0.5;
    alpha += vRole * packet * 0.9;
    // Sensor grain on the live capture.
    alpha *= 1.0 + 0.22 * w3 * sin(uTime * 9.0 + vRand * 80.0);
    // The verdict holds its light for the last act.
    alpha = mix(alpha, 0.15 + w4 * 1.1 + vPing * 1.05 + 0.3 * vLit, vVerdict);
    alpha *= disc;
    if (alpha < 0.004) discard;

    vec3 bone = vec3(0.925, 0.913, 0.882);
    vec3 signal = vec3(0.52, 0.63, 1.0);
    vec3 positive = vec3(0.30, 0.85, 0.58);
    float signalness = vRole * clamp(0.3 * (1.0 - w0) + 0.6 * vLit + vHot + commit + w1 * 0.4 + ripple + packet, 0.0, 1.0);
    vec3 col = mix(bone, signal, signalness);
    col = mix(col, signal, (1.0 - vRole) * clamp(vHot + 0.4 * vLit + ripple + scan, 0.0, 0.7) * 0.6);
    // The bar's core runs near-white — light, not paint.
    col = mix(col, vec3(0.84, 0.88, 1.0), clamp(vHot * 1.2, 0.0, 1.0) * 0.85);
    col = mix(col, positive, vVerdict * max(smoothstep(3.2, 3.9, uProgress), vPing));
    gl_FragColor = vec4(col, alpha * 0.9);
  }
`;

/** World-space x of the subject per act, opposite that act's copy column.
 *  The last act swings widest: it holds two subjects side by side, and the
 *  leftmost of them still has to clear the copy. */
const STAGE_OFFSET = [3.1, -2.2, 3.1, -3.1, 3.3];
/** Camera distance per act: close on the card, out for the field, close
 *  on the face, out far enough at the end to hold both subjects whole. */
const STAGE_Z = [10.4, 9.8, 11.8, 8.6, 12.6];

/** Camera and swing keep the morph's own rhythm: hold through the act,
 *  travel with the crossing. */
function interpStage(values: number[], p: number) {
  const seg = Math.max(0, Math.min(values.length - 2, Math.floor(p)));
  return THREE.MathUtils.lerp(
    values[seg],
    values[seg + 1],
    THREE.MathUtils.smoothstep(p - seg, 0.58, 0.95),
  );
}

function IdentityMesh({ bus }: { bus: IdentityBusRef }) {
  const model = useMemo(() => buildModel(), []);
  const groupRef = useRef<THREE.Group>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
    }),
    [],
  );

  /* The line accents: each act's hairline furniture, shown only for its
     act — the card edge and printed rules for the document, the field
     boxes, the halo, the miniature card, the bridge rails, the verdict's
     square with the site's own drawn tick inside it. */
  const lineGeo = useMemo(() => {
    const rect = (
      cx: number,
      cy: number,
      hw: number,
      hh: number,
      z = 0,
    ): number[][] => [
      [cx - hw, cy + hh, z, cx + hw, cy + hh, z],
      [cx + hw, cy + hh, z, cx + hw, cy - hh, z],
      [cx + hw, cy - hh, z, cx - hw, cy - hh, z],
      [cx - hw, cy - hh, z, cx - hw, cy + hh, z],
    ];
    const segs = (pairs: number[][]) => {
      const arr = new Float32Array(pairs.length * 6);
      pairs.forEach((p, i) => arr.set(p, i * 6));
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      return g;
    };

    /* The scanner, as simple as it can honestly be: one vertical line
       spanning the machine zone with a little overshoot. Nothing else. */
    const scanCore = segs([[0, -2.24, 0.05, 0, -1.08, 0.05]]);
    // A capture reticle's corner brackets.
    const brackets = (
      cx: number,
      cy: number,
      hw: number,
      hh: number,
      arm: number,
    ): number[][] => [
      [cx - hw, cy + hh - arm, 0, cx - hw, cy + hh, 0],
      [cx - hw, cy + hh, 0, cx - hw + arm, cy + hh, 0],
      [cx + hw - arm, cy + hh, 0, cx + hw, cy + hh, 0],
      [cx + hw, cy + hh, 0, cx + hw, cy + hh - arm, 0],
      [cx + hw, cy - hh + arm, 0, cx + hw, cy - hh, 0],
      [cx + hw, cy - hh, 0, cx + hw - arm, cy - hh, 0],
      [cx - hw + arm, cy - hh, 0, cx - hw, cy - hh, 0],
      [cx - hw, cy - hh, 0, cx - hw, cy - hh + arm, 0],
    ];
    // The OCR scene's hardware: the phone (body, punch-hole, home bar),
    // its three field boxes, and the reticle looking at the document.
    const fields = segs([
      ...rect(2.1, 0.1, 1.15, 2.35),
      [2.0, 2.12, 0, 2.2, 2.12, 0],
      [1.9, -2.14, 0, 2.3, -2.14, 0],
      ...rect(2.05, 1.15, 0.82, 0.3),
      ...rect(2.05, 0.35, 0.82, 0.3),
      ...rect(2.05, -0.45, 0.82, 0.3),
      ...brackets(-1.2, -0.35, 2.25, 1.55, 0.34),
    ]);
    const haloPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 72; i += 1) {
      const a = (i / 72) * Math.PI * 2;
      haloPts.push(
        new THREE.Vector3(Math.cos(a) * 2.45, 0.1 + Math.sin(a) * 2.45, 0),
      );
    }
    const halo = new THREE.BufferGeometry().setFromPoints(haloPts);
    // A sampled curve, packed as segment pairs so it can live in the same
    // LineSegments as the straight furniture.
    const arc = (
      a: [number, number],
      c: [number, number],
      b: [number, number],
    ): number[][] => {
      const pts: [number, number][] = [];
      for (let i = 0; i <= 20; i += 1) {
        const t = i / 20;
        const q = (p0: number, p1: number, p2: number) =>
          (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
        pts.push([q(a[0], c[0], b[0]), q(a[1], c[1], b[1])]);
      }
      return pts
        .slice(1)
        .map((p2, i) => [pts[i][0], pts[i][1], 0, p2[0], p2[1], 0]);
    };
    // The match act's structure: the miniature card, the bridge rails, and
    // the 2D face-match drawing's own circulating curves grown to stage
    // size — the comparison travelling over and back.
    const match = segs([
      ...rect(-2.75, 0.1, 1.15, 1.55),
      [-1.3, 0.34, 0, 1.6, 0.34, 0],
      [-1.3, -0.34, 0, 1.6, -0.34, 0],
      ...arc([-2.85, 1.2], [0.1, 2.5], [2.15, 1.6]),
      ...arc([-2.85, -0.95], [0.1, -2.25], [2.25, -1.15]),
      // The live subject under capture, the way the 2D drawing frames it.
      ...brackets(2.55, 0.2, 1.3, 1.65, 0.3),
    ]);
    // Agreement: the square, and the tick the whole site draws verdicts
    // with.
    const green = segs([
      ...rect(0.15, 0, 0.25, 0.25),
      [0.02, 0.0, 0.01, 0.12, -0.12, 0.01],
      [0.12, -0.12, 0.01, 0.33, 0.13, 0.01],
    ]);
    return { scanCore, fields, halo, match, green };
  }, []);
  const scanRef = useRef<THREE.Group>(null);
  const scanCoreMat = useRef<THREE.LineBasicMaterial>(null);
  const scanGlowMat = useRef<THREE.MeshBasicMaterial>(null);
  const fieldsMat = useRef<THREE.LineBasicMaterial>(null);
  const haloMat = useRef<THREE.LineBasicMaterial>(null);
  const matchMat = useRef<THREE.LineBasicMaterial>(null);
  const greenMat = useRef<THREE.LineBasicMaterial>(null);
  const haloRef = useRef<THREE.LineLoop>(null);
  const clock = useRef(0);

  useFrame((state, delta) => {
    const p = bus.current.progress * 4;
    const dt = Math.min(delta, 1 / 30);
    if (process.env.NODE_ENV === "development") {
      (window as unknown as Record<string, unknown>).__idmat = mat.current;
    }
    if (mat.current) {
      mat.current.uniforms.uProgress.value = p;
      mat.current.uniforms.uTime.value += dt;
      mat.current.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    }

    clock.current += dt;
    const t = clock.current;
    // Furniture is stricter than light: hairlines belong to one act only.
    const win = (k: number) => Math.max(0, 1 - Math.abs(p - k) * 1.8);
    // The scan line rides the same sine as the shader's bar.
    if (scanRef.current) scanRef.current.position.x = Math.sin(t * 0.7) * 2.9;
    if (scanCoreMat.current) scanCoreMat.current.opacity = 0.9 * win(0);
    if (scanGlowMat.current) scanGlowMat.current.opacity = 0.1 * win(0);
    // The OCR act's hardware has to hold its own beside the streams.
    if (fieldsMat.current) fieldsMat.current.opacity = 0.5 * win(1);
    if (haloMat.current) haloMat.current.opacity = 0.4 * win(3);
    if (matchMat.current) matchMat.current.opacity = 0.3 * win(4);
    if (greenMat.current)
      greenMat.current.opacity = 0.85 * Math.max(0, win(4) - 0.15);
    if (haloRef.current) haloRef.current.rotation.z += dt * 0.25;

    if (groupRef.current) {
      const swing = interpStage(STAGE_OFFSET, p) * bus.current.spread;
      groupRef.current.position.x +=
        (swing - groupRef.current.position.x) * (1 - Math.pow(0.0025, dt));
      // A slow float, always: the subject is never a still image.
      groupRef.current.position.y = Math.sin(t * 0.4) * 0.06;
      const targetX = -0.06 + bus.current.pointer[1] * 0.07;
      // A standing sway everywhere, and in the face's act the deliberate
      // yaw a liveness check asks for — the cheapest proof on the page
      // that the head is a solid.
      const targetY =
        bus.current.pointer[0] * 0.16 +
        Math.sin(t * 0.23) * 0.05 +
        Math.sin(t * 0.5) * 0.16 * win(3);
      groupRef.current.rotation.x +=
        (targetX - groupRef.current.rotation.x) * (1 - Math.pow(0.002, dt));
      groupRef.current.rotation.y +=
        (targetY - groupRef.current.rotation.y) * (1 - Math.pow(0.002, dt));
    }
  });

  return (
    <group ref={groupRef}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(N * 3), 3]}
          />
          <bufferAttribute attach="attributes-aP0" args={[model.forms[0], 3]} />
          <bufferAttribute attach="attributes-aP1" args={[model.forms[1], 3]} />
          <bufferAttribute attach="attributes-aP2" args={[model.forms[2], 3]} />
          <bufferAttribute attach="attributes-aP3" args={[model.forms[3], 3]} />
          <bufferAttribute attach="attributes-aP4" args={[model.forms[4], 3]} />
          <bufferAttribute attach="attributes-aInfo" args={[model.info, 3]} />
        </bufferGeometry>
        <shaderMaterial
          ref={mat}
          vertexShader={VERTEX}
          fragmentShader={FRAGMENT}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <group ref={scanRef}>
        <mesh position={[0, -1.66, 0.01]}>
          <planeGeometry args={[0.26, 1.16]} />
          <meshBasicMaterial
            ref={scanGlowMat}
            color="#2d46ff"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <lineSegments geometry={lineGeo.scanCore}>
          <lineBasicMaterial
            ref={scanCoreMat}
            color="#7290ff"
            transparent
            opacity={0}
          />
        </lineSegments>
      </group>
      <lineSegments geometry={lineGeo.fields}>
        <lineBasicMaterial
          ref={fieldsMat}
          color="#ece9e1"
          transparent
          opacity={0}
        />
      </lineSegments>
      <lineLoop ref={haloRef} geometry={lineGeo.halo}>
        <lineBasicMaterial
          ref={haloMat}
          color="#ece9e1"
          transparent
          opacity={0}
        />
      </lineLoop>
      <lineSegments geometry={lineGeo.match}>
        <lineBasicMaterial
          ref={matchMat}
          color="#ece9e1"
          transparent
          opacity={0}
        />
      </lineSegments>
      <lineSegments geometry={lineGeo.green}>
        <lineBasicMaterial
          ref={greenMat}
          color="#4dd995"
          transparent
          opacity={0}
        />
      </lineSegments>
    </group>
  );
}

function IdentityCamera({ bus }: { bus: IdentityBusRef }) {
  const target = useRef(new THREE.Vector3());
  useFrame((state, delta) => {
    const p = bus.current.progress * 4;
    const z = interpStage(STAGE_Z, p);
    const x = bus.current.pointer[0] * 0.5;
    const y = bus.current.pointer[1] * 0.35 - 0.15;
    target.current.set(x, y, z);
    const k = 1 - Math.pow(0.0018, Math.min(delta, 1 / 30));
    state.camera.position.lerp(target.current, k);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function IdentityScene({
  bus,
  active,
}: {
  bus: IdentityBusRef;
  active: boolean;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.8]}
      camera={{ position: [0, -0.15, 10.4], fov: 46, near: 0.1, far: 80 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => gl.setClearColor(INK, 1)}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      <IdentityMesh bus={bus} />
      <IdentityCamera bus={bus} />
    </Canvas>
  );
}
