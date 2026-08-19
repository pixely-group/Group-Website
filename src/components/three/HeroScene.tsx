"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "@/lib/rng";

export type HeroBusRef = { current: HeroBus };

export type HeroBus = {
  /** 0 → 1 while the hero scrolls out of view. */
  progress: number;
  /** Pointer in NDC (-1..1, y up). */
  pointer: [number, number];
};

const INK = new THREE.Color("#0a0a0b");

/**
 * The hero's environment: a deep field, a column of light, and a gyroscope
 * the device stands inside.
 *
 * Everything is arranged around the device rather than across the frame. The
 * beam and the rings sit at the device's own x, so the phone reads as the lit
 * thing and the scene as what is lighting it; the left of the frame stays
 * dark for the headline. That is the difference between a background with a
 * subject and a background competing with one.
 */
const FOCUS_X = 4.0; // world x of the device's column

/* ————————————————————————————— deep field ————————————————————————————— */

const STAR_VERT = /* glsl */ `
  attribute vec4 aSeed;   // x, y, depth, twinkle phase
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vA;

  void main() {
    float depth = aSeed.z;
    // Nearer stars drift further: parallax without moving the camera.
    float drift = uTime * (0.012 + depth * 0.05);
    vec3 p = vec3(
      mod(aSeed.x + drift + 9.0, 18.0) - 9.0,
      aSeed.y,
      -6.0 - depth * 22.0
    );
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float twinkle = 0.6 + 0.4 * sin(uTime * 1.1 + aSeed.w * 6.283);
    vA = (0.10 + (1.0 - depth) * 0.55) * twinkle;
    gl_PointSize = (0.9 + (1.0 - depth) * 2.1) * uPixelRatio;
    gl_Position = projectionMatrix * mv;
  }
`;

const STAR_FRAG = /* glsl */ `
  precision mediump float;
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d) * vA;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vec3(0.92, 0.94, 1.0), a);
  }
`;

/* ————————————————————————————— nebula ————————————————————————————— */

const NEBULA_FRAG = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 p = vUv * 3.0;
    float n = fbm(p + vec2(uTime * 0.012, uTime * -0.008));
    n = smoothstep(0.32, 0.95, n);
    // Cool violet through the brand blue, never bright enough to be weather.
    vec3 col = mix(vec3(0.07, 0.06, 0.20), vec3(0.16, 0.22, 0.72), n);
    // Fade to nothing at the edges so it never shows a seam.
    float edge = smoothstep(0.0, 0.42, vUv.x) * smoothstep(1.0, 0.58, vUv.x)
               * smoothstep(0.0, 0.34, vUv.y) * smoothstep(1.0, 0.66, vUv.y);
    gl_FragColor = vec4(col, n * edge * 0.5);
  }
`;

const PASS_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* ————————————————————————————— beam ————————————————————————————— */

const BEAM_FRAG = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    // A tight core inside a wide falloff, so it reads as light and not a bar.
    float x = abs(vUv.x - 0.5) * 2.0;
    float core = exp(-x * x * 34.0);
    float halo = exp(-x * x * 4.5) * 0.34;

    // Charge running up it, and a slow breath over the whole column.
    float run = smoothstep(0.55, 1.0, fract(vUv.y * 1.6 - uTime * 0.14));
    float breath = 0.78 + 0.22 * sin(uTime * 0.55);

    // Held off the very top and bottom edges.
    float ends = smoothstep(0.0, 0.22, vUv.y) * smoothstep(1.0, 0.72, vUv.y);

    float a = (core * (0.5 + run * 0.5) + halo) * ends * breath;
    vec3 col = mix(vec3(0.18, 0.27, 1.0), vec3(0.72, 0.80, 1.0), core * 0.9 + run * 0.3);
    gl_FragColor = vec4(col, a * 0.62);
  }
`;

/* ————————————————————————————— gyroscope ————————————————————————————— */

const RING_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const RING_FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform float uGain;
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    // Silhouette lighting: the hoop is brightest where it turns away, which
    // is what makes a thin ring read as a solid object rather than a line.
    float f = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.2);
    float a = (0.05 + f * 0.95) * uGain;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor * (0.35 + f), a);
  }
`;

/* ————————————————————————————— components ————————————————————————————— */

function DeepField({ count }: { count: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const geo = useMemo(() => {
    const rand = mulberry32(0xc051c);
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i += 1) {
      seeds[i * 4] = rand() * 18 - 9;
      seeds[i * 4 + 1] = rand() * 13 - 6.5;
      seeds[i * 4 + 2] = rand();
      seeds[i * 4 + 3] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(count * 3), 3),
    );
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPixelRatio: { value: 1 } }),
    [],
  );

  useFrame((state, delta) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value += Math.min(delta, 1 / 30);
    mat.current.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
  });

  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={STAR_VERT}
        fragmentShader={STAR_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Nebula() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, delta) => {
    if (mat.current) mat.current.uniforms.uTime.value += Math.min(delta, 1 / 30);
  });
  return (
    <mesh position={[FOCUS_X * 0.55, 0, -16]}>
      <planeGeometry args={[46, 30]} />
      <shaderMaterial
        ref={mat}
        vertexShader={PASS_VERT}
        fragmentShader={NEBULA_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function Beam() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, delta) => {
    if (mat.current) mat.current.uniforms.uTime.value += Math.min(delta, 1 / 30);
  });
  return (
    <mesh position={[FOCUS_X, 0, -4.5]}>
      <planeGeometry args={[7.5, 22]} />
      <shaderMaterial
        ref={mat}
        vertexShader={PASS_VERT}
        fragmentShader={BEAM_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/** Three hoops on three axes, turning at three rates. */
function Gyroscope() {
  const g = useRef<THREE.Group>(null);
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  const c = useRef<THREE.Mesh>(null);

  const mk = (hex: string, gain: number) => ({
    uColor: { value: new THREE.Color(hex) },
    uGain: { value: gain },
  });
  const u = useMemo(
    () => ({
      a: mk("#7290ff", 0.95),
      b: mk("#9fb4ff", 0.7),
      c: mk("#3f57ff", 0.55),
    }),
    [],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    if (a.current) {
      a.current.rotation.y += dt * 0.16;
      a.current.rotation.x += dt * 0.05;
    }
    if (b.current) {
      b.current.rotation.x -= dt * 0.11;
      b.current.rotation.z += dt * 0.07;
    }
    if (c.current) {
      c.current.rotation.z -= dt * 0.08;
      c.current.rotation.y -= dt * 0.13;
    }
    if (g.current) g.current.rotation.z = Math.sin(performance.now() / 9000) * 0.06;
  });

  const shader = (uniforms: Record<string, THREE.IUniform>) => (
    <shaderMaterial
      vertexShader={RING_VERT}
      fragmentShader={RING_FRAG}
      uniforms={uniforms}
      transparent
      depthWrite={false}
      side={THREE.DoubleSide}
      blending={THREE.AdditiveBlending}
    />
  );

  return (
    <group ref={g} position={[FOCUS_X, 0, -3]}>
      <mesh ref={a} rotation={[0.5, 0, 0.2]}>
        <torusGeometry args={[2.5, 0.022, 10, 220]} />
        {shader(u.a)}
      </mesh>
      <mesh ref={b} rotation={[1.35, 0.4, 0]}>
        <torusGeometry args={[3.25, 0.016, 10, 220]} />
        {shader(u.b)}
      </mesh>
      <mesh ref={c} rotation={[0.2, 1.1, 0.7]}>
        <torusGeometry args={[4.0, 0.013, 10, 220]} />
        {shader(u.c)}
      </mesh>
    </group>
  );
}

/** Pointer leans the whole environment; scroll pushes it away. */
function CameraRig({ bus }: { bus: HeroBusRef }) {
  const target = useRef(new THREE.Vector3());
  useFrame((state, delta) => {
    const p = bus.current.progress;
    const [px, py] = bus.current.pointer;
    const cam = state.camera;
    target.current.set(px * 0.85, py * 0.6 - p * 1.4, 10 + p * 3.5);
    const k = 1 - Math.pow(0.0018, Math.min(delta, 1 / 30));
    cam.position.lerp(target.current, k);
    cam.lookAt(FOCUS_X * 0.42, 0, -3);
  });
  return null;
}

export default function HeroScene({
  bus,
  count,
  active,
}: {
  bus: HeroBusRef;
  count: number;
  active: boolean;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 10], fov: 50, near: 0.1, far: 80 }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => gl.setClearColor(INK, 1)}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      <Nebula />
      <DeepField count={count} />
      <Beam />
      <Gyroscope />
      <CameraRig bus={bus} />
    </Canvas>
  );
}
