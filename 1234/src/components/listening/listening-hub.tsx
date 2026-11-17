"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileCheck2,
  Headphones,
  Home,
  Map as MapIcon,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sun,
  Volume2,
} from "lucide-react";
import { Tilt3D } from "@/components/ui";
import { useApp } from "@/components/providers/app-provider";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type ListeningMode = "overview" | "roadmap" | "dictation" | "paragraph" | "video";

const PART_NODES = [
  { part: "PART 1", title: "Mô tả tranh", meta: "5 đề · 0 đã làm", color: "bg-[#31683a]" },
  { part: "PART 2", title: "Hỏi - Đáp", meta: "5 đề · 0 đã làm", color: "bg-[#60792b]" },
  { part: "PART 3", title: "Hội thoại ngắn", meta: "5 đề · 0 đã làm", color: "bg-[#196365]" },
  { part: "PART 4", title: "Bài nói ngắn", meta: "5 đề · 0 đã làm", color: "bg-[#1a5233]" },
];

const ROADMAP_CHUNKS = [
  {
    stage: "CHẶNG 1 · Tranh tả người",
    color: "bg-[#f5b938] text-[#1f1907]",
    items: [
      "TỔNG QUAN PART 1 · QUAN SÁT & DỰ ĐOÁN",
      "CHIẾN THUẬT: LOẠI SAI CHỌN ĐÚNG",
      "ĐỘNG TÁC TAY: CẦM, NHẤC, MANG, ĐẶT",
      "THAO TÁC DỤNG CỤ & THIẾT BỊ",
      "TƯ THẾ, MẶT, LỜI NÓI, DI CHUYỂN",
      "TRANG PHỤC: TRẠNG THÁI HAY HÀNH ĐỘNG",
    ],
  },
  {
    stage: "CHẶNG 2 · Tranh tả vật / cảnh",
    color: "bg-[#224578] text-white",
    items: [
      "VỊ TRÍ & SẮP XẾP KHÔNG GIAN",
      "BA THỂ BỊ ĐỘNG & BẰNG CHỨNG",
      "CẢNH TRONG NHÀ & VĂN PHÒNG",
      "CẢNH NGOÀI TRỜI & GIAO THÔNG",
    ],
  },
  {
    stage: "CHẶNG 3 · Kết hợp & tổng ôn",
    color: "bg-[#237142] text-white",
    items: [
      "TRANH KẾT HỢP: NGƯỜI ↔ VẬT",
      "TỔNG HỢP BẪY ĐỒNG ÂM + PHÒNG THI",
    ],
  },
];

const DICTATION_SAMPLES = [
  {
    id: "d1",
    level: "Part 1",
    sentence: "A woman is adjusting a microphone in the conference room.",
    vi: "Một người phụ nữ đang điều chỉnh micro trong phòng họp.",
    tip: "Nghe kỹ âm cuối -ing và cụm 'conference room'.",
  },
  {
    id: "d2",
    level: "Part 2",
    sentence: "Could you send me the quarterly budget report before Friday?",
    vi: "Bạn có thể gửi tôi báo cáo ngân sách hàng quý trước thứ Sáu không?",
    tip: "Từ khóa: quarterly budget report.",
  },
  {
    id: "d3",
    level: "Part 3",
    sentence: "The maintenance crew will inspect the elevator early tomorrow morning.",
    vi: "Đội bảo trì sẽ kiểm tra thang máy vào sáng sớm ngày mai.",
    tip: "Chú ý thì tương lai 'will inspect' và danh từ 'maintenance'.",
  },
];

const BILINGUAL_CLIPS = [
  {
    id: "v1",
    title: "Hội thoại văn phòng: Sắp xếp lịch họp với đối tác",
    duration: "01:45",
    level: "450–650 TOEIC",
    lines: [
      {
        en: "Hi Sarah, did you confirm the meeting room for tomorrow's presentation?",
        vi: "Chào Sarah, bạn đã xác nhận phòng họp cho buổi thuyết trình ngày mai chưa?",
      },
      {
        en: "Yes, we booked Room 302 because the projector there works best.",
        vi: "Rồi ạ, tụi mình đã đặt phòng 302 vì máy chiếu ở đó hoạt động ổn định nhất.",
      },
    ],
  },
  {
    id: "v2",
    title: "Thông báo sân bay: Thay đổi cửa khởi hành",
    duration: "01:20",
    level: "650+ TOEIC",
    lines: [
      {
        en: "Attention passengers on Flight 408 to Tokyo, your boarding gate has changed to B12.",
        vi: "Xin lưu ý hành khách trên chuyến bay 408 đi Tokyo, cửa lên máy bay đã đổi sang B12.",
      },
      {
        en: "Please have your boarding pass and passport ready for inspection.",
        vi: "Vui lòng chuẩn bị sẵn thẻ lên tàu và hộ chiếu để kiểm tra.",
      },
    ],
  },
];

export function ListeningHub({ initialMode = "overview" }: { initialMode?: string }) {
  const { openFeatureMap, notify, theme, toggleTheme } = useApp();
  const [mode, setMode] = React.useState<ListeningMode>(() => {
    if (initialMode === "roadmap" || initialMode === "dictation" || initialMode === "paragraph" || initialMode === "video") {
      return initialMode;
    }
    return "overview";
  });
  const [isPlayingWave, setIsPlayingWave] = React.useState(false);
  const [fontScale, setFontScale] = React.useState<"sm" | "md">("md");
  const [dictIdx, setDictIdx] = React.useState(0);
  const [dictRate, setDictRate] = React.useState<0.8 | 1 | 1.15>(1);
  const [dictInput, setDictInput] = React.useState("");
  const [dictChecked, setDictChecked] = React.useState(false);
  const [activePartTab, setActivePartTab] = React.useState<1 | 2 | 3 | 4>(1);

  const activeSample = DICTATION_SAMPLES[dictIdx];

  const speakText = (text: string, rate = 0.95) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      notify("Trình duyệt không hỗ trợ đọc giọng nói SpeechSynthesis.", "info");
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = rate;
    setIsPlayingWave(true);
    utter.onend = () => setIsPlayingWave(false);
    utter.onerror = () => setIsPlayingWave(false);
    window.speechSynthesis.speak(utter);
  };

  const toggleSampleWave = () => {
    if (isPlayingWave) {
      window.speechSynthesis?.cancel();
      setIsPlayingWave(false);
    } else {
      speakText("Welcome to LingoChill Listening Studio. Let's practice TOEIC Part one through Part four together.", 0.95);
    }
  };

  const normalizeWords = (s: string) =>
    s
      .toLowerCase()
      .replace(/[.,?!']/g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  const expectedWords = normalizeWords(activeSample.sentence);
  const userWords = normalizeWords(dictInput);
  const matchedCount = expectedWords.filter((w, i) => userWords[i] === w).length;

  return (
    <div className="min-h-screen bg-[#f5f8f5] dark:bg-[#101612]">
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        {/* MAIN LEFT CANVAS */}
        <main className={cn("min-w-0 flex-1 px-4 py-7 sm:px-8 sm:py-9", fontScale === "sm" && "text-[13px]")}>
          {/* Mobile top workspace pills */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 lg:hidden">
            <div className="inline-flex rounded-xl border border-[#d6ddd6] bg-white p-1 text-xs font-bold">
              <Link href="/luyen-de" className="px-3 py-1.5 text-slate-600">Luyện Đề</Link>
              <span className="rounded-lg bg-[#205936] px-3 py-1.5 text-white">Luyện Nghe</span>
              <Link href="/reading" className="px-3 py-1.5 text-slate-600">Luyện Đọc</Link>
            </div>
            <button
              type="button"
              onClick={openFeatureMap}
              className="inline-flex items-center gap-1 rounded-xl border border-[#d6ddd6] bg-white px-3 py-1.5 text-xs font-bold"
            >
              <MapIcon className="h-3.5 w-3.5" /> Bản đồ
            </button>
          </div>

          {mode === "overview" && (
            <div className="space-y-7">
              {/* Hero Split Row matching StudyChill step_55 */}
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    <Link href="/" className="inline-flex items-center gap-1 hover:text-[#205936]">
                      <Home className="h-3.5 w-3.5" />
                      TRANG CHỦ
                    </Link>
                    <span>›</span>
                    <span className="text-[#205936] dark:text-[#9ee56f]">LUYỆN NGHE</span>
                  </div>

                  <h1 className="mt-2 font-display text-5xl font-black uppercase tracking-tight sm:text-6xl leading-none">
                    <span className="text-[#1a492e] dark:text-[#e6f3ea]">LUYỆN </span>
                    <span className="text-[#8fc841]">NGHE</span>
                  </h1>
                  <p className="mt-2.5 text-sm font-medium text-[var(--muted-foreground)] sm:text-base">
                    Nghe chắc từng Part, đi từ 450+ lên 850+
                  </p>
                </div>

                {/* Tilted 3D Polaroid Mascot Card + Live Audio Visualizer Pill */}
                <Tilt3D maxTilt={10} scale={1.02} glare={false} className="relative flex flex-col items-center self-center md:self-auto">
                  <div className="rotate-[2.5deg] rounded-2xl border-2 border-[#d2ded2] bg-white p-3 pb-4 shadow-md dark:border-white/15 dark:bg-[#19231d] preserve-3d">
                    <div className="depth-3d-md flex h-36 w-48 items-center justify-center rounded-xl bg-[#ebf3e4] dark:bg-[#142018]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/mascot/card-listening.png"
                        alt="Luyện nghe cùng Mochi"
                        className="h-32 w-auto object-contain"
                      />
                    </div>
                    <p className="depth-3d-sm mt-2 text-center font-heading text-xs font-extrabold text-[#162617] dark:text-white">
                      Listening Part 1 → 4
                    </p>
                  </div>

                  {/* Soundwave bar badge overlapping bottom-left */}
                  <button
                    type="button"
                    onClick={toggleSampleWave}
                    className="depth-3d-lg -mt-4 -ml-10 inline-flex items-center gap-2 rounded-full border-2 border-[#162617] bg-white px-3.5 py-1.5 text-xs font-bold text-[#162617] shadow-md transition hover:bg-[#f2f9ea] cursor-pointer"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2b633c] text-white">
                      {isPlayingWave ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
                    </span>
                    <span className="flex items-end gap-0.5 h-3.5">
                      {[6, 11, 8, 13, 7, 12, 9, 13, 8, 6].map((h, i) => (
                        <span
                          key={i}
                          style={{ height: `${h}px` }}
                          className={cn(
                            "w-1 rounded-full transition-colors",
                            isPlayingWave ? "bg-[#2b633c] animate-pulse" : "bg-[#5a8b55]"
                          )}
                        />
                      ))}
                    </span>
                    <span className="font-mono-num text-[11px] text-slate-500">0:42</span>
                  </button>
                </Tilt3D>
              </div>

              {/* Progress Strip matching StudyChill */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-[#1b2d1c] bg-white p-4 shadow-[3px_3px_0_#1b2d1c] dark:border-white/15 dark:bg-[#171f1a] dark:shadow-none">
                <div className="flex items-center gap-6 px-2">
                  <div>
                    <p className="font-mono-num text-xl font-black text-[var(--heading)]">20</p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">Đề luyện</p>
                  </div>
                  <div>
                    <p className="font-mono-num text-xl font-black text-[var(--heading)]">0</p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">Đang làm</p>
                  </div>
                  <div>
                    <p className="font-mono-num text-xl font-black text-[var(--heading)]">
                      0<span className="text-xs font-semibold text-slate-400">/20</span>
                    </p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">Đã nộp</p>
                  </div>
                </div>

                <div className="flex min-w-[160px] flex-1 items-center gap-3 px-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#8fc841] text-[10px] font-bold text-[#4a7a22]">
                    ◎
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div className="h-full w-[4%] rounded-full bg-[#205936]" />
                  </div>
                  <span className="font-mono-num text-xs font-bold text-slate-500">0%</span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Link
                    href="/luyen-de"
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#205936] px-4 text-xs font-bold text-white shadow-xs transition hover:bg-[#184429]"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Bắt đầu Test 01
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMode("roadmap")}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#cfd6cc] bg-white px-4 text-xs font-bold text-[var(--heading)] hover:border-[#205936] cursor-pointer dark:border-white/15 dark:bg-white/5"
                  >
                    Xem Part 1 · Mô tả tranh
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* 4 Circular Connected Part Nodes matching StudyChill step_55 */}
              <div className="pt-4">
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 relative">
                  {PART_NODES.map((node, idx) => (
                    <div key={node.part} className="relative flex flex-col items-center">
                      {idx < PART_NODES.length - 1 && (
                        <div
                          aria-hidden="true"
                          className="hidden sm:block absolute left-[calc(50%+5.5rem)] right-[-2rem] top-1/2 -translate-y-1/2 h-0.5 bg-[#1b2d1c]/35 dark:bg-white/20"
                        />
                      )}
                      <Tilt3D maxTilt={10} scale={1.04} className="rounded-full">
                        <button
                          type="button"
                          onClick={() => {
                            setActivePartTab((idx + 1) as 1 | 2 | 3 | 4);
                            setMode("roadmap");
                          }}
                          className={cn(
                            "group relative flex h-40 w-40 sm:h-44 sm:w-44 flex-col items-center justify-center rounded-full border-2 border-[#162617] text-center text-white shadow-[0_7px_0_#162617,0_14px_26px_rgba(22,38,23,0.18)] transition cursor-pointer preserve-3d",
                            node.color
                          )}
                        >
                          <span className="depth-3d-sm text-[11px] font-bold tracking-widest uppercase text-white/75">
                            {node.part}
                          </span>
                          <span className="depth-3d-md mt-1 font-heading text-base sm:text-lg font-extrabold">
                            {node.title}
                          </span>
                          <span className="depth-3d-sm mt-1.5 text-xs text-white/80">{node.meta}</span>
                        </button>
                      </Tilt3D>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DARK ROADMAP VIEW matching StudyChill step_57 */}
          {mode === "roadmap" && (
            <div className="rounded-3xl bg-[#131722] p-6 sm:p-8 text-white shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <button
                  type="button"
                  onClick={() => setMode("overview")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold hover:bg-white/15 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Quay lại
                </button>
                <div className="flex items-center gap-2 text-xs font-bold">
                  {([1, 2, 3, 4] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setActivePartTab(p)}
                      className={cn(
                        "rounded-xl px-3.5 py-1.5 transition cursor-pointer",
                        activePartTab === p ? "bg-white/15 text-[#f5b938]" : "text-white/60 hover:text-white"
                      )}
                    >
                      Part {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.15fr] items-center">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-blue-300">
                    LỘ TRÌNH LISTENING · TOEIC
                  </p>
                  <h2 className="mt-1 font-display text-5xl font-black">
                    PART <span className="text-[#f5b938]">{activePartTab}</span>
                  </h2>
                  <p className="mt-1 text-base font-bold text-white/80">
                    {PART_NODES[activePartTab - 1].title}
                  </p>
                  <div className="mt-5 flex items-center gap-6 text-xs">
                    <div>
                      <p className="font-mono-num text-xl font-black">14</p>
                      <p className="text-white/50">BÀI HỌC</p>
                    </div>
                    <div>
                      <p className="font-mono-num text-xl font-black">3</p>
                      <p className="text-white/50">ĐỀ ÔN</p>
                    </div>
                    <div>
                      <p className="font-mono-num text-xl font-black">0/17</p>
                      <p className="text-white/50">ĐÃ XONG</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode("dictation")}
                    className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-[#8ea4d2] px-5 text-xs font-extrabold text-[#0e1525] transition hover:brightness-110 cursor-pointer"
                  >
                    Bắt đầu Bài 1 <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  {/* 3 Colored Hexagonal Stage Badges matching step_57 */}
                  <div className="mt-8 grid grid-cols-3 gap-3">
                    {ROADMAP_CHUNKS.map((c, idx) => (
                      <div
                        key={c.stage}
                        className={cn(
                          "rounded-2xl p-4 text-center shadow-lg",
                          c.color
                        )}
                      >
                        <p className="text-[10px] font-black uppercase tracking-wider opacity-80">
                          CHẶNG {idx + 1}
                        </p>
                        <p className="mt-1 text-xs font-extrabold leading-snug">
                          {c.stage.split("·")[1]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right lesson accordion list */}
                <div className="rounded-2xl border border-white/10 bg-[#1a2030] p-4 space-y-4">
                  {ROADMAP_CHUNKS.map((chunk) => (
                    <div key={chunk.stage}>
                      <p className="px-2 text-[11px] font-extrabold uppercase tracking-wider text-blue-300">
                        {chunk.stage}
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {chunk.items.map((title, idx) => (
                          <button
                            key={title}
                            type="button"
                            onClick={() => setMode("dictation")}
                            className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-xs font-semibold text-white/90 transition hover:border-[#f5b938]/50 hover:bg-white/10 cursor-pointer"
                          >
                            <span className="flex items-center gap-2.5">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/25 font-mono-num text-[11px] font-bold">
                                {idx + 1}
                              </span>
                              <span className="line-clamp-1">{title}</span>
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/40" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* INTERACTIVE DICTATION TRAINER (Sentence & Paragraph) */}
          {(mode === "dictation" || mode === "paragraph") && (
            <div className="rounded-3xl border-2 border-[#1b2d1c] bg-white p-6 sm:p-8 shadow-[4px_4px_0_#1b2d1c] dark:border-white/15 dark:bg-[#171f1a]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
                <div>
                  <span className="rounded-full bg-[#e6f3d8] px-3 py-1 text-[11px] font-extrabold text-[#1e4d26]">
                    {mode === "dictation" ? "NGHE CHÉP TỪNG CÂU" : "NGHE CHÉP ĐOẠN VĂN"} · {activeSample.level}
                  </span>
                  <h2 className="mt-2 font-heading text-xl font-extrabold text-[var(--heading)]">
                    Câu {dictIdx + 1} / {DICTATION_SAMPLES.length}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {([0.8, 1, 1.15] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setDictRate(r)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-xs font-mono-num font-bold cursor-pointer",
                        dictRate === r ? "border-[#205936] bg-[#205936] text-white" : "border-[var(--border)]"
                      )}
                    >
                      {r}x
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => speakText(activeSample.sentence, dictRate)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#205936] px-4 py-2 text-xs font-bold text-white cursor-pointer hover:bg-[#184429]"
                  >
                    <Volume2 className="h-4 w-4" />
                    Phát audio
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <textarea
                  rows={3}
                  value={dictInput}
                  onChange={(e) => {
                    setDictInput(e.target.value);
                    setDictChecked(false);
                  }}
                  placeholder="Nghe kỹ rồi gõ lại chính xác câu tiếng Anh bạn vừa nghe được..."
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 text-sm text-[var(--foreground)] outline-none focus:border-[#205936]"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDictChecked(true)}
                      className="rounded-xl bg-[#9ee56f] border-2 border-[#162617] px-5 py-2 text-xs font-extrabold text-[#162617] cursor-pointer hover:bg-[#aeef82]"
                    >
                      Kiểm tra từng từ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDictInput("");
                        setDictChecked(false);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] px-3.5 py-2 text-xs font-bold cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Làm lại
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDictIdx((i) => (i + 1) % DICTATION_SAMPLES.length);
                      setDictInput("");
                      setDictChecked(false);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#205936] hover:underline cursor-pointer"
                  >
                    Câu tiếp theo <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {dictChecked && (
                  <div className="rounded-2xl border border-[#c6dab7] bg-[#f3f9ec] p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                    <p className="text-xs font-extrabold text-[#1c4b25] dark:text-[#9ee56f]">
                      Độ chính xác: {matchedCount}/{expectedWords.length} từ đúng
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-sm font-semibold">
                      {expectedWords.map((w, idx) => {
                        const ok = userWords[idx] === w;
                        return (
                          <span
                            key={idx}
                            className={cn(
                              "rounded px-1.5 py-0.5",
                              ok ? "bg-emerald-200/70 text-emerald-950" : "bg-rose-200/70 text-rose-950"
                            )}
                          >
                            {w}
                          </span>
                        );
                      })}
                    </div>
                    <p className="mt-2.5 text-xs text-[var(--muted-foreground)]">
                      <b>Dịch nghĩa:</b> {activeSample.vi}
                    </p>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      <b>Gợi ý:</b> {activeSample.tip}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BILINGUAL VIDEO TRAINER */}
          {mode === "video" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-extrabold text-[var(--heading)]">
                  Video &amp; Hội thoại song ngữ TOEIC
                </h2>
                <button
                  type="button"
                  onClick={() => setMode("overview")}
                  className="text-xs font-bold text-[#205936] hover:underline cursor-pointer"
                >
                  ← Về tổng quan Luyện Nghe
                </button>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {BILINGUAL_CLIPS.map((clip) => (
                  <div
                    key={clip.id}
                    className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-xs dark:bg-[#171f1a]"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-[#205936]">
                      <span className="rounded-full bg-[#e6f3d8] px-2.5 py-0.5">{clip.level}</span>
                      <span className="font-mono-num text-[var(--muted-foreground)]">{clip.duration}</span>
                    </div>
                    <h3 className="mt-2.5 font-heading text-base font-extrabold text-[var(--heading)]">
                      {clip.title}
                    </h3>
                    <div className="mt-3 space-y-2.5">
                      {clip.lines.map((line, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl bg-[var(--surface-alt)] p-3 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-[var(--heading)]">{line.en}</p>
                            <button
                              type="button"
                              onClick={() => speakText(line.en, 0.95)}
                              aria-label="Nghe câu này"
                              className="shrink-0 rounded-lg bg-[#205936] p-1.5 text-white cursor-pointer"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="mt-1 text-[var(--muted-foreground)]">{line.vi}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* RIGHT FIXED STUDIO WORKSPACE SIDEBAR matching StudyChill step_39 */}
        <aside className="w-full shrink-0 border-t border-[#e2e7e2] bg-white lg:w-[356px] lg:border-l lg:border-t-0 dark:border-white/10 dark:bg-[#141a16]">
          <div className="flex h-full flex-col justify-between p-5 lg:sticky lg:top-0 lg:min-h-screen">
            <div>
              {/* 3 Mode Switcher Pills — Single-Line matching StudyChill */}
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-[#f1f5f1] p-1 dark:bg-white/5">
                <Link
                  href="/luyen-de"
                  className="flex items-center justify-center gap-1 whitespace-nowrap rounded-xl py-2 px-1 text-[11px] font-bold text-[#1f3427] transition hover:bg-white/60 dark:text-white/80"
                >
                  <FileCheck2 className="h-3.5 w-3.5 shrink-0" />
                  Luyện Đề
                </Link>
                <span className="flex items-center justify-center gap-1 whitespace-nowrap rounded-xl bg-[#205936] py-2 px-1 text-[11px] font-bold text-white shadow-xs">
                  <Headphones className="h-3.5 w-3.5 shrink-0" />
                  Luyện Nghe
                </span>
                <Link
                  href="/reading"
                  className="flex items-center justify-center gap-1 whitespace-nowrap rounded-xl py-2 px-1 text-[11px] font-bold text-[#1f3427] transition hover:bg-white/60 dark:text-white/80"
                >
                  <BookOpen className="h-3.5 w-3.5 shrink-0" />
                  Luyện Đọc
                </Link>
              </div>

              <p className="mt-6 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                THEO PART
              </p>
              <div className="mt-2.5 space-y-1">
                {PART_NODES.map((node, idx) => (
                  <button
                    key={node.part}
                    type="button"
                    onClick={() => {
                      setActivePartTab((idx + 1) as 1 | 2 | 3 | 4);
                      setMode("roadmap");
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#1b2d1c] transition hover:bg-[#eff5ee] cursor-pointer dark:text-white/85 dark:hover:bg-white/5"
                  >
                    <span>
                      <strong className="mr-2.5 font-mono-num text-[#205936] dark:text-[#9ee56f]">{idx + 1}</strong>
                      Part {idx + 1} · {node.title}
                    </span>
                    <span className="text-[11px] text-slate-400">5 đề</span>
                  </button>
                ))}
              </div>

              <p className="mt-6 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                LUYỆN THÊM
              </p>
              <div className="mt-2.5 space-y-1.5">
                {[
                  { numeral: "I", label: "Lộ trình Listening", m: "roadmap" as const },
                  { numeral: "II", label: "Nghe chép câu", m: "dictation" as const },
                  { numeral: "III", label: "Nghe chép đoạn văn", m: "paragraph" as const },
                  { numeral: "IV", label: "Video song ngữ", m: "video" as const },
                ].map((extra) => (
                  <button
                    key={extra.label}
                    type="button"
                    onClick={() => setMode(extra.m)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-bold transition cursor-pointer",
                      mode === extra.m
                        ? "bg-[#e7f3e4] text-[#174623] dark:bg-[#205936]/30 dark:text-[#9ee56f]"
                        : "text-[#1b2d1c] hover:bg-[#eff5ee] dark:text-white/85 dark:hover:bg-white/5"
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

            <div className="mt-8 flex items-center justify-between border-t border-[#e7ebe8] pt-4 text-xs font-bold text-slate-500 dark:border-white/10">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFontScale("sm")}
                  className={cn("cursor-pointer hover:text-[#205936]", fontScale === "sm" && "underline text-[#205936]")}
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontScale("md")}
                  className={cn("cursor-pointer hover:text-[#205936]", fontScale === "md" && "underline text-[#205936]")}
                >
                  A+
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Chuyển giao diện sáng tối"
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-[#205936] dark:text-slate-300 dark:hover:bg-white/10 cursor-pointer"
                >
                  {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </button>
              </div>
              <Link href="/" className="text-[11px] font-bold text-[#205936] hover:underline">
                Về {siteConfig.brand.name} →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
