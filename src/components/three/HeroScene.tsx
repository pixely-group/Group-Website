"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "@/lib/rng";

/**
 * Mutable channel between DOM scroll/pointer land and the GL scene. Passed as
 * a ref and read only inside the render loop, never during React render.
 */
export type HeroBusRef = { current: HeroBus };

export type HeroBus = {
  /** 0 → 1 while the hero scrolls out of view. */
  progress: number;
  /** Lenis scroll velocity, px/frame-ish. */
  velocity: number;
  /** Pointer in NDC (-1..1, y up). */
  pointer: [number, number];
};

const INK = new THREE.Color("#0a0a0b");
const BONE = new THREE.Color("#ece9e1");
const SIGNAL = new THREE.Color("#ff4d00");

const FIELD_VERTEX = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uSpan;
  uniform float uHeight;
  uniform float uDepth;
  uniform float uPixelRatio;
  uniform vec2 uPointer;

  varying float vAlpha;
  varying vec3 vColor;

  const float LANES = 21.0;

  void main() {
    // Quantize into shared lanes so particles draw dotted streamlines.
    float lane = floor(aSeed.x * LANES);
    float laneN = lane / (LANES - 1.0);          // 0..1
    float laneRand = fract(sin(lane * 12.9898) * 43758.5453);

    float speed = 0.55 + laneRand * 0.75 + aSeed.w * 0.18;
    float x = mod(aSeed.z * uSpan + uTime * speed, uSpan) - uSpan * 0.5;
    float y0 = (laneN - 0.5) * uHeight + (fract(aSeed.x * LANES) - 0.5) * 0.05;
    float z = (laneRand - 0.5) * uDepth + (aSeed.y - 0.5) * 0.6;

    // Coherent field curvature: neighbouring lanes bend nearly in phase,
    // so streams stay parallel and drift like laminar flow.
    float bend = sin(x * 0.30 + laneN * 3.1) * 0.45
      + sin(x * 0.093 + laneN * 6.0 + 1.7) * 0.8;
    float y = y0 * (0.9 + 0.22 * sin(x * 0.05 + laneN * 2.0)) + bend;

    // Streams tighten toward the meridian axis on the right.
    float conv = smoothstep(-uSpan * 0.5, uSpan * 0.5, x);
    y = mix(y, y * 0.45, conv * 0.6);

    vec3 pos = vec3(x, y, z);

    // Pointer acts as a soft lens pushing streams apart.
    vec2 d2 = pos.xy - uPointer;
    float push = exp(-dot(d2, d2) * 0.42);
    pos.xy += normalize(d2 + 1e-4) * push * 0.9;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float isSignal = step(0.975, aSeed.w);
    float base = mix(1.5, 2.3, aSeed.y);
    gl_PointSize = (base + isSignal * 2.6) * uPixelRatio * (7.5 / -mv.z);

    vColor = mix(vec3(0.925, 0.913, 0.882), vec3(1.0, 0.30, 0.0), isSignal);

    // Some lanes glow, some barely register — depth without fog.
    float laneGlow = 0.55 + 0.45 * fract(sin(lane * 78.233) * 12543.21);
    float tw = 0.9 + 0.1 * sin(uTime * (0.6 + aSeed.z * 1.4) + aSeed.x * 40.0);
    float edge = smoothstep(0.5, 0.44, abs(x) / uSpan);
    vAlpha = mix(0.46 * laneGlow, 0.95, isSignal) * tw * edge;
  }
`;

const FIELD_FRAGMENT = /* glsl */ `
  precision mediump float;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.06, d) * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

function FlowField({ bus, count }: { bus: HeroBusRef; count: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const viewport = useThree((s) => s.viewport);

  const { geometry, uniforms } = useMemo(() => {
    const rand = mulberry32(0x5eed1);
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count * 4; i += 1) seeds[i] = rand();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    // Positions are computed in the shader; provide a dummy attribute.
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(count * 3), 3),
    );
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 30);
    const u = {
      uTime: { value: 0 },
      uSpan: { value: 26 },
      uHeight: { value: 9 },
      uDepth: { value: 7 },
      uPixelRatio: { value: 1 },
      uPointer: { value: new THREE.Vector2(99, 99) },
    };
    return { geometry: geo, uniforms: u };
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const pointerTarget = useRef(new THREE.Vector2(99, 99));

  useFrame((state, delta) => {
    const mat = material.current;
    if (!mat) return;
    const dt = Math.min(delta, 1 / 30);
    const velocityBoost = Math.min(Math.abs(bus.current.velocity) * 0.045, 2.2);
    mat.uniforms.uTime.value +=
      dt * (0.62 + velocityBoost + bus.current.progress * 0.9);
    mat.uniforms.uPixelRatio.value = state.gl.getPixelRatio();

    // Map pointer NDC onto the z=0 plane the field occupies.
    pointerTarget.current.set(
      (bus.current.pointer[0] * viewport.width) / 2,
      (bus.current.pointer[1] * viewport.height) / 2,
    );
    (mat.uniforms.uPointer.value as THREE.Vector2).lerp(
      pointerTarget.current,
      1 - Math.pow(0.001, dt),
    );
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={FIELD_VERTEX}
        fragmentShader={FIELD_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function ringGeometry(radius: number, segments = 220) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}

/** Faint orbital hairlines — the wordmark's meridian, monumental. */
function MeridianRings({ bus }: { bus: HeroBusRef }) {
  const outer = useRef<THREE.Line>(null);
  const inner = useRef<THREE.Line>(null);
  const outerGeo = useMemo(() => ringGeometry(5.4), []);
  const innerGeo = useMemo(() => ringGeometry(3.1), []);

  useEffect(
    () => () => {
      outerGeo.dispose();
      innerGeo.dispose();
    },
    [outerGeo, innerGeo],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (outer.current) {
      outer.current.rotation.x = 1.35 + Math.sin(t * 0.11) * 0.08;
      outer.current.rotation.y = t * 0.05 + bus.current.pointer[0] * 0.06;
      outer.current.rotation.z = t * 0.02;
    }
    if (inner.current) {
      inner.current.rotation.x = -1.2 + Math.cos(t * 0.09) * 0.1;
      inner.current.rotation.y = -t * 0.07 + bus.current.pointer[0] * 0.04;
    }
  });

  const lines = useMemo(() => {
    const mk = (geo: THREE.BufferGeometry, color: THREE.Color, opacity: number) =>
      new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
      );
    return {
      outer: mk(outerGeo, BONE, 0.16),
      inner: mk(innerGeo, SIGNAL, 0.22),
    };
  }, [outerGeo, innerGeo]);

  return (
    <group position={[2.2, -0.4, -1.5]}>
      <primitive object={lines.outer} ref={outer} />
      <primitive object={lines.inner} ref={inner} />
    </group>
  );
}

function CameraRig({ bus }: { bus: HeroBusRef }) {
  const target = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const p = bus.current.progress;
    const cam = state.camera;
    target.current.set(
      bus.current.pointer[0] * 0.4,
      bus.current.pointer[1] * 0.3 - p * 1.6,
      8 - p * 2.4,
    );
    const k = 1 - Math.pow(0.0015, Math.min(delta, 1 / 30));
    cam.position.lerp(target.current, k);
    cam.lookAt(0, -p * 1.1, 0);
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
      dpr={[1, 1.8]}
      camera={{ position: [0, 0, 8], fov: 50, near: 0.1, far: 60 }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => gl.setClearColor(INK, 1)}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      <FlowField bus={bus} count={count} />
      <MeridianRings bus={bus} />
      <CameraRig bus={bus} />
    </Canvas>
  );
}
