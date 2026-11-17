"use client";

import * as React from "react";
import { ArrowDown, ArrowRight, Bell, Box, ChevronRight, Flame, Gift, Globe2, GraduationCap, HelpCircle, Layers, MessageSquare, ShieldCheck, Smartphone, Sparkles, Star, Trophy, Users, Volume2 } from "lucide-react";
import type { FeatureMapItem } from "@/lib/site-config";
import Link from "next/link";
import { FacebookBrandIcon, YoutubeBrandIcon } from "@/components/ui";
import { Mascot, MascotExamArt, MascotReadingArt, } from "@/components/brand/mascot";
import { Hero3DBackdrop } from "@/components/three";
import { LeaderboardTrophy3D } from "@/components/three";
import { StudyIsland3D } from "@/components/three";
import { Podium3DCards } from "@/components/leaderboard";
import { Tilt3D } from "@/components/ui";
import { useApp } from "@/components/providers/app-provider";
import { siteConfig, type FeatureMapItem } from "@/lib/site-config";

// === feature-globe.tsx ===
interface FeatureGlobeProps {
  items: FeatureMapItem[];
  activeId: string;
  onSelect: (item: FeatureMapItem) => void;
  size?: number;
  darkStage?: boolean;
}

/**
 * Stylized Asia-Pacific / Eurasia continent polylines ([lat, lon]) so the 3D wireframe globe
 * displays crisp landmass contours matching StudyChill's global learning map.
 */
const CONTINENT_POLYGONS: Array<Array<[number, number]>> = [
  // East & Southeast Asia outline
  [
    [52, 105], [50, 128], [41, 129], [36, 127], [30, 122], [22, 114], [21, 108],
    [16, 108], [10, 106], [13, 101], [7, 100], [1, 104], [10, 99], [19, 94],
    [22, 88], [26, 72], [35, 76], [42, 88], [52, 105],
  ],
  // Japan archipelago
  [[44, 143], [38, 141], [35, 139], [33, 131], [36, 136], [41, 140], [44, 143]],
  // Indonesia / Maritime SEA
  [[5, 96], [-4, 105], [-7, 114], [-8, 120], [-2, 117], [3, 111], [5, 96]],
  // Australia
  [
    [-12, 130], [-14, 143], [-24, 152], [-37, 149], [-38, 141], [-33, 124],
    [-31, 115], [-21, 115], [-12, 130],
  ],
  // Northern Eurasia & Europe hint
  [[68, 30], [70, 75], [64, 110], [60, 142], [54, 120], [50, 70], [52, 22], [60, 10], [68, 30]],
  // Africa east coast hint
  [[30, 32], [12, 44], [2, 46], [-18, 36], [-34, 22], [-18, 14], [15, -16], [35, 10], [30, 32]],
];

const CITY_LABELS: Record<string, string> = {
  "lo-trinh-nghe": "Tokyo",
  "ngu-phap-nen-tang": "Seoul",
  "doc-bao-song-ngu": "Singapore",
  "nghe-chep-doan-van": "Sydney",
  "on-tu-vung": "Hà Nội",
  "doc-quet-luot": "Bangkok",
  "video-song-ngu": "Taipei",
  "nghe-chep-chinh-ta": "Osaka",
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Interactive 3D wireframe globe rendered on HTML5 Canvas for the Homepage Filmstrip showcase
 * and the Feature Map modal, supporting drag rotation, continent contours, glowing pins, and label badges.
 */
export function FeatureGlobe({
  items,
  activeId,
  onSelect,
  size = 260,
  darkStage = false,
}: FeatureGlobeProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const rotRef = React.useRef({ lon: -1.75, lat: 0.25, dragging: false, lastX: 0, lastY: 0 });
  const projectedRef = React.useRef<Array<{ item: FeatureMapItem; x: number; y: number; visible: boolean }>>([]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== size * dpr) {
        canvas.width = size * dpr;
        canvas.height = size * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      if (!rotRef.current.dragging) {
        rotRef.current.lon += 0.0028;
      }

      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.39;
      const { lon: rotLon, lat: rotLat } = rotRef.current;

      const project = (latDeg: number, lonDeg: number) => {
        const phi = (latDeg * Math.PI) / 180;
        const lambda = (lonDeg * Math.PI) / 180 + rotLon;
        const x0 = Math.cos(phi) * Math.sin(lambda);
        const y0 = Math.sin(phi);
        const z0 = Math.cos(phi) * Math.cos(lambda);

        const cosLat = Math.cos(rotLat);
        const sinLat = Math.sin(rotLat);
        const y1 = y0 * cosLat - z0 * sinLat;
        const z1 = y0 * sinLat + z0 * cosLat;

        return {
          x: cx + x0 * r,
          y: cy - y1 * r,
          z: z1,
        };
      };

      // Back-half of tilted 3D equatorial orbital ring (drawn BEFORE globe sphere)
      const ringRadius = r * 1.19;
      ctx.save();
      ctx.beginPath();
      for (let deg = 0; deg <= 360; deg += 4) {
        const a = (deg * Math.PI) / 180 + rotLon * 0.4;
        const rx = cx + Math.cos(a) * ringRadius * 0.96 - Math.sin(a) * Math.sin(0.28) * ringRadius * 0.25;
        const rz = Math.sin(a) * Math.cos(0.32);
        const ry = cy + Math.sin(a) * ringRadius * 0.34 - Math.cos(a) * ringRadius * 0.16;
        if (rz <= 0) {
          if (deg === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
      }
      ctx.strokeStyle = "rgba(158, 229, 111, 0.22)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Volumetric 3D sphere shading gradient
      const glow = ctx.createRadialGradient(cx - r * 0.32, cy - r * 0.32, r * 0.08, cx, cy, r);
      glow.addColorStop(0, "rgba(175, 229, 118, 0.22)");
      glow.addColorStop(0.55, "rgba(110, 165, 58, 0.09)");
      glow.addColorStop(1, "rgba(8, 20, 14, 0.28)");

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
      ctx.strokeStyle = "rgba(162, 206, 98, 0.45)";
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Latitude grid lines
      ctx.strokeStyle = "rgba(140, 184, 74, 0.16)";
      ctx.lineWidth = 0.85;
      for (let lat = -60; lat <= 60; lat += 25) {
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 10) {
          const p = project(lat, lon);
          if (p.z > 0) {
            if (!started) {
              ctx.moveTo(p.x, p.y);
              started = true;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      // Longitude meridians
      for (let lon = -180; lon < 180; lon += 25) {
        ctx.beginPath();
        let started = false;
        for (let lat = -85; lat <= 85; lat += 8) {
          const p = project(lat, lon);
          if (p.z > 0) {
            if (!started) {
              ctx.moveTo(p.x, p.y);
              started = true;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      // Stylized landmass contours
      ctx.strokeStyle = "rgba(255, 253, 248, 0.38)";
      ctx.fillStyle = "rgba(140, 184, 74, 0.08)";
      ctx.lineWidth = 1.1;
      for (const poly of CONTINENT_POLYGONS) {
        ctx.beginPath();
        let started = false;
        for (const [lat, lon] of poly) {
          const p = project(lat, lon);
          if (p.z > -0.05) {
            if (!started) {
              ctx.moveTo(p.x, p.y);
              started = true;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      // Curved 3D flight arcs between adjacent Asia-Pacific hubs when both face forward
      for (let i = 0; i < items.length - 1; i++) {
        const pA = project(items[i].coords[0], items[i].coords[1]);
        const pB = project(items[i + 1].coords[0], items[i + 1].coords[1]);
        if (pA.z > 0.15 && pB.z > 0.15) {
          const midX = (pA.x + pB.x) / 2;
          const midY = (pA.y + pB.y) / 2 - Math.hypot(pB.x - pA.x, pB.y - pA.y) * 0.24;
          ctx.beginPath();
          ctx.moveTo(pA.x, pA.y);
          ctx.quadraticCurveTo(midX, midY, pB.x, pB.y);
          ctx.strokeStyle = "rgba(158, 229, 111, 0.36)";
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
      }

      // Front-half of tilted 3D equatorial orbital ring (drawn OVER globe surface)
      ctx.save();
      ctx.beginPath();
      let startedFront = false;
      for (let deg = 0; deg <= 360; deg += 4) {
        const a = (deg * Math.PI) / 180 + rotLon * 0.4;
        const rx = cx + Math.cos(a) * ringRadius * 0.96 - Math.sin(a) * Math.sin(0.28) * ringRadius * 0.25;
        const rz = Math.sin(a) * Math.cos(0.32);
        const ry = cy + Math.sin(a) * ringRadius * 0.34 - Math.cos(a) * ringRadius * 0.16;
        if (rz > 0) {
          if (!startedFront) {
            ctx.moveTo(rx, ry);
            startedFront = true;
          } else {
            ctx.lineTo(rx, ry);
          }
        } else {
          startedFront = false;
        }
      }
      ctx.strokeStyle = "rgba(181, 240, 128, 0.55)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();

      // Feature nodes & crisp pin badges
      const nextProjected: typeof projectedRef.current = [];
      const visibleLabels: Array<{
        x: number;
        y: number;
        title: string;
        city: string;
        isActive: boolean;
      }> = [];

      for (const item of items) {
        const p = project(item.coords[0], item.coords[1]);
        const visible = p.z > 0.05;
        nextProjected.push({ item, x: p.x, y: p.y, visible });

        if (!visible) continue;
        const isActive = item.id === activeId;

        if (isActive) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(181, 224, 92, 0.25)";
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, isActive ? 5.5 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? "#fffdf6" : "#8cb84a";
        ctx.fill();
        ctx.strokeStyle = isActive ? "#8cb84a" : "#ffffff";
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Collect top 4 front-facing pins + active pin for crisp floating labels
        if (isActive || (p.z > 0.35 && visibleLabels.length < 4)) {
          visibleLabels.push({
            x: p.x,
            y: p.y,
            title: item.title,
            city: item.city ?? CITY_LABELS[item.id] ?? "StudyChill Hub",
            isActive,
          });
        }
      }

      // Draw crisp rounded pill badges attached to pins with guaranteed vertical separation
      visibleLabels.sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.y - b.y);
      const placedBoxes: Array<{ x: number; y: number; w: number; h: number }> = [];

      for (const lbl of visibleLabels) {
        const boxW = Math.min(136, Math.max(94, lbl.title.length * 5.9 + 20));
        const boxH = 30;
        const preferLeft = lbl.x > cx + r * 0.12 || lbl.x + boxW + 14 > size - 10;
        const rawX = preferLeft ? lbl.x - boxW - 10 : lbl.x + 10;
        const bx = Math.max(10, Math.min(size - boxW - 10, rawX));
        let by = Math.max(10, Math.min(size - boxH - 10, lbl.y - boxH / 2));

        // Attempt up/down nudges so labels never stack over each other
        const overlaps = (testY: number) =>
          placedBoxes.some(
            (b) => Math.abs(b.x - bx) < Math.max(b.w, boxW) * 0.85 && Math.abs(b.y - testY) < boxH + 10
          );

        if (overlaps(by)) {
          const offsets = [boxH + 12, -(boxH + 12), 2 * (boxH + 12), -2 * (boxH + 12)];
          let found = false;
          for (const dy of offsets) {
            const candidateY = Math.max(10, Math.min(size - boxH - 10, by + dy));
            if (!overlaps(candidateY)) {
              by = candidateY;
              found = true;
              break;
            }
          }
          if (!found) continue;
        }

        placedBoxes.push({ x: bx, y: by, w: boxW, h: boxH });

        // Crisp green accent lip at bottom like StudyChill pins
        drawRoundedRect(ctx, bx, by + 2.5, boxW, boxH, 7);
        ctx.fillStyle = "#5a8632";
        ctx.fill();

        // Main clean white card
        drawRoundedRect(ctx, bx, by, boxW, boxH, 7);
        ctx.fillStyle = lbl.isActive ? "#ffffff" : "#f8faf5";
        ctx.fill();
        ctx.strokeStyle = lbl.isActive ? "#8cb84a" : "#d3dbc6";
        ctx.lineWidth = lbl.isActive ? 1.5 : 1;
        ctx.stroke();

        ctx.fillStyle = "#182414";
        ctx.font = "700 10px Inter, system-ui, sans-serif";
        ctx.fillText(lbl.title, bx + 8, by + 13, boxW - 16);

        ctx.fillStyle = "#5f7454";
        ctx.font = "600 8.5px Inter, system-ui, sans-serif";
        ctx.fillText(lbl.city, bx + 8, by + 24, boxW - 16);

        if (placedBoxes.length >= 4) break;
      }

      projectedRef.current = nextProjected;
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [items, activeId, size]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    rotRef.current.dragging = true;
    rotRef.current.lastX = e.clientX;
    rotRef.current.lastY = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!rotRef.current.dragging) return;
    const dx = e.clientX - rotRef.current.lastX;
    const dy = e.clientY - rotRef.current.lastY;
    rotRef.current.lon += dx * 0.01;
    rotRef.current.lat = Math.max(-1.1, Math.min(1.1, rotRef.current.lat + dy * 0.01));
    rotRef.current.lastX = e.clientX;
    rotRef.current.lastY = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    rotRef.current.dragging = false;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const hit = projectedRef.current.find(
      (n) => n.visible && Math.hypot(n.x - px, n.y - py) < 22
    );
    if (hit) {
      onSelect(hit.item);
    }
  };

  return (
    <div
      className={
        darkStage
          ? "flex flex-col items-center justify-center"
          : "flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-3"
      }
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          rotRef.current.dragging = false;
        }}
        style={{ width: size, height: size }}
        className="cursor-grab active:cursor-grabbing touch-none"
      />
      {!darkStage && (
        <p className="mt-1.5 text-center text-xs text-[var(--muted-foreground)]">
          Kéo xoay quả cầu hoặc chạm vào điểm sáng
        </p>
      )}
    </div>
  );
}

// === gear-divider.tsx ===
export function GearDivider() {
  return (
    <div
      aria-hidden="true"
      className="relative h-9 w-full overflow-hidden bg-[#222528] border-y border-black/50 select-none"
    >
      <div
        className="h-full w-full opacity-95"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='36' viewBox='0 0 64 36'%3E%3Cg fill='%2316181a' stroke='%233d4247' stroke-width='1.5'%3E%3Cpath d='M16 2 L19 6 L24 5 L25 10 L30 12 L28 17 L32 21 L27 24 L27 29 L22 30 L19 34 L15 31 L10 34 L8 29 L3 29 L4 24 L0 20 L4 16 L3 11 L8 10 L10 5 L14 6 Z'/%3E%3Ccircle cx='16' cy='18' r='5' fill='%232e3236'/%3E%3Cpath d='M48 2 L51 6 L56 5 L57 10 L62 12 L60 17 L64 21 L59 24 L59 29 L54 30 L51 34 L47 31 L42 34 L40 29 L35 29 L36 24 L32 20 L36 16 L35 11 L40 10 L42 5 L46 6 Z'/%3E%3Ccircle cx='48' cy='18' r='5' fill='%232e3236'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat-x",
          backgroundPosition: "center",
          backgroundSize: "64px 36px",
        }}
      />
    </div>
  );
}

// === home-client.tsx ===
interface LeaderRow {
  id: string;
  name: string;
  xp: number;
  streakDays: number;
}

interface HomeClientProps {
  stats: {
    documentsCount: number;
    grammarTopicsCount: number;
    grammarLessonsCount: number;
    examSetsCount: number;
    examTestsCount: number;
    examQuestionsCount: number;
    scenariosCount?: number;
    openSessionsCount?: number;
    surveyResponsesCount?: number;
  };
  leaders: LeaderRow[];
}

const FALLBACK_LEADERS: LeaderRow[] = [
  { id: "f1", name: "Minh Anh 850", xp: 480, streakDays: 14 },
  { id: "f2", name: "Thanh Hương", xp: 325, streakDays: 9 },
  { id: "f3", name: "Thuỳ Dương", xp: 210, streakDays: 6 },
  { id: "f4", name: "Kiều Diễm", xp: 145, streakDays: 7 },
  { id: "f5", name: "Hữu Trung", xp: 98, streakDays: 4 },
];

const BINDER_CARDS = [
  {
    id: "docs",
    title: "Tài liệu",
    subtitle: "Kho tài liệu miễn phí.",
    href: "/documents",
  },
  {
    id: "listening",
    title: "Luyện nghe",
    subtitle: "Nghe chép, luyện theo Part.",
    href: "/listening",
  },
  {
    id: "reading",
    title: "Luyện đọc",
    subtitle: "Đọc hiểu, đọc lướt & quét.",
    href: "/reading",
  },
  {
    id: "exam",
    title: "Luyện đề",
    subtitle: "Đề thi thử sát đề thật.",
    href: "/luyen-de",
  },
];

function renderBubbleText(text: string, word: string, meaning: string) {
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedMeaning = meaning.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(${escapedWord})\\s*\\((${escapedMeaning})\\)`, "i");
  const match = text.match(pattern);
  if (!match || match.index === undefined) {
    return <span>{text}</span>;
  }
  const before = text.slice(0, match.index);
  const after = text.slice(match.index + match[0].length);
  return (
    <>
      {before}
      <strong className="font-extrabold text-[#16361b]">{match[1]}</strong>{" "}
      <em className="font-semibold text-[#5a6854]">({match[2]})</em>
      {after}
    </>
  );
}

export function HomeClient({ stats, leaders }: HomeClientProps) {
  const { user, openAuthModal } = useApp();
  const [bubbleIndex, setBubbleIndex] = React.useState(0);
  const [activeFeature, setActiveFeature] = React.useState<FeatureMapItem>(
    siteConfig.featureMap[2]
  );
  const [stageMode3D, setStageMode3D] = React.useState<"globe" | "island">("globe");
  const [rankTab, setRankTab] = React.useState<"week" | "month" | "all" | "streak">("week");

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setBubbleIndex((i) => (i + 1) % siteConfig.heroSpeechBubbles.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, []);

  const currentBubble = siteConfig.heroSpeechBubbles[bubbleIndex];

  const speakWord = (word: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(word);
      utter.lang = "en-US";
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    }
  };

  // Merge DB leaders with clean fallbacks if < 5 rows exist
  const baseRows = leaders.length >= 5 ? leaders : [...leaders, ...FALLBACK_LEADERS].slice(0, 8);
  const sortedRows = React.useMemo(() => {
    const list = [...baseRows];
    if (rankTab === "streak") {
      return list.sort((a, b) => b.streakDays - a.streakDays || b.xp - a.xp);
    }
    const mult = rankTab === "month" ? 2 : rankTab === "all" ? 4 : 1;
    return list
      .map((item) => ({ ...item, xp: item.xp * mult }))
      .sort((a, b) => b.xp - a.xp || b.streakDays - a.streakDays);
  }, [baseRows, rankTab]);

  const first = sortedRows[0] ?? FALLBACK_LEADERS[0];
  const second = sortedRows[1] ?? FALLBACK_LEADERS[1];
  const third = sortedRows[2] ?? FALLBACK_LEADERS[2];
  const runnerUps = sortedRows.slice(3, 6);

  return (
    <div className="overflow-x-clip">
      {/* 1A. MOBILE COZY PAPER-GRID HERO (< md) matching StudyChill mobile step_4 */}
      <section className="pt-20 pb-8 md:hidden">
        <div className="mx-auto max-w-md px-4 text-center">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#4c6848]">
            <span>🍃</span>
            <span>GÓC HỌC TẬP CỦA BẠN</span>
          </p>

          <h1 className="mt-2 font-display text-3xl font-black leading-tight text-[#122014] dark:text-white">
            Học TOEIC Cùng
            <span className="mt-0.5 block text-[2.35rem] tracking-tight">
              <span className="text-[#1f4824] dark:text-emerald-200">LINGO</span>
              <span className="text-[#80ca4a]">CHILL</span>
            </span>
          </h1>

          <div className="mt-4 overflow-hidden rounded-3xl border border-[#dfd9c8] bg-[#f8f4e8] shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/mascot/hero-mobile-reading.jpg"
              alt="Học TOEIC cùng Mochi mỗi ngày"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>

        <div className="mx-auto mt-7 max-w-md px-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#5a6854]">
            BẮT ĐẦU TỪ ĐÂY
          </p>
          <h2 className="mt-0.5 font-heading text-xl font-extrabold text-[var(--heading)]">
            Hôm nay bạn muốn học gì? 🌿
          </h2>

          <div className="mt-4 space-y-3.5">
            {BINDER_CARDS.map((card, idx) => {
              const imgMap: Record<string, string> = {
                docs: "/images/mascot/card-docs.png",
                listening: "/images/mascot/card-listening.png",
                reading: "/images/mascot/card-reading.png",
                exam: "/images/mascot/card-exam.png",
              };
              return (
                <Link
                  key={card.id}
                  href={card.href}
                  className="relative flex items-center justify-between gap-3 rounded-2xl bg-[#fdfbf4] dark:bg-[var(--surface)] sc-shadow px-4 pt-6 pb-4 transition active:translate-y-0.5"
                >
                  <span
                    aria-hidden="true"
                    className="absolute left-3.5 top-3 h-2.5 w-2.5 rounded-full border-2 border-[#1b2d1c] bg-[#f4efe3]"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute right-3.5 top-3 h-2.5 w-2.5 rounded-full border-2 border-[#1b2d1c] bg-[#f4efe3]"
                  />

                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgMap[card.id]}
                      alt={card.title}
                      className="h-14 w-14 shrink-0 object-contain"
                    />
                    <div className="min-w-0">
                      <p className="font-heading text-base font-extrabold text-[var(--heading)]">
                        {card.title}
                      </p>
                      <p className="truncate text-xs text-[var(--muted-foreground)]">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-xs ${
                      idx === 0 ? "bg-[#8e6b43]" : "bg-[#ad987f]"
                    }`}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            })}

            <Link
              href="/tinh-huong"
              className="relative flex items-center justify-between gap-3 rounded-2xl bg-[#19462b] text-white sc-shadow px-4 py-4 transition active:translate-y-0.5"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#9ee56f] text-[#0d1c12]">
                  <Layers className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="font-heading text-base font-extrabold text-white">
                    Thực hành nghề 3 lớp
                  </p>
                  <p className="truncate text-xs text-emerald-100/80">
                    Tình huống ngành &amp; Ghép cặp VSVC
                  </p>
                </div>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9ee56f] text-[#0d1c12]">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* 1B. FULL-BLEED DARK FOREST PERSPECTIVE HERO (Desktop >= md matching StudyChill step_2) */}
      <section className="sc-perspective-stage relative hidden md:flex min-h-[90vh] flex-col justify-between pt-20 pb-8 text-white">
        <Hero3DBackdrop theme="forest" />
        {/* Background perspective grid & floating ambient leaves */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 sc-perspective-grid opacity-55"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-56 sc-perspective-floor opacity-85"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[12%] top-[24%] h-72 w-72 rounded-full bg-[#4ade80]/10 blur-3xl"
        />

        {/* Ambient floating leaves matching StudyChill */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {[
            "left-[14%] top-[18%] [animation-delay:0s]",
            "left-[25%] top-[36%] [animation-delay:2.5s]",
            "left-[52%] top-[14%] [animation-delay:4s]",
            "left-[78%] top-[28%] [animation-delay:1.5s]",
            "left-[90%] top-[44%] [animation-delay:3.3s]",
          ].map((pos, idx) => (
            <span
              key={idx}
              className={`sc-leaf absolute h-2.5 w-4 rounded-full bg-[#8fd95a]/55 ${pos}`}
            />
          ))}
        </div>

        {/* Center Hero Container */}
        <div className="relative z-10 mx-auto my-auto grid w-full max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.08fr_0.92fr]">
          {/* Left Hero Typography & CTA */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-[#a1e86c]" />
              Tài liệu học tập miễn phí
            </span>

            <h1 className="mt-5 font-display font-black uppercase tracking-tight">
              <span className="block text-[5rem] lg:text-[6.1rem] leading-[0.9] sc-hero-word-lime">
                TOEIC
              </span>
              <span className="mt-1.5 block text-[2.95rem] lg:text-[3.75rem] leading-[1.02] sc-hero-word-white">
                {siteConfig.brand.shortName}
              </span>
            </h1>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <a
                href="#explore-cards"
                className="sc-btn-lime inline-flex h-12 items-center gap-2 rounded-2xl px-6 text-sm font-extrabold"
              >
                Khám phá ngay
                <ArrowDown className="h-4 w-4" />
              </a>
              <Link
                href="/community"
                className="inline-flex h-12 items-center gap-2 rounded-2xl border-2 border-white/25 bg-white/[0.06] px-6 text-sm font-bold text-white backdrop-blur-xs transition hover:border-[#a1e86c] hover:bg-white/15"
              >
                <Users className="h-4 w-4 text-[#a1e86c]" />
                Cộng đồng
              </Link>
              <Link
                href="/tinh-huong"
                className="inline-flex h-12 items-center gap-2 rounded-2xl border-2 border-[#a1e86c]/45 bg-[#19462b]/70 px-5 text-sm font-bold text-[#c7f5a3] backdrop-blur-xs transition hover:border-[#a1e86c] hover:bg-[#19462b]"
              >
                <Layers className="h-4 w-4" />
                Thực hành nghề 3 lớp
              </Link>
            </div>

            {/* Social Proof Pill Row */}
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0e2219] bg-[#9ee56f] text-xs font-black text-[#122616]">
                  M
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0e2219] bg-[#f3eee3] text-xs font-black text-[#122616]">
                  T
                </span>
              </div>
              <p className="max-w-xs text-xs leading-relaxed text-white/70">
                Tham gia cùng <b className="text-white">10.000+</b> sĩ tử bứt phá điểm TOEIC mỗi ngày!
              </p>
            </div>
          </div>

          {/* Right Mascot Pedestal & Interactive Cloud Speech Bubble */}
          <div className="relative flex flex-col items-center justify-center pt-4 lg:pt-0">
            {/* Speech Bubble matching StudyChill */}
            <div className="relative mb-2 self-center sm:mr-28">
              <button
                type="button"
                onClick={() => speakWord(currentBubble.word)}
                title="Nghe phát âm từ vựng"
                className="group relative flex items-center gap-2.5 rounded-full bg-[#faf6ea] px-4 py-2.5 text-left text-xs text-[#1d2e1b] shadow-xl border border-black/15 transition hover:scale-[1.02] cursor-pointer max-w-[270px]"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#74be46] text-white">
                  <Volume2 className="h-3.5 w-3.5" />
                </span>
                <span className="leading-snug font-medium">
                  {renderBubbleText(
                    currentBubble.text,
                    currentBubble.word,
                    currentBubble.meaning
                  )}
                </span>
              </button>
              <span className="ml-24 mt-1.5 block h-2.5 w-2.5 rounded-full bg-[#faf6ea]" />
              <span className="ml-28 mt-1 block h-1.5 w-1.5 rounded-full bg-[#faf6ea]/85" />
            </div>

            {/* Wizard Mascot standing on multi-ring glowing dark jade podium */}
            <div className="relative flex flex-col items-center justify-end">
              <div className="relative z-10 -mb-8 animate-float-slow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/mascot/hero-wizard.png"
                  alt={`${siteConfig.brand.mascotName} linh vật ${siteConfig.brand.name}`}
                  className="h-72 w-auto object-contain lg:h-[360px] drop-shadow-[0_18px_24px_rgba(0,0,0,0.45)]"
                />
              </div>
              {/* Concentric Neon Glowing Pedestal Rings matching StudyChill step_2 */}
              <div className="relative flex items-center justify-center">
                <div className="pointer-events-none absolute -inset-x-8 -inset-y-2.5 rounded-[100%] border border-[#9ee56f]/20" />
                <div className="pointer-events-none absolute -inset-x-4 -inset-y-1 rounded-[100%] border border-[#9ee56f]/35" />
                <div className="h-14 w-80 lg:w-[400px] rounded-[100%] border border-[#9ee56f]/55 bg-[#07150e]/95 shadow-[0_0_50px_rgba(158,229,111,0.3)]" />
                <div className="pointer-events-none absolute inset-2 rounded-[100%] border border-white/25" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Scroll Cue Pill */}
        <div className="relative z-10 mt-6 flex justify-center">
          <a
            href="#explore-cards"
            className="rounded-lg border border-white/15 bg-[#1e2c24]/90 px-4 py-2 font-heading text-xs font-extrabold uppercase tracking-wider text-white/90 transition hover:border-[#9ee56f]/60 hover:bg-[#27382e]"
          >
            {siteConfig.brand.mascotName.toUpperCase()} CÓ GÌ?
          </a>
        </div>
      </section>

      {/* 2. MARQUEE TICKER BAR */}
      <div className="border-y border-[var(--border)] bg-[#fcfaf3] dark:bg-[var(--surface)] py-2.5">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 overflow-hidden">
          <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white dark:bg-[var(--surface-alt)] px-3 py-1 text-xs font-extrabold text-[var(--heading)] shadow-xs">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            Nổi bật:
          </span>

          <div className="sc-marquee-wrap relative flex-1 overflow-hidden">
            <div className="sc-marquee-track gap-8 text-xs font-medium text-[var(--muted-foreground)]">
              {[...siteConfig.tickerItems, ...siteConfig.tickerItems].map((item, idx) => (
                <span key={idx} className="inline-flex shrink-0 items-center gap-1.5">
                  <span>{item.text}</span>
                  <span className="rounded-full bg-[#e6f3d8] dark:bg-[#1e3523] px-2 py-0.5 font-mono-num text-[11px] font-bold text-[#1d4c26] dark:text-[#9ee56f]">
                    {item.highlight}
                  </span>
                  <span>{item.tail}</span>
                  <Sparkles className="ml-3 h-3.5 w-3.5 text-amber-500" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. "{BRAND} CÓ GÌ?" 4 PUNCHED BINDER CARDS */}
      <section id="explore-cards" className="relative hidden md:block overflow-hidden py-16 sm:py-20">
        {/* Giant Cream-Paper Outline Watermark matching StudyChill step_22 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-8 flex select-none justify-center overflow-hidden"
        >
          <span className="sc-text-stroke-watermark whitespace-nowrap font-display text-[8.5rem] lg:text-[12.5rem] font-black uppercase leading-none tracking-tight">
            {siteConfig.brand.shortName}
          </span>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          {/* Header + Peeking Mascot with speech bubble above head */}
          <div className="relative flex flex-col items-center justify-center">
            <div className="sc-shadow inline-flex items-center gap-2.5 rounded-2xl bg-[#b88d58] px-8 py-3.5 text-[#172617]">
              <span className="font-heading text-xl font-extrabold uppercase tracking-wide sm:text-2xl">
                {siteConfig.brand.shortName} CÓ GÌ?
              </span>
              <span className="text-lg">🌿</span>
            </div>

            <div className="hidden lg:flex absolute right-0 -top-5 flex-col items-center">
              <div className="relative rounded-xl border-2 border-[#1b2d1c] bg-white px-3.5 py-1.5 text-xs font-bold text-[#172617] shadow-[2px_2px_0_#1b2d1c]">
                {siteConfig.brand.mascotName} xin chào các bạn! 👋
                <span className="absolute left-1/2 -bottom-1.5 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-[#1b2d1c] bg-white" />
              </div>
              <Mascot size={46} mood="happy" className="mt-1.5" />
            </div>
          </div>

          {/* 4 Binder-Ring Feature Cards with Spatial 3D Tilt & Floating Plush Layers */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BINDER_CARDS.map((card, cardIdx) => (
              <Tilt3D key={card.id} maxTilt={8} scale={1.02} className="rounded-[26px]">
                <Link
                  href={card.href}
                  className="group relative flex h-full flex-col items-center justify-between rounded-[26px] bg-[#fdfbf4] dark:bg-[var(--surface)] sc-shadow px-6 pt-10 pb-7 text-center transition preserve-3d"
                >
                  {/* Top Left & Right Binder Ring Holes */}
                  <span
                    aria-hidden="true"
                    className="absolute left-5 top-5 h-3.5 w-3.5 rounded-full border-2 border-[#1b2d1c] bg-[#f4efe3] dark:border-[var(--border-strong)] dark:bg-[var(--bg)]"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute right-5 top-5 h-3.5 w-3.5 rounded-full border-2 border-[#1b2d1c] bg-[#f4efe3] dark:border-[var(--border-strong)] dark:bg-[var(--bg)]"
                  />

                  {/* 3D Mascot Illustration hovering along Z-axis */}
                  <div className="depth-3d-lg flex h-44 w-full items-center justify-center">
                    {card.id === "docs" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src="/images/mascot/card-docs.png"
                        alt="Tài liệu"
                        className="h-40 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    {card.id === "listening" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src="/images/mascot/card-listening.png"
                        alt="Luyện nghe"
                        className="h-40 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    {card.id === "reading" && (
                      <MascotReadingArt className="h-40 w-auto transition-transform duration-300 group-hover:scale-105" />
                    )}
                    {card.id === "exam" && (
                      <MascotExamArt className="h-40 w-auto transition-transform duration-300 group-hover:scale-105" />
                    )}
                  </div>

                  <div className="depth-3d-sm mt-4">
                    <h2 className="font-heading text-xl font-extrabold text-[var(--heading)]">
                      {card.title}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {card.subtitle}
                    </p>
                  </div>

                  <span
                    className={`depth-3d-md mt-6 inline-flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm transition group-hover:translate-x-0.5 ${
                      cardIdx === 0
                        ? "bg-[#8e6b43] group-hover:bg-[#6f5130]"
                        : "bg-[#ad987f] group-hover:bg-[#8e6b43]"
                    }`}
                  >
                    <ArrowRight className="h-4.5 w-4.5" />
                  </span>
                </Link>
              </Tilt3D>
            ))}
          </div>
        </div>
      </section>

      {/* 4. GEAR-FRAMED DARK "BẢN ĐỒ CHỨC NĂNG (8 TÍNH NĂNG)" INTERACTIVE SECTION */}
      <section className="relative">
        <GearDivider />

        <div className="bg-[#1b1d20] text-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            {/* Top Strip */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="flex items-center gap-3">
                <h2 className="font-heading text-base sm:text-lg font-extrabold tracking-wide uppercase text-white">
                  BẢN ĐỒ CHỨC NĂNG
                </h2>
                <span className="text-xs font-bold tracking-wider uppercase text-white/45">
                  8 TÍNH NĂNG
                </span>
              </div>

              <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#9ee56f] text-[10px] font-black text-[#122616]">
                  LC
                </span>
                <span className="rounded bg-[#9ee56f]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#9ee56f]">
                  ADMIN
                </span>
                <span className="text-xs font-semibold text-white">
                  {siteConfig.brand.ownerName}
                </span>
              </div>

              <Link
                href="/bang-xep-hang"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2 text-xs font-bold text-white/90 transition hover:border-[#9ee56f] hover:bg-white/10"
              >
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                Bảng xếp hạng
              </Link>
            </div>

            {/* 3-Column Feature Map Body */}
            <div className="mt-8 grid items-center gap-8 lg:grid-cols-[74px_1.08fr_350px]">
              {/* Left Vertical Social Links */}
              <div className="hidden lg:flex flex-col items-center gap-3 border-r border-white/10 pr-5">
                {[
                  { label: "Tài liệu", href: "/documents", bg: "bg-[#1877f2]", icon: <FacebookBrandIcon className="h-4 w-4" /> },
                  { label: "Thông báo", href: "/community", bg: "bg-[#1877f2]", icon: <Bell className="h-4 w-4" /> },
                  { label: "YouTube", href: siteConfig.brand.youtubeUrl, bg: "bg-red-600", icon: <YoutubeBrandIcon className="h-4 w-4" />, ext: true },
                  { label: "Cộng đồng", href: "/community", bg: "bg-zinc-900 border border-white/20", icon: <span className="font-bold text-xs">@</span> },
                  { label: "Zalo", href: siteConfig.brand.zaloUrl, bg: "bg-sky-500", icon: <MessageSquare className="h-4 w-4" />, ext: true },
                ].map((s) =>
                  s.ext ? (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-16 flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] py-2 text-[10px] font-semibold text-white/75 transition hover:border-white/25 hover:bg-white/10"
                    >
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-white ${s.bg}`}>
                        {s.icon}
                      </span>
                      {s.label}
                    </a>
                  ) : (
                    <Link
                      key={s.label}
                      href={s.href}
                      className="flex w-16 flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] py-2 text-[10px] font-semibold text-white/75 transition hover:border-white/25 hover:bg-white/10"
                    >
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-white ${s.bg}`}>
                        {s.icon}
                      </span>
                      {s.label}
                    </Link>
                  )
                )}
              </div>

              {/* Center Interactive 8 Rows */}
              <div className="space-y-2.5">
                {siteConfig.featureMap.map((item, idx) => {
                  const isSelected = item.id === activeFeature.id;
                  const isHot = Boolean(item.badge);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onMouseEnter={() => setActiveFeature(item)}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition ${
                        isSelected
                          ? "border-[#c44888] bg-gradient-to-r from-[#7b1d52] via-[#4a1834] to-[#271b23] shadow-[0_0_20px_rgba(196,72,136,0.28)]"
                          : idx < 2
                          ? "border-rose-500/20 bg-gradient-to-r from-[#381827] to-[#24262a] hover:border-rose-400/45"
                          : "border-white/10 bg-[#23262a] hover:border-[#9ee56f]/45 hover:bg-[#2a2d32]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`inline-flex h-6 w-8 shrink-0 items-center justify-center rounded-md font-mono-num text-[11px] font-bold ${
                            isHot || isSelected
                              ? "bg-rose-500/25 text-rose-200 border border-rose-400/35"
                              : "bg-white/5 text-[#9ee56f] border border-white/10"
                          }`}
                        >
                          {item.number}
                        </span>
                        <span className="truncate text-sm font-bold text-white">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-rose-200">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, starIdx) => (
                          <Star
                            key={starIdx}
                            className={`h-3.5 w-3.5 ${
                              starIdx < item.stars
                                ? "fill-amber-400 text-amber-400"
                                : "fill-white/15 text-white/15"
                            }`}
                          />
                        ))}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Right Interactive 3D Stage (Globe <-> Three.js WebGL Study Island) */}
              <div className="flex flex-col items-center justify-center">
                <div className="mb-2 inline-flex rounded-full border border-white/15 bg-white/5 p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setStageMode3D("globe")}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 transition cursor-pointer ${
                      stageMode3D === "globe" ? "bg-[#9ee56f] text-[#142616]" : "text-white/75 hover:text-white"
                    }`}
                  >
                    <Globe2 className="h-3 w-3" />
                    Quả cầu 3D
                  </button>
                  <button
                    type="button"
                    onClick={() => setStageMode3D("island")}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 transition cursor-pointer ${
                      stageMode3D === "island" ? "bg-[#9ee56f] text-[#142616]" : "text-white/75 hover:text-white"
                    }`}
                  >
                    <Box className="h-3 w-3" />
                    Mô hình 3D
                  </button>
                </div>

                {stageMode3D === "globe" ? (
                  <FeatureGlobe
                    items={siteConfig.featureMap}
                    activeId={activeFeature.id}
                    onSelect={setActiveFeature}
                    size={330}
                    darkStage
                  />
                ) : (
                  <StudyIsland3D
                    items={siteConfig.featureMap}
                    activeId={activeFeature.id}
                    onSelect={setActiveFeature}
                    size={330}
                  />
                )}
                <div className="mt-2 text-center">
                  <p className="text-xs font-bold text-[#9ee56f]">{activeFeature.title}</p>
                  <p className="mt-0.5 text-[11px] text-white/60 max-w-xs">
                    {activeFeature.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <GearDivider />
      </section>

      {/* 5. BẢNG XẾP HẠNG 3D PODIUM & TROPHY SHOWCASE SECTION */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Tilt3D maxTilt={14} scale={1.06} className="rounded-2xl">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-[#946a16] bg-gradient-to-br from-amber-300 to-amber-400 text-[#422a00] shadow-[3px_3px_0_#946a16]">
                <Trophy className="h-5 w-5" />
              </span>
            </Tilt3D>
            <div>
              <div className="flex flex-wrap items-baseline gap-2.5">
                <h2 className="font-heading text-2xl font-extrabold text-[var(--heading)] sm:text-3xl">
                  Bảng xếp hạng
                </h2>
                <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                  Tuần này · còn 7 ngày
                </span>
              </div>
            </div>
          </div>

          <div className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-1 shadow-xs">
            {[
              { key: "week" as const, label: "Tuần này" },
              { key: "month" as const, label: "Tháng này" },
              { key: "all" as const, label: "Mọi lúc" },
              { key: "streak" as const, label: "🔥 Chuỗi ngày" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRankTab(tab.key)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                  rankTab === tab.key
                    ? "bg-[#3f6236] text-white shadow-xs"
                    : tab.key === "streak"
                    ? "text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                    : "text-[var(--muted-foreground)] hover:text-[var(--heading)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Leaderboard 3D Podium Container */}
        <div className="mt-6 rounded-3xl border border-[var(--border-strong)] bg-[var(--surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]">
          {/* Reward Banner */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#eaf1de] dark:bg-[#1a2f1e] px-4 py-2.5 text-xs text-[#2b4426] dark:text-[#b4e386]">
            <Gift className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="font-extrabold">TOP 1 · TOP 2 tháng</span>
            <span className="text-[var(--muted-foreground)]">
              Kho tài liệu Full + Nhắc lịch ôn SRS không giới hạn
            </span>
          </div>

          {/* 3D Stepped Podium + Runner Ups & WebGL Trophy Showcase */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_1fr] items-stretch">
            {/* Left: Spatial 3D Stepped Podium (2 - 1 - 3) */}
            <Podium3DCards
              first={first}
              second={second}
              third={third}
              metric={rankTab === "streak" ? "streak" : "xp"}
            />

            {/* Right: #04, #05, #06 Ranked Rows + Interactive WebGL 3D Championship Trophy */}
            <div className="flex h-full flex-col justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)]/60 p-3 sm:p-4">
              <div className="space-y-2.5">
                {runnerUps.map((person, idx) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-xs transition hover:-translate-y-0.5 hover:border-[#7ea644] hover:shadow-[3px_3px_0_#7ea644]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-flex h-7 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8efde] dark:bg-[#233725] font-mono-num text-xs font-extrabold text-[#3c5a35] dark:text-[#9ee56f]">
                        0{idx + 4}
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1b3922] text-xs font-bold text-[#9ee56f]">
                        {person.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="truncate font-heading text-sm font-bold text-[var(--heading)]">
                        {person.name}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 text-xs font-bold">
                      <span className="font-mono-num text-[var(--heading)]">
                        {person.xp} <span className="font-normal text-[var(--muted-foreground)]">EXP</span>
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-orange-500">
                        <Flame className="h-3.5 w-3.5 fill-current" />
                        {person.streakDays}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <LeaderboardTrophy3D
                topName={first.name}
                topXp={first.xp}
                height={186}
              />
            </div>
          </div>

          {/* Bottom Full-Width Dark Forest CTA Strip */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#274723] px-5 py-3.5 text-white">
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e9dfba] text-[#274723]">
                <HelpCircle className="h-4 w-4" />
              </span>
              {user ? (
                <span>
                  Bạn đang có <b className="text-[#9ee56f]">{user.xp} EXP</b> · Chuỗi{" "}
                  <b>{user.streakDays} ngày</b>!
                </span>
              ) : (
                <span>Bạn hạng mấy?</span>
              )}
            </div>

            {user ? (
              <Link
                href="/luyen-de"
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#f3c95b] hover:underline"
              >
                Luyện thêm để tăng hạng
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal("Đăng nhập để lưu EXP và ghi danh Bảng xếp hạng")}
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#f3c95b] hover:underline cursor-pointer"
              >
                <span className="underline">Đăng nhập</span>
                <span className="text-white/90 font-medium">để lên bảng</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 text-right">
          <Link
            href="/bang-xep-hang"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--heading)] hover:text-[var(--primary)] transition"
          >
            Xem đủ 50 hạng · Bảng vàng tháng
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* 6. FOUNDER STORY & COMMUNITY SHOWCASE matching StudyChill step_24_story */}
      <section className="relative overflow-hidden mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-14 flex select-none justify-center overflow-hidden"
        >
          <span className="sc-text-stroke-watermark whitespace-nowrap font-display text-[7rem] sm:text-[10.5rem] font-black uppercase leading-none tracking-tight opacity-70">
            {siteConfig.brand.shortName}
          </span>
        </div>

        <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
          {/* Left Story Copy */}
          <div>
            <div className="w-full max-w-[440px] rounded-full border-2 border-[#182d1a] bg-[var(--surface)] px-6 py-2.5 font-heading text-xs font-extrabold uppercase tracking-wider text-[var(--heading)] shadow-[0_3px_0_#182d1a]">
              CÂU CHUYỆN {siteConfig.brand.shortName}
            </div>

            <h2 className="mt-6 font-heading text-3xl font-black leading-tight sm:text-4xl lg:text-[2.65rem]">
              <span className="block bg-gradient-to-r from-[#2563eb] via-[#a855f7] to-[#f97316] bg-clip-text text-transparent">
                Từ trang chia sẻ tài liệu đến
              </span>
              <span className="block bg-gradient-to-r from-[#80c242] via-[#3e6b29] to-[#1a331d] bg-clip-text text-transparent dark:from-[#9ee56f] dark:to-[#d8f7b8]">
                nền tảng luyện thi TOEIC
              </span>
            </h2>

            <p className="mt-5 text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {siteConfig.brand.founderQuote} — luyện nghe, luyện đọc theo từng Part,{" "}
              <b className="text-[var(--heading)]">
                {stats.examTestsCount} đề thi thử sát đề thật ({stats.examQuestionsCount}+ câu hỏi)
              </b>
              , từ vựng và lộ trình {stats.grammarLessonsCount} bài ngữ pháp cùng kho{" "}
              <b className="text-[var(--heading)]">{stats.documentsCount}+ tài liệu miễn phí</b>.
            </p>

            <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              Dù bạn là học sinh, sinh viên hay người đi làm,{" "}
              <b className="text-[var(--heading)]">ở độ tuổi nào</b> cũng có lộ trình phù hợp — mục
              tiêu không đổi: học thông minh hơn,{" "}
              <span className="rounded bg-[#e6efd7] dark:bg-[#233a25] px-1.5 py-0.5 font-semibold text-[#23431e] dark:text-[#9ee56f]">
                áp lực ít hơn
              </span>{" "}
              với{" "}
              <span className="rounded bg-[#e6efd7] dark:bg-[#233a25] px-1.5 py-0.5 font-semibold text-[#23431e] dark:text-[#9ee56f]">
                chi phí thấp nhất
              </span>
              .
            </p>

            <div className="mt-7 flex items-center gap-4">
              <Link
                href="/community"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#8e6b43] px-7 text-sm font-bold text-white shadow-md transition hover:bg-[#705332]"
              >
                Tham gia cộng đồng
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Mascot size={46} mood="celebrate" />
            </div>
          </div>

          {/* Right Tilted Framed Photo Showcase Card with 3D Cursor Parallax */}
          <Tilt3D maxTilt={7} scale={1.015} glare={false} className="relative pt-4">
            {/* Top-right overlapping floating white pill */}
            <div className="depth-3d-lg relative z-20 -mb-4 mr-2 flex justify-end">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e3decb] bg-white px-4 py-1.5 text-xs font-bold text-[#172617] shadow-md">
                <GraduationCap className="h-3.5 w-3.5 text-[#2d6a3e]" />
                {siteConfig.brand.name} Learning
              </span>
            </div>

            <div className="relative rotate-[1.4deg] overflow-hidden rounded-[26px] border-2 border-[#182d1a] bg-[#213a25] p-8 sm:p-10 text-white shadow-[0_18px_40px_rgba(24,45,26,0.2)]">
              {/* Soft Photo Backdrop + Greenery Wash */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/mascot/hero-mobile-reading.jpg"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-luminosity"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#527441]/75 via-[#2e4c2e]/75 to-[#1b2f1f]/90"
              />

              {/* Viewfinder corners */}
              <div className="depth-3d-md relative z-10 my-8 flex flex-col items-center justify-center py-10 text-center">
                <span className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-white/85" />
                <span className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-white/85" />
                <span className="absolute left-0 bottom-0 h-6 w-6 border-l-2 border-b-2 border-white/85" />
                <span className="absolute right-0 bottom-0 h-6 w-6 border-r-2 border-b-2 border-white/85" />

                <p className="font-display text-2xl sm:text-3xl font-black tracking-wider text-white drop-shadow">
                  TÀI LIỆU {siteConfig.brand.shortName}
                </p>
                <span className="mt-2.5 inline-block rounded bg-white px-3.5 py-1 font-heading text-[11px] font-extrabold tracking-widest text-[#1c3222] uppercase shadow-sm">
                  Ở ĐÂY CÓ NHIỀU TÀI LIỆU CHILL CHILL
                </span>
              </div>

              <div className="relative z-10 flex items-center justify-end">
                <span className="text-xs font-semibold text-white/75">
                  Miễn phí cho sĩ tử TOEIC
                </span>
              </div>
            </div>

            {/* Bottom-left overlapping companion + 10.000+ pill */}
            <div className="depth-3d-lg relative z-20 -mt-5 ml-3 flex items-center">
              <span className="-mr-2 z-10">
                <Mascot size={46} mood="happy" />
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#e3decb] bg-white py-2 pl-4 pr-5 text-xs font-extrabold text-[#162617] shadow-lg">
                10,000+ Đồng hành
              </span>
            </div>
          </Tilt3D>
        </div>
      </section>

      {/* 7. VSVC STARTUP PROJECT SHOWCASE: "MỘT TÌNH HUỐNG - BA LỚP" & CLOSED BETA HUB */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="rounded-[32px] border-2 border-[#1b2d1c] bg-[#13291b] p-6 sm:p-10 text-white sc-shadow">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9ee56f] px-3.5 py-1 text-xs font-black text-[#0d1c12]">
                <GraduationCap className="h-3.5 w-3.5" />
                Đề án Khởi nghiệp LV04 · Trường CĐ nghề Việt Nam – Singapore (2026–2027)
              </span>
              <h2 className="font-display text-2xl font-black tracking-tight sm:text-4xl">
                Nền tảng Thực hành Ngoại ngữ Nghề nghiệp (3 Lớp)
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-emerald-100/85">
                Luyện tiếng Anh sát tình huống ngành <b>Cơ khí, Điện – Điện tử, Tin học, Kinh tế – Du lịch</b>{" "}
                với cơ chế <b>Một tình huống – Ba lớp</b>: (1) Nội dung chuyên ngành được giáo viên
                khoa rà soát, (2) Đóng vai 2 người theo Rubric có cấu trúc, (3) Ghép cặp luyện nói
                cùng bạn cùng ngành theo lịch hẹn kèm lớp bảo vệ riêng cho học viên dưới 18 tuổi.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0">
              <Link
                href="/tinh-huong"
                className="sc-btn-lime inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-xs font-extrabold"
              >
                <Layers className="h-4 w-4" />
                {stats.scenariosCount ?? 14} Tình huống 3 lớp
              </Link>
              <Link
                href="/ghep-cap"
                className="inline-flex h-11 items-center gap-2 rounded-2xl border-2 border-white/25 bg-white/10 px-5 text-xs font-bold text-white hover:bg-white/15"
              >
                <Users className="h-4 w-4 text-[#9ee56f]" />
                Ghép cặp ({stats.openSessionsCount ?? 0} lịch mở)
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                title: "Kho Tình huống 3 lớp",
                desc: "Từ vựng, mẫu câu, hội thoại & rubric theo ngành Cơ khí, Điện, Tin học.",
                href: "/tinh-huong",
                badge: `${stats.scenariosCount ?? 14} tình huống`,
              },
              {
                title: "Ghép cặp Google Meet",
                desc: "Hẹn lịch 1-1 cùng ngành, tách biệt nhóm tuổi <18, có nút báo cáo & chặn.",
                href: "/ghep-cap",
                badge: "An toàn <18",
              },
              {
                title: "Khảo sát H1–H6",
                desc: "Bộ 15 câu Phụ lục A ẩn danh & bảng kiểm chứng giả thuyết thời gian thực.",
                href: "/khao-sat",
                badge: `${stats.surveyResponsesCount ?? 0}/150 mẫu`,
              },
              {
                title: "Đề án & Chỉ tiêu 0b",
                desc: "Hồ sơ cuộc thi LV04, ma trận đối thủ, lộ trình 4 giai đoạn & cam kết AI.",
                href: "/de-an",
                badge: "LV04 · VSVC",
              },
              {
                title: "Gói học, APK & Phụ huynh",
                desc: "Freemium (0đ giai đoạn 0), kế hoạch Android APK & Cổng theo dõi <18 tuổi.",
                href: "/goi-hoc",
                badge: "Free GĐ 0",
              },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group flex flex-col justify-between rounded-2xl border border-white/15 bg-white/[0.05] p-4 transition hover:border-[#9ee56f] hover:bg-white/10"
              >
                <div>
                  <span className="inline-block rounded-full bg-[#9ee56f]/20 px-2.5 py-0.5 text-[10px] font-extrabold text-[#9ee56f]">
                    {card.badge}
                  </span>
                  <h3 className="mt-2 font-heading text-sm font-extrabold text-white group-hover:text-[#9ee56f]">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-emerald-100/75">
                    {card.desc}
                  </p>
                </div>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#9ee56f]">
                  Mở ngay <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-emerald-100/80">
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/phu-huynh" className="inline-flex items-center gap-1.5 hover:text-[#9ee56f]">
                <ShieldCheck className="h-4 w-4 text-[#9ee56f]" />
                Cổng Giám sát Phụ huynh (&lt;18 tuổi)
              </Link>
              <Link href="/ung-dung-android" className="inline-flex items-center gap-1.5 hover:text-[#9ee56f]">
                <Smartphone className="h-4 w-4 text-[#9ee56f]" />
                Ứng dụng Android (APK / Google Play)
              </Link>
            </div>
            <Link href="/chinh-sach/noi-quy-thu-nghiem-kin" className="underline hover:text-[#9ee56f]">
              Xem Nội quy thử nghiệm kín (Phụ lục B)
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
