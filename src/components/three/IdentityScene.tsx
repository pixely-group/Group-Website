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
 *   0  DOCUMENT — the ID assembles out of scatter: outline, portrait,
 *      data lines, and three dense rows of machine characters. The
 *      reader's crest sweeps the machine zone.
 *   1  FIELDS — the print lifts off and re-sorts into five structured
 *      rows, stacked in depth: the document as data.
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
  scatter: Float32Array;
  forms: Float32Array[]; // five formations, N*3 each
  info: Float32Array; // rand, role(0 base / 1 signal), verdict flag
};

function buildModel(): Model {
  const rand = mulberry32(20260829);
  const scatter = new Float32Array(N * 3);
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

    /* Scatter: a loose flattened cloud to assemble out of. */
    {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const rr = 6.5 + rand() * 4.5;
      set(
        scatter,
        i,
        rr * Math.sin(phi) * Math.cos(theta),
        rr * Math.sin(phi) * Math.sin(theta) * 0.7,
        rr * Math.cos(phi) * 0.55,
      );
    }

    /* ——— 0 DOCUMENT ——— */
    if (isVerdict) {
      // The check digits: dense stubs at the machine rows' right ends.
      const row = Math.floor(u * 300) % 3;
      set(
        forms[0],
        i,
        2.72 + rand() * 0.34,
        -1.34 - row * 0.27 + (rand() - 0.5) * 0.07,
        (rand() - 0.5) * 0.05,
      );
    } else if (isSignal) {
      // Machine characters: three tight rows across the card's foot.
      const row = i % 3;
      set(
        forms[0],
        i,
        -3.0 + rand() * 5.5,
        -1.34 - row * 0.27 + (rand() - 0.5) * 0.06,
        (rand() - 0.5) * 0.05,
      );
    } else if (u < 0.2) {
      // Outline: the card's own perimeter.
      const t = rand() * 2;
      const w = 3.4;
      const h = 2.2;
      const along = t % 1;
      if (t < 0.5) set(forms[0], i, -w + along * 2 * w * 2, h, 0);
      else if (t < 1) set(forms[0], i, w, h - along * 2 * h * 2, 0);
      else if (t < 1.5) set(forms[0], i, w - along * 2 * w * 2, -h, 0);
      else set(forms[0], i, -w, -h + along * 2 * h * 2, 0);
      forms[0][i * 3] += (rand() - 0.5) * 0.05;
      forms[0][i * 3 + 1] += (rand() - 0.5) * 0.05;
    } else if (u < 0.42) {
      // Portrait: an oval of a person, upper left.
      const a = rand() * Math.PI * 2;
      const rr = Math.sqrt(rand());
      set(
        forms[0],
        i,
        -2.2 + Math.cos(a) * rr * 0.62,
        0.62 + Math.sin(a) * rr * 0.82,
        (rand() - 0.5) * 0.08,
      );
    } else if (u < 0.68) {
      // Data lines: four printed rows right of the portrait.
      const row = Math.floor(rand() * 4);
      set(
        forms[0],
        i,
        -1.1 + rand() * (3.6 - row * 0.5),
        1.55 - row * 0.5 + (rand() - 0.5) * 0.05,
        (rand() - 0.5) * 0.05,
      );
    } else {
      // The card's body: a faint fill sitting slightly behind.
      set(
        forms[0],
        i,
        (rand() - 0.5) * 6.6,
        (rand() - 0.5) * 4.2,
        -0.18 - rand() * 0.1,
      );
    }

    /* ——— 1 FIELDS ——— */
    {
      const row = isVerdict ? 2 : Math.floor(rand() * 5);
      const y = 1.8 - row * 0.9;
      const z = (2 - row) * 0.5;
      if (isVerdict) {
        set(
          forms[1],
          i,
          2.55 + rand() * 0.3,
          y + (rand() - 0.5) * 0.24,
          z + (rand() - 0.5) * 0.06,
        );
      } else if (isSignal) {
        // The row's leading mark — the field's own square.
        set(
          forms[1],
          i,
          -2.85 + rand() * 0.5,
          y + (rand() - 0.5) * 0.3,
          z + (rand() - 0.5) * 0.06,
        );
      } else {
        const lane = rand() < 0.5 ? 0.15 : -0.15;
        set(
          forms[1],
          i,
          -2.1 + rand() * 4.5,
          y + lane + (rand() - 0.5) * 0.05,
          z + (rand() - 0.5) * 0.06,
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
        if (u < 0.36) {
          // Eyes: two watching clusters.
          const side = u < 0.18 ? -1 : 1;
          const a = rand() * Math.PI * 2;
          const rr = Math.sqrt(rand()) * 0.17;
          set(
            forms[3],
            i,
            side * 0.6 + Math.cos(a) * rr,
            0.5 + Math.sin(a) * rr * 0.7,
            1.18 + (rand() - 0.5) * 0.06,
          );
        } else if (u < 0.58) {
          // The mouth: a short front arc.
          const a = -0.5 + rand();
          set(
            forms[3],
            i,
            a * 1.0,
            -1.0 - Math.abs(a) * 0.16 + (rand() - 0.5) * 0.05,
            1.2 - Math.abs(a) * 0.32,
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
          z += 0.42 * (1 - Math.abs(x) / 0.42) * (1 - Math.abs(y + 0.18) / 1.05);
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
        // The bridge: two packet lanes between the subjects.
        const lane = rand() < 0.5 ? 0.16 : -0.16;
        set(
          forms[4],
          i,
          -1.25 + rand() * 2.8,
          lane + (rand() - 0.5) * 0.05,
          (rand() - 0.5) * 0.08,
        );
      } else if (r < 0.45) {
        // The document self: the portrait flattened, standing left.
        const a = rand() * Math.PI * 2;
        const rr = Math.sqrt(rand());
        if (rand() < 0.6) {
          set(
            forms[4],
            i,
            -2.75 + Math.cos(a) * rr * 0.66,
            0.2 + Math.sin(a) * rr * 0.9,
            (rand() - 0.5) * 0.08,
          );
        } else {
          // Its card edge.
          const t = rand() * 2;
          const w = 1.15;
          const h = 1.65;
          const along = t % 1;
          let x = 0;
          let y = 0;
          if (t < 0.5) {
            x = -w + along * 2 * w * 2;
            y = h;
          } else if (t < 1) {
            x = w;
            y = h - along * 2 * h * 2;
          } else if (t < 1.5) {
            x = w - along * 2 * w * 2;
            y = -h;
          } else {
            x = -w;
            y = -h + along * 2 * h * 2;
          }
          set(forms[4], i, -2.75 + x, 0.2 + y, (rand() - 0.5) * 0.06);
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

  return { scatter, forms, info };
}

const VERTEX = /* glsl */ `
  attribute vec3 aScatter;
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

  vec3 pick(float s) {
    float f = clamp(s, 0.0, 4.0);
    int i = int(floor(min(f, 3.0)));
    float t = f - float(i);
    // Per-particle stagger: the morph travels as a wave, not a cut.
    t = clamp((t - aInfo.x * 0.22) / 0.78, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    vec3 a; vec3 b;
    if (i == 0) { a = aP0; b = aP1; }
    else if (i == 1) { a = aP1; b = aP2; }
    else if (i == 2) { a = aP2; b = aP3; }
    else { a = aP3; b = aP4; }
    return mix(a, b, t);
  }

  void main() {
    vec3 formed = pick(uProgress);
    // Assembly out of scatter across the first act's approach.
    float assemble = smoothstep(0.02, 0.5, uProgress + 0.5 - aInfo.x * 0.3);
    vec3 pos = mix(aScatter, formed, assemble);
    // Breath: nothing organic is perfectly still.
    pos += 0.035 * vec3(
      sin(uTime * 0.7 + aInfo.x * 43.0),
      cos(uTime * 0.6 + aInfo.x * 29.0),
      sin(uTime * 0.8 + aInfo.x * 61.0)
    );
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = 2.3 + aInfo.y * 1.1 + aInfo.z * 1.2;
    float pulse = 0.88 + 0.12 * sin(uTime * 1.3 + aInfo.x * 40.0);
    gl_PointSize = size * uPixelRatio * (10.0 / -mv.z) * pulse;
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

  float win(float k) { return max(0.0, 1.0 - abs(uProgress - k)); }

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.1, d);

    float w0 = win(0.0);
    float w1 = win(1.0);
    float w2 = win(2.0);
    float w3 = win(3.0);
    float w4 = win(4.0);

    // The acts' own light.
    float beam = pow(0.5 + 0.5 * sin(vPos.x * 1.9 - uTime * 2.6), 8.0) * w0;
    float ripple = pow(0.5 + 0.5 * sin(length(vPos.xy) * 2.8 - uTime * 2.1), 6.0) * w2;
    float scan = pow(0.5 + 0.5 * sin(vPos.y * 2.2 - uTime * 1.7), 10.0) * w3;
    float packet = pow(smoothstep(0.42, 0.0, fract(vPos.x * 0.42 - uTime * 0.55 - vRand * 3.0)), 2.0) * w4;

    float alpha = 0.30 + 0.10 * vRand;
    alpha += vRole * (0.20 + 0.5 * (beam + w1 * 0.6) );
    alpha += ripple * (0.35 + vRole * 0.5);
    alpha += scan * 0.5;
    alpha += vRole * packet * 0.9;
    // The verdict holds its light for the last act.
    alpha = mix(alpha, 0.15 + w4 * 1.1, vVerdict);
    alpha *= disc;
    if (alpha < 0.004) discard;

    vec3 bone = vec3(0.925, 0.913, 0.882);
    vec3 signal = vec3(0.52, 0.63, 1.0);
    vec3 positive = vec3(0.30, 0.85, 0.58);
    float signalness = vRole * clamp(0.35 + beam + w1 * 0.5 + ripple + packet, 0.0, 1.0);
    vec3 col = mix(bone, signal, signalness);
    col = mix(col, signal, (1.0 - vRole) * clamp(ripple + scan, 0.0, 0.7) * 0.6);
    col = mix(col, positive, vVerdict * smoothstep(3.2, 3.9, uProgress));
    gl_FragColor = vec4(col, alpha * 0.9);
  }
`;

/** World-space x of the subject per act, opposite that act's copy column.
 *  The last act swings widest: it holds two subjects side by side, and the
 *  leftmost of them still has to clear the copy. */
const STAGE_OFFSET = [3.1, -3.1, 3.1, -3.1, 3.6];
/** Camera distance per act: close on the card, out for the field, close
 *  on the face, out again to hold both subjects. */
const STAGE_Z = [10.4, 9.8, 11.8, 8.6, 11.6];

function interpStage(values: number[], p: number) {
  const seg = Math.max(0, Math.min(values.length - 2, Math.floor(p)));
  return THREE.MathUtils.lerp(
    values[seg],
    values[seg + 1],
    THREE.MathUtils.smoothstep(p - seg, 0, 1),
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

  /* The line accents: the card's edge in act 0, the halo in act 3, the
     verdict's square in act 4 — hairline geometry over the particles,
     each shown only for its act. */
  const lineGeo = useMemo(() => {
    const card = new THREE.BufferGeometry().setFromPoints(
      [
        [-3.4, 2.2],
        [3.4, 2.2],
        [3.4, -2.2],
        [-3.4, -2.2],
      ].map(([x, y]) => new THREE.Vector3(x, y, 0)),
    );
    const haloPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 72; i += 1) {
      const a = (i / 72) * Math.PI * 2;
      haloPts.push(
        new THREE.Vector3(Math.cos(a) * 2.45, 0.1 + Math.sin(a) * 2.45, 0),
      );
    }
    const halo = new THREE.BufferGeometry().setFromPoints(haloPts);
    const verdict = new THREE.BufferGeometry().setFromPoints(
      [
        [-0.1, 0.25],
        [0.4, 0.25],
        [0.4, -0.25],
        [-0.1, -0.25],
      ].map(([x, y]) => new THREE.Vector3(x, y, 0)),
    );
    return { card, halo, verdict };
  }, []);
  const cardMat = useRef<THREE.LineBasicMaterial>(null);
  const haloMat = useRef<THREE.LineBasicMaterial>(null);
  const verdictMat = useRef<THREE.LineBasicMaterial>(null);
  const haloRef = useRef<THREE.LineLoop>(null);

  useFrame((state, delta) => {
    const p = bus.current.progress * 4;
    const dt = Math.min(delta, 1 / 30);
    if (mat.current) {
      mat.current.uniforms.uProgress.value = p;
      mat.current.uniforms.uTime.value += dt;
      mat.current.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    }

    const win = (k: number) => Math.max(0, 1 - Math.abs(p - k));
    if (cardMat.current) cardMat.current.opacity = 0.34 * win(0);
    if (haloMat.current) haloMat.current.opacity = 0.4 * win(3);
    if (verdictMat.current)
      verdictMat.current.opacity = 0.85 * Math.max(0, win(4) - 0.15);
    if (haloRef.current) haloRef.current.rotation.z += dt * 0.25;

    if (groupRef.current) {
      const swing = interpStage(STAGE_OFFSET, p) * bus.current.spread;
      groupRef.current.position.x +=
        (swing - groupRef.current.position.x) * (1 - Math.pow(0.0025, dt));
      const targetX = -0.06 + bus.current.pointer[1] * 0.07;
      const targetY = bus.current.pointer[0] * 0.16;
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
          <bufferAttribute attach="attributes-aScatter" args={[model.scatter, 3]} />
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
      <lineLoop geometry={lineGeo.card}>
        <lineBasicMaterial
          ref={cardMat}
          color="#ece9e1"
          transparent
          opacity={0}
        />
      </lineLoop>
      <lineLoop ref={haloRef} geometry={lineGeo.halo}>
        <lineBasicMaterial
          ref={haloMat}
          color="#ece9e1"
          transparent
          opacity={0}
        />
      </lineLoop>
      <lineLoop geometry={lineGeo.verdict}>
        <lineBasicMaterial
          ref={verdictMat}
          color="#4dd995"
          transparent
          opacity={0}
        />
      </lineLoop>
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
        antialias: false,
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
