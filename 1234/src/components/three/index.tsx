"use client";

import * as React from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import type { FeatureMapItem } from "@/lib/site-config";

// === hero-3d-backdrop.tsx ===
type BackdropTheme = "forest" | "navy" | "sky";

interface Hero3DBackdropProps {
  theme?: BackdropTheme;
  className?: string;
}

const THEME_PALETTES: Record<
  BackdropTheme,
  { primary: number; secondary: number; ring: number; particles: number; opacity: number }
> = {
  forest: {
    primary: 0x9ee56f,
    secondary: 0x3b8c4e,
    ring: 0x8fd95a,
    particles: 0xb7f28d,
    opacity: 0.72,
  },
  navy: {
    primary: 0xf5b942,
    secondary: 0x60a5fa,
    ring: 0x93c5fd,
    particles: 0xfde68a,
    opacity: 0.65,
  },
  sky: {
    primary: 0x3b82f6,
    secondary: 0xb88c58,
    ring: 0x2563eb,
    particles: 0x4f752b,
    opacity: 0.45,
  },
};

/**
 * Interactive WebGL 3D atmospheric canvas backdrop rendering floating crystal polyhedra,
 * dual intersecting orbital wireframe rings, and pointer-driven 3D camera parallax.
 * Falls back gracefully to a static null state if WebGL is unavailable.
 */
export function Hero3DBackdrop({ theme = "forest", className }: Hero3DBackdropProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 560;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.3, 10);

    const palette = THEME_PALETTES[theme];

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(palette.primary, 1.8);
    keyLight.position.set(5, 6, 7);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(palette.secondary, 1.4, 24);
    rimLight.position.set(-6, -3, 4);
    scene.add(rimLight);

    const group = new THREE.Group();
    scene.add(group);

    // Dual large orbital wireframe rings
    const ringGeoA = new THREE.TorusGeometry(3.7, 0.018, 10, 72);
    const ringMatA = new THREE.MeshBasicMaterial({
      color: palette.ring,
      transparent: true,
      opacity: palette.opacity * 0.32,
    });
    const ringA = new THREE.Mesh(ringGeoA, ringMatA);
    ringA.rotation.set(1.15, 0.35, 0.18);
    ringA.position.set(2.3, -0.2, -2.4);
    group.add(ringA);

    const ringGeoB = new THREE.TorusGeometry(2.65, 0.014, 10, 64);
    const ringMatB = new THREE.MeshBasicMaterial({
      color: palette.primary,
      transparent: true,
      opacity: palette.opacity * 0.25,
    });
    const ringB = new THREE.Mesh(ringGeoB, ringMatB);
    ringB.rotation.set(0.7, -0.8, 0.25);
    ringB.position.set(2.4, -0.1, -2.0);
    group.add(ringB);

    // Floating faceted crystal polyhedra across 3D Z-space
    const icoGeo = new THREE.IcosahedronGeometry(0.42, 0);
    const octGeo = new THREE.OctahedronGeometry(0.32, 0);
    const wireMat = new THREE.MeshBasicMaterial({
      color: palette.primary,
      wireframe: true,
      transparent: true,
      opacity: palette.opacity * 0.65,
    });
    const solidMatPrimary = new THREE.MeshStandardMaterial({
      color: palette.primary,
      roughness: 0.28,
      metalness: 0.25,
      transparent: true,
      opacity: palette.opacity * 0.45,
    });
    const solidMatSecondary = new THREE.MeshStandardMaterial({
      color: palette.secondary,
      roughness: 0.35,
      metalness: 0.35,
      transparent: true,
      opacity: palette.opacity * 0.55,
    });

    const crystalConfigs = [
      { pos: [-5.2, 2.2, -3.5], speed: 0.006, wire: true, ico: true, scale: 1.0 },
      { pos: [-4.1, -1.9, -2.5], speed: -0.008, wire: false, ico: false, scale: 0.85 },
      { pos: [5.0, 2.4, -3.0], speed: 0.007, wire: false, ico: true, scale: 1.15 },
      { pos: [4.6, -2.1, -1.8], speed: 0.009, wire: true, ico: false, scale: 0.9 },
      { pos: [0.4, 2.6, -4.5], speed: -0.005, wire: true, ico: true, scale: 0.8 },
      { pos: [-1.4, -2.3, -3.2], speed: 0.007, wire: false, ico: false, scale: 0.72 },
    ];

    const crystals: Array<{ mesh: THREE.Mesh; baseY: number; speed: number; phase: number }> = [];
    crystalConfigs.forEach((cfg, idx) => {
      const geo = cfg.ico ? icoGeo : octGeo;
      const mat = cfg.wire ? wireMat : idx % 2 === 0 ? solidMatPrimary : solidMatSecondary;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      mesh.scale.setScalar(cfg.scale);
      group.add(mesh);
      crystals.push({ mesh, baseY: cfg.pos[1], speed: cfg.speed, phase: idx * 1.1 });
    });

    // Floating 3D depth particles
    const particleCount = 65;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = -Math.random() * 7;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: palette.particles,
      size: 0.075,
      transparent: true,
      opacity: palette.opacity * 0.7,
    });
    const points = new THREE.Points(particleGeo, particleMat);
    group.add(points);

    let pointerX = 0;
    let pointerY = 0;
    const handlePointerMove = (e: PointerEvent) => {
      pointerX = (e.clientX / window.innerWidth - 0.5) * 1.4;
      pointerY = (e.clientY / window.innerHeight - 0.5) * 0.9;
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    const ro = new ResizeObserver(() => {
      if (!container || !renderer) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const t = clock.getElapsedTime();
      ringA.rotation.z += 0.0022;
      ringB.rotation.z -= 0.003;

      for (const c of crystals) {
        c.mesh.rotation.x += c.speed;
        c.mesh.rotation.y += c.speed * 1.3;
        c.mesh.position.y = c.baseY + Math.sin(t * 1.2 + c.phase) * 0.2;
      }

      points.rotation.y = t * 0.02;

      // Damped pointer parallax camera tilt
      camera.position.x += (pointerX * 0.75 - camera.position.x) * 0.04;
      camera.position.y += (0.3 - pointerY * 0.55 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, -2);

      renderer?.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      ringGeoA.dispose();
      ringGeoB.dispose();
      ringMatA.dispose();
      ringMatB.dispose();
      icoGeo.dispose();
      octGeo.dispose();
      wireMat.dispose();
      solidMatPrimary.dispose();
      solidMatSecondary.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer?.dispose();
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    />
  );
}

// === leaderboard-3d.tsx ===
interface LeaderboardTrophy3DProps {
  topName?: string;
  topXp?: number;
  height?: number;
  className?: string;
  compact?: boolean;
}

/**
 * Interactive Three.js WebGL 3D Championship Podium & Golden Trophy Cup.
 * Renders extruded #2/#1/#3 3D pedestals, a lathe-turned metallic golden chalice,
 * floating diamond crown, orbital championship ring, and rising golden sparks.
 */
export function LeaderboardTrophy3D({
  topName = "Minh Anh TOEIC",
  topXp = 1240,
  height = 178,
  className,
  compact = false,
}: LeaderboardTrophy3DProps) {
  const mountRef = React.useRef<HTMLDivElement | null>(null);
  const rotRef = React.useRef({
    yaw: -0.32,
    pitch: 0.24,
    dragging: false,
    lastX: 0,
    lastY: 0,
  });
  const [webglReady, setWebglReady] = React.useState(true);

  React.useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      Promise.resolve().then(() => setWebglReady(false));
      return;
    }

    const width = container.clientWidth || 380;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = `${height}px`;
    renderer.domElement.style.display = "block";
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 60);
    camera.position.set(0, 1.85, 5.4);
    camera.lookAt(0, 0.45, 0);

    // Rich warm metallic lighting
    scene.add(new THREE.AmbientLight(0xfffbeb, 0.9));
    const keyLight = new THREE.DirectionalLight(0xfff4d2, 2.0);
    keyLight.position.set(4, 7, 5);
    scene.add(keyLight);
    const rimGreen = new THREE.PointLight(0x9ee56f, 1.5, 16);
    rimGreen.position.set(-4, 2.5, 3);
    scene.add(rimGreen);
    const rimGold = new THREE.PointLight(0xf59e0b, 1.4, 14);
    rimGold.position.set(3.5, 1.2, -2.5);
    scene.add(rimGold);

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(obj: T): T => {
      disposables.push(obj);
      return obj;
    };

    const stage = new THREE.Group();
    scene.add(stage);

    // Base dark-forest circular turntable platform
    const discGeo = track(new THREE.CylinderGeometry(2.15, 2.25, 0.16, 36));
    const discMat = track(
      new THREE.MeshStandardMaterial({ color: 0x1a3820, roughness: 0.45, metalness: 0.25 })
    );
    const discMesh = new THREE.Mesh(discGeo, discMat);
    discMesh.position.y = -0.62;
    stage.add(discMesh);

    const rimRingGeo = track(new THREE.TorusGeometry(2.2, 0.024, 10, 56));
    const rimRingMat = track(
      new THREE.MeshBasicMaterial({ color: 0x9ee56f, transparent: true, opacity: 0.65 })
    );
    const rimRing = new THREE.Mesh(rimRingGeo, rimRingMat);
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = -0.53;
    stage.add(rimRing);

    // Three stepped 3D podium blocks: #2 Silver (left), #1 Gold (center), #3 Bronze (right)
    const steps = [
      { x: -1.12, h: 0.56, color: 0xcbd5e1, emissive: 0x334155 },
      { x: 0, h: 0.92, color: 0xb2cf7e, emissive: 0x3b631d },
      { x: 1.12, h: 0.42, color: 0xdfd1a7, emissive: 0x6b5622 },
    ];

    steps.forEach((step) => {
      const boxGeo = track(new THREE.BoxGeometry(0.9, step.h, 0.78));
      const boxMat = track(
        new THREE.MeshStandardMaterial({
          color: step.color,
          emissive: step.emissive,
          emissiveIntensity: 0.16,
          roughness: 0.35,
          metalness: 0.2,
        })
      );
      const mesh = new THREE.Mesh(boxGeo, boxMat);
      mesh.position.set(step.x, -0.54 + step.h / 2, 0);
      stage.add(mesh);

      // Subtle glossy top cap slab
      const capGeo = track(new THREE.BoxGeometry(0.95, 0.06, 0.84));
      const capMat = track(
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.25,
          metalness: 0.1,
        })
      );
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(step.x, -0.54 + step.h + 0.03, 0);
      stage.add(cap);
    });

    // Metallic Gold Trophy Cup standing atop Center #1 Pedestal (Lathe profile)
    const cupGroup = new THREE.Group();
    cupGroup.position.set(0, 0.44, 0);
    stage.add(cupGroup);

    const goldMat = track(
      new THREE.MeshStandardMaterial({
        color: 0xf6c343,
        emissive: 0x854d0e,
        emissiveIntensity: 0.28,
        roughness: 0.2,
        metalness: 0.82,
      })
    );

    const profilePoints = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.28, 0.0),
      new THREE.Vector2(0.24, 0.09),
      new THREE.Vector2(0.09, 0.16),
      new THREE.Vector2(0.08, 0.34),
      new THREE.Vector2(0.18, 0.42),
      new THREE.Vector2(0.36, 0.78),
      new THREE.Vector2(0.39, 0.94),
      new THREE.Vector2(0.34, 0.94),
      new THREE.Vector2(0.30, 0.76),
      new THREE.Vector2(0.15, 0.44),
      new THREE.Vector2(0.0, 0.44),
    ];
    const chaliceGeo = track(new THREE.LatheGeometry(profilePoints, 28));
    const chalice = new THREE.Mesh(chaliceGeo, goldMat);
    cupGroup.add(chalice);

    // Side trophy handles (curved tori)
    [-1, 1].forEach((side) => {
      const handleGeo = track(new THREE.TorusGeometry(0.16, 0.032, 8, 20, Math.PI));
      const handle = new THREE.Mesh(handleGeo, goldMat);
      handle.position.set(side * 0.34, 0.7, 0);
      handle.rotation.z = side === -1 ? Math.PI / 2 : -Math.PI / 2;
      cupGroup.add(handle);
    });

    // Floating emerald crest gem spinning inside/above trophy chalice
    const starGeo = track(new THREE.OctahedronGeometry(0.18, 0));
    const starMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x9ee56f,
        emissive: 0x4ca12f,
        emissiveIntensity: 0.55,
        roughness: 0.15,
        metalness: 0.5,
      })
    );
    const starGem = new THREE.Mesh(starGeo, starMat);
    starGem.position.set(0, 1.18, 0);
    cupGroup.add(starGem);

    // Floating Silver (#2) & Bronze (#3) Coins hovering above left & right steps
    const coinGeo = track(new THREE.CylinderGeometry(0.19, 0.19, 0.06, 20));
    const silverMat = track(
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.85 })
    );
    const bronzeMat = track(
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.26, metalness: 0.78 })
    );

    const coin2 = new THREE.Mesh(coinGeo, silverMat);
    coin2.rotation.x = Math.PI / 2;
    coin2.position.set(-1.12, 0.34, 0);
    stage.add(coin2);

    const coin3 = new THREE.Mesh(coinGeo, bronzeMat);
    coin3.rotation.x = Math.PI / 2;
    coin3.position.set(1.12, 0.2, 0);
    stage.add(coin3);

    // Floating golden spark dust
    const sparkCount = 42;
    const sparkPos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const rad = 0.6 + Math.random() * 1.6;
      sparkPos[i * 3] = Math.cos(a) * rad;
      sparkPos[i * 3 + 1] = -0.3 + Math.random() * 2.1;
      sparkPos[i * 3 + 2] = Math.sin(a) * rad;
    }
    const sparkGeo = track(new THREE.BufferGeometry());
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = track(
      new THREE.PointsMaterial({ color: 0xfde047, size: 0.055, transparent: true, opacity: 0.85 })
    );
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    stage.add(sparks);

    const ro = new ResizeObserver(() => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 380;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    });
    ro.observe(container);

    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const t = clock.getElapsedTime();
      if (!rotRef.current.dragging) {
        rotRef.current.yaw += 0.0045;
      }

      stage.rotation.y = rotRef.current.yaw;
      stage.rotation.x = rotRef.current.pitch;

      cupGroup.rotation.y = -t * 0.45;
      starGem.rotation.y = t * 1.6;
      starGem.position.y = 1.18 + Math.sin(t * 2.4) * 0.05;

      coin2.rotation.z = t * 1.1;
      coin2.position.y = 0.34 + Math.sin(t * 2.0 + 0.6) * 0.04;
      coin3.rotation.z = -t * 1.1;
      coin3.position.y = 0.2 + Math.cos(t * 2.0) * 0.04;

      sparks.rotation.y = t * 0.22;

      renderer?.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      disposables.forEach((d) => d.dispose());
      renderer?.dispose();
    };
  }, [height]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    rotRef.current.dragging = true;
    rotRef.current.lastX = e.clientX;
    rotRef.current.lastY = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!rotRef.current.dragging) return;
    const dx = e.clientX - rotRef.current.lastX;
    const dy = e.clientY - rotRef.current.lastY;
    rotRef.current.yaw += dx * 0.012;
    rotRef.current.pitch = Math.max(-0.08, Math.min(0.65, rotRef.current.pitch + dy * 0.008));
    rotRef.current.lastX = e.clientX;
    rotRef.current.lastY = e.clientY;
  };

  const stopDrag = () => {
    rotRef.current.dragging = false;
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#cfd8c6] bg-gradient-to-b from-[#132917] via-[#1c3d22] to-[#0e2012] text-white shadow-inner dark:border-[#9ee56f]/25",
        className
      )}
    >
      {/* Top Floating Badge */}
      <div className="pointer-events-none absolute inset-x-3 top-2.5 z-10 flex items-center justify-between text-[10px]">
        <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/35 px-2.5 py-0.5 font-extrabold uppercase tracking-wider text-[#9ee56f] backdrop-blur-xs">
          ✦ Cúp Vô Địch 3D
        </span>
        {!compact && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono-num text-[10px] font-bold text-amber-200 backdrop-blur-xs">
            TOP 1 · {topName} ({topXp} EXP)
          </span>
        )}
      </div>

      {webglReady ? (
        <div
          ref={mountRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrag}
          onPointerLeave={stopDrag}
          style={{ height }}
          className="w-full cursor-grab active:cursor-grabbing touch-none select-none"
          aria-label="Sân khấu cúp vô địch 3D tương tác — kéo để xoay"
        />
      ) : (
        <div
          style={{ height }}
          className="flex flex-col items-center justify-center p-4 text-center text-xs text-white/75"
        >
          <p className="font-bold text-amber-300">Cúp Vô Địch · {topName}</p>
          <p className="mt-0.5 text-[11px]">{topXp} EXP dẫn đầu tuần này</p>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center">
        <span className="inline-block rounded-full bg-black/30 px-2.5 py-0.5 text-[10px] font-medium text-white/70 backdrop-blur-xs">
          Kéo chuột để xoay mô hình 3D
        </span>
      </div>
    </div>
  );
}

// === study-island-3d.tsx ===
interface StudyIsland3DProps {
  items: FeatureMapItem[];
  activeId: string;
  onSelect: (item: FeatureMapItem) => void;
  size?: number;
  className?: string;
}

const LANDMARK_PILLARS = [
  { label: "01 Tài liệu & Ngữ pháp", itemIdx: 1, color: 0x9ee56f },
  { label: "02 Nghe & Dictation", itemIdx: 2, color: 0x38bdf8 },
  { label: "03 Đọc báo & Quét từ", itemIdx: 3, color: 0xf472b6 },
  { label: "04 Luyện đề ETS", itemIdx: 6, color: 0xf5b942 },
];

/**
 * Interactive Three.js WebGL 3D Isometric Learning Island Diorama.
 * Users can drag to rotate the floating 3D platform, view orbiting satellite study modules
 * (Book stack, Sound wave torus, Knowledge crystal prism, Gold medal disc), or click a node.
 */
export function StudyIsland3D({
  items,
  activeId,
  onSelect,
  size = 330,
  className,
}: StudyIsland3DProps) {
  const mountRef = React.useRef<HTMLDivElement | null>(null);
  const rotStateRef = React.useRef({
    yaw: 0.45,
    pitch: 0.42,
    dragging: false,
    lastX: 0,
    lastY: 0,
  });
  const [webglReady, setWebglReady] = React.useState(true);

  React.useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      Promise.resolve().then(() => setWebglReady(false));
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size);
    renderer.domElement.style.width = `${size}px`;
    renderer.domElement.style.height = `${size}px`;
    renderer.domElement.style.display = "block";
    el.innerHTML = "";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    camera.position.set(0, 2.2, 6.2);
    camera.lookAt(0, 0.25, 0);

    // Crisp studio lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xfffdf6, 1.5);
    sun.position.set(4, 7, 5);
    scene.add(sun);
    const emeraldFill = new THREE.PointLight(0x9ee56f, 1.5, 16);
    emeraldFill.position.set(-4, 2, 3);
    scene.add(emeraldFill);

    const world = new THREE.Group();
    scene.add(world);

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(obj: T): T => {
      disposables.push(obj);
      return obj;
    };

    // Main floating island deck: lower dark earth bevel + vibrant emerald moss hexagon top
    const rockGeo = track(new THREE.CylinderGeometry(1.75, 1.05, 0.55, 6));
    const rockMat = track(
      new THREE.MeshStandardMaterial({ color: 0x263829, roughness: 0.75, metalness: 0.1 })
    );
    const rockMesh = new THREE.Mesh(rockGeo, rockMat);
    rockMesh.position.y = -0.35;
    world.add(rockMesh);

    const grassGeo = track(new THREE.CylinderGeometry(1.9, 1.78, 0.22, 6));
    const grassMat = track(
      new THREE.MeshStandardMaterial({ color: 0x528b3b, roughness: 0.55, metalness: 0.08 })
    );
    const grassMesh = new THREE.Mesh(grassGeo, grassMat);
    grassMesh.position.y = 0.03;
    world.add(grassMesh);

    // Orbiting Neon Ring around Island
    const haloGeo = track(new THREE.TorusGeometry(2.35, 0.025, 12, 64));
    const haloMat = track(
      new THREE.MeshBasicMaterial({ color: 0x9ee56f, transparent: true, opacity: 0.55 })
    );
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = Math.PI / 2;
    haloMesh.position.y = 0.1;
    world.add(haloMesh);

    // 1. Center Emerald Graduation Trophy Beacon
    const pedestalGeo = track(new THREE.CylinderGeometry(0.42, 0.52, 0.36, 16));
    const pedestalMat = track(
      new THREE.MeshStandardMaterial({ color: 0x163426, roughness: 0.4, metalness: 0.3 })
    );
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(0, 0.32, 0);
    world.add(pedestal);

    const gemGeo = track(new THREE.OctahedronGeometry(0.44, 0));
    const gemMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x9ee56f,
        emissive: 0x3b7a2a,
        emissiveIntensity: 0.45,
        roughness: 0.18,
        metalness: 0.45,
      })
    );
    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.set(0, 1.0, 0);
    world.add(gem);

    // 2. Landmark 1: 3D Stacked Grammar Books (front-left)
    const bookGroup = new THREE.Group();
    bookGroup.position.set(-0.98, 0.26, 0.55);
    const bookColors = [0xb88c58, 0x9ee56f, 0xf3eee3];
    bookColors.forEach((col, i) => {
      const bGeo = track(new THREE.BoxGeometry(0.62, 0.14, 0.44));
      const bMat = track(new THREE.MeshStandardMaterial({ color: col, roughness: 0.45 }));
      const bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.position.y = i * 0.15;
      bMesh.rotation.y = (i - 1) * 0.14;
      bookGroup.add(bMesh);
    });
    world.add(bookGroup);

    // 3. Landmark 2: Listening Audio Torus Arch & Waves (back-right)
    const listenGroup = new THREE.Group();
    listenGroup.position.set(0.98, 0.5, -0.58);
    const archGeo = track(new THREE.TorusGeometry(0.28, 0.06, 10, 28, Math.PI));
    const archMat = track(
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.25, metalness: 0.5 })
    );
    const arch = new THREE.Mesh(archGeo, archMat);
    listenGroup.add(arch);
    [-0.28, 0.28].forEach((offsetX) => {
      const cupGeo = track(new THREE.SphereGeometry(0.11, 14, 14));
      const cup = new THREE.Mesh(cupGeo, archMat);
      cup.position.set(offsetX, 0, 0);
      listenGroup.add(cup);
    });
    world.add(listenGroup);

    // 4. Landmark 3: Reading Pink/Amber Floating Crystal Card (back-left)
    const cardGeo = track(new THREE.BoxGeometry(0.46, 0.58, 0.08));
    const cardMat = track(
      new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.3, metalness: 0.2 })
    );
    const readCard = new THREE.Mesh(cardGeo, cardMat);
    readCard.position.set(-0.92, 0.55, -0.62);
    readCard.rotation.set(-0.18, 0.4, 0.08);
    world.add(readCard);

    // 5. Landmark 4: Exam Gold Trophy Disc / Cube (front-right)
    const examGeo = track(new THREE.IcosahedronGeometry(0.32, 0));
    const examMat = track(
      new THREE.MeshStandardMaterial({
        color: 0xf5b942,
        emissive: 0x7c4805,
        emissiveIntensity: 0.3,
        roughness: 0.22,
        metalness: 0.55,
      })
    );
    const examNode = new THREE.Mesh(examGeo, examMat);
    examNode.position.set(0.95, 0.5, 0.58);
    world.add(examNode);

    // Floating orbital satellite beads
    const satGeo = track(new THREE.SphereGeometry(0.075, 12, 12));
    const satMat = track(new THREE.MeshBasicMaterial({ color: 0xfffdf6 }));
    const satellites: Array<{ mesh: THREE.Mesh; angle: number; speed: number }> = [];
    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(satGeo, satMat);
      world.add(mesh);
      satellites.push({ mesh, angle: (Math.PI / 2) * i, speed: 0.8 });
    }

    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const t = clock.getElapsedTime();
      if (!rotStateRef.current.dragging) {
        rotStateRef.current.yaw += 0.0055;
      }

      world.rotation.y = rotStateRef.current.yaw;
      world.rotation.x = rotStateRef.current.pitch;
      world.position.y = Math.sin(t * 1.4) * 0.08;

      gem.rotation.y = t * 1.2;
      gem.position.y = 0.96 + Math.sin(t * 2.2) * 0.07;

      listenGroup.position.y = 0.52 + Math.cos(t * 2.1) * 0.05;
      readCard.position.y = 0.56 + Math.sin(t * 1.9 + 1) * 0.05;
      examNode.rotation.x = t * 0.8;
      examNode.rotation.y = t * 1.1;

      for (const s of satellites) {
        const a = s.angle + t * s.speed;
        s.mesh.position.set(Math.cos(a) * 2.35, 0.1 + Math.sin(t * 2 + a) * 0.04, Math.sin(a) * 2.35);
      }

      renderer?.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      disposables.forEach((d) => d.dispose());
      renderer?.dispose();
    };
  }, [size]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    rotStateRef.current.dragging = true;
    rotStateRef.current.lastX = e.clientX;
    rotStateRef.current.lastY = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!rotStateRef.current.dragging) return;
    const dx = e.clientX - rotStateRef.current.lastX;
    const dy = e.clientY - rotStateRef.current.lastY;
    rotStateRef.current.yaw += dx * 0.012;
    rotStateRef.current.pitch = Math.max(0.12, Math.min(0.85, rotStateRef.current.pitch + dy * 0.008));
    rotStateRef.current.lastX = e.clientX;
    rotStateRef.current.lastY = e.clientY;
  };

  const stopDrag = () => {
    rotStateRef.current.dragging = false;
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      {webglReady ? (
        <div
          ref={mountRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrag}
          onPointerLeave={stopDrag}
          style={{ width: size, height: size }}
          className="cursor-grab active:cursor-grabbing touch-none select-none"
          aria-label="Mô hình không gian học 3D tương tác — kéo để xoay"
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="flex flex-col items-center justify-center rounded-3xl border border-white/15 bg-white/5 p-6 text-center text-xs text-white/75"
        >
          <p className="font-bold text-[#9ee56f]">Không gian học TOEIC 3D</p>
          <p className="mt-1">Chạm các nút bên dưới để mở nhanh khu học tập.</p>
        </div>
      )}

      {/* Interactive Pillar Jump Buttons synced to FeatureMap items */}
      <div className="mt-2 flex flex-wrap justify-center gap-1.5 max-w-[330px]">
        {LANDMARK_PILLARS.map((pillar) => {
          const mapped = items[pillar.itemIdx] ?? items[0];
          const isSelected = mapped?.id === activeId;
          return (
            <button
              key={pillar.label}
              type="button"
              onClick={() => {
                if (mapped) onSelect(mapped);
                rotStateRef.current.yaw += 0.9;
              }}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10px] font-bold transition cursor-pointer",
                isSelected
                  ? "border-[#9ee56f] bg-[#9ee56f]/20 text-[#9ee56f]"
                  : "border-white/15 bg-white/5 text-white/75 hover:border-white/35 hover:text-white"
              )}
            >
              {pillar.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
