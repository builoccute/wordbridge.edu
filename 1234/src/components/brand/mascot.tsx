"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type MascotVariant =
  | "default"
  | "hero"
  | "docs"
  | "listen"
  | "read"
  | "exam"
  | "standing"
  | "laptop"
  | "grammar";

interface MascotProps {
  className?: string;
  size?: number;
  mood?: "happy" | "study" | "cheer" | "celebrate";
  variant?: MascotVariant;
}

const PLUSH_IMAGE_MAP: Partial<Record<MascotVariant, string>> = {
  hero: "/images/mascot/hero-wizard.png",
  docs: "/images/mascot/card-docs.png",
  listen: "/images/mascot/card-listening.png",
  read: "/images/mascot/card-reading.png",
  grammar: "/images/mascot/card-reading.png",
  exam: "/images/mascot/card-exam.png",
  laptop: "/images/mascot/card-exam.png",
};

/**
 * Mochi — LingoChill's 3D plush & vector mascot supporting themed study scenes.
 * Uses photorealistic transparent 3D plush PNGs for medium/large scenes (>= 72px)
 * and lightweight SVG for compact badges/tabs (< 72px).
 */
export function Mascot({
  className,
  size = 64,
  mood = "happy",
  variant = "default",
}: MascotProps) {
  const uid = React.useId().replace(/:/g, "");
  const plushSrc = PLUSH_IMAGE_MAP[variant];
  if (plushSrc && size >= 72) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={plushSrc}
        alt="Mochi Mascot"
        style={{ width: size, height: size }}
        className={cn("select-none shrink-0 object-contain drop-shadow-[0_6px_14px_rgba(24,35,14,0.18)]", className)}
      />
    );
  }
  const ids = {
    headGrad: `mc-head-${uid}`,
    bodyGrad: `mc-body-${uid}`,
    hoodieGrad: `mc-hoodie-${uid}`,
    leafGrad: `mc-leaf-${uid}`,
    cloakGrad: `mc-cloak-${uid}`,
    hatGrad: `mc-hat-${uid}`,
    crateGrad: `mc-crate-${uid}`,
    creamGrad: `mc-cream-${uid}`,
    ringGlow: `mc-ring-${uid}`,
    shadowBlur: `mc-sh-${uid}`,
  };

  const w = variant === "hero" ? Math.round(size * 1.15) : variant === "exam" ? Math.round(size * 1.18) : size;
  const h = size;

  return (
    <svg
      width={w}
      height={h}
      viewBox={variant === "hero" ? "0 0 220 210" : "0 0 180 180"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none shrink-0", className)}
      aria-label="Mochi Mascot"
    >
      <defs>
        <radialGradient id={ids.headGrad} cx="38%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#e8f79b" />
          <stop offset="52%" stopColor="#bddb55" />
          <stop offset="100%" stopColor="#7ca12f" />
        </radialGradient>
        <radialGradient id={ids.bodyGrad} cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#d4ea78" />
          <stop offset="60%" stopColor="#9ec242" />
          <stop offset="100%" stopColor="#658525" />
        </radialGradient>
        <linearGradient id={ids.hoodieGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f6d2c" />
          <stop offset="100%" stopColor="#273a17" />
        </linearGradient>
        <linearGradient id={ids.cloakGrad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7b9e4b" />
          <stop offset="50%" stopColor="#4b6c30" />
          <stop offset="100%" stopColor="#2d441b" />
        </linearGradient>
        <linearGradient id={ids.hatGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#638742" />
          <stop offset="100%" stopColor="#2f4a20" />
        </linearGradient>
        <linearGradient id={ids.leafGrad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#bce26b" />
          <stop offset="100%" stopColor="#5e872c" />
        </linearGradient>
        <linearGradient id={ids.crateGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a7bd6e" />
          <stop offset="100%" stopColor="#7d9548" />
        </linearGradient>
        <linearGradient id={ids.creamGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffdf6" />
          <stop offset="100%" stopColor="#eae3cc" />
        </linearGradient>
        <radialGradient id={ids.ringGlow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8cb84a" stopOpacity="0.45" />
          <stop offset="70%" stopColor="#8cb84a" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#8cb84a" stopOpacity="0" />
        </radialGradient>
        <filter id={ids.shadowBlur} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#18230e" floodOpacity="0.28" />
        </filter>
      </defs>

      {/* Variant: HERO (Forest Adventurer Mochi with blossom hat & leafy staff) */}
      {variant === "hero" ? (
        <g filter={`url(#${ids.shadowBlur})`}>
          {/* Soft aura behind mascot */}
          <ellipse cx="118" cy="184" rx="86" ry="18" fill={`url(#${ids.ringGlow})`} />
          <ellipse cx="118" cy="184" rx="74" ry="12" stroke="#9fd15b" strokeOpacity="0.45" strokeWidth="1.5" />
          <ellipse cx="118" cy="184" rx="58" ry="8.5" stroke="#cfe88c" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="5 4" />

          {/* Cloak back flowing drape */}
          <path
            d="M72 110 C55 130 50 158 64 170 L166 170 C178 156 172 128 156 110 Z"
            fill={`url(#${ids.cloakGrad})`}
            stroke="#243218"
            strokeWidth="2.2"
          />

          {/* Cute feet & inner tunic */}
          <ellipse cx="97" cy="173" rx="14" ry="8" fill="#8cb33e" stroke="#243218" strokeWidth="2" />
          <ellipse cx="137" cy="173" rx="14" ry="8" fill="#8cb33e" stroke="#243218" strokeWidth="2" />
          <path d="M90 128 L144 128 L149 165 Q118 171 85 165 Z" fill="#f3ecd5" stroke="#243218" strokeWidth="2" />
          {/* Adventure leather harness & brass buckle */}
          <rect x="92" y="138" width="50" height="8" rx="3" fill="#6b4b2a" stroke="#243218" strokeWidth="1.8" />
          <rect x="112" y="136" width="11" height="12" rx="2.5" fill="#f1d98d" stroke="#243218" strokeWidth="1.8" />

          {/* Leaf mantle / shoulder cape */}
          <path
            d="M74 114 Q118 100 160 114 Q152 134 118 134 Q82 134 74 114 Z"
            fill={`url(#${ids.leafGrad})`}
            stroke="#243218"
            strokeWidth="2"
          />
          <circle cx="117" cy="126" r="8" fill="#a8d85d" stroke="#243218" strokeWidth="2" />
          <circle cx="117" cy="126" r="3.5" fill="#fffdf6" />

          {/* Wooden Nature Staff on left */}
          <g>
            <path d="M48 80 L61 178" stroke="#6f4e2e" strokeWidth="6.5" strokeLinecap="round" />
            <path d="M48 80 L61 178" stroke="#966f46" strokeWidth="2.4" strokeLinecap="round" />
            {/* Twisting branches & glowing orb at top */}
            <circle cx="44" cy="70" r="15" fill="#21462d" stroke="#94c953" strokeWidth="2.4" />
            <circle cx="44" cy="70" r="9.5" fill="#dff59c" opacity="0.85" />
            <ellipse cx="29" cy="64" rx="9" ry="4.5" transform="rotate(-24 29 64)" fill={`url(#${ids.leafGrad})`} stroke="#243218" strokeWidth="1.5" />
            <ellipse cx="59" cy="60" rx="8.5" ry="4" transform="rotate(30 59 60)" fill={`url(#${ids.leafGrad})`} stroke="#243218" strokeWidth="1.5" />
            <ellipse cx="33" cy="83" rx="8" ry="4" transform="rotate(20 33 83)" fill="#7ca73e" stroke="#243218" strokeWidth="1.5" />
            {/* Little blossoms on staff */}
            <circle cx="49" cy="54" r="4" fill="#fffdf6" />
            <circle cx="49" cy="54" r="1.6" fill="#f1d98d" />
          </g>

          {/* Right hand & left gripping hand */}
          <circle cx="62" cy="128" r="9.5" fill={`url(#${ids.headGrad})`} stroke="#243218" strokeWidth="2" />
          <circle cx="159" cy="134" r="9.5" fill={`url(#${ids.headGrad})`} stroke="#243218" strokeWidth="2" />

          {/* Round 3D Mascot Head */}
          <ellipse cx="118" cy="84" rx="40" ry="34" fill={`url(#${ids.headGrad})`} stroke="#243218" strokeWidth="2.4" />
          {/* Specular cheek highlight */}
          <ellipse cx="97" cy="72" rx="10" ry="5" fill="#ffffff" opacity="0.28" transform="rotate(-18 97 72)" />

          {/* Big expressive 3D eyes */}
          <g>
            <ellipse cx="101" cy="84" rx="9.5" ry="11" fill="#1e241b" />
            <ellipse cx="135" cy="84" rx="9.5" ry="11" fill="#1e241b" />
            <circle cx="104" cy="80" r="3.6" fill="#ffffff" />
            <circle cx="138" cy="80" r="3.6" fill="#ffffff" />
            <circle cx="98" cy="88" r="1.6" fill="#ffffff" opacity="0.7" />
            <circle cx="132" cy="88" r="1.6" fill="#ffffff" opacity="0.7" />
          </g>
          {/* Rosy cheeks & gentle smile */}
          <ellipse cx="89" cy="94" rx="5.5" ry="3.2" fill="#ea8a7c" opacity="0.45" />
          <ellipse cx="147" cy="94" rx="5.5" ry="3.2" fill="#ea8a7c" opacity="0.45" />
          <path d="M111 94 Q118 102 125 94" stroke="#243218" strokeWidth="2.6" strokeLinecap="round" fill="none" />

          {/* Wizard/Explorer Leafy Hat + Antlers + White Blossoms */}
          <path
            d="M66 64 Q118 48 170 64 Q152 74 118 71 Q84 74 66 64 Z"
            fill={`url(#${ids.hatGrad})`}
            stroke="#243218"
            strokeWidth="2.2"
          />
          <path
            d="M84 60 C87 38 105 18 119 16 C133 18 148 39 151 60 Q118 65 84 60 Z"
            fill={`url(#${ids.hatGrad})`}
            stroke="#243218"
            strokeWidth="2.2"
          />
          {/* Branching twigs & sprout leaves on hat */}
          <path d="M84 44 Q72 28 70 16 M76 32 L63 29" stroke="#5d4227" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M150 44 Q162 28 164 16 M158 32 L171 29" stroke="#5d4227" strokeWidth="3.2" strokeLinecap="round" />
          <ellipse cx="70" cy="14" rx="7" ry="4" transform="rotate(-30 70 14)" fill={`url(#${ids.leafGrad})`} stroke="#243218" strokeWidth="1.4" />
          <ellipse cx="164" cy="14" rx="7" ry="4" transform="rotate(30 164 14)" fill={`url(#${ids.leafGrad})`} stroke="#243218" strokeWidth="1.4" />
          <ellipse cx="95" cy="48" rx="9" ry="5" transform="rotate(-18 95 48)" fill={`url(#${ids.leafGrad})`} stroke="#243218" strokeWidth="1.4" />
          <ellipse cx="143" cy="51" rx="9" ry="5" transform="rotate(20 143 51)" fill={`url(#${ids.leafGrad})`} stroke="#243218" strokeWidth="1.4" />
          {/* Blossoms */}
          <circle cx="88" cy="54" r="5" fill="#fffdf6" stroke="#c8d6a6" strokeWidth="1" />
          <circle cx="88" cy="54" r="2" fill="#f1d98d" />
          <circle cx="146" cy="44" r="4.5" fill="#fffdf6" stroke="#c8d6a6" strokeWidth="1" />
          <circle cx="146" cy="44" r="1.8" fill="#f1d98d" />
        </g>
      ) : variant === "standing" ? (
        /* Cute standing turn-around Mochi for Study Library hero */
        <g filter={`url(#${ids.shadowBlur})`}>
          <ellipse cx="90" cy="164" rx="34" ry="8" fill="#071026" opacity="0.45" />
          {/* Left antenna */}
          <path d="M74 44 Q67 28 65 24" stroke="#85ad35" strokeWidth="5" strokeLinecap="round" />
          <circle cx="64" cy="21" r="6" fill={`url(#${ids.headGrad})`} stroke="#243218" strokeWidth="1.8" />
          {/* Right antenna */}
          <path d="M104 44 Q111 28 114 24" stroke="#85ad35" strokeWidth="5" strokeLinecap="round" />
          <circle cx="115" cy="21" r="6" fill={`url(#${ids.headGrad})`} stroke="#243218" strokeWidth="1.8" />
          {/* Body */}
          <ellipse cx="78" cy="154" rx="11" ry="7" fill="#9bc244" stroke="#243218" strokeWidth="2" />
          <ellipse cx="102" cy="154" rx="11" ry="7" fill="#9bc244" stroke="#243218" strokeWidth="2" />
          <rect x="64" y="102" width="52" height="48" rx="22" fill={`url(#${ids.bodyGrad})`} stroke="#243218" strokeWidth="2.2" />
          {/* Head */}
          <ellipse cx="90" cy="74" rx="36" ry="31" fill={`url(#${ids.headGrad})`} stroke="#243218" strokeWidth="2.2" />
          {/* Side peeking round glasses */}
          <circle cx="109" cy="74" r="10.5" fill="#ffffff" fillOpacity="0.22" stroke="#1e241b" strokeWidth="3" />
          <circle cx="111" cy="74" r="4" fill="#1e241b" />
          <circle cx="112" cy="72" r="1.4" fill="#ffffff" />
          <line x1="88" y1="73" x2="98" y2="73" stroke="#1e241b" strokeWidth="2.6" strokeLinecap="round" />
        </g>
      ) : (
        /* Classic Rounded Hoodie Mochi with Glasses & Scene Accessories */
        <g filter={`url(#${ids.shadowBlur})`}>
          <ellipse cx="90" cy="166" rx="48" ry="10" fill="#243218" opacity="0.16" />

          {/* Background props for EXAM variant (sticky notes + stack of books + mug + clock) */}
          {variant === "exam" && (
            <g>
              {/* Floating sticky notes top-left */}
              <rect x="14" y="24" width="22" height="24" rx="3" fill="#f3ebd3" stroke="#d9cfb2" strokeWidth="1.4" transform="rotate(-6 25 36)" />
              <line x1="18" y1="31" x2="31" y2="30" stroke="#98a088" strokeWidth="1.5" />
              <line x1="18" y1="37" x2="29" y2="36" stroke="#98a088" strokeWidth="1.5" />
              <rect x="19" y="54" width="20" height="22" rx="3" fill="#e9dfc0" stroke="#cfc3a0" strokeWidth="1.4" transform="rotate(4 29 65)" />
              {/* Thought cloud right */}
              <ellipse cx="152" cy="96" rx="18" ry="14" fill="#ffffff" stroke="#d8d1be" strokeWidth="1.4" />
              <circle cx="137" cy="108" r="3" fill="#ffffff" stroke="#d8d1be" strokeWidth="1" />
              {/* Stack of books left */}
              <rect x="14" y="122" width="38" height="10" rx="2" fill="#89a653" stroke="#243218" strokeWidth="1.6" />
              <rect x="16" y="132" width="36" height="10" rx="2" fill="#6f8b3f" stroke="#243218" strokeWidth="1.6" />
              <rect x="13" y="142" width="40" height="10" rx="2" fill="#b4cc7a" stroke="#243218" strokeWidth="1.6" />
              {/* Potted succulent right */}
              <rect x="144" y="130" width="18" height="14" rx="3" fill="#ebe4d2" stroke="#243218" strokeWidth="1.5" />
              <ellipse cx="149" cy="126" rx="4" ry="7" transform="rotate(-18 149 126)" fill="#7ca73e" stroke="#243218" strokeWidth="1.3" />
              <ellipse cx="156" cy="126" rx="4" ry="7" transform="rotate(18 156 126)" fill="#8cb84a" stroke="#243218" strokeWidth="1.3" />
            </g>
          )}

          {/* Music notes for LISTEN variant */}
          {variant === "listen" && (
            <g fill="#59752f">
              <path d="M36 42 L36 60 M36 42 L48 39 L48 56" stroke="#59752f" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <circle cx="33" cy="60" r="3.8" />
              <circle cx="45" cy="56" r="3.8" />
              <path d="M144 48 L144 64" stroke="#59752f" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M144 48 Q152 50 151 56" stroke="#59752f" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <circle cx="141" cy="64" r="3.6" />
              <path d="M34 86 L37 92 L43 92 L38 96 L40 102 L34 98 L28 102 L30 96 L25 92 L31 92 Z" fill="#8cb84a" opacity="0.65" />
            </g>
          )}

          {/* Focus speech bubble for READ variant */}
          {variant === "read" && (
            <g>
              <ellipse cx="38" cy="46" rx="21" ry="15" fill="#fffdf6" stroke="#243218" strokeWidth="1.5" />
              <circle cx="52" cy="63" r="3" fill="#fffdf6" stroke="#243218" strokeWidth="1.2" />
              <text x="38" y="49" textAnchor="middle" fill="#243218" fontSize="9.5" fontWeight="700" fontFamily="sans-serif">
                Focus
              </text>
            </g>
          )}

          {/* Dual Antennas */}
          <path d="M72 44 Q64 26 60 22" stroke="#8cb33e" strokeWidth="5.5" strokeLinecap="round" />
          <circle cx="59" cy="20" r="6.5" fill={`url(#${ids.headGrad})`} stroke="#243218" strokeWidth="2" />
          <path d="M108 44 Q116 26 120 22" stroke="#8cb33e" strokeWidth="5.5" strokeLinecap="round" />
          <circle cx="121" cy="20" r="6.5" fill={`url(#${ids.headGrad})`} stroke="#243218" strokeWidth="2" />

          {/* Green Hoodie Body & Legs (except DOCS which sits inside box) */}
          {variant !== "docs" && (
            <g>
              {/* Sitting Shoes/Feet */}
              <ellipse cx="64" cy="147" rx="13" ry="9" fill={`url(#${ids.bodyGrad})`} stroke="#243218" strokeWidth="2.2" />
              <ellipse cx="116" cy="147" rx="13" ry="9" fill={`url(#${ids.bodyGrad})`} stroke="#243218" strokeWidth="2.2" />
              {/* Hoodie */}
              <path
                d="M58 105 C56 122 57 142 68 148 L112 148 C123 142 124 122 122 105 Z"
                fill={`url(#${ids.hoodieGrad})`}
                stroke="#243218"
                strokeWidth="2.2"
              />
              {/* Hoodie Drawstrings */}
              <line x1="82" y1="112" x2="80" y2="128" stroke="#dce8b8" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="98" y1="112" x2="100" y2="128" stroke="#dce8b8" strokeWidth="2.2" strokeLinecap="round" />
              {/* Arms */}
              <ellipse cx="58" cy="124" rx="9" ry="11" transform="rotate(-18 58 124)" fill={`url(#${ids.hoodieGrad})`} stroke="#243218" strokeWidth="2" />
              <ellipse cx="122" cy="124" rx="9" ry="11" transform="rotate(18 122 124)" fill={`url(#${ids.hoodieGrad})`} stroke="#243218" strokeWidth="2" />
            </g>
          )}

          {/* Olive File Crate & Folders for DOCS variant */}
          {variant === "docs" && (
            <g>
              {/* Arms hugging inside box */}
              <rect x="64" y="100" width="52" height="30" rx="14" fill={`url(#${ids.hoodieGrad})`} stroke="#243218" strokeWidth="2.2" />
              {/* Folders popping out */}
              <rect x="44" y="102" width="34" height="28" rx="4" fill="#ebe3c9" stroke="#243218" strokeWidth="1.8" transform="rotate(-8 60 116)" />
              <rect x="104" y="102" width="32" height="28" rx="4" fill="#d8e3b3" stroke="#243218" strokeWidth="1.8" transform="rotate(6 120 116)" />
              {/* Storage Crate */}
              <path
                d="M34 114 L146 114 L138 158 C137 162 133 164 128 164 L52 164 C47 164 43 162 42 158 Z"
                fill={`url(#${ids.crateGrad})`}
                stroke="#243218"
                strokeWidth="2.4"
              />
              <rect x="70" y="131" width="40" height="14" rx="3" fill="#2c3e1a" stroke="#243218" strokeWidth="1.5" />
              <text x="90" y="141" textAnchor="middle" fill="#fffdf6" fontSize="7" fontWeight="700" fontFamily="sans-serif">
                TÀI LIỆU
              </text>
            </g>
          )}

          {/* Round 3D Mochi Head */}
          <ellipse cx="90" cy="76" rx="40" ry="33" fill={`url(#${ids.headGrad})`} stroke="#243218" strokeWidth="2.4" />
          <ellipse cx="68" cy="60" rx="9" ry="4.5" fill="#ffffff" opacity="0.3" transform="rotate(-22 68 60)" />

          {/* Headphones over head for LISTEN variant */}
          {variant === "listen" && (
            <g>
              <path d="M48 76 C48 40 132 40 132 76" stroke="#7c9844" strokeWidth="7" fill="none" strokeLinecap="round" />
              <rect x="41" y="64" width="14" height="28" rx="7" fill="#a8c762" stroke="#243218" strokeWidth="2.2" />
              <rect x="125" y="64" width="14" height="28" rx="7" fill="#a8c762" stroke="#243218" strokeWidth="2.2" />
            </g>
          )}

          {/* Eyes */}
          {mood === "cheer" || mood === "celebrate" || variant === "listen" ? (
            <g stroke="#1e241b" strokeWidth="2.8" strokeLinecap="round" fill="none">
              <path d="M68 78 Q74 71 80 78" />
              <path d="M100 78 Q106 71 112 78" />
            </g>
          ) : (
            <g>
              <circle cx="74" cy="77" r="6" fill="#1e241b" />
              <circle cx="106" cy="77" r="6" fill="#1e241b" />
              <circle cx="76" cy="74.5" r="2.2" fill="#ffffff" />
              <circle cx="108" cy="74.5" r="2.2" fill="#ffffff" />
            </g>
          )}

          {/* Iconic Round Glasses */}
          <g stroke="#1e241b" strokeWidth="3.2" fill="none">
            <circle cx="73" cy="77" r="14.5" fill="#ffffff" fillOpacity="0.16" />
            <circle cx="107" cy="77" r="14.5" fill="#ffffff" fillOpacity="0.16" />
            <path d="M87.5 76 Q90 74 92.5 76" />
            <line x1="51" y1="74" x2="58.5" y2="76" />
            <line x1="121.5" y1="76" x2="129" y2="74" />
          </g>

          {/* Cheeks & Smile */}
          <ellipse cx="62" cy="87" rx="4.5" ry="2.5" fill="#e87e70" opacity="0.45" />
          <ellipse cx="118" cy="87" rx="4.5" ry="2.5" fill="#e87e70" opacity="0.45" />
          <path d="M84 89 Q90 95 96 89" stroke="#243218" strokeWidth="2.4" strokeLinecap="round" fill="none" />

          {/* Foreground Prop: Open Book (READ / LISTEN / GRAMMAR) */}
          {(variant === "read" || variant === "listen" || variant === "grammar" || variant === "default") && (
            <g>
              <path d="M64 128 Q77 122 90 128 L90 152 Q77 146 64 150 Z" fill={`url(#${ids.leafGrad})`} stroke="#243218" strokeWidth="2" />
              <path d="M90 128 Q103 122 116 128 L116 150 Q103 146 90 152 Z" fill="#fffdf6" stroke="#243218" strokeWidth="2" />
              <line x1="94" y1="134" x2="111" y2="133" stroke="#9aa38b" strokeWidth="1.5" />
              <line x1="94" y1="140" x2="109" y2="139" stroke="#9aa38b" strokeWidth="1.5" />
              {/* Hands holding book */}
              <circle cx="63" cy="138" r="6" fill={`url(#${ids.headGrad})`} stroke="#243218" strokeWidth="1.8" />
              <circle cx="117" cy="138" r="6" fill={`url(#${ids.headGrad})`} stroke="#243218" strokeWidth="1.8" />
            </g>
          )}

          {/* Foreground Prop: Laptop (LAPTOP) */}
          {variant === "laptop" && (
            <g>
              <rect x="64" y="122" width="52" height="32" rx="4" fill="#d9e0d0" stroke="#243218" strokeWidth="2" />
              <circle cx="90" cy="138" r="3" fill="#8cb84a" />
              <path d="M56 154 L124 154 L120 159 L60 159 Z" fill="#99a491" stroke="#243218" strokeWidth="1.8" />
            </g>
          )}

          {/* Foreground Prop: Exam Answer Sheet + Mug + Digital Clock (EXAM) */}
          {variant === "exam" && (
            <g>
              {/* Desk sheet */}
              <path d="M64 134 L126 130 L132 158 L58 162 Z" fill="#fffdf6" stroke="#243218" strokeWidth="2" />
              <circle cx="76" cy="143" r="2.2" fill="#243218" />
              <line x1="82" y1="143" x2="118" y2="141" stroke="#c7bfa8" strokeWidth="1.5" />
              <circle cx="76" cy="151" r="2.2" fill="#8cb84a" />
              <line x1="82" y1="151" x2="115" y2="149" stroke="#c7bfa8" strokeWidth="1.5" />
              {/* Coffee mug */}
              <rect x="46" y="148" width="16" height="14" rx="3" fill="#fffdf6" stroke="#243218" strokeWidth="1.6" />
              {/* Digital timer */}
              <rect x="134" y="146" width="26" height="16" rx="4" fill="#d5e2b5" stroke="#243218" strokeWidth="1.8" />
              <text x="147" y="157" textAnchor="middle" fill="#243218" fontSize="7" fontWeight="700" fontFamily="monospace">
                25:00
              </text>
              {/* Pencil in right hand */}
              <line x1="112" y1="136" x2="125" y2="123" stroke="#d4a03a" strokeWidth="3.2" strokeLinecap="round" />
            </g>
          )}
        </g>
      )}
    </svg>
  );
}

/** 3D Plush Mascot Reading an Open Green Book (for "Luyện đọc" & Reading Hub) */
export function MascotReadingArt({ className = "" }: { className?: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/images/mascot/card-reading.png"
      alt="Luyện đọc cùng Mochi"
      className={cn("select-none object-contain drop-shadow-[0_6px_14px_rgba(24,35,14,0.16)]", className)}
    />
  );
}

/** 3D Plush Mascot Solving TOEIC Exam Sheet at Desk (for "Luyện đề" & Exam Hub) */
export function MascotExamArt({ className = "" }: { className?: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/images/mascot/card-exam.png"
      alt="Luyện đề cùng Mochi"
      className={cn("select-none object-contain drop-shadow-[0_6px_14px_rgba(24,35,14,0.16)]", className)}
    />
  );
}

/** 3D Plush Mochi Companion for Login Page & Auth Gate Modal left pane */
export function LoginCompanionArt({ className = "" }: { className?: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/images/mascot/card-reading.png"
      alt="Mochi chào mừng bạn"
      className={cn("select-none object-contain drop-shadow-[0_10px_22px_rgba(24,43,23,0.18)]", className)}
    />
  );
}
