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
 * The reactor core: a churning sphere of plasma with a hot limb and the
 * corona it throws, over an otherwise empty field.
 *
 * Picked from four candidates by looking at them rather than by describing
 * them, which is the only reason this one is here and the previous five were
 * not. It is a single fullscreen fragment shader — one draw call, no
 * geometry, no particles — and one dominant object, which is what lets a
 * frame that already holds a headline and a device carry a background at all.
 */
const FULLSCREEN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Already in clip space; no camera is involved.
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const CORE_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uPointer;
  uniform float uProgress;
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
  /** Blue through violet into a cold white — the brand's family, not a rainbow. */
  vec3 pal(float t) {
    return vec3(0.42, 0.44, 0.62)
         + vec3(0.36, 0.30, 0.42) * cos(6.28318 * (vec3(0.62, 0.68, 0.82) * t + vec3(0.62, 0.54, 0.42)));
  }

  const float R = 0.27;

  void main() {
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);

    // Sits right of centre so the device stands against it; lifts away as the
    // hero leaves.
    vec2 c = vec2(0.17, 0.06) + uPointer * 0.02 + vec2(0.0, uProgress * 0.30);

    vec2 rel = p - c;
    float d = length(rel);
    float t = uTime;

    // The surface churns in a frame that swirls with the radius, so it turns
    // over rather than sliding past.
    float sw = t * 0.16 + d * 2.4;
    vec2 sp = vec2(rel.x * cos(sw) - rel.y * sin(sw), rel.x * sin(sw) + rel.y * cos(sw));
    float surf = fbm(sp * 6.0 + vec2(t * 0.22, -t * 0.15));
    surf = pow(smoothstep(0.20, 0.95, surf), 1.4);

    float inside = smoothstep(R, R - 0.06, d);
    float limb = exp(-pow((d - R) / 0.030, 2.0));           // the hot edge
    float corona = exp(-pow(max(0.0, d - R) / 0.24, 2.0));  // the light it throws

    vec3 col = vec3(0.016, 0.018, 0.030);
    col += pal(0.15 + surf * 0.5) * inside * (0.35 + surf * 1.5);
    col += vec3(0.82, 0.88, 1.0) * limb * 1.25;
    col += pal(0.55) * corona * 0.55;

    // Falls off to the corners, hardest bottom-left where the type sits.
    float vig = smoothstep(1.30, 0.32, length((p - vec2(-0.10, -0.05)) * vec2(0.92, 1.26)));
    col *= 0.30 + vig * 0.80;

    // Five octaves band badly across a dark gradient without this.
    float dither = (hash(vUv * uRes) - 0.5) * 0.015;
    gl_FragColor = vec4(max(col + dither, 0.0), 1.0);
  }
`;

function Core({ bus }: { bus: HeroBusRef }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const size = useThree((s) => s.size);
  const eased = useRef(new THREE.Vector2());

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2() },
      uProgress: { value: 0 },
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
        fragmentShader={CORE_FRAG}
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
      <Core bus={bus} />
    </Canvas>
  );
}
