"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FileCheck2,
  Headphones,
  Home,
  Map as MapIcon,
  Moon,
  Paperclip,
  Play,
  Sun,
  Trophy,
  Volume2,
} from "lucide-react";
import { MascotReadingArt } from "@/components/brand/mascot";
import { Tilt3D } from "@/components/ui";
import { useApp } from "@/components/providers/app-provider";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type ReadingMode = "overview" | "news" | "skim-scan";

const READING_STAGES = [
  { step: "CHẶNG 01", level: "250+", label: "TOEIC" },
  { step: "CHẶNG 02", level: "450+", label: "TOEIC" },
  { step: "CHẶNG 03", level: "650+", label: "TOEIC" },
  { step: "CHẶNG 04", level: "800+", label: "TOEIC" },
  { step: "CHẶNG 05", level: "990", label: "TOEIC" },
];

const NEWS_ARTICLES = [
  {
    id: "n1",
    topic: "Workplace & Hybrid Teams",
    level: "Chặng 02 · 450+",
    title: "Global Firms Adopt Flexible Four-Day Pilot Weeks",
    sentences: [
      {
        en: "Several mid-sized technology companies have announced a three-month pilot for flexible work schedules.",
        vi: "Nhiều công ty công nghệ quy mô vừa đã công bố thử nghiệm lịch làm việc linh hoạt kéo dài 3 tháng.",
      },
      {
        en: "Employees who meet quarterly productivity targets may finish work at noon on Fridays without salary reductions.",
        vi: "Nhân viên hoàn thành chỉ tiêu năng suất hàng quý có thể kết thúc công việc lúc trưa thứ Sáu mà không bị giảm lương.",
      },
    ],
    gloss: [
      { word: "quarterly", meaning: "hàng quý (theo 3 tháng)" },
      { word: "productivity", meaning: "năng suất làm việc" },
      { word: "reduction", meaning: "sự cắt giảm" },
    ],
  },
  {
    id: "n2",
    topic: "Supply Chain & Logistics",
    level: "Chặng 03 · 650+",
    title: "Automated Warehouses Speed Up Regional Parcel Delivery",
    sentences: [
      {
        en: "To accommodate rising seasonal demand, the logistics center upgraded its conveyor sorting system last month.",
        vi: "Để đáp ứng nhu cầu tăng cao theo mùa, trung tâm logistics đã nâng cấp hệ thống băng chuyền phân loại từ tháng trước.",
      },
      {
        en: "Shipping managers estimate that transit delays have decreased by nearly twenty-eight percent since installation.",
        vi: "Các quản lý vận tải ước tính sự chậm trễ giao nhận đã giảm gần 28% kể từ khi lắp đặt.",
      },
    ],
    gloss: [
      { word: "accommodate", meaning: "đáp ứng / thích ứng với" },
      { word: "transit", meaning: "quá trình vận chuyển" },
      { word: "installation", meaning: "việc lắp đặt" },
    ],
  },
];

export function ReadingHub({ initialMode = "overview" }: { initialMode?: string }) {
  const { openFeatureMap, theme, toggleTheme } = useApp();
  const [mode, setMode] = React.useState<ReadingMode>(() => {
    if (initialMode === "news" || initialMode === "skim-scan") return initialMode;
    return "overview";
  });
  const [fontScale, setFontScale] = React.useState<"sm" | "md">("md");
  const [selectedWord, setSelectedWord] = React.useState<{ word: string; meaning: string } | null>(null);
  const [blurSupport, setBlurSupport] = React.useState(false);

  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f4f6] dark:bg-[#171216]">
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        {/* MAIN LEFT CANVAS */}
        <main className={cn("min-w-0 flex-1 px-4 py-7 sm:px-8 sm:py-9", fontScale === "sm" && "text-[13px]")}>
          {/* Mobile studio switcher */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 lg:hidden">
            <div className="inline-flex rounded-xl border border-[#e3d2dc] bg-white p-1 text-xs font-bold">
              <Link href="/luyen-de" className="px-3 py-1.5 text-slate-600">Luyện Đề</Link>
              <Link href="/listening" className="px-3 py-1.5 text-slate-600">Luyện Nghe</Link>
              <span className="rounded-lg bg-[#612352] px-3 py-1.5 text-white">Luyện Đọc</span>
            </div>
            <button
              type="button"
              onClick={openFeatureMap}
              className="inline-flex items-center gap-1 rounded-xl border border-[#e3d2dc] bg-white px-3 py-1.5 text-xs font-bold"
            >
              <MapIcon className="h-3.5 w-3.5" /> Bản đồ
            </button>
          </div>

          {mode === "overview" && (
            <div className="space-y-7">
              {/* Hero Split Row matching StudyChill step_59 */}
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    <Link href="/" className="inline-flex items-center gap-1 hover:text-[#612352]">
                      <Home className="h-3.5 w-3.5" />
                      TRANG CHỦ
                    </Link>
                    <span>›</span>
                    <span className="text-[#612352] dark:text-[#e1759a]">LUYỆN ĐỌC</span>
                  </div>

                  <h1 className="mt-2 font-display text-5xl font-black uppercase tracking-tight sm:text-6xl leading-none">
                    <span className="text-[#4a1a3d] dark:text-white">LUYỆN </span>
                    <span className="text-[#e1759a]">ĐỌC</span>
                  </h1>
                  <p className="mt-2.5 text-sm font-medium text-[var(--muted-foreground)] sm:text-base">
                    Đọc chắc từng Part, đi từ 450+ lên 850+
                  </p>
                </div>

                {/* Tilted 3D Clipped Polaroid Card */}
                <Tilt3D maxTilt={10} scale={1.02} glare={false} className="relative flex flex-col items-center self-center md:self-auto">
                  <Paperclip className="depth-3d-lg absolute -top-3 left-8 z-10 h-7 w-7 text-slate-500 rotate-12" />
                  <div className="rotate-[2deg] rounded-2xl border-2 border-[#dfc7d4] bg-white p-3 pb-4 shadow-md dark:border-white/15 dark:bg-[#231922] preserve-3d">
                    <div className="depth-3d-md flex h-36 w-48 items-center justify-center rounded-xl bg-[#f7ebf1] dark:bg-[#191117]">
                      <MascotReadingArt className="h-32 w-auto" />
                    </div>
                    <p className="depth-3d-sm mt-2 text-center font-heading text-xs font-extrabold text-[#3c1931] dark:text-white">
                      Reading Part 5 → 7
                    </p>
                  </div>

                  {/* Overlapping skim · scan badge */}
                  <button
                    type="button"
                    onClick={() => setMode("skim-scan")}
                    className="depth-3d-lg -mt-4 -ml-28 rounded-xl border-2 border-[#5b2a4d] bg-white px-3.5 py-2 text-xs font-bold shadow-md transition hover:scale-105 cursor-pointer"
                  >
                    <span className="rounded bg-[#f9d8e5] px-2 py-0.5 text-[#5b1d3e]">
                      skim · scan
                    </span>
                  </button>
                </Tilt3D>
              </div>

              {/* Progress Strip */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-[#461c3b] bg-white p-4 shadow-[3px_3px_0_#461c3b] dark:border-white/15 dark:bg-[#21181f] dark:shadow-none">
                <div className="flex items-center gap-6 px-2">
                  <div>
                    <p className="font-mono-num text-xl font-black text-[var(--heading)]">18</p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">Đề luyện</p>
                  </div>
                  <div>
                    <p className="font-mono-num text-xl font-black text-[var(--heading)]">0</p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">Đang làm</p>
                  </div>
                  <div>
                    <p className="font-mono-num text-xl font-black text-[var(--heading)]">
                      0<span className="text-xs font-semibold text-slate-400">/18</span>
                    </p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">Đã nộp</p>
                  </div>
                </div>

                <div className="flex min-w-[160px] flex-1 items-center gap-3 px-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#e1759a] text-[10px] font-bold text-[#9c3262]">
                    ◎
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div className="h-full w-[4%] rounded-full bg-[#612352]" />
                  </div>
                  <span className="font-mono-num text-xs font-bold text-slate-500">0%</span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Link
                    href="/luyen-de"
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#55224c] px-4 text-xs font-bold text-white shadow-xs transition hover:bg-[#41183a]"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Bắt đầu Test 01
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMode("news")}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#d6c2ce] bg-white px-4 text-xs font-bold text-[var(--heading)] hover:border-[#55224c] cursor-pointer dark:border-white/15 dark:bg-white/5"
                  >
                    Đọc báo song ngữ
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Stepped Ascending 3D Extruded Part Cards matching StudyChill step_59 bottom */}
              <div className="pt-8 grid items-end gap-5 sm:grid-cols-3">
                <Tilt3D maxTilt={8} scale={1.02} className="rounded-2xl">
                  <Link
                    href="/ngu-phap"
                    className="card-3d-extrude-plum flex h-36 flex-col justify-end rounded-2xl border-2 border-[#2a1527] bg-gradient-to-b from-[#662c60] to-[#4e214a] p-5 text-white transition preserve-3d"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(transparent, transparent 22px, rgba(255,255,255,0.06) 23px), linear-gradient(to bottom, #662c60, #4e214a)",
                    }}
                  >
                    <p className="depth-3d-sm text-[10px] font-extrabold uppercase tracking-wider text-white/75">PART 5</p>
                    <p className="depth-3d-md mt-0.5 font-heading text-xl font-extrabold">Điền câu</p>
                    <p className="depth-3d-sm mt-1 text-xs text-white/80">Một câu · 0/7 đề</p>
                  </Link>
                </Tilt3D>

                <Tilt3D maxTilt={8} scale={1.02} className="rounded-2xl">
                  <Link
                    href="/luyen-de"
                    className="card-3d-extrude-plum flex h-48 flex-col justify-end rounded-2xl border-2 border-[#421527] bg-gradient-to-b from-[#cc678e] to-[#ab4b73] p-5 text-white transition preserve-3d"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(transparent, transparent 22px, rgba(255,255,255,0.08) 23px), linear-gradient(to bottom, #cc678e, #ab4b73)",
                    }}
                  >
                    <p className="depth-3d-sm text-[10px] font-extrabold uppercase tracking-wider text-white/80">PART 6</p>
                    <p className="depth-3d-md mt-0.5 font-heading text-xl font-extrabold">Điền đoạn văn</p>
                    <p className="depth-3d-sm mt-1 text-xs text-white/85">Một đoạn văn · 0/6 đề</p>
                  </Link>
                </Tilt3D>

                <Tilt3D maxTilt={8} scale={1.02} className="rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setMode("news")}
                    className="card-3d-extrude-plum flex h-60 w-full flex-col justify-end rounded-2xl border-2 border-[#11203d] bg-gradient-to-b from-[#284b87] to-[#1b3563] p-5 text-left text-white transition cursor-pointer preserve-3d"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(transparent, transparent 22px, rgba(255,255,255,0.07) 23px), linear-gradient(to bottom, #284b87, #1b3563)",
                    }}
                  >
                    <p className="depth-3d-sm text-[10px] font-extrabold uppercase tracking-wider text-blue-200">PART 7</p>
                    <p className="depth-3d-md mt-0.5 font-heading text-xl font-extrabold">Đọc hiểu</p>
                    <p className="depth-3d-sm mt-1 text-xs text-blue-100/85">Cả bài đọc · 0/5 đề</p>
                  </button>
                </Tilt3D>
              </div>
            </div>
          )}

          {/* BILINGUAL NEWS & SKIMMING WORKSPACE matching StudyChill step_61 */}
          {(mode === "news" || mode === "skim-scan") && (
            <div className="space-y-6">
              {/* Deep Navy Header Banner */}
              <div className="rounded-3xl bg-gradient-to-r from-[#13294b] via-[#1c3c6b] to-[#214579] p-6 sm:p-8 text-white shadow-xl">
                <div className="grid gap-6 md:grid-cols-[1.35fr_0.65fr] items-center">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                      📖 LUYỆN ĐỌC · {mode === "news" ? "SONG NGỮ" : "SKIM & SCAN"}
                    </p>
                    <h2 className="mt-2 font-display text-3xl sm:text-4xl font-black">
                      Đọc báo{" "}
                      <span className="rounded-lg bg-[#f3b642] px-2.5 py-0.5 text-[#17243b]">
                        song ngữ
                      </span>
                    </h2>
                    <p className="mt-3 max-w-xl text-xs sm:text-sm text-blue-100/85 leading-relaxed">
                      Bài báo tiếng Anh thật theo chủ đề và cấp độ TOEIC. Bấm một từ để tra nghĩa nhanh, bật chế độ làm mờ câu phụ để rèn Skim &amp; Scan tốc độ.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setBlurSupport((b) => !b)}
                        className="rounded-xl bg-[#f3b642] px-4 py-2 text-xs font-extrabold text-[#17243b] transition hover:brightness-105 cursor-pointer"
                      >
                        {blurSupport ? "Hiện đầy đủ cả bài" : "Bật chế độ Skimming (Làm mờ phụ)"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("overview")}
                        className="rounded-xl border border-white/25 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 cursor-pointer"
                      >
                        ← Về tổng quan Luyện Đọc
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-1 gap-2.5 text-center md:text-left">
                    {[
                      { num: "287", lbl: "BÀI BÁO" },
                      { num: "6", lbl: "CHỦ ĐỀ" },
                      { num: "5", lbl: "CHẶNG TOEIC" },
                    ].map((s) => (
                      <div
                        key={s.lbl}
                        className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5"
                      >
                        <p className="font-mono-num text-lg font-black text-amber-300">{s.num}</p>
                        <p className="text-[10px] font-bold tracking-wider text-white/75">{s.lbl}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5 TOEIC Tracks card */}
              <div className="rounded-3xl bg-[#18335e] p-5 text-white">
                <div className="flex items-center justify-between gap-2 pb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200/75">
                      TỪ DỄ ĐẾN KHÓ
                    </p>
                    <h3 className="font-heading text-lg font-extrabold">
                      Mỗi bài báo, một bước tiến.
                    </h3>
                  </div>
                  <Link
                    href="/luyen-de"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20"
                  >
                    <Trophy className="h-3.5 w-3.5 text-amber-300" />
                    Đọc hiểu TOEIC
                  </Link>
                </div>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
                  {READING_STAGES.map((st) => (
                    <div
                      key={st.step}
                      className="rounded-2xl border border-white/15 bg-white/[0.06] p-3.5"
                    >
                      <p className="text-[10px] font-bold text-blue-200">{st.step}</p>
                      <p className="mt-1 font-display text-2xl font-black">
                        {st.level} <span className="text-[10px] font-normal text-white/60">{st.label}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Bilingual Articles */}
              <div className="grid gap-5 md:grid-cols-2">
                {NEWS_ARTICLES.map((art) => (
                  <article
                    key={art.id}
                    className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-xs dark:bg-[#21181f]"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#22437d] dark:text-blue-300">{art.topic}</span>
                      <span className="rounded-full bg-[#f7ebf1] px-2.5 py-0.5 text-[#612352]">
                        {art.level}
                      </span>
                    </div>
                    <h3 className="mt-2 font-heading text-base font-extrabold text-[var(--heading)]">
                      {art.title}
                    </h3>

                    <div className="mt-3 space-y-3">
                      {art.sentences.map((s, sIdx) => (
                        <div key={sIdx} className="rounded-xl bg-[var(--surface-alt)] p-3 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                "font-semibold leading-relaxed text-[var(--heading)] transition",
                                blurSupport && sIdx > 0 && "blur-[3px] hover:blur-none"
                              )}
                            >
                              {s.en}
                            </p>
                            <button
                              type="button"
                              onClick={() => speak(s.en)}
                              aria-label="Nghe câu tiếng Anh"
                              className="shrink-0 rounded-lg bg-[#22437d] p-1.5 text-white cursor-pointer"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="mt-1 text-[var(--muted-foreground)]">{s.vi}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {art.gloss.map((g) => (
                        <button
                          key={g.word}
                          type="button"
                          onClick={() => {
                            setSelectedWord(g);
                            speak(g.word);
                          }}
                          className="rounded-lg border border-[#d6c2ce] bg-[#faf4f7] px-2.5 py-1 text-[11px] font-bold text-[#612352] hover:bg-[#612352] hover:text-white transition cursor-pointer"
                        >
                          {g.word}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>

              {selectedWord && (
                <div className="rounded-2xl border-2 border-[#22437d] bg-white p-4 text-xs shadow-md flex items-center justify-between gap-3">
                  <div>
                    <b className="text-sm text-[#22437d]">{selectedWord.word}</b>:{" "}
                    <span>{selectedWord.meaning}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedWord(null)}
                    className="font-bold text-slate-500 cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* RIGHT FIXED STUDIO WORKSPACE SIDEBAR matching StudyChill step_41 */}
        <aside className="w-full shrink-0 border-t border-[#eadce4] bg-white lg:w-[356px] lg:border-l lg:border-t-0 dark:border-white/10 dark:bg-[#191318]">
          <div className="flex h-full flex-col justify-between p-5 lg:sticky lg:top-0 lg:min-h-screen">
            <div>
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-[#f5edf2] p-1 dark:bg-white/5">
                <Link
                  href="/luyen-de"
                  className="flex items-center justify-center gap-1 whitespace-nowrap rounded-xl py-2 px-1 text-[11px] font-bold text-[#3f1c37] hover:bg-white/60 dark:text-white/80"
                >
                  <FileCheck2 className="h-3.5 w-3.5 shrink-0" />
                  Luyện Đề
                </Link>
                <Link
                  href="/listening"
                  className="flex items-center justify-center gap-1 whitespace-nowrap rounded-xl py-2 px-1 text-[11px] font-bold text-[#3f1c37] hover:bg-white/60 dark:text-white/80"
                >
                  <Headphones className="h-3.5 w-3.5 shrink-0" />
                  Luyện Nghe
                </Link>
                <span className="flex items-center justify-center gap-1 whitespace-nowrap rounded-xl bg-[#612352] py-2 px-1 text-[11px] font-bold text-white shadow-xs">
                  <BookOpen className="h-3.5 w-3.5 shrink-0" />
                  Luyện Đọc
                </span>
              </div>

              <p className="mt-6 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                THEO PART
              </p>
              <div className="mt-2.5 space-y-1">
                {[
                  { num: 5, label: "Part 5 · Điền câu", count: "7 đề", href: "/ngu-phap" },
                  { num: 6, label: "Part 6 · Điền đoạn văn", count: "6 đề", href: "/luyen-de" },
                  { num: 7, label: "Part 7 · Đọc hiểu", count: "5 đề", href: "/luyen-de" },
                ].map((item) => (
                  <Link
                    key={item.num}
                    href={item.href}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-[#2d1629] transition hover:bg-[#f7ebf1] dark:text-white/85 dark:hover:bg-white/5"
                  >
                    <span>
                      <strong className="mr-2.5 font-mono-num text-[#612352] dark:text-[#e1759a]">{item.num}</strong>
                      {item.label}
                    </span>
                    <span className="text-[11px] text-slate-400">{item.count}</span>
                  </Link>
                ))}
              </div>

              <p className="mt-6 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                LUYỆN THÊM
              </p>
              <div className="mt-2.5 space-y-1.5">
                {[
                  { numeral: "I", label: "Đọc lướt & đọc quét", m: "skim-scan" as const },
                  { numeral: "II", label: "Đọc báo song ngữ", m: "news" as const },
                ].map((extra) => (
                  <button
                    key={extra.label}
                    type="button"
                    onClick={() => setMode(extra.m)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-bold transition cursor-pointer",
                      mode === extra.m
                        ? "bg-[#f5e3ed] text-[#612352] dark:bg-[#612352]/30 dark:text-[#f0a5c2]"
                        : "text-[#2d1629] hover:bg-[#f7ebf1] dark:text-white/85 dark:hover:bg-white/5"
                    )}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-extrabold text-slate-600 dark:bg-white/10 dark:text-white/75">
                      {extra.numeral}
                    </span>
                    <span>{extra.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-[#eadce4] pt-4 text-xs font-bold text-slate-500 dark:border-white/10">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFontScale("sm")}
                  className={cn("cursor-pointer hover:text-[#612352]", fontScale === "sm" && "underline text-[#612352]")}
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontScale("md")}
                  className={cn("cursor-pointer hover:text-[#612352]", fontScale === "md" && "underline text-[#612352]")}
                >
                  A+
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Chuyển giao diện sáng tối"
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-[#612352] dark:text-slate-300 dark:hover:bg-white/10 cursor-pointer"
                >
                  {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </button>
              </div>
              <Link href="/" className="text-[11px] font-bold text-[#612352] hover:underline">
                Về {siteConfig.brand.name} →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
