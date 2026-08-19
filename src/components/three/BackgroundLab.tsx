"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export type LabVariant = "aurora" | "chrome" | "warp" | "core";

export const LAB_VARIANTS: { id: LabVariant; name: string; note: string }[] = [
  { id: "aurora", name: "Aurora curtains", note: "Volumetric ribbons of light, rising and folding. Deep colour, constant slow movement." },
  { id: "chrome", name: "Liquid chrome", note: "An iridescent metal surface flowing under domain-warped noise. Reads expensive and very current." },
  { id: "warp", name: "Warp field", note: "Radial streaks accelerating out of a vanishing point. The most energy of the four." },
  { id: "core", name: "Reactor core", note: "A churning sphere of plasma with a corona. One dominant object, high intensity." },
];

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/** Shared noise + a cosine palette, so the four read as one family. */
const COMMON = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uPointer;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  const mat2 ROT = mat2(0.80, 0.60, -0.60, 0.80);
  float fbm(vec2 p) {
    float v = 0.0, a = 0.55;
    for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = ROT * p * 2.03; a *= 0.5; }
    return v;
  }
  // Blue through violet into a cold white — the brand's family, not a rainbow.
  vec3 pal(float t) {
    return vec3(0.42, 0.44, 0.62)
         + vec3(0.36, 0.30, 0.42) * cos(6.28318 * (vec3(0.62, 0.68, 0.82) * t + vec3(0.62, 0.54, 0.42)));
  }
  float dither(vec2 uv) { return (hash(uv * uRes) - 0.5) * 0.015; }
`;

const AURORA = /* glsl */ `
  ${COMMON}
  float curtain(vec2 p, float seed, float t) {
    // Shear each sheet by its own wave so they never move as one.
    float x = p.x + sin(p.y * 1.5 + t * 0.25 + seed * 3.1) * 0.30
                  + sin(p.y * 3.7 - t * 0.14 + seed) * 0.09;
    float n = fbm(vec2(x * 2.4 + seed * 17.0, p.y * 0.7 - t * 0.10));
    float band = smoothstep(0.34, 0.98, n);
    // Fine vertical fibres inside the sheet — what makes it a curtain.
    float fibre = pow(vnoise(vec2(x * 120.0, p.y * 1.2 - t * 0.3)), 2.0);
    return band * (0.55 + fibre * 0.9) * smoothstep(-0.62, 0.28, p.y);
  }
  void main() {
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) + uPointer * 0.02;
    float t = uTime;
    float a = curtain(p + vec2(0.30, 0.0), 0.0, t);
    float b = curtain(p + vec2(-0.05, 0.05), 1.7, t * 1.15);
    float c = curtain(p + vec2(-0.42, -0.03), 3.3, t * 0.85);
    vec3 col = vec3(0.020, 0.022, 0.035);
    col += pal(0.10) * a * 0.85;
    col += pal(0.42) * b * 0.75;
    col += pal(0.74) * c * 0.55;
    col += vec3(0.75, 0.82, 1.0) * pow(a + b, 3.0) * 0.05;
    float vig = smoothstep(1.25, 0.30, length((p - vec2(-0.08, -0.04)) * vec2(0.92, 1.28)));
    col *= 0.28 + vig * 0.82;
    gl_FragColor = vec4(max(col + dither(vUv), 0.0), 1.0);
  }
`;

const CHROME = /* glsl */ `
  ${COMMON}
  void main() {
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * 2.4 + uPointer * 0.05;
    float t = uTime * 0.055;
    // Domain warp, twice — noise sampled through noise sampled through noise.
    vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
    vec2 r = vec2(fbm(p + 3.4 * q + vec2(1.7, 9.2) + t * 1.3),
                  fbm(p + 3.4 * q + vec2(8.3, 2.8) - t * 0.9));
    float f = fbm(p + 3.6 * r);
    // Thin-film iridescence: the same value read at three offsets.
    vec3 col = pal(f * 1.5 + length(r) * 0.35 + t * 0.5);
    // Specular ridges where the surface turns over.
    float ridge = pow(abs(fract(f * 7.0 + t) - 0.5) * 2.0, 14.0);
    col += vec3(0.85, 0.90, 1.0) * ridge * 0.55;
    col *= 0.30 + f * 1.15;
    float vig = smoothstep(1.55, 0.35, length((p * 0.42 - vec2(-0.08, -0.04)) * vec2(0.92, 1.26)));
    col *= 0.26 + vig * 0.84;
    gl_FragColor = vec4(max(col + dither(vUv), 0.0), 1.0);
  }
`;

const WARP = /* glsl */ `
  ${COMMON}
  void main() {
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
    vec2 c = vec2(0.14, 0.04) + uPointer * 0.035;
    vec2 rel = p - c;
    float r = length(rel);
    float ang = atan(rel.y, rel.x);
    float t = uTime;
    // Streaks: tight around the angle, running outward with time.
    float s1 = pow(vnoise(vec2(ang * 72.0, r * 2.6 - t * 0.85)), 3.0);
    float s2 = pow(vnoise(vec2(ang * 128.0 + 4.0, r * 4.2 - t * 1.5)), 3.6);
    float fall = smoothstep(0.02, 0.75, r) * exp(-r * r * 1.5);
    float core = exp(-r * r * 90.0);
    vec3 col = vec3(0.018, 0.020, 0.032);
    col += pal(0.18) * s1 * fall * 2.6;
    col += pal(0.62) * s2 * fall * 1.9;
    col += vec3(0.80, 0.86, 1.0) * core * 1.5;
    col += pal(0.4) * exp(-r * r * 7.0) * 0.22;
    float vig = smoothstep(1.30, 0.30, length((p - vec2(-0.10, -0.05)) * vec2(0.92, 1.28)));
    col *= 0.30 + vig * 0.80;
    gl_FragColor = vec4(max(col + dither(vUv), 0.0), 1.0);
  }
`;

const CORE = /* glsl */ `
  ${COMMON}
  void main() {
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
    vec2 c = vec2(0.17, 0.06) + uPointer * 0.02;
    vec2 rel = p - c;
    float d = length(rel);
    float t = uTime;
    float R = 0.27;
    // Surface churn, sampled in a space that swirls with the radius.
    float sw = t * 0.16 + d * 2.4;
    vec2 sp = vec2(rel.x * cos(sw) - rel.y * sin(sw), rel.x * sin(sw) + rel.y * cos(sw));
    float surf = fbm(sp * 6.0 + vec2(t * 0.22, -t * 0.15));
    surf = pow(smoothstep(0.20, 0.95, surf), 1.4);
    float inside = smoothstep(R, R - 0.06, d);
    float limb = exp(-pow((d - R) / 0.030, 2.0));           // hot edge
    float corona = exp(-pow(max(0.0, d - R) / 0.24, 2.0));  // the light it throws
    vec3 col = vec3(0.016, 0.018, 0.030);
    col += pal(0.15 + surf * 0.5) * inside * (0.35 + surf * 1.5);
    col += vec3(0.82, 0.88, 1.0) * limb * 1.25;
    col += pal(0.55) * corona * 0.55;
    float vig = smoothstep(1.30, 0.32, length((p - vec2(-0.10, -0.05)) * vec2(0.92, 1.26)));
    col *= 0.30 + vig * 0.80;
    gl_FragColor = vec4(max(col + dither(vUv), 0.0), 1.0);
  }
`;

const SHADERS: Record<LabVariant, string> = {
  aurora: AURORA,
  chrome: CHROME,
  warp: WARP,
  core: CORE,
};

function Surface({ variant }: { variant: LabVariant }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const size = useThree((s) => s.size);
  const eased = useRef(new THREE.Vector2());
  const target = useRef(new THREE.Vector2());

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2() },
    }),
    [],
  );

  useFrame((state, delta) => {
    const m = mat.current;
    if (!m) return;
    const dt = Math.min(delta, 1 / 30);
    m.uniforms.uTime.value += dt;
    m.uniforms.uRes.value.set(
      size.width * state.gl.getPixelRatio(),
      size.height * state.gl.getPixelRatio(),
    );
    const k = 1 - Math.pow(0.02, dt);
    eased.current.lerp(target.current, k);
    m.uniforms.uPointer.value.copy(eased.current);
  });

  // Subscribing is an effect's job, not a memo's — a memo runs during render,
  // where touching a ref is exactly what the rule forbids.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1),
      );
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <mesh frustumCulled={false} key={variant}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={SHADERS[variant]}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function BackgroundLab({ variant }: { variant: LabVariant }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      <Surface variant={variant} />
    </Canvas>
  );
}
