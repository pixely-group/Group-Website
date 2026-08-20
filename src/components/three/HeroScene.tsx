"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { NetworkMesh, type NetworkBus } from "@/components/three/NetworkScene";

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
const SIGNAL = new THREE.Color("#9fb4ff");

function ringGeometry(radius: number, segments = 220) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}

/** Faint orbital hairlines — the wordmark's axis, monumental. */
function OrbitalRings({ bus }: { bus: HeroBusRef }) {
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

/**
 * The same graph section 03 stands behind its copy, held at its first stage —
 * the one that section titles "01 — Payments" — rather than played through
 * all four. The hero is a backdrop; the narrative belongs to the section that
 * narrates it.
 *
 * Centred rather than swung aside: spread 0 leaves it behind both the copy
 * and the device instead of picking a side.
 */
function NetworkBackdrop({ bus }: { bus: HeroBusRef }) {
  const net = useRef<NetworkBus>({ progress: 0, pointer: [0, 0], spread: 0 });

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    /* Read off the section rather than guessed: while its Payments copy is
       up, its own scroll trigger sits at 0.15, which NetworkMesh multiplies
       to a stage number of 0.6 — the graph part-assembled with the flow just
       beginning. A quarter, which is where I first put this, is the end of
       that stage and visibly further along. The drift stays inside it. */
    net.current.progress = 0.15 + Math.sin(t * 0.045) * 0.012;
    net.current.pointer = bus.current.pointer;
  });

  return <NetworkMesh bus={net} />;
}

function CameraRig({ bus }: { bus: HeroBusRef }) {
  const target = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const p = bus.current.progress;
    const cam = state.camera;
    target.current.set(
      bus.current.pointer[0] * 0.4,
      bus.current.pointer[1] * 0.3 - p * 1.6,
      11.5 - p * 3.2,
    );
    const k = 1 - Math.pow(0.0015, Math.min(delta, 1 / 30));
    cam.position.lerp(target.current, k);
    cam.lookAt(0, -p * 1.1, 0);
  });

  return null;
}

export default function HeroScene({
  bus,
  active,
}: {
  bus: HeroBusRef;
  active: boolean;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.8]}
      /* Matched to the network section's camera, because the graph is built
         at a scale that assumes it. */
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
      <NetworkBackdrop bus={bus} />
      <OrbitalRings bus={bus} />
      <CameraRig bus={bus} />
    </Canvas>
  );
}
