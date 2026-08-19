"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type HeroBusRef = { current: HeroBus };

export type HeroBus = {
  /** 0 → 1 while the hero scrolls out of view. */
  progress: number;
  /** Pointer in NDC (-1..1, y up). */
  pointer: [number, number];
};

/**
 * An eclipse behind weather.
 *
 * Every previous attempt here was made of things — particles, a lattice, a
 * beam of filaments — and every one of them fought the headline and the
 * device for attention, because a hundred moving objects will always beat two
 * still ones. This is made of light instead: one dark disc with a lit rim,
 * the atmosphere it is glowing through, and a horizon under it. There is
 * nothing to count and nothing moving quickly, which is exactly why it can
 * carry a frame that already has a subject in it.
 *
 * It is also one fullscreen fragment shader — a single draw call, no
 * geometry, no per-particle state.
 */
const FULLSCREEN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // The quad is already in clip space; no camera is involved.
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const ECLIPSE_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uPointer;
  uniform float uProgress;
  varying vec2 vUv;

  /* — value noise, and enough octaves of it to read as weather */
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  const mat2 ROT = mat2(0.80, 0.60, -0.60, 0.80);
  float fbm6(vec2 p) {
    float v = 0.0, a = 0.55;
    for (int i = 0; i < 6; i++) { v += a * vnoise(p); p = ROT * p * 2.03; a *= 0.5; }
    return v;
  }
  float fbm4(vec2 p) {
    float v = 0.0, a = 0.55;
    for (int i = 0; i < 4; i++) { v += a * vnoise(p); p = ROT * p * 2.03; a *= 0.5; }
    return v;
  }

  /** Where the disc sits, in screen fractions. Right of centre and high, so
   *  the device stands against its lower arc rather than covering it. */
  const vec2 DISC_UV = vec2(0.615, 0.60);
  const float R = 0.285;

  void main() {
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);

    // The pointer leans the whole sky a little; scroll lifts it away.
    vec2 drift = uPointer * 0.018;
    vec2 c = (DISC_UV - 0.5) * vec2(aspect, 1.0) + drift + vec2(0.0, uProgress * 0.26);

    vec2 rel = p - c;
    float d = length(rel);
    vec2 n = rel / max(d, 1e-4);
    float edge = abs(d - R);

    // The rim is not evenly lit — it is a crescent, brightest where the arc
    // faces the light and dying round the back. That one term is most of why
    // this reads as an eclipse and not a ring.
    vec2 L = normalize(vec2(-0.36, 0.93));
    float lit = smoothstep(-0.5, 0.88, dot(n, L));
    // A slow wander in the lit side, so the crescent breathes.
    lit *= 0.86 + 0.14 * sin(uTime * 0.11);

    float rim = exp(-pow(edge / 0.0055, 2.0)) * lit;
    float bloom = exp(-pow(edge / 0.06, 2.0)) * lit * 0.55;
    float wash = exp(-pow(max(0.0, d - R) / 0.34, 2.0)) * lit * 0.18;

    /* — weather. Two layers at different scales and speeds so it has depth
         rather than a single sliding texture. */
    vec2 q = p * 1.9;
    float w1 = fbm6(q + vec2(uTime * 0.010, uTime * -0.006));
    float w2 = fbm4(q * 2.1 + vec2(uTime * -0.016, uTime * 0.009) + w1 * 0.5);
    float weather = smoothstep(0.22, 1.0, w1 * 0.65 + w2 * 0.45);

    // Densest just under the disc, thinning upward — the horizon it glows
    // through.
    float band = exp(-pow((p.y + 0.12) / 0.30, 2.0));
    float atmos = weather * (0.20 + band * 1.05);

    // The disc is opaque: the weather passes behind it, not through it.
    float inside = smoothstep(R, R - 0.003, d);
    atmos *= 1.0 - inside * 0.88;
    // And it occludes its own bloom slightly, which gives it a body.
    float body = inside * 0.06;

    /* — one hue family, the way the reference holds to one */
    vec3 deep = vec3(0.030, 0.032, 0.045);
    vec3 mid = vec3(0.145, 0.180, 0.470);
    vec3 hot = vec3(0.760, 0.830, 1.000);

    vec3 col = deep;
    col += mid * atmos * 0.95;
    col += mix(mid, hot, 0.62) * (bloom + wash);
    col += hot * rim * 1.65;
    col -= vec3(0.02, 0.022, 0.03) * body;

    // Falls off to the corners, hardest bottom-left where the type sits.
    float vig = smoothstep(1.20, 0.28, length((p - vec2(-0.10, -0.05)) * vec2(0.92, 1.30)));
    col *= 0.30 + vig * 0.80;

    // Ordered dither: six octaves of noise band badly in a dark gradient.
    float dither = (hash(vUv * uRes) - 0.5) * 0.014;
    gl_FragColor = vec4(max(col + dither, 0.0), 1.0);
  }
`;

function Eclipse({ bus }: { bus: HeroBusRef }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const size = useThree((s) => s.size);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uProgress: { value: 0 },
    }),
    [],
  );

  const eased = useRef(new THREE.Vector2(0, 0));

  useFrame((state, delta) => {
    const m = mat.current;
    if (!m) return;
    const dt = Math.min(delta, 1 / 30);
    m.uniforms.uTime.value += dt;
    m.uniforms.uRes.value.set(
      size.width * state.gl.getPixelRatio(),
      size.height * state.gl.getPixelRatio(),
    );
    const [px, py] = bus.current.pointer;
    const k = 1 - Math.pow(0.02, dt);
    eased.current.x += (px - eased.current.x) * k;
    eased.current.y += (py - eased.current.y) * k;
    m.uniforms.uPointer.value.copy(eased.current);
    m.uniforms.uProgress.value = bus.current.progress;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={FULLSCREEN_VERT}
        fragmentShader={ECLIPSE_FRAG}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function HeroScene({
  bus,
  active,
}: {
  bus: HeroBusRef;
  /** Unused; kept so the caller's shape does not have to change. */
  count?: number;
  active: boolean;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.5]}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
      }}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      <Eclipse bus={bus} />
    </Canvas>
  );
}
