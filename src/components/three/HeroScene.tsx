"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
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

/**
 * The reactor core and what orbits it.
 *
 * The core is the floor of this, not the whole of it: a churning sphere with
 * a hot limb and a corona, drawn as one fullscreen shader behind everything.
 * Over it sit the things that make it a place rather than an object — a deep
 * field for parallax, three rings of accretion caught edge-on, and a few
 * thousand particles running their orbits, some of them falling in.
 *
 * Everything above the core is positioned in world space around the point
 * the core occupies on screen, so the rings and the stream belong to it
 * rather than merely sharing a frame with it.
 */

/** Where the core lands in world units, and how big it is there. Derived
 *  from the shader's own constants so the two cannot drift apart. */
const CORE_AT = new THREE.Vector3(1.53, 0.56, 0);
const CORE_R = 2.52;
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


/* ————————————————————— what orbits the core ————————————————————— */

/** Deep field. Parallax by depth, so the frame has somewhere to be. */
const STAR_VERT = /* glsl */ `
  attribute vec4 aSeed;   // x, y, depth, twinkle
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vA;
  void main() {
    float depth = aSeed.z;
    vec3 p = vec3(
      mod(aSeed.x + uTime * (0.010 + depth * 0.04) + 16.0, 32.0) - 16.0,
      aSeed.y,
      -8.0 - depth * 26.0
    );
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vA = (0.08 + (1.0 - depth) * 0.5) * (0.6 + 0.4 * sin(uTime * 1.2 + aSeed.w * 6.283));
    gl_PointSize = (0.8 + (1.0 - depth) * 1.9) * uPixelRatio;
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
    gl_FragColor = vec4(vec3(0.88, 0.91, 1.0), a);
  }
`;

/**
 * The stream. Each particle keeps a tilted circular orbit; a share of them
 * are falling, their radius easing in over a long cycle and their angular
 * speed rising as it shrinks — which is what makes an accretion read as
 * accretion rather than as a rotating cloud.
 */
const ORBIT_VERT = /* glsl */ `
  attribute vec4 aOrb;   // radius, phase, angular speed, tilt
  attribute vec2 aVar;   // size, how much it falls
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec3 uCentre;
  uniform float uCoreR;
  varying float vA;
  varying float vHot;

  mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0,0.0,0.0, 0.0,c,-s, 0.0,s,c); }
  mat3 rotZ(float a) { float c = cos(a), s = sin(a); return mat3(c,-s,0.0, s,c,0.0, 0.0,0.0,1.0); }

  void main() {
    float t = uTime;
    float fall = fract(t * 0.035 * (0.6 + aVar.y) + aOrb.y);
    // Eased so it hangs at the outside and hurries at the end.
    float r = mix(aOrb.x, uCoreR * 1.04, aVar.y * fall * fall);
    float spin = aOrb.z * (1.0 + (1.0 - r / aOrb.x) * 2.6);
    float a = aOrb.y * 6.28318 + t * spin;

    vec3 p = vec3(cos(a) * r, 0.0, sin(a) * r);
    p = rotZ(aOrb.w * 0.85) * rotX(aOrb.w * 1.9 + 0.45) * p;
    p += uCentre;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float d = -mv.z;
    // Hotter the closer it gets, and it dims out as it arrives.
    vHot = clamp(1.0 - (r - uCoreR) / max(aOrb.x - uCoreR, 0.001), 0.0, 1.0);
    vA = smoothstep(46.0, 3.0, d) * (0.5 + vHot * 0.8) * (1.0 - smoothstep(0.86, 1.0, aVar.y * fall * fall));
    gl_PointSize = (aVar.x * (1.0 + vHot * 1.8) * 44.0 / max(d, 2.0)) * uPixelRatio;
    gl_Position = projectionMatrix * mv;
  }
`;

const ORBIT_FRAG = /* glsl */ `
  precision mediump float;
  varying float vA;
  varying float vHot;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.02, d) * vA;
    if (a < 0.004) discard;
    vec3 cool = vec3(0.42, 0.50, 0.98);
    vec3 hot = vec3(0.95, 0.93, 1.0);
    gl_FragColor = vec4(mix(cool, hot, vHot * vHot), a);
  }
`;

/** Rings, lit on their silhouettes so a thin hoop reads as an object. */
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
    float f = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.2);
    float a = (0.04 + f * 0.96) * uGain;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor * (0.35 + f), a);
  }
`;

function DeepField({ count }: { count: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const geo = useMemo(() => {
    const rand = mulberry32(0x51a7);
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i += 1) {
      seeds[i * 4] = rand() * 32 - 16;
      seeds[i * 4 + 1] = rand() * 18 - 9;
      seeds[i * 4 + 2] = rand();
      seeds[i * 4 + 3] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50);
    return g;
  }, [count]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uPixelRatio: { value: 1 } }), []);
  useFrame((state, delta) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value += Math.min(delta, 1 / 30);
    mat.current.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
  });
  return (
    <points geometry={geo} frustumCulled={false} renderOrder={1}>
      <shaderMaterial ref={mat} vertexShader={STAR_VERT} fragmentShader={STAR_FRAG}
        uniforms={uniforms} transparent depthWrite={false} depthTest={false}
        blending={THREE.AdditiveBlending} />
    </points>
  );
}

function OrbitStream({ count }: { count: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);

  const geo = useMemo(() => {
    const rand = mulberry32(0x0b17a);
    const orb = new Float32Array(count * 4);
    const varv = new Float32Array(count * 2);
    for (let i = 0; i < count; i += 1) {
      // Radii biased outward, so the disc has a body and not just a rim.
      const t = Math.pow(rand(), 0.65);
      orb[i * 4] = CORE_R * (1.16 + t * 2.1);
      orb[i * 4 + 1] = rand();
      orb[i * 4 + 2] = 0.10 + rand() * 0.22;
      orb[i * 4 + 3] = (rand() - 0.5) * 2.4;
      varv[i * 2] = 0.7 + rand() * 1.7;
      // A third of them are falling; the rest hold their orbit.
      varv[i * 2 + 1] = rand() < 0.34 ? 0.45 + rand() * 0.55 : 0;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("aOrb", new THREE.BufferAttribute(orb, 4));
    g.setAttribute("aVar", new THREE.BufferAttribute(varv, 2));
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.boundingSphere = new THREE.Sphere(CORE_AT.clone(), CORE_R * 4);
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uCentre: { value: CORE_AT.clone() },
      uCoreR: { value: CORE_R },
    }),
    [],
  );

  useFrame((state, delta) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value += Math.min(delta, 1 / 30);
    mat.current.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
  });

  return (
    <points geometry={geo} frustumCulled={false} renderOrder={3}>
      <shaderMaterial ref={mat} vertexShader={ORBIT_VERT} fragmentShader={ORBIT_FRAG}
        uniforms={uniforms} transparent depthWrite={false} depthTest={false}
        blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Rings() {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  const c = useRef<THREE.Mesh>(null);
  const u = useMemo(
    () => ({
      a: { uColor: { value: new THREE.Color("#8ea6ff") }, uGain: { value: 0.85 } },
      b: { uColor: { value: new THREE.Color("#c9d4ff") }, uGain: { value: 0.55 } },
      c: { uColor: { value: new THREE.Color("#5f6dff") }, uGain: { value: 0.45 } },
    }),
    [],
  );
  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    if (a.current) { a.current.rotation.z += dt * 0.10; a.current.rotation.x += dt * 0.03; }
    if (b.current) { b.current.rotation.z -= dt * 0.07; b.current.rotation.y += dt * 0.05; }
    if (c.current) { c.current.rotation.x -= dt * 0.05; c.current.rotation.z -= dt * 0.09; }
  });
  const shader = (uniforms: Record<string, THREE.IUniform>) => (
    <shaderMaterial vertexShader={RING_VERT} fragmentShader={RING_FRAG} uniforms={uniforms}
      transparent depthWrite={false} depthTest={false} side={THREE.DoubleSide}
      blending={THREE.AdditiveBlending} />
  );
  return (
    <group position={CORE_AT} renderOrder={2}>
      <mesh ref={a} rotation={[1.35, 0.2, 0]}>
        <torusGeometry args={[CORE_R * 1.28, 0.014, 8, 240]} />
        {shader(u.a)}
      </mesh>
      <mesh ref={b} rotation={[1.18, 0.9, 0.3]}>
        <torusGeometry args={[CORE_R * 1.62, 0.011, 8, 240]} />
        {shader(u.b)}
      </mesh>
      <mesh ref={c} rotation={[1.5, -0.5, 0.8]}>
        <torusGeometry args={[CORE_R * 2.05, 0.009, 8, 240]} />
        {shader(u.c)}
      </mesh>
    </group>
  );
}

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
    <mesh frustumCulled={false} renderOrder={-10}>
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

/** Pointer leans the whole assembly; scroll pulls back from it. */
function CameraRig({ bus }: { bus: HeroBusRef }) {
  const target = useRef(new THREE.Vector3());
  useFrame((state, delta) => {
    const p = bus.current.progress;
    const [px, py] = bus.current.pointer;
    const cam = state.camera;
    target.current.set(px * 0.9, py * 0.65 - p * 1.6, 10 + p * 4.0);
    const k = 1 - Math.pow(0.0018, Math.min(delta, 1 / 30));
    cam.position.lerp(target.current, k);
    cam.lookAt(CORE_AT.x * 0.55, CORE_AT.y * 0.4, -2);
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
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 10], fov: 50, near: 0.1, far: 90 }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
      }}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      <Core bus={bus} />
      <DeepField count={Math.round(count * 0.5)} />
      <Rings />
      <OrbitStream count={count} />
      <CameraRig bus={bus} />
    </Canvas>
  );
}
