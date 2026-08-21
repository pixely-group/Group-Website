"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import { gsap } from "@/lib/gsap";
import { CENTRES, CORRIDORS } from "@/lib/corridors";
import { isLand } from "@/lib/worldmap";
import { useReducedMotion } from "@/lib/hooks";

/**
 * The corridors, on a globe you can turn.
 *
 * Land is a field of points rather than a surface — the continents are read
 * from the density of dots and the ocean is simply where there are none, which
 * is what lets a coarse coastline survive at this size. The rings that draw
 * it are the same ones the flat map used; only the projection changed.
 *
 * Everything is one geometry per kind — one Points for the land, one for the
 * markers, one LineSegments for the arcs, one Points for what travels along
 * them. Thirteen cities and twelve corridors would be twenty-five draw calls
 * as separate objects and are four this way.
 */
const RADIUS = 1;
/** Degrees between dots at the equator. Spacing is corrected by latitude, so
 *  this is the real spacing everywhere rather than only across the middle.
 *
 *  Finer than it looks it should be. A coastline drawn from coarse rings is
 *  only ever as good as its sampling: at 1.7 the dots were large enough to
 *  round off every bay, and the continents read as blobs with the right
 *  outline. Smaller dots closer together resolve the same rings into a shape,
 *  which is the whole of why the reference is legible. */
const STEP = 1.05;
/** How far the arcs stand off the surface at their highest, as a share of the
 *  radius. Enough to read as a hop rather than a scratch on the sphere. */
const ARC_LIFT = 0.28;
const ARC_SEGMENTS = 48;

const DEG = Math.PI / 180;

/** Longitude/latitude to a point on the sphere. Longitude turns about Y, so
 *  the globe spins the way the world does. */
function onSphere(lon: number, lat: number, r = RADIUS) {
  const phi = (90 - lat) * DEG;
  const theta = (lon + 180) * DEG;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

/** A great-circle path between two points, lifted into an arc. Slerped rather
 *  than interpolated straight, or the line would cut through the sphere on
 *  anything longer than a short hop. */
function arcPoints(a: THREE.Vector3, b: THREE.Vector3, segments: number) {
  const out: THREE.Vector3[] = [];
  const angle = a.angleTo(b);
  const lift = ARC_LIFT * Math.min(1, angle / Math.PI + 0.25);
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = new THREE.Vector3().copy(a).lerp(b, t).normalize();
    p.multiplyScalar(RADIUS * (1 + lift * Math.sin(Math.PI * t)));
    out.push(p);
  }
  return out;
}

export default function Globe({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0.35, 3.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setClearAlpha(0);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.cssText =
      "display:block;width:100%;height:100%;touch-action:pan-y;cursor:ew-resize";

    /* Everything hangs off this, so one rotation turns the land, the cities
       and the corridors together and nothing can drift out of register. */
    const world = new THREE.Group();
    world.rotation.z = -18 * DEG;
    scene.add(world);

    const SIGNAL = new THREE.Color("#2d46ff");
    const LIFT = new THREE.Color("#7290ff");

    /* ---- the halo ---------------------------------------------------
       No shell inside the sphere. One was tried at two opacities and both
       were wrong in the same direction: it is a lid, and a lid is exactly
       what the reference does not have. There the far side of the world is
       plainly visible through the near side — the sphere is described by its
       dots crowding towards the silhouette, not by anything filling it — so
       the dots are the only thing here and the far ones simply sit dimmer.

       The halo behind it is a flat card facing the camera, not a shell around
       the sphere. A back-facing shell with a fresnel term was the first
       attempt and it filled the whole disc: on a sphere every fragment has
       some grazing angle to give, and additive blue over a dark ground
       accumulates all of it. A card has no geometry to integrate — the glow
       is a function of distance from the centre, so it can be told to peak
       just outside the globe's edge and be nowhere else. */
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(2.7, 2.7),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: new THREE.Color("#2d46ff") } },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying vec2 vUv;
          void main() {
            /* 0 at the card's centre, 1 at its edge. The globe's silhouette
               lands at 0.74 of that, since the card is 2.7 across and the
               sphere is 2 — so the band is set to climb through there and
               fall away into nothing well before the card's own edge, which
               must never be visible. */
            float r = length(vUv - 0.5) * 2.0;
            float band = smoothstep(0.66, 0.755, r) * smoothstep(0.93, 0.755, r);
            gl_FragColor = vec4(uColor, band * 0.11);
          }
        `,
      }),
    );
    halo.renderOrder = -3;
    scene.add(halo);

    /* And an atmosphere on the sphere itself. The card behind gives the bloom
       standing off the edge; this gives the edge its own light, which is the
       part that made it read as a body rather than a plate of dots.

       A back-facing shell, so the fresnel is strongest exactly at the
       silhouette. The exponent is what keeps it there: at 3.5 it reached most
       of the way to the middle and the whole disc lit up. */
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 1.055, 48, 32),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: new THREE.Color("#3f5bff") } },
        vertexShader: `
          varying vec3 vN;
          varying vec3 vV;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(mat3(modelViewMatrix) * position);
            vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying vec3 vN;
          varying vec3 vV;
          void main() {
            float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 6.0);
            gl_FragColor = vec4(uColor, f * 0.75);
          }
        `,
      }),
    );
    atmosphere.renderOrder = -1;
    world.add(atmosphere);

    /* ---- land ------------------------------------------------------- */
    const dots: number[] = [];
    for (let lat = -84; lat <= 84; lat += STEP) {
      /* A constant step in longitude crowds the poles, so it is widened by
         the latitude's own cosine — the dots stay the same distance apart
         all the way up rather than converging into a smear. */
      const span = Math.max(0.12, Math.cos(lat * DEG));
      const lonStep = STEP / span;
      for (let lon = -180; lon < 180; lon += lonStep) {
        if (!isLand(lon, lat)) continue;
        const p = onSphere(lon, lat);
        dots.push(p.x, p.y, p.z);
      }
    }
    const landGeo = new THREE.BufferGeometry();
    landGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(dots, 3),
    );

    const landMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uSize: { value: 2.35 },
        uColor: { value: SIGNAL },
        uLift: { value: LIFT },
        uPixelRatio: { value: 1 },
      },
      vertexShader: `
        uniform float uSize;
        uniform float uPixelRatio;
        varying float vFacing;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          /* The sphere is centred on the origin, so a point's position is
             also its normal — no attribute needed to know which way it
             faces. */
          vec3 n = normalize(mat3(modelViewMatrix) * position);
          vFacing = n.z;
          gl_PointSize = uSize * uPixelRatio * (0.55 + 0.45 * max(vFacing, 0.0));
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uLift;
        varying float vFacing;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          /* The far side is not hidden, only dimmed — a globe you can see the
             back of reads as a sphere rather than as a disc. */
          /* The far side keeps a third of its weight. Dimmer than the
             near side so the sphere still has a front, present enough that
             you are looking through a world rather than at a shell. */
          float a = mix(0.32, 1.0, smoothstep(-0.95, 0.3, vFacing));
          vec3 c = mix(uColor, uLift, smoothstep(-0.1, 0.95, vFacing));
          gl_FragColor = vec4(c, a * smoothstep(0.5, 0.34, d));
        }
      `,
    });
    const land = new THREE.Points(landGeo, landMat);
    world.add(land);

    /* ---- corridors --------------------------------------------------- */
    const arcVerts: number[] = [];
    const arcT: number[] = [];
    const paths: THREE.Vector3[][] = [];
    for (const c of CORRIDORS) {
      const a = onSphere(CENTRES[c.from].lon, CENTRES[c.from].lat);
      const b = onSphere(CENTRES[c.to].lon, CENTRES[c.to].lat);
      const pts = arcPoints(a, b, ARC_SEGMENTS);
      paths.push(pts);
      for (let i = 0; i < pts.length - 1; i++) {
        arcVerts.push(pts[i].x, pts[i].y, pts[i].z);
        arcVerts.push(pts[i + 1].x, pts[i + 1].y, pts[i + 1].z);
        arcT.push(i / ARC_SEGMENTS, (i + 1) / ARC_SEGMENTS);
      }
    }
    const arcGeo = new THREE.BufferGeometry();
    arcGeo.setAttribute("position", new THREE.Float32BufferAttribute(arcVerts, 3));
    arcGeo.setAttribute("aT", new THREE.Float32BufferAttribute(arcT, 1));
    const arcMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: LIFT } },
      vertexShader: `
        attribute float aT;
        varying float vT;
        varying float vFacing;
        void main() {
          vT = aT;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vFacing = normalize(mat3(modelViewMatrix) * position).z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vT;
        varying float vFacing;
        void main() {
          /* Faded at both ends so an arc leaves the city rather than being
             stuck to it, and cut behind the globe so the far side does not
             draw over the near one. */
          float ends = smoothstep(0.0, 0.16, vT) * smoothstep(1.0, 0.84, vT);
          float front = smoothstep(-0.25, 0.05, vFacing);
          gl_FragColor = vec4(uColor, ends * front * 0.55);
        }
      `,
    });
    world.add(new THREE.LineSegments(arcGeo, arcMat));

    /* ---- what travels along them ------------------------------------- */
    const pulseGeo = new THREE.BufferGeometry();
    const pulsePos = new Float32Array(CORRIDORS.length * 3);
    pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePos, 3));
    const pulseMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: LIFT }, uPixelRatio: { value: 1 } },
      vertexShader: `
        uniform float uPixelRatio;
        varying float vFacing;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vFacing = normalize(mat3(modelViewMatrix) * position).z;
          gl_PointSize = 5.5 * uPixelRatio;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vFacing;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float front = smoothstep(-0.1, 0.15, vFacing);
          gl_FragColor = vec4(uColor, front * smoothstep(0.5, 0.0, d));
        }
      `,
    });
    world.add(new THREE.Points(pulseGeo, pulseMat));

    /* ---- cities ------------------------------------------------------ */
    const cityPos: number[] = [];
    const cityHome: number[] = [];
    for (const c of CENTRES) {
      const p = onSphere(c.lon, c.lat, RADIUS * 1.004);
      cityPos.push(p.x, p.y, p.z);
      cityHome.push("home" in c && c.home ? 1 : 0);
    }
    const cityGeo = new THREE.BufferGeometry();
    cityGeo.setAttribute("position", new THREE.Float32BufferAttribute(cityPos, 3));
    cityGeo.setAttribute("aHome", new THREE.Float32BufferAttribute(cityHome, 1));
    cityGeo.setAttribute(
      "aIndex",
      new THREE.Float32BufferAttribute(CENTRES.map((_, i) => i), 1),
    );
    const cityMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uColor: { value: LIFT },
        uPixelRatio: { value: 1 },
        uTime: { value: 0 },
        uHover: { value: -1 },
      },
      vertexShader: `
        attribute float aHome;
        attribute float aIndex;
        uniform float uHover;
        uniform float uPixelRatio;
        uniform float uTime;
        varying float vFacing;
        varying float vHome;
        varying float vLit;
        void main() {
          vHome = aHome;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vFacing = normalize(mat3(modelViewMatrix) * position).z;
          /* Algiers breathes; the rest hold still. It is the one every
             corridor runs to, so it should be findable while the globe
             turns. */
          float beat = 1.0 + aHome * 0.22 * sin(uTime * 2.4);
          float lit = step(abs(aIndex - uHover), 0.5);
          vLit = lit;
          gl_PointSize =
            (aHome > 0.5 ? 15.0 : 9.0) * beat * (1.0 + lit * 0.55) * uPixelRatio;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vFacing;
        varying float vHome;
        varying float vLit;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          if (d > 1.0) discard;
          /* A ring, not a disc — a filled dot at this size reads as a blob
             on top of the land rather than as a place on it. */
          float ring = smoothstep(0.52, 0.68, d) * smoothstep(1.0, 0.86, d);
          float core = smoothstep(0.34, 0.16, d) * (0.35 + vHome * 0.5 + vLit * 0.5);
          float front = smoothstep(-0.05, 0.2, vFacing);
          float a = (ring + core) * front * (1.0 + vLit * 0.4);
          if (a < 0.01) discard;
          gl_FragColor = vec4(uColor, a);
        }
      `,
    });
    world.add(new THREE.Points(cityGeo, cityMat));

    /* ---- names ------------------------------------------------------
       HTML over the canvas rather than sprites in it: the type is the site's
       own at the site's own weight, it stays crisp at any pixel ratio, and it
       can be read by anything that reads the page. Projected each frame from
       the city's real position, so the names turn with the globe and go
       round the back with it. */
    const overlay = document.createElement("div");
    overlay.className = "globe-labels";
    overlay.setAttribute("aria-hidden", "true");
    host.appendChild(overlay);

    const cityLocal = CENTRES.map((c) => onSphere(c.lon, c.lat, RADIUS * 1.004));
    const labels = CENTRES.map((c) => {
      const el = document.createElement("span");
      el.className = "globe-label";
      if ("home" in c && c.home) el.dataset.home = "true";
      el.textContent = c.name;
      overlay.appendChild(el);
      return el;
    });

    /* ---- size -------------------------------------------------------- */
    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      landMat.uniforms.uPixelRatio.value = dpr;
      pulseMat.uniforms.uPixelRatio.value = dpr;
      cityMat.uniforms.uPixelRatio.value = dpr;
      /* Pulled back until the whole globe fits, solved rather than picked.
         A distance chosen by eye fits the box it was chosen in and crops the
         sphere in every other — which is what was happening: at 3.05 the
         frustum was 1.63 tall against a sphere 2 across, so the top and
         bottom were simply outside it and it looked masked.

         REACH is the radius that has to fit, and the halo sets it rather
         than the sphere: the card is 2.7 across and its glow is gone by 0.93
         of that, so 1.27 is the point past which there is nothing left to
         cut. Solved on both axes and the further of the two wins. */
      const REACH = 1.27;
      const half = Math.tan(((camera.fov / 2) * Math.PI) / 180);
      camera.position.setLength(
        Math.max(REACH / half, REACH / (half * camera.aspect)),
      );
      halo.quaternion.copy(camera.quaternion);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    /* ---- turning it ------------------------------------------------- */
    /* Opens on Algiers. The section is about one country's corridors, and
       a globe that starts on the Pacific spends its first seconds showing the
       one part of the world none of them reach. Solved from the city's own
       position rather than written down, so moving the home city moves the
       opening view with it. */
    const home = onSphere(CENTRES[0].lon, CENTRES[0].lat);
    const spin = { y: -Math.atan2(home.x, home.z) };
    const velocity = { y: 0 };
    /* Fixed. A globe that can be tipped as well as turned can be left at an
       angle nobody chose, and there is no reading of this section that wants
       the pole pointing at you — so the tilt is the map's, set once, and the
       drag only turns it. */
    const TILT = 0.12;
    let dragging = false;
    let lastX = 0;
    /* Held while the pointer is down and for a moment after, so letting go
       hands the globe back to its own drift instead of stopping it dead. */
    let idle = 0;

    /* Which city the pointer is near, in screen space — the markers are a
       few pixels of a rotating sphere, so this asks where they ended up
       rather than trying to intersect them. */
    let hover = -1;
    const projected = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    const nearestCity = (clientX: number, clientY: number) => {
      const r = renderer.domElement.getBoundingClientRect();
      const x = clientX - r.left;
      const y = clientY - r.top;
      let best = -1;
      let bestD = 26 * 26;
      camDir.copy(camera.position).normalize();
      for (let i = 0; i < cityLocal.length; i++) {
        projected.copy(cityLocal[i]).applyMatrix4(world.matrixWorld);
        if (projected.clone().normalize().dot(camDir) < 0.02) continue;
        projected.project(camera);
        const px = (projected.x * 0.5 + 0.5) * r.width;
        const py = (-projected.y * 0.5 + 0.5) * r.height;
        const d = (px - x) ** 2 + (py - y) ** 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return best;
    };

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      idle = 0;
      /* Capture is a nicety — it keeps the drag alive if the pointer
         leaves the canvas — and it throws if the id is not a live pointer.
         Guarded so a throw cannot skip the line after it and leave the globe
         being dragged while still showing the idle cursor. */
      try {
        renderer.domElement.setPointerCapture(e.pointerId);
      } catch {
        /* no capture, drag still works */
      }
      renderer.domElement.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) {
        const i = nearestCity(e.clientX, e.clientY);
        if (i !== hover) {
          hover = i;
          cityMat.uniforms.uHover.value = i;
          labels.forEach((el, n) =>
            el.toggleAttribute("data-on", n === i),
          );
          renderer.domElement.dataset.cursor = i >= 0 ? "link" : "";
        }
        return;
      }
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      velocity.y = dx * 0.005;
      spin.y += velocity.y;
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      idle = 0;
      try {
        renderer.domElement.releasePointerCapture?.(e.pointerId);
      } catch {
        /* nothing to release */
      }
      renderer.domElement.style.cursor = "ew-resize";
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);

    /* ---- the loop ---------------------------------------------------- */
    const pulseVec = new THREE.Vector3();
    let elapsed = 0;
    const draw = () => {
      const dt = Math.min(gsap.ticker.deltaRatio(60) / 60, 0.1);
      elapsed += dt;

      if (!dragging) {
        /* Inertia first, then the drift — so a flick carries and settles
           into the same slow turn it started from. */
        velocity.y *= 0.94;
        spin.y += velocity.y;
        idle = Math.min(1, idle + dt * 1.2);
        if (!reduced) spin.y += 0.028 * dt * idle;
      }
      world.rotation.y = spin.y;
      world.rotation.x = TILT;

      cityMat.uniforms.uTime.value = elapsed;

      for (let i = 0; i < CORRIDORS.length; i++) {
        const c = CORRIDORS[i];
        const pts = paths[i];
        const t = ((elapsed / c.period + c.offset) % 1) * ARC_SEGMENTS;
        const i0 = Math.floor(t);
        pulseVec
          .copy(pts[i0])
          .lerp(pts[Math.min(ARC_SEGMENTS, i0 + 1)], t - i0);
        pulsePos[i * 3] = pulseVec.x;
        pulsePos[i * 3 + 1] = pulseVec.y;
        pulsePos[i * 3 + 2] = pulseVec.z;
      }
      pulseGeo.attributes.position.needsUpdate = true;

      const rect = renderer.domElement;
      const w = rect.clientWidth;
      const h = rect.clientHeight;
      camDir.copy(camera.position).normalize();
      for (let i = 0; i < labels.length; i++) {
        projected.copy(cityLocal[i]).applyMatrix4(world.matrixWorld);
        /* How squarely the city faces the camera. Names fade out well before
           the edge rather than at it, or they would flip from one side of the
           globe to the other in a single frame as the city crosses. */
        const facing = projected.clone().normalize().dot(camDir);
        projected.project(camera);
        const el = labels[i];
        const o = Math.max(0, Math.min(1, (facing - 0.12) / 0.3));
        el.style.opacity = String(o);
        if (o <= 0.001) continue;
        el.style.transform = `translate(${(projected.x * 0.5 + 0.5) * w}px, ${
          (-projected.y * 0.5 + 0.5) * h
        }px)`;
      }

      renderer.render(scene, camera);
    };
    gsap.ticker.add(draw);

    return () => {
      gsap.ticker.remove(draw);
      ro.disconnect();
      overlay.remove();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointercancel", onUp);
      scene.traverse((o) => {
        const m = o as THREE.Points;
        m.geometry?.dispose?.();
        (m.material as THREE.Material)?.dispose?.();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [reduced]);

  return <div ref={hostRef} className={`relative ${className ?? ""}`} />;
}
