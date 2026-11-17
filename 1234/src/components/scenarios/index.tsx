"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, BookOpen, BookmarkPlus, Calendar, CheckCircle2, ClipboardCheck, Clock, Layers, MessageSquareText, Search, ShieldCheck, Sparkles, Users, Volume2, Wrench } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/components/providers/app-provider";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { Card } from "@/components/ui";
import type { ScenarioDialogueLine, ScenarioPhraseItem, ScenarioRoleBrief, ScenarioRubricItem, ScenarioVocabItem, } from "@/lib/site-config";
import { cn, safeJsonParse } from "@/lib/utils";
import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";

// === scenario-detail-client.tsx ===
interface OpenSessionRow {
  id: string;
  slotLabel: string;
  scheduledAtIso: string;
  major: string;
  level: string;
  school: string;
  ageGroupScope: string;
  hostName: string;
}

export interface ScenarioDetailData {
  id: string;
  slug: string;
  title: string;
  major: string;
  level: string;
  summary: string;
  durationMinutes: number;
  isFree: boolean;
  vocabJson: string;
  phrasesJson: string;
  dialogueJson: string;
  roleAJson: string;
  roleBJson: string;
  rubricJson: string;
  authorName: string;
  reviewedByTeacher: string;
  sourceAttribution: string;
}

export function ScenarioDetailClient({
  scenario,
  openSessions,
}: {
  scenario: ScenarioDetailData;
  openSessions: OpenSessionRow[];
}) {
  const { user, openAuthModal, notify } = useApp();
  const [activeLayer, setActiveLayer] = React.useState<"layer1" | "layer2" | "layer3">("layer1");
  const [selectedRole, setSelectedRole] = React.useState<"A" | "B">("A");
  const [savedWords, setSavedWords] = React.useState<Record<string, boolean>>({});
  const [checkedTasks, setCheckedTasks] = React.useState<Record<string, boolean>>({});

  const vocab = React.useMemo(
    () => safeJsonParse<ScenarioVocabItem[]>(scenario.vocabJson, []),
    [scenario.vocabJson]
  );
  const phrases = React.useMemo(
    () => safeJsonParse<ScenarioPhraseItem[]>(scenario.phrasesJson, []),
    [scenario.phrasesJson]
  );
  const dialogue = React.useMemo(
    () => safeJsonParse<ScenarioDialogueLine[]>(scenario.dialogueJson, []),
    [scenario.dialogueJson]
  );
  const roleA = React.useMemo(
    () =>
      safeJsonParse<ScenarioRoleBrief>(scenario.roleAJson, {
        title: "Vai A",
        goal: "",
        tasks: [],
      }),
    [scenario.roleAJson]
  );
  const roleB = React.useMemo(
    () =>
      safeJsonParse<ScenarioRoleBrief>(scenario.roleBJson, {
        title: "Vai B",
        goal: "",
        tasks: [],
      }),
    [scenario.roleBJson]
  );
  const rubric = React.useMemo(
    () => safeJsonParse<ScenarioRubricItem[]>(scenario.rubricJson, []),
    [scenario.rubricJson]
  );

  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    }
  };

  const handleSaveWord = async (item: ScenarioVocabItem) => {
    if (!user) {
      openAuthModal("Đăng nhập để lưu từ vựng chuyên ngành vào Sổ tay SRS của bạn.");
      return;
    }
    const key = `sc-${scenario.slug}-${item.word.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const res = await fetch("/api/vocab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        word: {
          id: key,
          word: item.word,
          phonetic: item.phonetic,
          pos: item.pos,
          meaning: item.meaning,
          example: item.example,
          deck: `Ngành ${scenario.major}`,
        },
      }),
    });
    if (res.ok) {
      setSavedWords((prev) => ({ ...prev, [item.word]: true }));
      notify(`Đã lưu "${item.word}" vào Sổ từ vựng (Ngành ${scenario.major}).`, "success");
    } else {
      notify("Không thể lưu từ vựng lúc này.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f3ea] bg-paper-grid pb-20 pt-8 text-[#1b2d1c] dark:bg-[#0e1511] dark:text-[#eef3e8]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/tinh-huong"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại Thư viện Tình huống
          </Link>

          <Link href={`/ghep-cap?scenario=${scenario.slug}`}>
            <Button size="sm">
              <Users className="h-4 w-4" />
              Đặt lịch ghép cặp tình huống này
            </Button>
          </Link>
        </div>

        {/* Header Card */}
        <Card className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="green">{scenario.major}</Badge>
            <Badge variant="neutral">{scenario.level}</Badge>
            <Badge variant="gold">
              <Clock className="h-3 w-3" />
              {scenario.durationMinutes} phút / buổi
            </Badge>
            <Badge variant="green">
              <CheckCircle2 className="h-3 w-3" />
              {scenario.reviewedByTeacher}
            </Badge>
          </div>

          <h1 className="font-display text-2xl font-black text-[var(--heading)] sm:text-3xl">
            {scenario.title}
          </h1>
          <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
            {scenario.summary}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-xs">
            <div className="space-y-0.5">
              <p>
                <strong className="text-[var(--heading)]">Biên soạn:</strong> {scenario.authorName}{" "}
                · <strong className="text-[var(--heading)]">Rà soát:</strong>{" "}
                {scenario.reviewedByTeacher}
              </p>
              <p className="text-[var(--muted-foreground)]">
                <strong>Nguồn &amp; minh bạch AI:</strong> {scenario.sourceAttribution}
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--primary)]" />
          </div>
        </Card>

        {/* 3-Layer Switcher */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              key: "layer1" as const,
              badge: "LỚP 1 · NỘI DUNG",
              title: "Từ vựng, Mẫu câu & Hội thoại",
              desc: `${vocab.length} từ chuyên ngành · ${phrases.length} mẫu câu · Hội thoại mẫu`,
            },
            {
              key: "layer2" as const,
              badge: "LỚP 2 · LUYỆN TẬP",
              title: "Kịch bản Đóng vai & Rubric",
              desc: "Nhiệm vụ Vai A / Vai B & Bảng chấm 5 tiêu chí",
            },
            {
              key: "layer3" as const,
              badge: "LỚP 3 · CỘNG ĐỒNG",
              title: "Ghép cặp theo Lịch hẹn",
              desc: `${openSessions.length} lịch đang mở trong nhóm kiểm soát`,
            },
          ].map((tab) => {
            const active = activeLayer === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveLayer(tab.key)}
                className={cn(
                  "rounded-2xl border-2 p-4 text-left transition cursor-pointer",
                  active
                    ? "border-[#1b2d1c] bg-[#19462b] text-white sc-shadow-sm"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--heading)] hover:border-[#1b2d1c]"
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider",
                    active ? "text-[#9ee56f]" : "text-[var(--primary)]"
                  )}
                >
                  <Layers className="h-3 w-3" />
                  {tab.badge}
                </span>
                <p className="mt-1 font-heading text-sm font-extrabold">{tab.title}</p>
                <p className={cn("mt-0.5 text-[11px]", active ? "text-emerald-100/80" : "text-[var(--muted-foreground)]")}>
                  {tab.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* LAYER 1: CONTENT */}
        {activeLayer === "layer1" && (
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-heading text-lg font-extrabold text-[var(--heading)]">
                  1. Từ vựng chuyên ngành ({vocab.length} từ)
                </h2>
                <Link href="/vocab/notebook" className="text-xs font-bold text-[var(--primary)] hover:underline">
                  Mở Sổ tay từ vựng &rarr;
                </Link>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {vocab.map((item) => {
                  const isSaved = Boolean(savedWords[item.word]);
                  return (
                    <div
                      key={item.word}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 flex flex-col justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-heading text-base font-extrabold text-[var(--heading)]">
                              {item.word}
                            </span>{" "}
                            <span className="text-xs text-[var(--muted-foreground)]">
                              {item.phonetic} · <i>{item.pos}</i>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => speak(item.word)}
                              title="Nghe phát âm"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--primary)] hover:border-[var(--primary)] cursor-pointer"
                            >
                              <Volume2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleSaveWord(item)}
                              title="Lưu vào sổ từ vựng"
                              className={cn(
                                "inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-bold transition cursor-pointer",
                                isSaved
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--heading)] hover:border-[var(--primary)]"
                              )}
                            >
                              <BookmarkPlus className="h-3.5 w-3.5" />
                              {isSaved ? "Đã lưu" : "Lưu"}
                            </button>
                          </div>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-[var(--primary)]">
                          {item.meaning}
                        </p>
                      </div>
                      <p className="text-xs italic text-[var(--muted-foreground)]">
                        “{item.example}”
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="font-heading text-lg font-extrabold text-[var(--heading)]">
                2. Mẫu câu giao tiếp trong tình huống
              </h2>
              <div className="space-y-3">
                {phrases.map((ph, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-heading text-sm font-bold text-[var(--heading)]">{ph.en}</p>
                      <p className="mt-0.5 text-xs text-[var(--primary)] font-semibold">{ph.vi}</p>
                      <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                        Ngữ cảnh: {ph.context}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => speak(ph.en)}
                      className="shrink-0"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      Nghe mẫu
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-heading text-lg font-extrabold text-[var(--heading)]">
                  3. Hội thoại mẫu theo vai
                </h2>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => speak(dialogue.map((d) => d.en).join(" "))}
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  Đọc cả đoạn hội thoại
                </Button>
              </div>
              <div className="space-y-3">
                {dialogue.map((line, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-2xl border p-4",
                      line.role === "A"
                        ? "border-[#93c96e] bg-[#f1f9ea] dark:bg-[#192b1d]"
                        : "border-[var(--border)] bg-[var(--surface-alt)]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--primary)]">
                        Vai {line.role} · {line.speakerName}
                      </span>
                      <button
                        type="button"
                        onClick={() => speak(line.en)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--heading)] hover:text-[var(--primary)] cursor-pointer"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        Nghe
                      </button>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-[var(--heading)]">{line.en}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{line.vi}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* LAYER 2: PRACTICE ROLEPLAY & RUBRIC */}
        {activeLayer === "layer2" && (
          <div className="space-y-6">
            <Card className="p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading text-lg font-extrabold text-[var(--heading)]">
                    Kịch bản đóng vai 2 người (15 phút có cấu trúc)
                  </h2>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Chọn vai bạn sẽ đóng để chuẩn bị ý trước khi vào phòng Google Meet luyện cùng bạn học.
                  </p>
                </div>
                <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("A")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 cursor-pointer",
                      selectedRole === "A" ? "bg-[#19462b] text-white" : "text-[var(--muted-foreground)]"
                    )}
                  >
                    Tôi chọn Vai A
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("B")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 cursor-pointer",
                      selectedRole === "B" ? "bg-[#19462b] text-white" : "text-[var(--muted-foreground)]"
                    )}
                  >
                    Tôi chọn Vai B
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { code: "A" as const, data: roleA },
                  { code: "B" as const, data: roleB },
                ].map((r) => {
                  const isMine = selectedRole === r.code;
                  return (
                    <div
                      key={r.code}
                      className={cn(
                        "rounded-2xl border-2 p-5 transition",
                        isMine
                          ? "border-[#1b2d1c] bg-[#eaf5e3] dark:bg-[#192b1d]"
                          : "border-[var(--border)] bg-[var(--surface-alt)] opacity-85"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant={isMine ? "green" : "neutral"}>{r.data.title}</Badge>
                        {isMine && (
                          <span className="text-[11px] font-extrabold text-[#19462b] dark:text-[#9ee56f]">
                            Vai bạn đang chuẩn bị
                          </span>
                        )}
                      </div>
                      <p className="mt-2.5 text-xs font-bold text-[var(--heading)]">
                        Mục tiêu: {r.data.goal}
                      </p>
                      <ul className="mt-3 space-y-2 text-xs text-[var(--foreground)]">
                        {r.data.tasks.map((task, idx) => {
                          const tKey = `${r.code}-${idx}`;
                          return (
                            <li key={tKey} className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                checked={Boolean(checkedTasks[tKey])}
                                onChange={(e) =>
                                  setCheckedTasks((prev) => ({
                                    ...prev,
                                    [tKey]: e.target.checked,
                                  }))
                                }
                                className="mt-0.5 h-3.5 w-3.5 accent-[#1a4d2e]"
                              />
                              <span>{task}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-[var(--primary)]" />
                <h2 className="font-heading text-lg font-extrabold text-[var(--heading)]">
                  Bảng tiêu chí nhận xét chéo (Rubric 5 tiêu chí)
                </h2>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Sau khi kết thúc buổi ghép cặp, cả hai thành viên chấm điểm 1–5 và ghi nhận xét có cấu trúc theo bảng sau (thay cho nói chuyện tự do không định hướng).
              </p>

              <div className="space-y-2.5">
                {rubric.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-heading text-sm font-bold text-[var(--heading)]">
                        {idx + 1}. {item.criterion}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">{item.description}</p>
                    </div>
                    <Badge variant="gold" className="shrink-0 self-start sm:self-center">
                      Thang 1 – {item.maxScore} điểm
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* LAYER 3: COMMUNITY PAIRING */}
        {activeLayer === "layer3" && (
          <Card className="p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-lg font-extrabold text-[var(--heading)]">
                  Lớp 3 · Lịch ghép cặp đang mở cho tình huống này
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Hệ thống tự động lọc theo nhóm tuổi (người dưới 18 tuổi chỉ thấy lịch của bạn cùng trường &amp; cùng nhóm tuổi) và tạo đường dẫn họp Google Meet an toàn.
                </p>
              </div>
              <Link href={`/ghep-cap?scenario=${scenario.slug}`}>
                <Button>
                  <Calendar className="h-4 w-4" />
                  Tạo hoặc nhận lịch hẹn ở Phòng ghép cặp
                </Button>
              </Link>
            </div>

            {openSessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-alt)] p-8 text-center">
                <MessageSquareText className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />
                <p className="mt-2 font-heading text-sm font-bold text-[var(--heading)]">
                  Hiện chưa có lịch hẹn mở nào cho tình huống này trong nhóm tuổi của bạn
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Bạn có thể tạo lịch hẹn đầu tiên theo khung giờ rảnh của mình để bạn cùng ngành tham gia!
                </p>
                <Link href={`/ghep-cap?scenario=${scenario.slug}`} className="mt-4 inline-block">
                  <Button size="sm">
                    Tạo lịch hẹn ngay
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {openSessions.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="green">{s.slotLabel}</Badge>
                        <Badge variant={s.ageGroupScope === "UNDER_18" ? "gold" : "neutral"}>
                          {s.ageGroupScope === "UNDER_18" ? "Nhóm < 18 tuổi" : "Nhóm ≥ 18 tuổi"}
                        </Badge>
                      </div>
                      <p className="mt-2 font-heading text-sm font-bold text-[var(--heading)]">
                        Bạn hẹn: {s.hostName}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {s.major} · {s.level} · {s.school}
                      </p>
                    </div>

                    <Link href={`/ghep-cap?scenario=${scenario.slug}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Sparkles className="h-3.5 w-3.5" />
                        Vào nhận ghép cặp ở Phòng ghép cặp
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

// === scenarios-explorer.tsx ===
export interface ScenarioSummaryItem {
  id: string;
  slug: string;
  title: string;
  major: string;
  level: string;
  summary: string;
  durationMinutes: number;
  isFree: boolean;
  authorName: string;
  reviewedByTeacher: string;
  openSessionsCount: number;
}

const MAJORS = ["Tất cả", "Cơ khí", "Điện - Điện tử", "Tin học", "Kinh tế - Du lịch"];
const LEVELS = ["Tất cả", "Cơ bản (A2)", "Trung bình (B1)", "Khá (B2)"];

export function ScenariosExplorer({ scenarios }: { scenarios: ScenarioSummaryItem[] }) {
  const [major, setMajor] = React.useState("Tất cả");
  const [level, setLevel] = React.useState("Tất cả");
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return scenarios.filter((s) => {
      if (major !== "Tất cả" && s.major !== major) return false;
      if (level !== "Tất cả" && s.level !== level) return false;
      if (q && !s.title.toLowerCase().includes(q) && !s.summary.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [scenarios, major, level, query]);

  return (
    <div className="min-h-screen bg-[#f6f3ea] bg-paper-grid pb-20 pt-8 text-[#1b2d1c] dark:bg-[#0e1511] dark:text-[#eef3e8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
        {/* Hero Header */}
        <section className="rounded-[28px] border-2 border-[#1b2d1c] bg-[#13291b] p-6 sm:p-9 text-white sc-shadow">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9ee56f] px-3 py-1 text-xs font-black text-[#0d1c12]">
                  <Layers className="h-3.5 w-3.5" />
                  Cơ chế “Một tình huống – Ba lớp”
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#9ee56f]" />
                  Giáo viên chuyên môn VSVC rà soát
                </span>
              </div>

              <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
                Thư viện Tình huống Nghề nghiệp
              </h1>
              <p className="text-sm leading-relaxed text-emerald-100/85">
                Thay vì học tiếng Anh giao tiếp chung chung, mỗi bài học được tổ chức quanh{" "}
                <b className="text-[#9ee56f]">một tình huống nghề nghiệp thực tế</b> gồm 3 lớp: (1)
                Nội dung chuyên ngành, (2) Kịch bản đóng vai &amp; Rubric nhận xét, và (3) Ghép cặp
                luyện nói cùng bạn học cùng ngành theo lịch hẹn.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 shrink-0 text-center">
              <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <BookOpen className="mx-auto h-4 w-4 text-[#9ee56f]" />
                <p className="mt-1 text-xs font-extrabold">Lớp 1</p>
                <p className="text-[11px] text-white/70">Từ vựng &amp; Hội thoại</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <Wrench className="mx-auto h-4 w-4 text-amber-300" />
                <p className="mt-1 text-xs font-extrabold">Lớp 2</p>
                <p className="text-[11px] text-white/70">Đóng vai &amp; Rubric</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <Users className="mx-auto h-4 w-4 text-sky-300" />
                <p className="mt-1 text-xs font-extrabold">Lớp 3</p>
                <p className="text-[11px] text-white/70">Ghép cặp cùng ngành</p>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Bar */}
        <Card className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {MAJORS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMajor(m)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-bold transition cursor-pointer",
                    major === m
                      ? "border-[#1b2d1c] bg-[#9ee56f] text-[#102414]"
                      : "border-[var(--border)] bg-[var(--surface-alt)] text-[var(--muted-foreground)] hover:text-[var(--heading)]"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--heading)] outline-none"
              >
                {LEVELS.map((lv) => (
                  <option key={lv} value={lv}>
                    Trình độ: {lv}
                  </option>
                ))}
              </select>

              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm tình huống nghề..."
                  className="h-9 pl-8 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted-foreground)]">
            <span>
              Đang hiển thị <b className="text-[var(--heading)]">{filtered.length}</b> /{" "}
              {scenarios.length} tình huống thực hành
            </span>
            <Link
              href="/ghep-cap"
              className="inline-flex items-center gap-1 font-bold text-[var(--primary)] hover:underline"
            >
              Mở phòng Ghép cặp luyện nói
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>

        {/* Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sc) => (
            <Link key={sc.id} href={`/tinh-huong/${sc.slug}`} className="group block">
              <Card className="flex h-full flex-col justify-between p-5 transition group-hover:-translate-y-0.5 group-hover:border-[#1b2d1c] group-hover:shadow-[4px_4px_0_#1b2d1c]">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="green">{sc.major}</Badge>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="neutral">{sc.level}</Badge>
                      <Badge variant={sc.isFree ? "gold" : "neutral"}>
                        {sc.isFree ? "Miễn phí" : "Thử nghiệm kín Free"}
                      </Badge>
                    </div>
                  </div>

                  <h2 className="mt-3 font-heading text-lg font-extrabold text-[var(--heading)] group-hover:text-[var(--primary)]">
                    {sc.title}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)] line-clamp-3">
                    {sc.summary}
                  </p>
                </div>

                <div className="mt-5 space-y-2.5 border-t border-[var(--border)] pt-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-[#9ee56f]">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{sc.reviewedByTeacher}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {sc.durationMinutes} phút
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-[var(--heading)]">
                      <Users className="h-3.5 w-3.5 text-[var(--primary)]" />
                      {sc.openSessionsCount} lịch đang mở
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
