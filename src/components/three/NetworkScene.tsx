"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "@/lib/rng";

/** Passed as a ref; read only inside the render loop. */
export type NetworkBusRef = { current: NetworkBus };

export type NetworkBus = {
  /** 0..1 across the whole narrative (mapped to 4 stages in-scene). */
  progress: number;
  pointer: [number, number];
  /**
   * How far the graph swings aside to clear the copy column. 1 on wide
   * viewports where copy alternates left/right, 0 where copy is full width
   * and the graph simply sits behind it.
   */
  spread: number;
};

const BONE = new THREE.Color("#ece9e1");
const INK = new THREE.Color("#0a0a0b");

/** Ring spec: [radius, node count]. Base mesh + expansion shells. */
const BASE_RINGS: [number, number][] = [
  [1.3, 22],
  [2.2, 34],
  [3.1, 48],
  [4.0, 62],
  [4.9, 78],
];
const EXTRA_RINGS: [number, number][] = [
  [5.8, 92],
  [6.7, 108],
];

type NetworkModel = {
  nodeScatter: Float32Array;
  nodeLattice: Float32Array;
  nodeInfo: Float32Array; // ring, rand, isExtra
  baseNodeCount: number;
  totalNodeCount: number;
  segScatter: Float32Array;
  segLattice: Float32Array;
  segT: Float32Array;
  segInfo: Float32Array; // rand, isPolicy, isExtra
  baseSegVerts: number;
  totalSegVerts: number;
};

function buildNetwork(): NetworkModel {
  const rand = mulberry32(20260818);
  type Node = {
    scatter: [number, number, number];
    lattice: [number, number, number];
    ring: number;
    rand: number;
    extra: boolean;
    angle: number;
  };
  const nodes: Node[] = [];
  const ringStartIndex: number[] = [];

  const pushRing = (
    radius: number,
    count: number,
    ring: number,
    extra: boolean,
  ) => {
    ringStartIndex[ring] = nodes.length;
    const offset = rand() * Math.PI * 2;
    for (let j = 0; j < count; j += 1) {
      const angle = (j / count) * Math.PI * 2 + offset;
      const jitterR = radius + (rand() - 0.5) * 0.14;
      const lattice: [number, number, number] = [
        Math.cos(angle) * jitterR,
        Math.sin(angle) * jitterR,
        (rand() - 0.5) * 0.5,
      ];
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const r = 5.5 + rand() * 3.5;
      const scatter: [number, number, number] = [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) * 0.75,
        r * Math.cos(phi) * 0.6,
      ];
      nodes.push({ scatter, lattice, ring, rand: rand(), extra, angle });
    }
  };

  BASE_RINGS.forEach(([radius, count], i) => pushRing(radius, count, i, false));
  const baseNodeCount = nodes.length;
  EXTRA_RINGS.forEach(([radius, count], i) =>
    pushRing(radius, count, BASE_RINGS.length + i, true),
  );

  const allRings = [...BASE_RINGS, ...EXTRA_RINGS];
  type Seg = { a: Node; b: Node; rand: number; policy: boolean; extra: boolean };
  const segs: Seg[] = [];

  const ringNodes = (ring: number) =>
    nodes.slice(
      ringStartIndex[ring],
      ring + 1 < allRings.length ? ringStartIndex[ring + 1] : nodes.length,
    );

  allRings.forEach(([, count], ring) => {
    const current = ringNodes(ring);
    // neighbours along the ring
    for (let j = 0; j < count; j += 1) {
      if (rand() < 0.82) {
        const a = current[j];
        const b = current[(j + 1) % count];
        segs.push({
          a,
          b,
          rand: rand(),
          policy: rand() < 0.15,
          extra: a.extra || b.extra,
        });
      }
    }
    // spokes to the next ring, matched by angle
    if (ring + 1 < allRings.length) {
      const next = ringNodes(ring + 1);
      current.forEach((a) => {
        if (rand() < 0.55) {
          let best = next[0];
          let bestD = Infinity;
          next.forEach((candidate) => {
            const d = Math.abs(
              Math.atan2(
                Math.sin(candidate.angle - a.angle),
                Math.cos(candidate.angle - a.angle),
              ),
            );
            if (d < bestD) {
              bestD = d;
              best = candidate;
            }
          });
          segs.push({
            a,
            b: best,
            rand: rand(),
            policy: rand() < 0.15,
            extra: a.extra || best.extra,
          });
        }
      });
    }
  });

  // Keep expansion geometry contiguous at the tail so drawRange can grow.
  segs.sort((s1, s2) => Number(s1.extra) - Number(s2.extra));
  const baseSegs = segs.filter((s) => !s.extra).length;

  const nodeScatter = new Float32Array(nodes.length * 3);
  const nodeLattice = new Float32Array(nodes.length * 3);
  const nodeInfo = new Float32Array(nodes.length * 3);
  nodes.forEach((n, i) => {
    nodeScatter.set(n.scatter, i * 3);
    nodeLattice.set(n.lattice, i * 3);
    nodeInfo.set([n.ring, n.rand, n.extra ? 1 : 0], i * 3);
  });

  const segScatter = new Float32Array(segs.length * 2 * 3);
  const segLattice = new Float32Array(segs.length * 2 * 3);
  const segT = new Float32Array(segs.length * 2);
  const segInfo = new Float32Array(segs.length * 2 * 3);
  segs.forEach((s, i) => {
    segScatter.set(s.a.scatter, i * 6);
    segScatter.set(s.b.scatter, i * 6 + 3);
    segLattice.set(s.a.lattice, i * 6);
    segLattice.set(s.b.lattice, i * 6 + 3);
    segT[i * 2] = 0;
    segT[i * 2 + 1] = 1;
    const info: [number, number, number] = [
      s.rand,
      s.policy ? 1 : 0,
      s.extra ? 1 : 0,
    ];
    segInfo.set(info, i * 6);
    segInfo.set(info, i * 6 + 3);
  });

  return {
    nodeScatter,
    nodeLattice,
    nodeInfo,
    baseNodeCount,
    totalNodeCount: nodes.length,
    segScatter,
    segLattice,
    segT,
    segInfo,
    baseSegVerts: baseSegs * 2,
    totalSegVerts: segs.length * 2,
  };
}

const STAGE_GLSL = /* glsl */ `
  // Explicit precision: this block is shared by vertex and fragment
  // stages, and a mismatched default breaks program linking.
  uniform mediump float uProgress; // 0..4
  float easeAssemble(float rand) {
    float assemble = smoothstep(0.02, 0.92, clamp(uProgress, 0.0, 1.0));
    float t = clamp(assemble * 1.35 - rand * 0.35, 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
  }
  float flowAmount() { return smoothstep(0.45, 1.0, uProgress); }
  float policyAmount() { return smoothstep(1.45, 2.0, uProgress); }
`;

const NODE_VERTEX = /* glsl */ `
  attribute vec3 aScatter;
  attribute vec3 aLattice;
  attribute vec3 aInfo;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;
  varying float vCore;
  ${"${STAGE}"}

  void main() {
    float t = easeAssemble(aInfo.y);
    vec3 pos = mix(aScatter, aLattice, t);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float core = 1.0 - smoothstep(0.0, 4.0, aInfo.x);
    vCore = core;
    float pulse = 0.85 + 0.15 * sin(uTime * 1.4 + aInfo.y * 40.0);
    gl_PointSize = (2.7 + core * 1.9) * uPixelRatio * (10.0 / -mv.z) * pulse;
    vAlpha = mix(0.42, 1.0, t) * (0.68 + 0.32 * aInfo.y);
  }
`;

const NODE_FRAGMENT = /* glsl */ `
  precision mediump float;
  varying float vAlpha;
  varying float vCore;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.12, d) * vAlpha;
    if (a < 0.004) discard;
    vec3 col = mix(vec3(0.925, 0.913, 0.882), vec3(1.0, 0.45, 0.15), vCore * 0.55);
    gl_FragColor = vec4(col, a);
  }
`;

const SEG_VERTEX = /* glsl */ `
  attribute vec3 aScatter;
  attribute vec3 aLattice;
  attribute float aT;
  attribute vec3 aInfo;
  varying float vT;
  varying vec3 vInfo;
  varying float vAssemble;
  ${"${STAGE}"}

  void main() {
    float t = easeAssemble(aInfo.x);
    vec3 pos = mix(aScatter, aLattice, t);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    vT = aT;
    vInfo = aInfo;
    vAssemble = t;
  }
`;

const SEG_FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  varying float vT;
  varying vec3 vInfo;
  varying float vAssemble;
  ${"${STAGE}"}

  void main() {
    float flow = flowAmount();
    float policy = policyAmount();
    float isPolicy = vInfo.y;

    float base = 0.34 * vAssemble;
    // travelling packet: a comet head sliding start -> end
    float speed = 0.22 + vInfo.x * 0.35;
    float f = fract(vT * (0.6 + vInfo.x * 0.8) - uTime * speed - vInfo.x * 7.0);
    float comet = pow(smoothstep(0.38, 0.0, f), 2.2);

    float alpha = base
      + comet * flow * 0.72 * mix(1.0, 0.3, policy * (1.0 - isPolicy))
      + isPolicy * policy * 0.34;
    alpha *= mix(1.0, 0.62, policy * (1.0 - isPolicy));

    vec3 boneCol = vec3(0.925, 0.913, 0.882);
    vec3 signal = vec3(0.62, 0.71, 1.0);
    vec3 col = mix(boneCol, signal, isPolicy * max(policy, comet * 0.25));
    gl_FragColor = vec4(col, alpha);
  }
`;

function withStage(shader: string) {
  return shader.replace("${STAGE}", STAGE_GLSL);
}

/* Exported so the hero can stand the same graph behind its copy. It is the
   whole of that section's look — nodes, segments and the packets running the
   spokes — and rebuilding a lookalike would be two things to keep in step. */
export function NetworkMesh({
  bus,
  core = true,
}: {
  bus: NetworkBusRef;
  /** The ring and axis at the middle of the graph. The section wants it as
   *  the thing the network is organised around; the hero does not, because
   *  there it is just a circle sitting in the middle of the page. */
  core?: boolean;
}) {
  const model = useMemo(() => buildNetwork(), []);
  const groupRef = useRef<THREE.Group>(null);
  const nodeMat = useRef<THREE.ShaderMaterial>(null);
  const segMat = useRef<THREE.ShaderMaterial>(null);
  const nodeGeo = useRef<THREE.BufferGeometry>(null);
  const segGeo = useRef<THREE.BufferGeometry>(null);

  const nodeUniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
    }),
    [],
  );
  const segUniforms = useMemo(
    () => ({ uProgress: { value: 0 }, uTime: { value: 0 } }),
    [],
  );

  useFrame((state, delta) => {
    const p = bus.current.progress * 4;
    const dt = Math.min(delta, 1 / 30);
    if (nodeMat.current) {
      nodeMat.current.uniforms.uProgress.value = p;
      nodeMat.current.uniforms.uTime.value += dt;
      nodeMat.current.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    }
    if (segMat.current) {
      segMat.current.uniforms.uProgress.value = p;
      segMat.current.uniforms.uTime.value += dt;
    }

    // SCALE stage: grow draw ranges into the expansion shells.
    const scaleT = THREE.MathUtils.smoothstep(p, 2.5, 3.6);
    if (nodeGeo.current) {
      const count = Math.round(
        model.baseNodeCount +
          (model.totalNodeCount - model.baseNodeCount) * scaleT,
      );
      nodeGeo.current.setDrawRange(0, count);
    }
    if (segGeo.current) {
      const count = Math.round(
        model.baseSegVerts +
          (model.totalSegVerts - model.baseSegVerts) * scaleT,
      );
      segGeo.current.setDrawRange(0, count - (count % 2));
    }

    if (groupRef.current) {
      const swing = stageSwing(p) * bus.current.spread;
      groupRef.current.position.x +=
        (swing - groupRef.current.position.x) * (1 - Math.pow(0.0025, dt));
      groupRef.current.rotation.z += dt * 0.03;
      const targetX = -0.5 + bus.current.pointer[1] * 0.05;
      const targetY = bus.current.pointer[0] * 0.09;
      groupRef.current.rotation.x +=
        (targetX - groupRef.current.rotation.x) * (1 - Math.pow(0.002, dt));
      groupRef.current.rotation.y +=
        (targetY - groupRef.current.rotation.y) * (1 - Math.pow(0.002, dt));
    }
  });

  return (
    <group ref={groupRef}>
      <points frustumCulled={false}>
        <bufferGeometry ref={nodeGeo}>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(model.totalNodeCount * 3), 3]}
          />
          <bufferAttribute
            attach="attributes-aScatter"
            args={[model.nodeScatter, 3]}
          />
          <bufferAttribute
            attach="attributes-aLattice"
            args={[model.nodeLattice, 3]}
          />
          <bufferAttribute attach="attributes-aInfo" args={[model.nodeInfo, 3]} />
        </bufferGeometry>
        <shaderMaterial
          ref={nodeMat}
          vertexShader={withStage(NODE_VERTEX)}
          fragmentShader={NODE_FRAGMENT}
          uniforms={nodeUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <lineSegments frustumCulled={false}>
        <bufferGeometry ref={segGeo}>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(model.totalSegVerts * 3), 3]}
          />
          <bufferAttribute
            attach="attributes-aScatter"
            args={[model.segScatter, 3]}
          />
          <bufferAttribute
            attach="attributes-aLattice"
            args={[model.segLattice, 3]}
          />
          <bufferAttribute attach="attributes-aT" args={[model.segT, 1]} />
          <bufferAttribute attach="attributes-aInfo" args={[model.segInfo, 3]} />
        </bufferGeometry>
        <shaderMaterial
          ref={segMat}
          vertexShader={withStage(SEG_VERTEX)}
          fragmentShader={withStage(SEG_FRAGMENT)}
          uniforms={segUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      {/* the settlement core: the wordmark, monumental again */}
      {core && <CoreGlyph />}
    </group>
  );
}

function CoreGlyph() {
  const objects = useMemo(() => {
    const ringPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i += 1) {
      const a = (i / 64) * Math.PI * 2;
      ringPts.push(
        new THREE.Vector3(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0),
      );
    }
    const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
    const axisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -9, 0),
      new THREE.Vector3(0, 9, 0),
    ]);
    return {
      ring: new THREE.LineLoop(
        ringGeo,
        new THREE.LineBasicMaterial({
          color: BONE,
          transparent: true,
          opacity: 0.5,
        }),
      ),
      axis: new THREE.Line(
        axisGeo,
        new THREE.LineBasicMaterial({
          color: BONE,
          transparent: true,
          opacity: 0.08,
        }),
      ),
    };
  }, []);

  useEffect(
    () => () => {
      objects.ring.geometry.dispose();
      (objects.ring.material as THREE.Material).dispose();
      objects.axis.geometry.dispose();
      (objects.axis.material as THREE.Material).dispose();
    },
    [objects],
  );

  return (
    <>
      <primitive object={objects.ring} />
      <primitive object={objects.axis} />
    </>
  );
}

/** World-space x of the graph per stage, opposite that stage's copy column. */
const STAGE_OFFSET = [3.4, -3.4, 3.4, -3.4];

/**
 * The graph itself moves aside, not the camera: `camera.lookAt(0,0,0)`
 * re-centres the subject every frame, so a camera offset would only orbit it.
 */
function stageSwing(p: number) {
  const seg = Math.max(0, Math.min(3, Math.floor(p)));
  return THREE.MathUtils.lerp(
    STAGE_OFFSET[seg],
    STAGE_OFFSET[Math.min(3, seg + 1)],
    THREE.MathUtils.smoothstep(p - seg, 0, 1),
  );
}

function NetworkCamera({ bus }: { bus: NetworkBusRef }) {
  const target = useRef(new THREE.Vector3());
  useFrame((state, delta) => {
    const p = bus.current.progress * 4;
    const move = THREE.MathUtils.smoothstep(p, 0.45, 1.0);
    const control = THREE.MathUtils.smoothstep(p, 1.45, 2.0);
    const scale = THREE.MathUtils.smoothstep(p, 2.5, 3.6);
    const z = 11.5 - move * 2.2 + control * 0.8 + scale * 6.4;

    const x = bus.current.pointer[0] * 0.5;
    const y = bus.current.pointer[1] * 0.4 - 0.4 + scale * 0.9;
    target.current.set(x, y, z);
    const k = 1 - Math.pow(0.0018, Math.min(delta, 1 / 30));
    state.camera.position.lerp(target.current, k);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function NetworkScene({
  bus,
  active,
}: {
  bus: NetworkBusRef;
  active: boolean;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.8]}
      camera={{ position: [0, -0.4, 11.5], fov: 46, near: 0.1, far: 80 }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => gl.setClearColor(INK, 1)}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      <NetworkMesh bus={bus} />
      <NetworkCamera bus={bus} />
    </Canvas>
  );
}
