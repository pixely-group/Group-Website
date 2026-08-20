"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { ALGERIA_BORDER, CITIES, FOCUS } from "@/lib/algeria";
import { mulberry32 } from "@/lib/rng";

const INK = new THREE.Color("#0a0a0b");
const BONE = new THREE.Color("#ece9e1");
const SIGNAL = new THREE.Color("#7290ff");

const R = 2.6;
const D2R = Math.PI / 180;

/** Longitude/latitude to a point on the sphere, with 0/0 facing the camera. */
function onSphere(lon: number, lat: number, radius = R) {
  const p = lat * D2R;
  const t = lon * D2R;
  return new THREE.Vector3(
    radius * Math.cos(p) * Math.sin(t),
    radius * Math.sin(p),
    radius * Math.cos(p) * Math.cos(t),
  );
}

/** A great-circle-ish arc between two points, bowed out from the surface. */
function arcPoints(
  a: THREE.Vector3,
  b: THREE.Vector3,
  lift: number,
  segments = 48,
) {
  const out: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = a.clone().lerp(b, t).normalize();
    /* Highest in the middle, flat at both ends, so the arc leaves and lands
       on the surface rather than cutting into it. */
    p.multiplyScalar(R * (1 + Math.sin(t * Math.PI) * lift));
    out.push(p);
  }
  return out;
}

/** The body of the globe: points spread evenly, not by lat/lon bands. */
function Globe() {
  const geo = useMemo(() => {
    const COUNT = 4200;
    const rand = mulberry32(0x61061e);
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    /* Fibonacci sphere: a lat/lon grid crowds the poles badly, and the
       crowding is exactly where this one is turned away from. */
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      pos[i * 3] = Math.cos(theta) * r * R;
      pos[i * 3 + 1] = y * R;
      pos[i * 3 + 2] = Math.sin(theta) * r * R;
      seed[i] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);

  const mat = useRef<THREE.ShaderMaterial>(null);
  useFrame((state, delta) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value += Math.min(delta, 1 / 30);
    mat.current.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
  });

  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        /* Normal, not additive. 4200 points on a sphere overlap heavily near
           the limb, and additive blending accumulated them into a solid white
           disc — the country, the graticule and the arcs were all under it. */
        uniforms={{
          uTime: { value: 0 },
          uColor: { value: BONE },
          uPixelRatio: { value: 1 },
        }}
        vertexShader={/* glsl */ `
          attribute float aSeed;
          uniform float uTime;
          uniform float uPixelRatio;
          varying float vFade;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            /* Only the near half is drawn, and it thins towards the limb, so
               the sphere reads as a solid body rather than a cloud. */
            vec3 n = normalize(mat3(modelViewMatrix) * normalize(position));
            float facing = smoothstep(-0.05, 0.55, n.z);
            float twinkle = 0.72 + 0.28 * sin(uTime * 0.6 + aSeed * 43.0);
            vFade = facing * twinkle;
            gl_Position = projectionMatrix * mv;
            /* gl_PointSize is in framebuffer pixels, so it is multiplied by
               the device ratio to hold a constant size on screen. The factor
               was 300, which put every point at roughly 58px — the sphere was
               a solid mass rather than a field of dots. */
            gl_PointSize = (0.85 + aSeed * 0.7) * uPixelRatio * (13.0 / -mv.z);
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 uColor;
          varying float vFade;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            gl_FragColor = vec4(uColor, vFade * 0.62 * smoothstep(0.5, 0.12, d));
          }
        `}
      />
    </points>
  );
}

/** Meridians and parallels, faint, for the sphere to be read as a sphere. */
function Graticule() {
  const geo = useMemo(() => {
    const pts: number[] = [];
    const push = (a: THREE.Vector3, b: THREE.Vector3) =>
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    const rr = R * 1.001;
    for (let lon = -180; lon < 180; lon += 30) {
      for (let lat = -80; lat < 80; lat += 4) {
        push(onSphere(lon, lat, rr), onSphere(lon, lat + 4, rr));
      }
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let lon = -180; lon < 180; lon += 4) {
        push(onSphere(lon, lat, rr), onSphere(lon + 4, lat, rr));
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  return (
    <lineSegments geometry={geo} frustumCulled={false}>
      <lineBasicMaterial
        color={BONE}
        transparent
        opacity={0.07}
        depthWrite={false}
      />
    </lineSegments>
  );
}

/** Algeria: its border, its cities, and the reach between them. */
function Algeria() {
  /* A filled body under the outline. A WebGL line is always one pixel wide
     whatever you ask for, so the outline alone cannot carry the country at
     this size — the fill is what makes it read as a shape rather than a
     scribble. Fanned from the centroid, which is safe here because Algeria is
     close enough to convex for none of the triangles to fall outside it. */
  const fill = useMemo(() => {
    const lon =
      ALGERIA_BORDER.reduce((a, [x]) => a + x, 0) / ALGERIA_BORDER.length;
    const lat =
      ALGERIA_BORDER.reduce((a, [, y]) => a + y, 0) / ALGERIA_BORDER.length;
    const centre = onSphere(lon, lat, R * 1.002);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < ALGERIA_BORDER.length; i++) {
      const a = ALGERIA_BORDER[i];
      const b = ALGERIA_BORDER[(i + 1) % ALGERIA_BORDER.length];
      pts.push(centre, onSphere(a[0], a[1], R * 1.002), onSphere(b[0], b[1], R * 1.002));
    }
    const g = new THREE.BufferGeometry();
    g.setFromPoints(pts);
    return g;
  }, []);

  const border = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setFromPoints(
      ALGERIA_BORDER.map(([lon, lat]) => onSphere(lon, lat, R * 1.004)),
    );
    return g;
  }, []);

  const arcs = useMemo(() => {
    const hub = onSphere(CITIES[0].lon, CITIES[0].lat);
    const g = new THREE.BufferGeometry();
    const pts: THREE.Vector3[] = [];
    /* Line segments rather than one strip: a strip would draw a return leg
       from each city back to the hub for the next arc. */
    for (const c of CITIES.slice(1)) {
      const arc = arcPoints(hub, onSphere(c.lon, c.lat), 0.045);
      for (let i = 0; i < arc.length - 1; i++) pts.push(arc[i], arc[i + 1]);
    }
    g.setFromPoints(pts);
    return g;
  }, []);

  const cityGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setFromPoints(
      CITIES.map((c) => onSphere(c.lon, c.lat, R * 1.008)),
    );
    return g;
  }, []);

  const pulse = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!pulse.current) return;
    const t = state.clock.elapsedTime;
    const s = 1 + (t % 2.4) * 1.4;
    pulse.current.scale.setScalar(s);
    (pulse.current.material as THREE.MeshBasicMaterial).opacity =
      Math.max(0, 0.5 - (t % 2.4) / 2.4 / 2);
  });

  const capital = onSphere(CITIES[0].lon, CITIES[0].lat, R * 1.01);

  return (
    <group>
      <mesh geometry={fill} frustumCulled={false}>
        <meshBasicMaterial
          color={SIGNAL}
          transparent
          opacity={0.16}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <lineLoop geometry={border} frustumCulled={false}>
        <lineBasicMaterial color={SIGNAL} transparent opacity={0.95} />
      </lineLoop>

      <lineSegments geometry={arcs} frustumCulled={false}>
        <lineBasicMaterial
          color={SIGNAL}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </lineSegments>

      <points geometry={cityGeo} frustumCulled={false}>
        <pointsMaterial color={BONE} size={0.05} sizeAttenuation transparent />
      </points>

      {/* The capital, marked and breathing. */}
      <mesh position={capital}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial color={SIGNAL} />
      </mesh>
      <mesh ref={pulse} position={capital}>
        <sphereGeometry args={[0.05, 14, 14]} />
        <meshBasicMaterial color={SIGNAL} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/**
 * The globe, turned so Algeria faces the reader. Everything is built on one
 * sphere so the country sits on the surface rather than floating over a
 * picture of one, and the whole group is rotated rather than the camera moved
 * — which keeps the lighting cue, the limb fade, pointing the same way.
 */
function Turned({
  pointer,
  still,
}: {
  pointer: React.RefObject<[number, number]>;
  still: boolean;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    if (still) {
      /* Squared onto Algeria and left there. */
      group.current.rotation.set(FOCUS.lat * D2R, -FOCUS.lon * D2R, 0);
      return;
    }
    const t = state.clock.elapsedTime;
    const k = 1 - Math.pow(0.002, Math.min(delta, 1 / 30));
    const [px, py] = pointer.current;
    /* Brought to face the camera, then allowed to breathe a few degrees so it
       is not a still image. */
    const targetY = -FOCUS.lon * D2R + Math.sin(t * 0.09) * 0.09 + px * 0.18;
    const targetX = FOCUS.lat * D2R + Math.cos(t * 0.07) * 0.04 - py * 0.12;
    group.current.rotation.y += (targetY - group.current.rotation.y) * k;
    group.current.rotation.x += (targetX - group.current.rotation.x) * k;
  });

  return (
    <group ref={group}>
      <Globe />
      <Graticule />
      <Algeria />
    </group>
  );
}

export default function GlobeScene({
  active,
  reduced = false,
}: {
  active: boolean;
  reduced?: boolean;
}) {
  const pointer = useRef<[number, number]>([0, 0]);

  return (
    <Canvas
      /* Under reduced motion it draws once and stops, rather than
         running a loop that renders the same frame. */
      frameloop={reduced ? "demand" : active ? "always" : "never"}
      dpr={[1, 1.8]}
      camera={{ position: [0, 0, 6.9], fov: 40, near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor(INK, 1)}
      onPointerMove={(e) => {
        pointer.current = [
          (e.clientX / window.innerWidth) * 2 - 1,
          (e.clientY / window.innerHeight) * 2 - 1,
        ];
      }}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      <Turned pointer={pointer} still={reduced} />
    </Canvas>
  );
}
