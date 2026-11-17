"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  Languages,
  Lightbulb,
  Menu,
  MessageSquare,
  Sparkles,
  Volume2,
  X,
  XCircle,
} from "lucide-react";
import { Mascot } from "@/components/brand/mascot";
import { useApp } from "@/components/providers/app-provider";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface KnowledgeSection {
  heading: string;
  summary: string;
  formula?: string;
  examples: { en: string; vi: string; highlight?: string }[];
  trapTip?: string;
}

export interface GrammarVocabItem {
  word: string;
  ipa: string;
  pos: string;
  meaning: string;
  example: string;
}

export interface GrammarQuizItem {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GrammarSummary {
  takeaways: string[];
  commonTraps: string[];
}

export interface RoadmapLessonNode {
  id: string;
  slug: string;
  title: string;
  order: number;
  completed: boolean;
  bestScore: number;
  quizCount: number;
  sectionHeadings: string[];
}

export interface RoadmapTopicItem {
  id: string;
  order: number;
  title: string;
  targetLevel: string;
  estimatedMinutes: number;
  lessons: RoadmapLessonNode[];
}

interface GrammarLessonViewerProps {
  roadmap: RoadmapTopicItem[];
  stats: {
    totalLessons: number;
    completedLessons: number;
    totalQuizCount: number;
    activeIndex: number;
    activeTopicOrder: number;
  };
  lesson: {
    id: string;
    slug: string;
    title: string;
    topicId: string;
    topicTitle: string;
    targetLevel: string;
  };
  knowledge: KnowledgeSection[];
  vocab: GrammarVocabItem[];
  tests: GrammarQuizItem[];
  summary: GrammarSummary;
  initialCompleted: boolean;
  initialBestScore: number;
  nextLesson: { slug: string; title: string } | null;
}

type TabId = "knowledge" | "vocab" | "tests" | "summary";

export function GrammarLessonViewer({
  roadmap,
  stats,
  lesson,
  knowledge,
  vocab,
  tests,
  summary,
  initialCompleted,
  initialBestScore,
  nextLesson,
}: GrammarLessonViewerProps) {
  const { user, refreshUser, openAuthModal, notify } = useApp();
  const [tab, setTab] = React.useState<TabId>("knowledge");
  const [expandedTopicIds, setExpandedTopicIds] = React.useState<Record<string, boolean>>({
    [lesson.topicId]: true,
  });
  const [sidebarOpenMobile, setSidebarOpenMobile] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [dismissAuthBanner, setDismissAuthBanner] = React.useState(false);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [completed, setCompleted] = React.useState(initialCompleted);
  const [bestScore, setBestScore] = React.useState(initialBestScore);
  const [quizResult, setQuizResult] = React.useState<{
    correctCount: number;
    totalQuestions: number;
    saved: boolean;
    xpAwarded: number;
    results: Array<{
      questionId: string;
      selectedIndex: number;
      correctIndex: number;
      isCorrect: boolean;
      explanation: string;
    }>;
  } | null>(null);

  const completedLessonsCount =
    completed && !initialCompleted ? stats.completedLessons + 1 : stats.completedLessons;
  const progressPct =
    stats.totalLessons > 0
      ? Math.round((completedLessonsCount / stats.totalLessons) * 100)
      : 0;

  const speakWord = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.92;
    window.speechSynthesis.speak(utter);
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/grammar/lessons/${lesson.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, markCompleted: true }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: {
          saved: boolean;
          correctCount: number;
          totalQuestions: number;
          bestScore?: number;
          xpAwarded: number;
          results: Array<{
            questionId: string;
            selectedIndex: number;
            correctIndex: number;
            isCorrect: boolean;
            explanation: string;
          }>;
        };
      };
      if (json.success && json.data) {
        setQuizResult(json.data);
        if (json.data.saved) {
          setCompleted(true);
          if (typeof json.data.bestScore === "number") {
            setBestScore(json.data.bestScore);
          }
          await refreshUser();
          notify(`Hoàn thành bài tập! +${json.data.xpAwarded} EXP`, "success");
        } else {
          notify(
            `Bạn đúng ${json.data.correctCount}/${json.data.totalQuestions} câu! Đăng nhập để lưu tiến độ & nhận EXP.`,
            "info"
          );
        }
      }
    } catch {
      notify("Không thể chấm bài lúc này.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTopic = (id: string) => {
    setExpandedTopicIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const tabs: Array<{ id: TabId; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
    { id: "knowledge", label: "Kiến thức", Icon: BookOpen },
    { id: "vocab", label: `Từ vựng (${vocab.length})`, Icon: Languages },
    { id: "tests", label: `Bài tập (${tests.length})`, Icon: HelpCircle },
    { id: "summary", label: "Lĩnh hội", Icon: Lightbulb },
  ];

  const renderSidebarContent = () => (
    <div className="flex flex-col">
      {/* Top 3 Progress Counters matching StudyChill Sidebar */}
      <div className="grid grid-cols-3 gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-center">
        <div>
          <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-[var(--muted-foreground)]">
            <span className="h-2 w-2 rounded-full bg-[#8cb84a]" />
            Đã học
          </p>
          <p className="mt-1 font-mono-num text-lg font-extrabold text-[var(--heading)]">
            {completedLessonsCount}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)]">chuyên đề</p>
        </div>

        <div className="border-x border-[var(--border)] px-1">
          <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-[var(--muted-foreground)]">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            Thực hành
          </p>
          <p className="mt-1 font-mono-num text-lg font-extrabold text-[var(--heading)]">
            {stats.totalQuizCount}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)]">câu trắc nghiệm</p>
        </div>

        <div>
          <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-[var(--muted-foreground)]">
            <span className="h-2 w-2 rounded-full bg-[#4f6d2c]" />
            Tiến độ
          </p>
          <p className="mt-1 font-mono-num text-lg font-extrabold text-[var(--heading)]">
            {progressPct}%
          </p>
          <div className="mx-auto mt-1 h-1.5 w-14 overflow-hidden rounded-full bg-[var(--muted)]">
            <div
              className="h-full rounded-full bg-[#8cb84a]"
              style={{ width: `${Math.max(4, progressPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Accordion Topic Roadmap */}
      <div className="divide-y divide-[var(--border)] px-3 py-3 space-y-2">
        {roadmap.map((topic) => {
          const isTopicExpanded = Boolean(expandedTopicIds[topic.id]);
          return (
            <div key={topic.id} className="pt-2 first:pt-0">
              <button
                type="button"
                onClick={() => toggleTopic(topic.id)}
                className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left transition hover:bg-[var(--surface-alt)] cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono-num text-xs font-extrabold",
                      topic.id === lesson.topicId
                        ? "bg-[#224624] text-white"
                        : "border border-[var(--border-strong)] bg-[var(--surface-alt)] text-[var(--heading)]"
                    )}
                  >
                    {topic.order}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold text-[var(--heading)]">
                      Chặng {String(topic.order).padStart(2, "0")} · {topic.title}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      Mục tiêu {topic.targetLevel} · {topic.lessons.length} chuyên đề
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform",
                    isTopicExpanded && "rotate-180"
                  )}
                />
              </button>

              {isTopicExpanded && (
                <div className="mt-1.5 ml-4 border-l border-[var(--border)] pl-3 space-y-1.5 pb-2">
                  {topic.lessons.map((item) => {
                    const isCurrent = item.id === lesson.id;
                    return (
                      <div key={item.id}>
                        <Link
                          href={`/ngu-phap/${item.slug}`}
                          onClick={() => setSidebarOpenMobile(false)}
                          className={cn(
                            "flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs transition",
                            isCurrent
                              ? "bg-[#ecf4d7] font-bold text-[#223914] dark:bg-[#27361c] dark:text-[#d5e8ae]"
                              : "text-[var(--foreground)] hover:bg-[var(--surface-alt)]"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {item.completed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#59752f]" />
                            ) : (
                              <span
                                className={cn(
                                  "h-2 w-2 shrink-0 rounded-full",
                                  isCurrent ? "bg-[#59752f]" : "bg-[var(--border-strong)]"
                                )}
                              />
                            )}
                            <span className="truncate">{item.title}</span>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                        </Link>

                        {/* Sub-outline inside active lesson just like StudyChill */}
                        {isCurrent && (
                          <div className="mt-1 ml-4 space-y-1 border-l border-dashed border-[var(--border-strong)] pl-3 text-[11px] text-[var(--muted-foreground)]">
                            <button
                              type="button"
                              onClick={() => setTab("knowledge")}
                              className={cn(
                                "flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left cursor-pointer",
                                tab === "knowledge"
                                  ? "font-bold text-[var(--heading)]"
                                  : "hover:text-[var(--heading)]"
                              )}
                            >
                              <BookOpen className="h-3 w-3" /> Kiến thức ({knowledge.length})
                            </button>
                            {sectionHeadingsList(item.sectionHeadings, () => setTab("knowledge"))}
                            <button
                              type="button"
                              onClick={() => setTab("vocab")}
                              className={cn(
                                "flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left cursor-pointer",
                                tab === "vocab"
                                  ? "font-bold text-[var(--heading)]"
                                  : "hover:text-[var(--heading)]"
                              )}
                            >
                              <Languages className="h-3 w-3" /> Từ vựng ({vocab.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setTab("tests")}
                              className={cn(
                                "flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left cursor-pointer",
                                tab === "tests"
                                  ? "font-bold text-[var(--heading)]"
                                  : "hover:text-[var(--heading)]"
                              )}
                            >
                              <HelpCircle className="h-3 w-3" /> Bài tập ({tests.length})
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Mobile Sidebar Bar */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpenMobile(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-1.5 text-xs font-bold text-[var(--heading)] cursor-pointer"
        >
          <Menu className="h-4 w-4" />
          <span>Lộ trình {stats.activeIndex}/{stats.totalLessons}</span>
        </button>
        <Badge variant="gold">Mục tiêu {lesson.targetLevel}</Badge>
      </div>

      {/* Mobile Drawer Roadmap */}
      {sidebarOpenMobile && (
        <div
          className="fixed inset-0 z-50 flex bg-black/45 lg:hidden"
          onClick={() => setSidebarOpenMobile(false)}
        >
          <div
            className="h-full w-80 max-w-[85vw] overflow-y-auto bg-[var(--surface)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <span className="font-heading text-sm font-extrabold">Lộ trình Ngữ pháp</span>
              <button
                type="button"
                onClick={() => setSidebarOpenMobile(false)}
                className="rounded-lg p-1 cursor-pointer"
                aria-label="Đóng lộ trình"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* Desktop 2-Column Split Workspace */}
      <div className="mx-auto flex max-w-7xl">
        {/* Left Accordion Roadmap Sidebar with StudyChill Collapse Chevron */}
        <aside
          className={cn(
            "relative hidden shrink-0 border-r border-[var(--border)] bg-[var(--surface)] transition-all duration-200 lg:block",
            sidebarCollapsed ? "w-0 border-r-0 overflow-visible" : "w-[330px]"
          )}
        >
          {!sidebarCollapsed && (
            <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {renderSidebarContent()}
            </div>
          )}

          <button
            type="button"
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label={sidebarCollapsed ? "Mở thanh lộ trình" : "Thu gọn thanh lộ trình"}
            className="hidden lg:flex fixed top-24 z-30 h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--heading)] shadow-sm transition hover:border-[#224624] cursor-pointer"
            style={{ left: sidebarCollapsed ? "18px" : "calc(max((100vw - 80rem) / 2, 0px) + 330px)" }}
          >
            <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform", sidebarCollapsed && "rotate-180")} />
          </button>
        </aside>

        {/* Right Main Lesson Content Stage */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-4xl">
            {/* StudyChill Forest-Green Grammar Banner matching step_32 */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#18341b] via-[#224725] to-[#17301a] px-6 py-5 text-white shadow-sm">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-6 top-3 h-14 w-36 opacity-20"
                style={{
                  backgroundImage: "radial-gradient(#ffffff 1.2px, transparent 1.2px)",
                  backgroundSize: "10px 10px",
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-[#e6c56f]/25"
              />
              <div className="relative z-10 flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#e7f1d9] ring-2 ring-[#b6e46d]/55 p-1">
                    <Mascot variant="grammar" size={86} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#a7d461]">
                      CHẶNG {String(stats.activeTopicOrder).padStart(2, "0")} · {lesson.topicTitle} · {lesson.targetLevel}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2.5">
                      <span className="font-display text-2xl font-black tracking-tight sm:text-3xl">
                        GRAMMAR
                      </span>
                      <span className="rounded-full bg-[#b5e05e] px-3 py-0.5 font-mono-num text-xs font-extrabold uppercase text-[#17280d]">
                        LESSON {String(stats.activeIndex).padStart(2, "0")}
                      </span>
                    </div>
                    <h1 className="mt-1.5 font-heading text-lg font-extrabold text-white sm:text-xl">
                      {lesson.title}
                    </h1>
                  </div>
                </div>

                <div className="shrink-0 text-center sm:text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#d9b86c]">
                    CHUYÊN ĐỀ {String(stats.activeIndex).padStart(2, "0")} / {String(stats.totalLessons).padStart(2, "0")}
                  </p>
                  {completed && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-[#c7ee83]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Đã xong ({bestScore}/{tests.length})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Guest Progress Login Bar */}
            {!user && !dismissAuthBanner && (
              <div className="mt-3 flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5 text-xs text-[var(--muted-foreground)]">
                <p>
                  <button
                    type="button"
                    onClick={() => openAuthModal("Đăng nhập để lưu tiến độ bài học và nhận EXP.")}
                    className="font-bold text-[var(--heading)] underline decoration-[#8cb84a] underline-offset-2 cursor-pointer"
                  >
                    Đăng nhập
                  </button>{" "}
                  để lưu tiến độ và nhận EXP sau mỗi bài tập.
                </p>
                <button
                  type="button"
                  onClick={() => setDismissAuthBanner(true)}
                  className="rounded p-1 hover:bg-[var(--muted)] cursor-pointer"
                  aria-label="Ẩn thông báo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Clean Underline Tab Bar + Right Utility Actions matching StudyChill step_32 */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-1 overflow-x-auto">
                {tabs.map((item) => {
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition cursor-pointer",
                        active
                          ? "border-[#243218] text-[var(--heading)] dark:border-[#8cb84a]"
                          : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--heading)]"
                      )}
                    >
                      <item.Icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="hidden sm:flex items-center gap-3 pr-1 text-xs font-bold text-[var(--muted-foreground)]">
                <Link
                  href="/community"
                  className="inline-flex items-center gap-1.5 py-2 hover:text-[var(--heading)]"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Bình luận
                </Link>
                <button
                  type="button"
                  onClick={() => setTab("summary")}
                  className="inline-flex items-center gap-1.5 py-2 hover:text-[var(--heading)] cursor-pointer"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Ôn tập
                </button>
              </div>
            </div>

            {/* StudyChill Compact Action Bar + Objective Box */}
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--heading)]">
                      Tài liệu Chuyên đề {String(stats.activeIndex).padStart(2, "0")} — {lesson.title}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {knowledge.length} phần kiến thức · {vocab.length} từ vựng · {tests.length} câu thực hành
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="primary" onClick={() => setTab("tests")}>
                  Làm bài tập ngay
                </Button>
              </div>

              {summary.takeaways.length > 0 && (
                <div className="rounded-2xl border border-[#cde0a5] bg-[#eff5dd] p-4 dark:border-[#3c4f28] dark:bg-[#212b19]">
                  <p className="text-xs font-extrabold text-[#243218] dark:text-[#d5e8ae]">
                    Học xong bài này, bạn sẽ
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {summary.takeaways.slice(0, 3).map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-[#3f4f30] dark:text-[#bfd39f]"
                      >
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#59752f]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* TAB 1: KIẾN THỨC */}
            {tab === "knowledge" && (
              <div className="mt-6 space-y-5">
                <div className="flex items-baseline gap-2 border-b-2 border-[#243218] pb-2 dark:border-[#4c5e35]">
                  <span className="font-display text-sm font-black uppercase text-[var(--heading)]">
                    SECTION A
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                    KIẾN THỨC — {lesson.title}
                  </span>
                </div>

                {knowledge.map((sec, idx) => (
                  <Card key={idx} className="p-5 sm:p-6">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#224624] font-mono-num text-xs font-extrabold text-white">
                        {idx + 1}
                      </span>
                      <h2 className="font-heading text-base font-extrabold uppercase tracking-tight text-[var(--heading)]">
                        {sec.heading}
                      </h2>
                    </div>

                    <p className="mt-2.5 text-sm leading-relaxed text-[var(--foreground)]">
                      {sec.summary}
                    </p>

                    {sec.formula && (
                      <div className="mt-3 rounded-xl border border-[#cadca1] bg-[#f1f6e3] px-4 py-2.5 font-mono text-xs font-bold text-[#2b4218] dark:border-[#3c5028] dark:bg-[#232d1c] dark:text-[#d0e6a9]">
                        Công thức: {sec.formula}
                      </div>
                    )}

                    <div className="mt-4 space-y-2.5">
                      {sec.examples.map((ex, eIdx) => (
                        <div
                          key={eIdx}
                          className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-[var(--heading)]">{ex.en}</p>
                            <button
                              type="button"
                              onClick={() => speakWord(ex.en)}
                              className="shrink-0 rounded-lg p-1 text-[#59752f] hover:bg-[var(--primary-soft)] cursor-pointer"
                              aria-label="Nghe câu ví dụ"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">&rarr; {ex.vi}</p>
                        </div>
                      ))}
                    </div>

                    {sec.trapTip && (
                      <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#e3d296] bg-[#fdf7df] px-4 py-3 text-xs text-[#694d12] dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <p>
                          <strong>Mẹo tránh bẫy:</strong> {sec.trapTip}
                        </p>
                      </div>
                    )}
                  </Card>
                ))}

                <div className="flex justify-end">
                  <Button onClick={() => setTab("vocab")}>
                    Tiếp theo: Từ vựng đi kèm
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 2: TỪ VỰNG */}
            {tab === "vocab" && (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {vocab.map((item, idx) => (
                    <Card key={idx} className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-heading text-lg font-bold text-[var(--heading)]">
                              {item.word}
                            </h3>
                            <Badge variant="neutral">{item.pos}</Badge>
                          </div>
                          <p className="font-mono-num text-xs text-[var(--muted-foreground)]">
                            {item.ipa}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => speakWord(item.word)}
                          aria-label={`Phát âm ${item.word}`}
                        >
                          <Volume2 className="h-4 w-4 text-[var(--primary)]" />
                        </Button>
                      </div>
                      <p className="mt-2.5 text-sm font-semibold text-[#4e6d24] dark:text-[#a6d45f]">
                        {item.meaning}
                      </p>
                      <p className="mt-1.5 text-xs italic text-[var(--muted-foreground)]">
                        &ldquo;{item.example}&rdquo;
                      </p>
                    </Card>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setTab("tests")}>
                    Làm bài tập thực chiến
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 3: BÀI TẬP QUIZ */}
            {tab === "tests" && (
              <div className="mt-6 space-y-4">
                {quizResult && (
                  <Card className="border-[#8cb84a] bg-[#eff6df] p-5 dark:bg-[#222c1a]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <Mascot size={56} mood="cheer" />
                        <div>
                          <p className="font-heading text-lg font-extrabold text-[var(--heading)]">
                            Kết quả: {quizResult.correctCount}/{quizResult.totalQuestions} câu đúng
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {quizResult.saved
                              ? `Đã lưu kết quả vào hồ sơ và cộng +${quizResult.xpAwarded} EXP.`
                              : "Chế độ khách: đăng nhập để lưu tiến độ và nhận EXP."}
                          </p>
                        </div>
                      </div>
                      {!user && (
                        <Button
                          size="sm"
                          onClick={() => openAuthModal("Đăng nhập để lưu điểm ngữ pháp & nhận EXP.")}
                        >
                          <Sparkles className="h-4 w-4" />
                          Lưu kết quả
                        </Button>
                      )}
                    </div>
                  </Card>
                )}

                {tests.map((q, idx) => {
                  const chosen = answers[q.id];
                  const reviewed = quizResult?.results.find((r) => r.questionId === q.id);

                  return (
                    <Card key={q.id} className="p-5">
                      <p className="text-xs font-extrabold uppercase text-[#59752f]">
                        Câu {idx + 1}
                      </p>
                      <p className="mt-1.5 text-base font-semibold text-[var(--heading)]">
                        {q.prompt}
                      </p>

                      <div className="mt-3.5 grid gap-2 sm:grid-cols-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = chosen === optIdx;
                          const isCorrectOption = reviewed && reviewed.correctIndex === optIdx;
                          const isWrongSelected =
                            reviewed && isSelected && reviewed.correctIndex !== optIdx;

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() =>
                                setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                              }
                              className={cn(
                                "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition cursor-pointer",
                                isCorrectOption
                                  ? "border-[#59752f] bg-[#ebf5d9] font-bold text-[#223812] dark:bg-[#2a3b1c] dark:text-[#d5e8ae]"
                                  : isWrongSelected
                                    ? "border-rose-400 bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-200"
                                    : isSelected
                                      ? "border-[#224624] bg-[#f0f5e3] font-bold text-[#243218] dark:border-[#8cb84a] dark:bg-[#242e1b] dark:text-white"
                                      : "border-[var(--border)] bg-[var(--surface-alt)] text-[var(--foreground)] hover:border-[#8cb84a]"
                              )}
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[var(--border-strong)] bg-[var(--surface)] font-mono-num text-xs font-bold">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1">{opt}</span>
                              {isCorrectOption && <CheckCircle2 className="h-4 w-4 text-[#59752f]" />}
                              {isWrongSelected && <XCircle className="h-4 w-4 text-rose-500" />}
                            </button>
                          );
                        })}
                      </div>

                      {reviewed && (
                        <div className="mt-3 rounded-xl bg-[var(--surface-alt)] p-3 text-xs text-[var(--muted-foreground)]">
                          <strong className="text-[var(--heading)]">Giải thích:</strong>{" "}
                          {reviewed.explanation}
                        </div>
                      )}
                    </Card>
                  );
                })}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    size="lg"
                    disabled={submitting || Object.keys(answers).length === 0}
                    onClick={handleSubmitQuiz}
                  >
                    {submitting ? "Đang chấm bài..." : "Nộp bài tập & Chấm điểm (+25 EXP)"}
                  </Button>
                  <Button variant="outline" onClick={() => setTab("summary")}>
                    Xem Tổng kết Lĩnh hội →
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 4: LĨNH HỘI */}
            {tab === "summary" && (
              <div className="mt-6 space-y-5">
                <Card className="p-6">
                  <h2 className="font-heading text-lg font-extrabold text-[var(--heading)]">
                    Điểm cốt lõi cần nhớ
                  </h2>
                  <ul className="mt-3 space-y-2.5 text-sm text-[var(--foreground)]">
                    {summary.takeaways.map((t, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#59752f]" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="border-amber-200 bg-amber-50/70 p-6 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <h2 className="font-heading text-lg font-extrabold text-amber-800 dark:text-amber-300">
                    Bẫy đề TOEIC hay gài ở chủ điểm này
                  </h2>
                  <ul className="mt-3 space-y-2.5 text-sm text-amber-900/90 dark:text-amber-100">
                    {summary.commonTraps.map((trap, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <span>{trap}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button variant="outline" onClick={() => setTab("knowledge")}>
                    <ChevronLeft className="h-4 w-4" /> Ôn lại Kiến thức
                  </Button>
                  {nextLesson && (
                    <Link
                      href={`/ngu-phap/${nextLesson.slug}`}
                      className="btn-chunky-lime inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold"
                    >
                      <span>Bài tiếp theo: {nextLesson.title}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function sectionHeadingsList(headings: string[], onSelect: () => void) {
  return headings.slice(0, 3).map((heading, idx) => (
    <button
      key={idx}
      type="button"
      onClick={onSelect}
      className="block w-full truncate pl-4 py-0.5 text-left text-[11px] hover:text-[var(--heading)] cursor-pointer"
    >
      {idx + 1}. {heading}
    </button>
  ));
}
