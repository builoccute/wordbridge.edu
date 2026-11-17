"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, BarChart3, Bell, BookOpen, CheckCircle2, Clock, FileText, Flag, Flame, Headphones, Home, Map as MapIcon, Moon, Pause, Play, RotateCcw, Sparkles, Sun, Trophy, Volume2, XCircle } from "lucide-react";
import { Button } from "@/components/ui";
import Link from "next/link";
import { Mascot } from "@/components/brand/mascot";
import { useApp } from "@/components/providers/app-provider";
import { Badge } from "@/components/ui";
import { Card } from "@/components/ui";
import { formatTimer } from "@/lib/utils";
import { MascotExamArt } from "@/components/brand/mascot";
import { Tilt3D } from "@/components/ui";
import type { ExamSetDashboardItem, ExamTestCardItem } from "@/lib/prisma";
import { cn } from "@/lib/utils";

// === part1-scene.tsx ===
interface Part1SceneProps {
  scene: string;
}

/**
 * Handcrafted SVG illustrations for TOEIC Part 1 picture-description questions
 * so visual questions work offline with zero external image hotlinks.
 */
export function Part1Scene({ scene }: Part1SceneProps) {
  if (scene === "cafe-workspace") {
    return (
      <svg viewBox="0 0 420 230" className="w-full rounded-2xl border border-[var(--border)] bg-amber-50 dark:bg-slate-900" role="img" aria-label="Bàn gỗ đặt laptop và sổ tay">
        <rect width="420" height="230" fill="#fef3c7" opacity="0.55" />
        {/* Window background */}
        <rect x="30" y="20" width="140" height="90" rx="8" fill="#bae6fd" stroke="#78350f" strokeWidth="3" />
        <line x1="100" y1="20" x2="100" y2="110" stroke="#78350f" strokeWidth="2.5" />
        <line x1="30" y1="65" x2="170" y2="65" stroke="#78350f" strokeWidth="2.5" />
        {/* Wooden desk */}
        <path d="M20 150 L400 150 L390 215 L30 215 Z" fill="#b45309" stroke="#451a03" strokeWidth="3" />
        <rect x="20" y="142" width="380" height="14" rx="4" fill="#d97706" stroke="#451a03" strokeWidth="3" />
        {/* Laptop on desk */}
        <polygon points="105,138 195,138 188,82 112,82" fill="#334155" stroke="#0f172a" strokeWidth="3" />
        <rect x="118" y="88" width="64" height="44" rx="2" fill="#e2e8f0" />
        <polygon points="95,146 205,146 195,138 105,138" fill="#94a3b8" stroke="#0f172a" strokeWidth="2.5" />
        {/* Notebook + pen */}
        <rect x="235" y="126" width="84" height="22" rx="4" fill="#fffdf8" stroke="#1e4033" strokeWidth="2.5" transform="rotate(-5 235 126)" />
        <line x1="248" y1="133" x2="305" y2="128" stroke="#10b981" strokeWidth="2" />
        <line x1="250" y1="139" x2="295" y2="135" stroke="#f59e0b" strokeWidth="2" />
        {/* Coffee cup */}
        <rect x="338" y="114" width="26" height="28" rx="4" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
        <path d="M364 120 Q374 120 374 128 Q374 136 364 136" fill="none" stroke="#1e293b" strokeWidth="2.5" />
        <path d="M346 106 Q344 98 350 93" stroke="#94a3b8" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (scene === "warehouse-logistics") {
    return (
      <svg viewBox="0 0 420 230" className="w-full rounded-2xl border border-[var(--border)] bg-slate-100 dark:bg-slate-900" role="img" aria-label="Thùng hàng xếp trên pallet gỗ trong nhà kho">
        <rect width="420" height="230" fill="#e2e8f0" />
        {/* Warehouse shelves */}
        <line x1="30" y1="30" x2="30" y2="195" stroke="#475569" strokeWidth="6" />
        <line x1="390" y1="30" x2="390" y2="195" stroke="#475569" strokeWidth="6" />
        <line x1="30" y1="90" x2="390" y2="90" stroke="#64748b" strokeWidth="5" />
        {/* Floor */}
        <rect x="0" y="195" width="420" height="35" fill="#cbd5e1" />
        {/* Wooden pallet 1 */}
        <rect x="65" y="182" width="130" height="12" fill="#92400e" stroke="#451a03" strokeWidth="2" />
        {/* Stacked boxes on pallet 1 */}
        <rect x="75" y="138" width="54" height="44" fill="#d97706" stroke="#78350f" strokeWidth="2.5" />
        <rect x="132" y="138" width="54" height="44" fill="#f59e0b" stroke="#78350f" strokeWidth="2.5" />
        <rect x="102" y="96" width="56" height="42" fill="#fbbf24" stroke="#78350f" strokeWidth="2.5" />
        {/* Wooden pallet 2 */}
        <rect x="235" y="182" width="125" height="12" fill="#92400e" stroke="#451a03" strokeWidth="2" />
        <rect x="245" y="136" width="52" height="46" fill="#d97706" stroke="#78350f" strokeWidth="2.5" />
        <rect x="300" y="136" width="52" height="46" fill="#f59e0b" stroke="#78350f" strokeWidth="2.5" />
        <rect x="272" y="98" width="52" height="38" fill="#d97706" stroke="#78350f" strokeWidth="2.5" />
      </svg>
    );
  }

  // Default: office-meeting
  return (
    <svg viewBox="0 0 420 230" className="w-full rounded-2xl border border-[var(--border)] bg-emerald-50 dark:bg-slate-900" role="img" aria-label="Nhân viên gõ laptop và đồng nghiệp xem tài liệu">
      <rect width="420" height="230" fill="#ecfdf5" />
      {/* Whiteboard */}
      <rect x="120" y="20" width="180" height="75" rx="6" fill="#ffffff" stroke="#94a3b8" strokeWidth="3" />
      <line x1="145" y1="42" x2="225" y2="42" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
      <line x1="145" y1="58" x2="265" y2="58" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
      <line x1="145" y1="74" x2="210" y2="74" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />

      {/* Person 1 (left - woman typing on laptop) */}
      <circle cx="115" cy="95" r="20" fill="#fed7aa" stroke="#1e293b" strokeWidth="2.5" />
      <path d="M95 95 C95 72, 135 72, 135 95" fill="#1e293b" />
      <path d="M84 150 C84 122, 146 122, 146 150 Z" fill="#15803d" stroke="#1e293b" strokeWidth="2.5" />

      {/* Person 2 (right - colleague reviewing document) */}
      <circle cx="305" cy="95" r="20" fill="#fed7aa" stroke="#1e293b" strokeWidth="2.5" />
      <path d="M286 91 C286 73, 324 73, 324 91" fill="#334155" />
      <path d="M274 150 C274 122, 336 122, 336 150 Z" fill="#0284c7" stroke="#1e293b" strokeWidth="2.5" />

      {/* Conference table */}
      <rect x="55" y="150" width="310" height="16" rx="6" fill="#d97706" stroke="#78350f" strokeWidth="3" />
      <rect x="85" y="166" width="16" height="50" fill="#92400e" />
      <rect x="319" y="166" width="16" height="50" fill="#92400e" />

      {/* Laptop in front of Person 1 */}
      <polygon points="122,147 185,147 178,108 130,108" fill="#334155" stroke="#0f172a" strokeWidth="2.5" />
      <rect x="112" y="147" width="80" height="5" rx="2" fill="#94a3b8" />

      {/* Document on table */}
      <rect x="235" y="138" width="66" height="13" rx="2" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
    </svg>
  );
}

// === toeic-audio-player.tsx ===
interface ToeicAudioPlayerProps {
  script: string;
  allowTranscript?: boolean;
  label?: string;
}

/**
 * Browser-native English audio player using Web Speech API (with waveform indicator
 * and speed selector) so TOEIC Listening tracks play reliably offline without dead CDN URLs.
 */
export function ToeicAudioPlayer({
  script,
  allowTranscript = false,
  label = "Audio Listening",
}: ToeicAudioPlayerProps) {
  const [playing, setPlaying] = React.useState(false);
  const [rate, setRate] = React.useState(1.0);
  const [showTranscript, setShowTranscript] = React.useState(false);
  const supported = React.useSyncExternalStore(
    () => () => {},
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    () => true
  );

  React.useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [script]);

  const startSpeech = (customRate = rate) => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(script);
    utter.lang = "en-US";
    utter.rate = customRate;

    const voices = window.speechSynthesis.getVoices();
    const enVoice =
      voices.find((v) => v.lang === "en-US" && v.localService) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (enVoice) utter.voice = enVoice;

    utter.onstart = () => setPlaying(true);
    utter.onend = () => setPlaying(false);
    utter.onerror = () => setPlaying(false);

    setPlaying(true);
    window.speechSynthesis.speak(utter);
  };

  const handleTogglePlay = () => {
    if (!supported) return;
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
    } else {
      startSpeech();
    }
  };

  const handleRateChange = (nextRate: number) => {
    setRate(nextRate);
    if (playing) {
      startSpeech(nextRate);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            onClick={handleTogglePlay}
            disabled={!supported}
            aria-label={playing ? "Dừng phát audio" : "Phát audio"}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button
            size="icon"
            variant="outline"
            onClick={() => startSpeech()}
            disabled={!supported}
            aria-label="Phát lại từ đầu"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--heading)]">
              <Volume2 className="h-3.5 w-3.5 text-[var(--primary)]" />
              <span>{label}</span>
            </div>
            <div className="mt-1 flex items-center gap-1" aria-hidden="true">
              {Array.from({ length: 16 }).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-1 rounded-full transition-all ${
                    playing ? "bg-[var(--primary)] animate-pulse" : "bg-[var(--border-strong)]"
                  }`}
                  style={{
                    height: `${8 + ((idx * 7) % 14)}px`,
                    animationDelay: `${idx * 60}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[0.85, 1.0, 1.15].map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => handleRateChange(speed)}
              className={`rounded-lg px-2.5 py-1 font-mono-num text-xs font-semibold transition cursor-pointer ${
                rate === speed
                  ? "bg-[var(--primary)] text-white"
                  : "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)]"
              }`}
            >
              {speed}x
            </button>
          ))}

          {allowTranscript && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowTranscript((v) => !v)}
            >
              <FileText className="h-3.5 w-3.5" />
              {showTranscript ? "Ẩn Transcript" : "Transcript"}
            </Button>
          )}
        </div>
      </div>

      {!supported && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          Trình duyệt chưa hỗ trợ Web Speech API; bạn có thể bật chế độ Luyện tập để đọc transcript.
        </p>
      )}

      {showTranscript && (
        <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs leading-relaxed text-[var(--foreground)]">
          <strong className="text-[var(--primary)]">Audio Transcript:</strong> {script}
        </div>
      )}
    </div>
  );
}

// === exam-runner.tsx ===
export interface ExamQuestionView {
  id: string;
  number: number;
  part: number;
  groupKey: string | null;
  promptText: string;
  passageTitle: string | null;
  passageHtml: string | null;
  audioScript: string | null;
  imageScene: string | null;
  options: string[];
}

export interface ExamTestView {
  id: string;
  slug: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  listeningCount: number;
  readingCount: number;
  difficulty: string;
  setTitle: string;
  setSlug: string;
  questions: ExamQuestionView[];
}

interface QuestionGroup {
  key: string;
  part: number;
  passageTitle: string | null;
  passageHtml: string | null;
  audioScript: string | null;
  questions: ExamQuestionView[];
}

interface SubmitResult {
  saved: boolean;
  listeningCorrect: number;
  listeningTotal: number;
  readingCorrect: number;
  readingTotal: number;
  listeningScore: number;
  readingScore: number;
  totalScore: number;
  durationSeconds: number;
  xpAwarded: number;
  breakdown: Array<{
    number: number;
    part: number;
    selectedIndex: number;
    correctIndex: number;
    isCorrect: boolean;
    explanation: string;
  }>;
}

export function ExamRunner({ test }: { test: ExamTestView }) {
  const { user, refreshUser, openAuthModal, notify } = useApp();
  const draftKey = `lc_exam_draft_${test.id}`;

  const [phase, setPhase] = React.useState<"intro" | "active" | "result">("intro");
  const [mode, setMode] = React.useState<"FULL" | "PRACTICE">("FULL");
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [flagged, setFlagged] = React.useState<number[]>([]);
  const [activeGroupIdx, setActiveGroupIdx] = React.useState(0);
  const [secondsLeft, setSecondsLeft] = React.useState(test.durationMinutes * 60);
  const [fontSize, setFontSize] = React.useState<14 | 16 | 18>(16);
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<SubmitResult | null>(null);

  const subscribeDraft = React.useCallback((cb: () => void) => {
    window.addEventListener("storage", cb);
    window.addEventListener("lc-draft-change", cb);
    return () => {
      window.removeEventListener("storage", cb);
      window.removeEventListener("lc-draft-change", cb);
    };
  }, []);

  const hasDraft = React.useSyncExternalStore(
    subscribeDraft,
    () => {
      try {
        return window.localStorage.getItem(draftKey) !== null;
      } catch {
        return false;
      }
    },
    () => false
  );

  // Build ordered question groups (Parts 3, 4, 6, 7 share passage/audio across groupKey)
  const groups = React.useMemo<QuestionGroup[]>(() => {
    const out: QuestionGroup[] = [];
    const byKey = new Map<string, QuestionGroup>();

    for (const q of test.questions) {
      const k = q.groupKey || `single-${q.number}`;
      let grp = byKey.get(k);
      if (!grp) {
        grp = {
          key: k,
          part: q.part,
          passageTitle: q.passageTitle,
          passageHtml: q.passageHtml,
          audioScript: q.audioScript,
          questions: [],
        };
        byKey.set(k, grp);
        out.push(grp);
      } else {
        if (!grp.passageTitle && q.passageTitle) grp.passageTitle = q.passageTitle;
        if (!grp.passageHtml && q.passageHtml) grp.passageHtml = q.passageHtml;
        if (!grp.audioScript && q.audioScript) grp.audioScript = q.audioScript;
      }
      grp.questions.push(q);
    }
    return out;
  }, [test.questions]);

  // Persist draft automatically while active
  React.useEffect(() => {
    if (phase !== "active") return;
    try {
      window.localStorage.setItem(
        draftKey,
        JSON.stringify({ answers, flagged, secondsLeft, mode })
      );
      window.dispatchEvent(new Event("lc-draft-change"));
    } catch {
      // ignore
    }
  }, [phase, answers, flagged, secondsLeft, mode, draftKey]);

  const handleSubmit = React.useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const durationSeconds = Math.max(0, test.durationMinutes * 60 - secondsLeft);
      const res = await fetch(`/api/exams/${test.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, durationSeconds, mode }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: SubmitResult;
      };
      if (json.success && json.data) {
        setResult(json.data);
        setPhase("result");
        window.localStorage.removeItem(draftKey);
        window.dispatchEvent(new Event("lc-draft-change"));
        if (json.data.saved) {
          await refreshUser();
          notify(`Đã nộp bài & lưu điểm (${json.data.totalScore} điểm)! +${json.data.xpAwarded} XP`, "success");
        } else {
          notify("Đã chấm bài xong! Đăng nhập nếu muốn lưu lịch sử thi.", "info");
        }
      }
    } catch {
      notify("Không thể nộp bài lúc này.", "error");
    } finally {
      setSubmitting(false);
    }
  }, [submitting, test.durationMinutes, test.id, secondsLeft, answers, mode, draftKey, refreshUser, notify]);

  const handleSubmitRef = React.useRef(handleSubmit);
  React.useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  const secondsLeftRef = React.useRef(secondsLeft);
  React.useEffect(() => {
    secondsLeftRef.current = secondsLeft;
  }, [secondsLeft]);

  // Countdown timer
  React.useEffect(() => {
    if (phase !== "active" || mode !== "FULL") return;
    if (secondsLeftRef.current <= 0) {
      const timeoutId = window.setTimeout(() => void handleSubmitRef.current(), 0);
      return () => window.clearTimeout(timeoutId);
    }
    const id = window.setInterval(() => {
      const next = Math.max(0, secondsLeftRef.current - 1);
      secondsLeftRef.current = next;
      setSecondsLeft(next);
      if (next <= 0) {
        window.clearInterval(id);
        void handleSubmitRef.current();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, mode]);

  const startFresh = (selectedMode: "FULL" | "PRACTICE") => {
    setMode(selectedMode);
    setAnswers({});
    setFlagged([]);
    setActiveGroupIdx(0);
    setSecondsLeft(test.durationMinutes * 60);
    setResult(null);
    setPhase("active");
  };

  const resumeDraft = () => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return startFresh("FULL");
      const parsed = JSON.parse(raw) as {
        answers?: Record<string, number>;
        flagged?: number[];
        secondsLeft?: number;
        mode?: "FULL" | "PRACTICE";
      };
      setAnswers(parsed.answers ?? {});
      setFlagged(parsed.flagged ?? []);
      setSecondsLeft(parsed.secondsLeft ?? test.durationMinutes * 60);
      setMode(parsed.mode ?? "FULL");
      setActiveGroupIdx(0);
      setPhase("active");
    } catch {
      startFresh("FULL");
    }
  };

  const toggleFlag = (qNumber: number) => {
    setFlagged((prev) =>
      prev.includes(qNumber) ? prev.filter((n) => n !== qNumber) : [...prev, qNumber]
    );
  };

  const jumpToQuestion = (qNumber: number) => {
    const idx = groups.findIndex((g) => g.questions.some((q) => q.number === qNumber));
    if (idx >= 0) setActiveGroupIdx(idx);
  };

  const answeredCount = Object.keys(answers).length;
  const activeGroup = groups[activeGroupIdx];

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link
          href={`/luyen-de/${test.setSlug}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại {test.setTitle}
        </Link>

        <Card className="mt-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="green">{test.setTitle}</Badge>
            <Badge variant="gold">{test.difficulty}</Badge>
          </div>

          <h1 className="mt-3 font-heading text-2xl font-extrabold text-[var(--heading)] sm:text-3xl">
            {test.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
            {test.description}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-3.5">
              <p className="text-xs text-[var(--muted-foreground)]">Tổng số câu</p>
              <p className="mt-1 font-mono-num text-xl font-bold text-[var(--heading)]">
                {test.totalQuestions} câu
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-3.5">
              <p className="text-xs text-[var(--muted-foreground)]">Thời lượng</p>
              <p className="mt-1 font-mono-num text-xl font-bold text-[var(--primary)]">
                {test.durationMinutes} phút
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-3.5">
              <p className="text-xs text-[var(--muted-foreground)]">Listening</p>
              <p className="mt-1 font-mono-num text-xl font-bold text-[var(--heading)]">
                {test.listeningCount} câu
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-3.5">
              <p className="text-xs text-[var(--muted-foreground)]">Reading</p>
              <p className="mt-1 font-mono-num text-xl font-bold text-[var(--heading)]">
                {test.readingCount} câu
              </p>
            </div>
          </div>

          {hasDraft && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Phát hiện bạn đang có bài làm dở được tự động lưu trên trình duyệt.
              </p>
              <Button size="sm" variant="gold" onClick={resumeDraft}>
                Tiếp tục bài làm dở
              </Button>
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-5">
              <h2 className="font-heading text-base font-bold text-[var(--heading)]">
                Chế độ Thi thử bấm giờ
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
                Mô phỏng phòng thi chuẩn ETS: đồng hồ đếm ngược tự động nộp bài khi hết giờ, ẩn transcript cho tới khi nộp bài.
              </p>
              <Button size="lg" className="mt-4 w-full" onClick={() => startFresh("FULL")}>
                <Play className="h-4 w-4" />
                Bắt đầu Thi thử ({test.durationMinutes}p)
              </Button>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-5">
              <h2 className="font-heading text-base font-bold text-[var(--heading)]">
                Chế độ Luyện tập tự do
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
                Không giới hạn thời gian, được phép mở Audio Transcript ngay khi nghe để đối chiếu từ vựng &amp; phát âm.
              </p>
              <Button
                size="lg"
                variant="outline"
                className="mt-4 w-full"
                onClick={() => startFresh("PRACTICE")}
              >
                <Headphones className="h-4 w-4" />
                Luyện tập thoải mái
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === "result" && result) {
    const partSummary = new Map<number, { correct: number; total: number }>();
    for (const item of result.breakdown) {
      const curr = partSummary.get(item.part) ?? { correct: 0, total: 0 };
      curr.total += 1;
      if (item.isCorrect) curr.correct += 1;
      partSummary.set(item.part, curr);
    }

    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Mascot size={82} mood="cheer" />
              <div>
                <Badge variant="green">Kết quả bài thi</Badge>
                <h1 className="mt-1.5 font-heading text-2xl font-extrabold text-[var(--heading)]">
                  {test.title}
                </h1>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Thời gian làm bài: <span className="font-mono-num font-bold">{formatTimer(result.durationSeconds)}</span>
                  {result.saved ? ` · Đã lưu hồ sơ (+${result.xpAwarded} XP)` : " · Chế độ khách (chưa lưu hồ sơ)"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!user && (
                <Button
                  variant="gold"
                  onClick={() => openAuthModal("Đăng nhập để lưu bảng điểm TOEIC vào Kho cá nhân.")}
                >
                  <Sparkles className="h-4 w-4" />
                  Đăng nhập để lưu điểm
                </Button>
              )}
              <Button variant="outline" onClick={() => startFresh(mode)}>
                <RotateCcw className="h-4 w-4" />
                Làm lại đề
              </Button>
              <Link href="/luyen-de">
                <Button variant="secondary">Chọn đề khác</Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--primary)] bg-[var(--primary-soft)] p-5 text-center">
              <p className="text-xs font-semibold uppercase text-[var(--primary)]">
                Tổng điểm quy đổi (ETS Scale)
              </p>
              <p className="mt-1 font-mono-num text-4xl font-extrabold text-[var(--heading)]">
                {result.totalScore}
              </p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Tổng câu đúng: {result.listeningCorrect + result.readingCorrect}/{test.totalQuestions}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-5 text-center">
              <p className="text-xs font-semibold text-[var(--muted-foreground)]">
                Listening
              </p>
              <p className="mt-1 font-mono-num text-3xl font-bold text-[var(--heading)]">
                {result.listeningTotal > 0 ? result.listeningScore : "—"}
              </p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {result.listeningTotal > 0
                  ? `Đúng ${result.listeningCorrect}/${result.listeningTotal} câu`
                  : "Đề không gồm phần Nghe"}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-5 text-center">
              <p className="text-xs font-semibold text-[var(--muted-foreground)]">
                Reading
              </p>
              <p className="mt-1 font-mono-num text-3xl font-bold text-[var(--heading)]">
                {result.readingTotal > 0 ? result.readingScore : "—"}
              </p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {result.readingTotal > 0
                  ? `Đúng ${result.readingCorrect}/${result.readingTotal} câu`
                  : "Đề không gồm phần Đọc"}
              </p>
            </div>
          </div>

          {/* Part Accuracy Chips */}
          <div className="mt-5 flex flex-wrap gap-2">
            {Array.from(partSummary.entries())
              .sort((a, b) => a[0] - b[0])
              .map(([part, stat]) => (
                <div
                  key={part}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold"
                >
                  <span className="text-[var(--muted-foreground)]">Part {part}: </span>
                  <span className="font-mono-num text-[var(--heading)]">
                    {stat.correct}/{stat.total}
                  </span>
                </div>
              ))}
          </div>
        </Card>

        {/* Detailed Question-by-Question Explanations */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-[var(--heading)]">
            <Trophy className="h-5 w-5 text-[var(--gold)]" />
            Đáp án &amp; Giải thích chi tiết từng câu
          </h2>

          {test.questions.map((q) => {
            const detail = result.breakdown.find((b) => b.number === q.number);
            if (!detail) return null;

            return (
              <Card key={q.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral">Câu {q.number} · Part {q.part}</Badge>
                    {detail.isCorrect ? (
                      <Badge variant="green">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Chính xác
                      </Badge>
                    ) : (
                      <Badge variant="rose">
                        <XCircle className="h-3.5 w-3.5" />
                        {detail.selectedIndex === -1 ? "Bỏ trống" : "Chưa đúng"}
                      </Badge>
                    )}
                  </div>
                </div>

                {q.passageHtml && (
                  <div
                    className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 text-xs leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: q.passageHtml }}
                  />
                )}

                {q.audioScript && (
                  <div className="mt-3">
                    <ToeicAudioPlayer
                      script={q.audioScript}
                      allowTranscript={true}
                      label={`Nghe lại câu ${q.number}`}
                    />
                  </div>
                )}

                <p className="mt-3 text-sm font-bold text-[var(--heading)]">{q.promptText}</p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt, idx) => {
                    const isCorrect = idx === detail.correctIndex;
                    const isPicked = idx === detail.selectedIndex;
                    let cls = "border-[var(--border)] bg-[var(--surface-alt)]";
                    if (isCorrect) {
                      cls = "border-emerald-500 bg-emerald-500/15 font-semibold text-emerald-900 dark:text-emerald-200";
                    } else if (isPicked && !isCorrect) {
                      cls = "border-rose-500 bg-rose-500/15 text-rose-900 dark:text-rose-200";
                    }
                    return (
                      <div key={idx} className={`rounded-xl border px-3.5 py-2.5 text-xs ${cls}`}>
                        <strong className="mr-1.5 font-mono-num">
                          {String.fromCharCode(65 + idx)}.
                        </strong>
                        {opt}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3.5 text-xs leading-relaxed text-[var(--foreground)]">
                  <strong className="text-[var(--primary)]">Giải thích chi tiết:</strong>{" "}
                  {detail.explanation}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ACTIVE EXAM VIEW
  return (
    <div className="min-h-screen bg-study-grid pb-16">
      {/* Sticky Exam HUD */}
      <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/luyen-de/${test.setSlug}`}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-2.5 py-1 text-xs font-semibold text-[var(--heading)] transition hover:bg-[var(--muted)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Bộ đề</span>
            </Link>
            <Badge variant="green">
              Part {activeGroup.part}
            </Badge>
            <p className="hidden sm:block font-heading text-sm font-bold text-[var(--heading)]">
              {test.title}
            </p>
            <span className="font-mono-num text-xs font-semibold text-[var(--muted-foreground)]">
              Đã chọn {answeredCount}/{test.totalQuestions}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Font size switcher */}
            <div className="hidden md:flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-0.5">
              {([14, 16, 18] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setFontSize(sz)}
                  className={`rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer ${
                    fontSize === sz
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--muted-foreground)]"
                  }`}
                >
                  {sz}px
                </button>
              ))}
            </div>

            {mode === "FULL" ? (
              <div
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono-num text-sm font-bold ${
                  secondsLeft < 120
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-600"
                    : "border-[var(--border)] bg-[var(--surface-alt)] text-[var(--heading)]"
                }`}
              >
                <Clock className="h-4 w-4 text-[var(--primary)]" />
                {formatTimer(secondsLeft)}
              </div>
            ) : (
              <Badge variant="gold">Chế độ Luyện tập</Badge>
            )}

            <Button
              size="sm"
              disabled={submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? "Đang chấm..." : "Nộp bài"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="mx-auto mt-6 grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_290px]">
        {/* Left: Active Question Group */}
        <div className="space-y-5">
          {/* Audio if listening */}
          {activeGroup.audioScript && (
            <ToeicAudioPlayer
              script={activeGroup.audioScript}
              allowTranscript={mode === "PRACTICE"}
              label={`Audio Part ${activeGroup.part} (Câu ${activeGroup.questions[0].number}${
                activeGroup.questions.length > 1
                  ? `–${activeGroup.questions[activeGroup.questions.length - 1].number}`
                  : ""
              })`}
            />
          )}

          <div
            className={`grid gap-5 ${
              activeGroup.passageHtml ? "lg:grid-cols-2 lg:items-start" : ""
            }`}
            style={{ fontSize: `${fontSize}px` }}
          >
            {/* Passage Panel for Part 6 & Part 7 */}
            {activeGroup.passageHtml && (
              <Card className="p-5 lg:sticky lg:top-20 lg:max-h-[76vh] lg:overflow-y-auto">
                {activeGroup.passageTitle && (
                  <h2 className="mb-3 border-b border-[var(--border)] pb-2 font-heading text-sm font-bold uppercase tracking-wide text-[var(--primary)]">
                    {activeGroup.passageTitle}
                  </h2>
                )}
                <div
                  className="space-y-3 leading-relaxed text-[var(--foreground)]"
                  dangerouslySetInnerHTML={{ __html: activeGroup.passageHtml }}
                />
              </Card>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {activeGroup.questions.map((q) => {
                const chosen = answers[String(q.number)];
                const isFlagged = flagged.includes(q.number);

                return (
                  <Card key={q.id} className="p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-num text-xs font-bold text-[var(--primary)]">
                        CÂU {q.number} · PART {q.part}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleFlag(q.number)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition cursor-pointer ${
                          isFlagged
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                            : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                        }`}
                      >
                        <Flag className="h-3.5 w-3.5" />
                        {isFlagged ? "Đã gắn cờ" : "Đánh dấu"}
                      </button>
                    </div>

                    {q.imageScene && (
                      <div className="mt-3 max-w-md">
                        <Part1Scene scene={q.imageScene} />
                      </div>
                    )}

                    <p className="mt-3 font-semibold leading-relaxed text-[var(--heading)]">
                      {q.promptText}
                    </p>

                    <div className="mt-4 space-y-2">
                      {q.options.map((opt, idx) => {
                        const selected = chosen === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setAnswers((prev) => ({ ...prev, [String(q.number)]: idx }))
                            }
                            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition cursor-pointer ${
                              selected
                                ? "border-[var(--primary)] bg-[var(--primary-soft)] font-semibold text-[var(--heading)]"
                                : "border-[var(--border)] bg-[var(--surface-alt)] hover:border-[var(--primary)]"
                            }`}
                          >
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono-num text-xs font-bold ${
                                selected
                                  ? "bg-[var(--primary)] text-white"
                                  : "bg-[var(--surface)] text-[var(--muted-foreground)] border border-[var(--border)]"
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Group Pagination */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              disabled={activeGroupIdx === 0}
              onClick={() => setActiveGroupIdx((i) => Math.max(0, i - 1))}
            >
              <ArrowLeft className="h-4 w-4" />
              Cụm câu trước
            </Button>

            {activeGroupIdx < groups.length - 1 ? (
              <Button
                onClick={() => setActiveGroupIdx((i) => Math.min(groups.length - 1, i + 1))}
              >
                Cụm câu tiếp theo
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button disabled={submitting} onClick={() => void handleSubmit()}>
                Nộp bài &amp; Xem điểm
              </Button>
            )}
          </div>
        </div>

        {/* Right: Question Palette Navigator */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="p-4">
            <h3 className="font-heading text-sm font-bold text-[var(--heading)]">
              Bảng câu hỏi ({answeredCount}/{test.totalQuestions})
            </h3>
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {test.questions.map((q) => {
                const isAnswered = typeof answers[String(q.number)] === "number";
                const isFlagged = flagged.includes(q.number);
                const isCurrent = activeGroup.questions.some((item) => item.number === q.number);

                let cls =
                  "border-[var(--border)] bg-[var(--surface-alt)] text-[var(--muted-foreground)]";
                if (isAnswered) {
                  cls = "border-[var(--primary)] bg-[var(--primary)] text-white";
                }
                if (isFlagged && !isAnswered) {
                  cls = "border-amber-500 bg-amber-500/20 text-amber-800 dark:text-amber-300";
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => jumpToQuestion(q.number)}
                    className={`relative h-9 rounded-lg border font-mono-num text-xs font-bold transition cursor-pointer ${cls} ${
                      isCurrent ? "ring-2 ring-[var(--gold)] ring-offset-1" : ""
                    }`}
                  >
                    {q.number}
                    {isFlagged && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-1.5 border-t border-[var(--border)] pt-3 text-[11px] text-[var(--muted-foreground)]">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-[var(--primary)]" />
                <span>Đã chọn đáp án</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-amber-500" />
                <span>Đã gắn cờ xem lại</span>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

// === luyen-de-dashboard.tsx ===
interface LuyenDeDashboardProps {
  sets: ExamSetDashboardItem[];
  activeSetSlug: string | null;
}

export function LuyenDeDashboard({ sets, activeSetSlug }: LuyenDeDashboardProps) {
  const { openFeatureMap, notify, theme, toggleTheme } = useApp();
  const [fontScale, setFontScale] = React.useState<"sm" | "md">("md");

  const activeSet = React.useMemo(
    () => (activeSetSlug ? sets.find((s) => s.slug === activeSetSlug) ?? sets[0] : sets[0]),
    [sets, activeSetSlug]
  );

  const totalTestsCount = sets.reduce((sum, s) => sum + s.tests.length, 0);
  const completedCount = sets.reduce(
    (sum, s) => sum + s.tests.filter((t) => typeof t.bestScore === "number").length,
    0
  );
  const completedPct =
    totalTestsCount > 0 ? Math.round((completedCount / totalTestsCount) * 100) : 0;

  const firstTest = activeSet?.tests[0] ?? sets[0]?.tests[0];

  const renderTestGrid = (tests: ExamTestCardItem[]) => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tests.map((test, idx) => {
        const isFirst = idx === 0;
        const pct = typeof test.bestScore === "number" ? Math.min(100, Math.round((test.bestScore / 990) * 100)) : 0;
        const testNumber = String(idx + 1).padStart(2, "0");

        if (isFirst) {
          return (
            <Link
              key={test.id}
              href={`/luyen-de/thi/${test.slug}`}
              className="sc-diagonal-card-dark-bg group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#0c4b4e] p-5 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200/80">
                      TEST
                    </span>
                    <p className="font-display text-3xl font-black leading-none text-white">
                      {testNumber}
                    </p>
                  </div>
                  <span className="rounded-lg bg-[#f4c6cf] px-3 py-1 text-xs font-extrabold text-[#5e1f2d]">
                    Bắt đầu
                  </span>
                </div>

                <p className="mt-2 line-clamp-1 text-xs font-semibold text-teal-100/90">
                  {test.title}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-teal-50">
                    Nghe {test.listeningCount}
                  </span>
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-teal-50">
                    Đọc {test.readingCount}
                  </span>
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-teal-50">
                    {test.durationMinutes} phút
                  </span>
                </div>

                <p className="mt-3 text-[11px] text-teal-200/75">Part 1 &rarr; Part 7 · {test.difficulty}</p>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-[#f4c6cf]"
                      style={{ width: `${Math.max(6, pct)}%` }}
                    />
                  </div>
                  <span className="font-mono-num text-[11px] font-bold text-teal-100">
                    {typeof test.bestScore === "number" ? `${test.bestScore}đ` : "0%"}
                  </span>
                </div>

                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f4c6cf] text-[#5e1f2d] transition group-hover:scale-105">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </span>
              </div>
            </Link>
          );
        }

        return (
          <Link
            key={test.id}
            href={`/luyen-de/thi/${test.slug}`}
            className="sc-diagonal-card-bg group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e0e5df] border-t-4 border-t-[#0c4b4e] bg-white p-5 text-[#172829] shadow-xs transition hover:-translate-y-0.5 hover:border-[#0c4b4e] dark:border-[#2a332d] dark:border-t-[#35858a] dark:bg-[#191f1d] dark:text-[#edf2e3]"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    TEST
                  </span>
                  <p className="font-display text-3xl font-black leading-none text-[#0c4b4e] dark:text-[#7bd1d6]">
                    {testNumber}
                  </p>
                </div>
                <span className="rounded-lg border border-slate-200 px-2.5 py-1 font-mono-num text-[11px] font-bold text-slate-500 dark:border-white/15 dark:text-slate-300">
                  {test.totalQuestions} câu
                </span>
              </div>

              <p className="mt-2 line-clamp-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                {test.title}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  Nghe {test.listeningCount}
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  Đọc {test.readingCount}
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  {test.durationMinutes} phút
                </span>
              </div>

              <p className="mt-3 text-[11px] text-slate-400">Part 1 &rarr; Part 7 · {test.difficulty}</p>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#0c4b4e]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="font-mono-num text-[11px] font-bold text-slate-500 dark:text-slate-300">
                  {typeof test.bestScore === "number" ? `${test.bestScore}đ` : "0%"}
                </span>
              </div>

              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-[#0c4b4e] transition group-hover:bg-[#0c4b4e] group-hover:text-white dark:border-white/15 dark:text-[#7bd1d6]">
                <Play className="h-3.5 w-3.5 fill-current" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f7f6] dark:bg-[#121614]">
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        {/* ===================================================================== */}
        {/* MAIN LEFT STAGE                                                       */}
        {/* ===================================================================== */}
        <main
          className={cn(
            "min-w-0 flex-1 px-4 py-7 sm:px-8 sm:py-9",
            fontScale === "sm" && "text-[13px]"
          )}
        >
          {activeSetSlug && activeSet ? (
            /* COLLECTION DETAIL MODE (/luyen-de/[setSlug] matching step_69) */
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Link
                    href="/luyen-de"
                    aria-label="Quay về tổng quan Luyện đề"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dce2de] bg-white text-[#1e3536] shadow-xs hover:border-[#0c4b4e] dark:border-white/15 dark:bg-[#1b221e] dark:text-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                  <div>
                    <div className="flex items-baseline gap-2.5">
                      <h1 className="font-display text-2xl font-extrabold text-[#122627] dark:text-white">
                        {activeSet.title}
                      </h1>
                      <span className="text-xs font-semibold text-slate-500">
                        {activeSet.tests.length} đề
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">{activeSet.description}</p>
                  </div>
                </div>

                {/* Top Floating Utility Pill matching StudyChill screenshot */}
                <div className="inline-flex items-center divide-x divide-[#e4e8e6] rounded-2xl border border-[#dce2de] bg-white px-2 py-1.5 text-xs font-semibold text-[#233738] shadow-xs dark:divide-white/10 dark:border-white/15 dark:bg-[#19201d] dark:text-white">
                  <Link
                    href="/my-library"
                    className="inline-flex items-center gap-1.5 px-3 py-1 hover:text-[#0c4b4e]"
                  >
                    <BarChart3 className="h-3.5 w-3.5" /> Phân tích
                  </Link>
                  <button
                    type="button"
                    onClick={openFeatureMap}
                    className="inline-flex items-center gap-1.5 px-3 py-1 hover:text-[#0c4b4e] cursor-pointer"
                  >
                    <MapIcon className="h-3.5 w-3.5" /> Bản đồ
                  </button>
                  <button
                    type="button"
                    onClick={() => notify("Các đề thi đã mở khóa chế độ bấm giờ chuẩn ETS.", "info")}
                    className="inline-flex items-center gap-1.5 px-3 py-1 hover:text-[#0c4b4e] cursor-pointer"
                  >
                    <Bell className="h-3.5 w-3.5" /> Thông báo
                  </button>
                </div>
              </div>

              {renderTestGrid(activeSet.tests)}
            </div>
          ) : (
            /* OVERVIEW HERO + ETS STRUCTURE DASHBOARD (/luyen-de matching step_65) */
            <div className="space-y-6">
              {/* Overview Split Hero Row */}
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      <Home className="h-3.5 w-3.5" />
                      <Link href="/" className="hover:text-[#0c4b4e]">
                        TRANG CHỦ
                      </Link>
                      <span>&rsaquo;</span>
                      <span className="text-[#0c4b4e] dark:text-[#7bd1d6]">LUYỆN ĐỀ</span>
                    </div>

                    <div className="flex items-center gap-1.5 lg:hidden">
                      <Link
                        href="/listening"
                        className="rounded-lg border border-[#dce2dc] bg-white px-2.5 py-1 text-[11px] font-bold text-[#0c4b4e]"
                      >
                        Luyện Nghe
                      </Link>
                      <Link
                        href="/reading"
                        className="rounded-lg border border-[#dce2dc] bg-white px-2.5 py-1 text-[11px] font-bold text-[#642937]"
                      >
                        Luyện Đọc
                      </Link>
                    </div>
                  </div>

                  <h1 className="mt-2 font-display text-4xl font-black tracking-tight sm:text-5xl">
                    <span className="text-[#0c3b3e] dark:text-[#7bd1d6]">LUYỆN </span>
                    <span className="text-[#6f3542] dark:text-[#ea8a9e]">ĐỀ</span>
                  </h1>
                  <p className="mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-300 sm:text-base">
                    Làm trọn đề 200 câu như ngồi phòng thi thật — chấm thang 990 ngay lập tức.
                  </p>
                </div>

                {/* Tilted 3D Polaroid Mascot + A/B/C/D Stamp matching StudyChill */}
                <Tilt3D maxTilt={10} scale={1.02} glare={false} className="relative mx-auto shrink-0 pt-2 md:mx-0">
                  <span className="depth-3d-lg absolute -right-3 -top-1 z-20 flex h-12 w-12 rotate-12 items-center justify-center rounded-full border border-dashed border-[#6f3542] bg-[#fffdf8] text-center font-mono-num text-[9px] font-black leading-tight text-[#6f3542] shadow-xs">
                    200
                    <br />
                    CÂU
                  </span>

                  <div className="rotate-[2deg] rounded-2xl border border-[#e3ded3] bg-white p-3 pb-4 text-center shadow-lg dark:border-white/15 dark:bg-[#1d2421] preserve-3d">
                    <div className="depth-3d-md flex h-32 w-44 items-center justify-center rounded-xl bg-[#f5eef4] dark:bg-[#251f24]">
                      <MascotExamArt className="h-28 w-auto" />
                    </div>
                    <p className="depth-3d-sm mt-2 text-xs font-extrabold text-[#162728] dark:text-white">
                      Full Test 200 câu
                    </p>
                  </div>

                  {/* Floating A B C D choice bubbles */}
                  <div className="depth-3d-md -mt-3 flex justify-center gap-1.5 relative z-20">
                    {(["A", "B", "C", "D"] as const).map((letter) => (
                      <span
                        key={letter}
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full border font-mono-num text-xs font-extrabold shadow-sm",
                          letter === "C"
                            ? "-translate-y-1 border-[#243218] bg-[#6f3542] text-white"
                            : "border-[#243218] bg-white text-[#243218]"
                        )}
                      >
                        {letter}
                      </span>
                    ))}
                  </div>
                </Tilt3D>
              </div>

              {/* Wide Crisp Progress Bar Card */}
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#243218] bg-white px-5 py-4 shadow-[0_3px_0_#d8ddd8] dark:border-white/15 dark:bg-[#19201d] md:flex-row md:items-center">
                <div className="flex items-center gap-5">
                  <div>
                    <p className="font-mono-num text-xl font-black text-[#122627] dark:text-white">
                      {totalTestsCount}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500">Đề luyện</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />
                  <div>
                    <p className="font-mono-num text-xl font-black text-[#122627] dark:text-white">
                      {completedCount}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500">Đã nộp</p>
                  </div>
                </div>

                <div className="flex flex-1 items-center gap-3 md:px-4">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#0c4b4e]"
                      style={{ width: `${Math.max(4, completedPct)}%` }}
                    />
                  </div>
                  <span className="font-mono-num text-xs font-bold text-slate-500">
                    {completedPct}%
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {firstTest && (
                    <Link
                      href={`/luyen-de/thi/${firstTest.slug}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0c4b4e] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#08383a]"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Bắt đầu Test 01</span>
                    </Link>
                  )}
                  {activeSet && (
                    <Link
                      href={`/luyen-de/${activeSet.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#243218] bg-white px-4 py-2.5 text-xs font-bold text-[#243218] hover:bg-slate-50 dark:border-white/20 dark:bg-white/5 dark:text-white"
                    >
                      <span>Xem {activeSet.title}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Dual ETS Structure Banners: Teal LISTENING + Burgundy READING */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Listening Banner */}
                <div className="rounded-2xl bg-[#0c4b4e] p-5 text-white shadow-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-teal-200">
                        LISTENING · NGHE
                      </p>
                    </div>
                    <p className="font-display text-2xl font-black">
                      100 <span className="text-xs font-normal text-teal-200">câu</span>{" "}
                      45 <span className="text-xs font-normal text-teal-200">phút</span>
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-12 gap-1.5 rounded-xl bg-white/10 p-2 text-center text-xs">
                    <div className="col-span-2 rounded-lg bg-white/10 py-2">
                      <p className="text-[10px] text-teal-200">P1</p>
                      <p className="font-mono-num font-bold">6</p>
                    </div>
                    <div className="col-span-3 rounded-lg bg-white/10 py-2">
                      <p className="text-[10px] text-teal-200">P2</p>
                      <p className="font-mono-num font-bold">25</p>
                    </div>
                    <div className="col-span-4 rounded-lg bg-white/15 py-2">
                      <p className="text-[10px] text-teal-200">P3</p>
                      <p className="font-mono-num font-bold">39</p>
                    </div>
                    <div className="col-span-3 rounded-lg bg-white/10 py-2">
                      <p className="text-[10px] text-teal-200">P4</p>
                      <p className="font-mono-num font-bold">30</p>
                    </div>
                  </div>
                </div>

                {/* Reading Banner */}
                <div className="rounded-2xl bg-[#642937] p-5 text-white shadow-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-200">
                        READING · ĐỌC
                      </p>
                    </div>
                    <p className="font-display text-2xl font-black">
                      100 <span className="text-xs font-normal text-rose-200">câu</span>{" "}
                      75 <span className="text-xs font-normal text-rose-200">phút</span>
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-12 gap-1.5 rounded-xl bg-white/10 p-2 text-center text-xs">
                    <div className="col-span-4 rounded-lg bg-white/10 py-2">
                      <p className="text-[10px] text-rose-200">P5</p>
                      <p className="font-mono-num font-bold">30</p>
                    </div>
                    <div className="col-span-2 rounded-lg bg-white/10 py-2">
                      <p className="text-[10px] text-rose-200">P6</p>
                      <p className="font-mono-num font-bold">16</p>
                    </div>
                    <div className="col-span-6 rounded-lg bg-white/15 py-2">
                      <p className="text-[10px] text-rose-200">P7</p>
                      <p className="font-mono-num font-bold">54</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Set Preview Tests below */}
              {activeSet && (
                <div className="pt-2">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-heading text-lg font-extrabold text-[#122627] dark:text-white">
                      Đề tiêu biểu · {activeSet.title}
                    </h2>
                    <Link
                      href={`/luyen-de/${activeSet.slug}`}
                      className="text-xs font-bold text-[#0c4b4e] hover:underline dark:text-[#7bd1d6]"
                    >
                      Mở toàn bộ bộ đề →
                    </Link>
                  </div>
                  {renderTestGrid(activeSet.tests)}
                </div>
              )}
            </div>
          )}
        </main>

        {/* ===================================================================== */}
        {/* RIGHT COLLECTION & MODE SIDEBAR (StudyChill exact 356px Exam Sidebar)   */}
        {/* ===================================================================== */}
        <aside className="w-full shrink-0 border-t border-[#e1e6e2] bg-white dark:border-white/10 dark:bg-[#171c1a] lg:w-[356px] lg:border-t-0 lg:border-l">
          <div className="sticky top-0 flex flex-col justify-between p-5 lg:min-h-screen">
            <div>
              {/* Mode Switch Tabs — Single-Line matching StudyChill */}
              <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#f1f4f2] p-1 dark:bg-white/5">
                <Link
                  href="/luyen-de"
                  className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-[#0c4b4e] py-2 px-1 text-[11px] font-bold text-white shadow-xs"
                >
                  <Sparkles className="h-3 w-3 shrink-0" /> Luyện Đề
                </Link>
                <Link
                  href="/listening"
                  className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-lg py-2 px-1 text-[11px] font-semibold text-slate-600 hover:bg-white hover:text-[#0c4b4e] dark:text-slate-300"
                >
                  <Headphones className="h-3 w-3 shrink-0" /> Luyện Nghe
                </Link>
                <Link
                  href="/reading"
                  className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-lg py-2 px-1 text-[11px] font-semibold text-slate-600 hover:bg-white hover:text-[#642937] dark:text-slate-300"
                >
                  <BookOpen className="h-3 w-3 shrink-0" /> Luyện Đọc
                </Link>
              </div>

              <p className="mt-6 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                BỘ ĐỀ LUYỆN THI
              </p>

              <div className="mt-3 space-y-1.5">
                {sets.map((s, idx) => {
                  const isSelected = activeSetSlug === s.slug;
                  const isHot = Boolean(s.badge?.toLowerCase().includes("hot")) || idx === sets.length - 1;
                  return (
                    <Link
                      key={s.id}
                      href={`/luyen-de/${s.slug}`}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-sm transition",
                        isSelected
                          ? "bg-[#0c4b4e] font-bold text-white shadow-sm"
                          : "font-semibold text-[#1c2e2f] hover:bg-[#f2f5f3] dark:text-[#e4eae5] dark:hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={cn(
                            "font-mono-num text-xs font-extrabold",
                            isSelected ? "text-[#f4c6cf]" : "text-[#6f3542]"
                          )}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="truncate">{s.title.replace(/^\d{2}\s+/, "")}</span>
                        {isHot && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-[#642937] px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white">
                            HOT <Flame className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-xs",
                          isSelected ? "text-teal-100" : "text-slate-400"
                        )}
                      >
                        {s.tests.length} đề
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bottom Controls Footer (clear now that FloatingMascot is docked on bottom-left) */}
            <div className="mt-8 flex items-center justify-between border-t border-[#e7ebe8] pt-4 text-xs font-bold text-slate-500 dark:border-white/10">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFontScale("sm")}
                  className={cn(
                    "cursor-pointer hover:text-[#0c4b4e]",
                    fontScale === "sm" && "text-[#0c4b4e] underline"
                  )}
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontScale("md")}
                  className={cn(
                    "cursor-pointer hover:text-[#0c4b4e]",
                    fontScale === "md" && "text-[#0c4b4e] underline"
                  )}
                >
                  A+
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Chuyển giao diện sáng tối"
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-[#0c4b4e] dark:text-slate-300 dark:hover:bg-white/10 cursor-pointer"
                >
                  {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </button>
              </div>
              <Link href="/my-library" className="text-[11px] font-bold text-[#0c4b4e] hover:underline">
                Lịch sử làm đề →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
