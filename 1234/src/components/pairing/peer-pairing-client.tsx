"use client";

import * as React from "react";
import Link from "next/link";
import {
  Ban,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Flag,
  LockKeyhole,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Video,
  XCircle,
} from "lucide-react";
import { ReportBlockModal } from "@/components/safety";
import { useApp } from "@/components/providers/app-provider";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { Card } from "@/components/ui";
import { Input } from "@/components/ui";
import { getAgeGroupLabel, isMinorAgeGroup } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { DEFAULT_PRACTICE_RUBRIC } from "@/lib/site-config";

export interface PairingScenarioOption {
  id: string;
  slug: string;
  title: string;
  major: string;
  level: string;
  durationMinutes: number;
}

export interface PracticeSessionView {
  id: string;
  scenario: {
    id: string;
    slug: string;
    title: string;
    major: string;
    level: string;
    durationMinutes: number;
  };
  host: {
    id: string;
    name: string;
    major: string;
    selfLevel: string;
    school: string;
  };
  partner: {
    id: string;
    name: string;
    major: string;
    selfLevel: string;
    school: string;
  } | null;
  major: string;
  level: string;
  school: string;
  ageGroupScope: string;
  scheduledAt: string;
  slotLabel: string;
  meetingUrl: string | null;
  status: string;
  hostConfirmedComplete: boolean;
  partnerConfirmedComplete: boolean;
  noRecordingConfirmed: boolean;
  notes: string | null;
  rubrics: Array<{
    id: string;
    reviewerId: string;
    targetUserId: string;
    overallScore: number;
    satisfactionRating: number;
    strengths: string;
    improvements: string;
    mentorReviewed: boolean;
    mentorNote: string | null;
  }>;
}

interface BlockedRow {
  id: string;
  blockedId: string;
  reason: string | null;
  blocked: { id: string; name: string; major: string; school: string };
}

export function PeerPairingClient({
  scenarios,
  initialOpenSessions,
  initialMySessions,
  preselectedScenarioSlug,
}: {
  scenarios: PairingScenarioOption[];
  initialOpenSessions: PracticeSessionView[];
  initialMySessions: PracticeSessionView[];
  preselectedScenarioSlug?: string;
}) {
  const { user, refreshUser, openAuthModal, notify } = useApp();
  const [tab, setTab] = React.useState<"open" | "create" | "mine" | "blocked">(
    preselectedScenarioSlug ? "create" : "open"
  );
  const [majorFilter, setMajorFilter] = React.useState("Tất cả");
  const [openSessions, setOpenSessions] = React.useState<PracticeSessionView[]>(initialOpenSessions);
  const [mySessions, setMySessions] = React.useState<PracticeSessionView[]>(initialMySessions);
  const [blockedUsers, setBlockedUsers] = React.useState<BlockedRow[]>([]);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  // Invite code quick verification state
  const [inviteCode, setInviteCode] = React.useState("");
  const [inviteLoading, setInviteLoading] = React.useState(false);

  // Create session form
  const defaultScenario =
    scenarios.find((s) => s.slug === preselectedScenarioSlug) || scenarios[0];
  const [scenarioId, setScenarioId] = React.useState(defaultScenario?.id || "");
  const [slotLabel, setSlotLabel] = React.useState(
    siteConfig.startupProject.defaultTimeSlots[0]
  );
  const [scheduledDate, setScheduledDate] = React.useState(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = React.useState("");
  const [noRecordingConfirmed, setNoRecordingConfirmed] = React.useState(true);
  const [creating, setCreating] = React.useState(false);

  // Rubric modal/drawer state
  const [rubricSessionId, setRubricSessionId] = React.useState<string | null>(null);
  const [rubricScores, setRubricScores] = React.useState<Record<string, number>>({
    terminology: 5,
    clarity: 4,
    task_completion: 5,
    interaction: 4,
    professionalism: 5,
  });
  const [satisfactionRating, setSatisfactionRating] = React.useState(5);
  const [strengths, setStrengths] = React.useState("");
  const [improvements, setImprovements] = React.useState("");
  const [submittingRubric, setSubmittingRubric] = React.useState(false);

  // Safety report/block modal
  const [reportTarget, setReportTarget] = React.useState<{
    targetType: "SESSION" | "USER";
    targetId: string;
    targetUserId?: string;
    targetUserName?: string;
  } | null>(null);

  const reloadSessions = React.useCallback(async () => {
    const [openRes, mineRes] = await Promise.all([
      fetch("/api/sessions", { cache: "no-store" }),
      user ? fetch("/api/sessions?mine=1", { cache: "no-store" }) : Promise.resolve(null),
    ]);
    if (openRes.ok) {
      const json = (await openRes.json()) as {
        success: boolean;
        data?: { sessions: PracticeSessionView[] };
      };
      if (json.success && json.data) setOpenSessions(json.data.sessions);
    }
    if (mineRes && mineRes.ok) {
      const json = (await mineRes.json()) as {
        success: boolean;
        data?: { sessions: PracticeSessionView[] };
      };
      if (json.success && json.data) setMySessions(json.data.sessions);
    }
    if (user) {
      const bRes = await fetch("/api/safety/block", { cache: "no-store" });
      if (bRes.ok) {
        const bJson = (await bRes.json()) as {
          success: boolean;
          data?: { blocks: BlockedRow[] };
        };
        if (bJson.success && bJson.data) setBlockedUsers(bJson.data.blocks);
      }
    }
  }, [user]);

  React.useEffect(() => {
    if (!user) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return reloadSessions();
    });
    return () => {
      active = false;
    };
  }, [user, reloadSessions]);

  const isMinor = isMinorAgeGroup(user?.ageGroup);
  const isApproved = user?.approvalStatus === "APPROVED";
  const needsParentConsent = Boolean(user && isMinor && user.parentConsentStatus !== "APPROVED");

  const filteredOpen = React.useMemo(() => {
    return openSessions.filter((s) => majorFilter === "Tất cả" || s.major === majorFilter);
  }, [openSessions, majorFilter]);

  const handleApplyInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setInviteLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      const json = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!json.success) {
        notify(json.error?.message || "Mã mời không hợp lệ.", "error");
        return;
      }
      await refreshUser();
      setInviteCode("");
      notify("Đã xác thực mã mời giáo viên & duyệt tài khoản thử nghiệm kín!", "success");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal("Đăng nhập bằng email trường hoặc mã mời để đặt lịch ghép cặp.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId,
          slotLabel,
          scheduledAt: `${scheduledDate}T19:00:00.000Z`,
          notes,
          noRecordingConfirmed,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        error?: { message: string };
      };
      if (!json.success) {
        notify(json.error?.message || "Không thể tạo lịch hẹn.", "error");
        return;
      }
      notify("Đã mở lịch ghép cặp thành công! Bạn cùng ngành có thể nhận lịch ngay.", "success");
      setNotes("");
      await reloadSessions();
      setTab("mine");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    if (!user) {
      openAuthModal("Đăng nhập để nhận ghép cặp luyện nói theo lịch hẹn.");
      return;
    }
    setBusyId(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join" }),
      });
      const json = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!json.success) {
        notify(json.error?.message || "Không thể nhận lịch hẹn này.", "error");
        return;
      }
      notify("Ghép cặp thành công! Đường dẫn Google Meet đã sẵn sàng trong mục Lịch của tôi.", "success");
      await reloadSessions();
      setTab("mine");
    } finally {
      setBusyId(null);
    }
  };

  const handleSessionAction = async (sessionId: string, action: "complete" | "cancel") => {
    setBusyId(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { xp?: number };
        error?: { message: string };
      };
      if (!json.success) {
        notify(json.error?.message || "Thao tác thất bại.", "error");
        return;
      }
      if (action === "complete") {
        notify("Đã xác nhận hoàn thành buổi luyện (+35 EXP)! Hãy gửi phiếu rubric nhận xét bạn cặp nhé.", "success");
        await refreshUser();
      } else {
        notify("Đã hủy lịch hẹn.", "info");
      }
      await reloadSessions();
    } finally {
      setBusyId(null);
    }
  };

  const handleSubmitRubric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rubricSessionId) return;
    setSubmittingRubric(true);
    try {
      const res = await fetch(`/api/sessions/${rubricSessionId}/rubric`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scores: rubricScores,
          satisfactionRating,
          strengths,
          improvements,
        }),
      });
      const json = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!json.success) {
        notify(json.error?.message || "Không thể lưu phiếu rubric.", "error");
        return;
      }
      notify("Đã gửi phiếu nhận xét rubric (+15 EXP)!", "success");
      setRubricSessionId(null);
      setStrengths("");
      setImprovements("");
      await refreshUser();
      await reloadSessions();
    } finally {
      setSubmittingRubric(false);
    }
  };

  const handleUnblock = async (blockedUserId: string) => {
    const res = await fetch(
      `/api/safety/block?blockedUserId=${encodeURIComponent(blockedUserId)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      notify("Đã bỏ chặn tài khoản.", "info");
      await reloadSessions();
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f3ea] bg-paper-grid pb-20 pt-8 text-[#1b2d1c] dark:bg-[#0e1511] dark:text-[#eef3e8]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        {/* Hero */}
        <section className="rounded-[28px] border-2 border-[#1b2d1c] bg-[#163426] p-6 sm:p-8 text-white sc-shadow">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9ee56f] px-3 py-1 text-xs font-black text-[#0d1c12]">
                <Users className="h-3.5 w-3.5" />
                Giai đoạn 0b · Thử nghiệm kín VSVC
              </span>
              <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
                Phòng Ghép cặp Luyện nói Theo lịch hẹn
              </h1>
              <p className="text-sm leading-relaxed text-emerald-100/85">
                Ghép cặp 1-1 theo đúng <b>ngành học</b>, <b>trình độ</b> và <b>khung giờ rảnh</b>. Hệ
                thống tự tạo đường dẫn <b>Google Meet</b> để hai bạn luyện kịch bản đóng vai mà không
                cần trao đổi SĐT hay thông tin liên hệ cá nhân.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-xs space-y-1.5 max-w-sm">
              <p className="font-extrabold text-[#9ee56f] flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                Bảo vệ An toàn &amp; Người dưới 18 tuổi
              </p>
              <p className="text-white/80">• Không nhắn tin riêng 1-1 ngoài phòng học.</p>
              <p className="text-white/80">• Học viên &lt;18 tuổi chỉ ghép cùng trường &amp; cùng nhóm tuổi.</p>
              <p className="text-white/80">• Không ghi âm/ghi hình lưu trên hệ thống.</p>
              <p className="text-white/80">• Nút Báo cáo vi phạm &amp; Chặn có mặt ở mọi phiên.</p>
            </div>
          </div>
        </section>

        {/* User Eligibility & Safety Status Panel */}
        {!user ? (
          <Card className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <LockKeyhole className="h-6 w-6 text-[var(--primary)] shrink-0 mt-0.5" />
              <div>
                <h2 className="font-heading text-base font-extrabold text-[var(--heading)]">
                  Đăng nhập bằng email trường (@vsvc.edu.vn) hoặc Mã mời giáo viên
                </h2>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Theo nội quy thử nghiệm kín (Phụ lục B), chỉ học sinh, sinh viên đã được duyệt mới có thể tạo hoặc nhận lịch ghép cặp.
                </p>
              </div>
            </div>
            <Button onClick={() => openAuthModal("Đăng nhập để sử dụng Phòng ghép cặp luyện nói VSVC")}>
              Đăng nhập ngay
            </Button>
          </Card>
        ) : (
          <Card className="p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant={isApproved ? "green" : "gold"}>
                  {isApproved
                    ? "Đã duyệt Thử nghiệm kín"
                    : user.approvalStatus === "SUSPENDED"
                    ? "Đang tạm khóa"
                    : "Chờ duyệt vào nhóm kín"}
                </Badge>
                <Badge variant="neutral">{user.major}</Badge>
                <Badge variant="neutral">{user.selfLevel}</Badge>
                <Badge variant={isMinor ? "gold" : "neutral"}>
                  {getAgeGroupLabel(user.ageGroup)}
                </Badge>
                {isMinor && (
                  <Badge variant={user.parentConsentStatus === "APPROVED" ? "green" : "gold"}>
                    Phụ huynh:{" "}
                    {user.parentConsentStatus === "APPROVED"
                      ? "Đã đồng ý"
                      : "Chờ phiếu đồng ý"}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Link href="/my-library#ho-so-vsvc" className="font-bold text-[var(--primary)] hover:underline">
                  Cập nhật hồ sơ / Khung giờ
                </Link>
                {isMinor && user.parentMonitorCode && (
                  <Link
                    href={`/phu-huynh?code=${user.parentMonitorCode}`}
                    className="font-bold text-amber-700 dark:text-amber-300 hover:underline"
                  >
                    Mã PH: {user.parentMonitorCode}
                  </Link>
                )}
              </div>
            </div>

            {!isApproved && user.approvalStatus !== "SUSPENDED" && (
              <form
                onSubmit={handleApplyInviteCode}
                className="flex flex-col gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <b>Tài khoản chưa được duyệt nhóm kín:</b> Nhập mã mời giáo viên (ví dụ{" "}
                  <code>VSVC-2026</code>, <code>VSVC-TH26</code>, <code>VSVC-CK26</code>,{" "}
                  <code>VSVC-DT26</code>) để kích hoạt ngay.
                </div>
                <div className="flex gap-2 shrink-0">
                  <Input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Mã mời (VSVC-...)"
                    className="h-9 w-40 bg-white text-xs font-mono-num"
                  />
                  <Button type="submit" size="sm" disabled={inviteLoading}>
                    {inviteLoading ? "Đang kiểm tra..." : "Kích hoạt"}
                  </Button>
                </div>
              </form>
            )}

            {needsParentConsent && (
              <div className="flex flex-col gap-2 rounded-2xl border border-rose-300 bg-rose-50 p-3.5 text-xs text-rose-950 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />
                  <span>
                    Bạn đang ở nhóm tuổi <b>dưới 18</b>. Hệ thống yêu cầu <b>Phiếu đồng ý của phụ huynh</b>{" "}
                    được duyệt trước khi tạo hoặc nhận ghép cặp.
                  </span>
                </div>
                <Link href="/my-library#phieu-phu-huynh" className="shrink-0">
                  <Button size="sm" variant="primary">
                    Gửi / Xem Phiếu phụ huynh
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap gap-1.5 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-1.5">
            {[
              { id: "open" as const, label: `Lịch đang mở (${openSessions.length})` },
              { id: "create" as const, label: "+ Đặt lịch hẹn mới" },
              { id: "mine" as const, label: `Lịch của tôi & Rubric (${mySessions.length})` },
              { id: "blocked" as const, label: `Đã chặn (${blockedUsers.length})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer",
                  tab === t.id
                    ? "bg-[#19462b] text-white"
                    : "text-[var(--muted-foreground)] hover:text-[var(--heading)]"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Link href="/tinh-huong" className="text-xs font-bold text-[var(--primary)] hover:underline">
            Xem kho 14 Tình huống 3 lớp &rarr;
          </Link>
        </div>

        {/* TAB 1: OPEN SESSIONS */}
        {tab === "open" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {["Tất cả", "Cơ khí", "Điện - Điện tử", "Tin học", "Kinh tế - Du lịch"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMajorFilter(m)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-bold cursor-pointer",
                    majorFilter === m
                      ? "border-[#1b2d1c] bg-[#9ee56f] text-[#102414]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)]"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            {filteredOpen.length === 0 ? (
              <Card className="p-8 text-center space-y-3">
                <p className="font-heading text-base font-bold text-[var(--heading)]">
                  Chưa có lịch hẹn mở nào phù hợp trong nhóm tuổi của bạn
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Bạn có thể tự mở một khung giờ rảnh mới để bạn học cùng ngành vào ghép cặp!
                </p>
                <Button size="sm" onClick={() => setTab("create")}>
                  <Plus className="h-4 w-4" />
                  Tạo lịch hẹn đầu tiên
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredOpen.map((s) => {
                  const isMine = user?.id === s.host.id;
                  return (
                    <Card key={s.id} className="p-5 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Badge variant="green">{s.major}</Badge>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="neutral">{s.level}</Badge>
                            <Badge variant={s.ageGroupScope === "UNDER_18" ? "gold" : "neutral"}>
                              {s.ageGroupScope === "UNDER_18" ? "Nhóm < 18 tuổi" : "Nhóm ≥ 18 tuổi"}
                            </Badge>
                          </div>
                        </div>

                        <Link
                          href={`/tinh-huong/${s.scenario.slug}`}
                          className="block font-heading text-base font-extrabold text-[var(--heading)] hover:text-[var(--primary)]"
                        >
                          {s.scenario.title}
                        </Link>

                        <div className="text-xs text-[var(--muted-foreground)] space-y-1">
                          <p className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-[var(--primary)]" />
                            <span>
                              <b>{s.slotLabel}</b> · {s.scenario.durationMinutes} phút
                            </span>
                          </p>
                          <p>
                            Người mở lịch: <b className="text-[var(--heading)]">{s.host.name}</b> ·{" "}
                            {s.host.school}
                          </p>
                          {s.notes && <p className="italic">“{s.notes}”</p>}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
                        {isMine ? (
                          <Badge variant="gold">Lịch của bạn đang chờ bạn cặp</Badge>
                        ) : (
                          <Button
                            size="sm"
                            disabled={busyId === s.id}
                            onClick={() => void handleJoinSession(s.id)}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            {busyId === s.id ? "Đang ghép..." : "Nhận ghép cặp lịch này"}
                          </Button>
                        )}

                        {!isMine && (
                          <button
                            type="button"
                            onClick={() =>
                              setReportTarget({
                                targetType: "SESSION",
                                targetId: s.id,
                                targetUserId: s.host.id,
                                targetUserName: s.host.name,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[var(--muted-foreground)] hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                          >
                            <Flag className="h-3 w-3" />
                            Báo cáo / Chặn
                          </button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREATE SESSION */}
        {tab === "create" && (
          <Card className="p-6 sm:p-8 max-w-2xl">
            <h2 className="font-heading text-xl font-extrabold text-[var(--heading)]">
              Đặt lịch hẹn luyện nói 1-1 mới
            </h2>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Hệ thống tự gán nhóm tuổi bảo vệ ({isMinor ? "Chỉ ghép với bạn < 18 tuổi cùng trường VSVC" : "Nhóm từ 18 tuổi trở lên"}) và tạo đường dẫn Google Meet tự động.
            </p>

            <form onSubmit={handleCreateSession} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--heading)]">
                  1. Chọn tình huống nghề nghiệp (3 lớp)
                </label>
                <select
                  value={scenarioId}
                  onChange={(e) => setScenarioId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                >
                  {scenarios.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      [{sc.major}] {sc.title} ({sc.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[var(--heading)]">
                    2. Ngày luyện dự kiến
                  </label>
                  <Input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[var(--heading)]">
                    3. Khung giờ rảnh
                  </label>
                  <select
                    value={slotLabel}
                    onChange={(e) => setSlotLabel(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                  >
                    {siteConfig.startupProject.defaultTimeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--heading)]">
                  4. Ghi chú luyện tập (không ghi SĐT / Zalo cá nhân)
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Mình muốn tập Vai A trước rồi đổi Vai B..."
                />
              </div>

              <label className="flex items-start gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-3.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={noRecordingConfirmed}
                  onChange={(e) => setNoRecordingConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#1a4d2e]"
                />
                <span>
                  Tôi cam kết tuân thủ <b>Nội quy thử nghiệm kín (Phụ lục B)</b>: không ghi âm/ghi hình
                  khi chưa có sự đồng ý, không trao đổi thông tin liên hệ cá nhân ngoài đường dẫn họp
                  của hệ thống.
                </span>
              </label>

              <Button type="submit" size="lg" disabled={creating}>
                <Plus className="h-4 w-4" />
                {creating ? "Đang tạo lịch hẹn..." : "Mở lịch ghép cặp ngay"}
              </Button>
            </form>
          </Card>
        )}

        {/* TAB 3: MY SESSIONS & RUBRIC */}
        {tab === "mine" && (
          <div className="space-y-4">
            {!user ? (
              <Card className="p-8 text-center">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Đăng nhập để xem lịch hẹn và phiếu rubric của bạn.
                </p>
              </Card>
            ) : mySessions.length === 0 ? (
              <Card className="p-8 text-center space-y-3">
                <p className="font-heading text-base font-bold text-[var(--heading)]">
                  Bạn chưa có buổi ghép cặp nào
                </p>
                <div className="flex justify-center gap-2">
                  <Button size="sm" onClick={() => setTab("open")}>
                    Tìm bạn ghép cặp
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setTab("create")}>
                    Tạo lịch hẹn mới
                  </Button>
                </div>
              </Card>
            ) : (
              mySessions.map((s) => {
                const isHost = user.id === s.host.id;
                const peer = isHost ? s.partner : s.host;
                const myRubric = s.rubrics.find((r) => r.reviewerId === user.id);
                const receivedRubric = s.rubrics.find((r) => r.targetUserId === user.id);
                const showRubricForm = rubricSessionId === s.id;

                return (
                  <Card key={s.id} className="p-5 sm:p-6 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              s.status === "COMPLETED"
                                ? "green"
                                : s.status === "MATCHED"
                                ? "gold"
                                : "neutral"
                            }
                          >
                            {s.status === "OPEN"
                              ? "Đang chờ bạn cặp"
                              : s.status === "MATCHED"
                              ? "Đã ghép cặp · Sẵn sàng họp"
                              : s.status === "COMPLETED"
                              ? "Đã hoàn thành"
                              : "Đã hủy"}
                          </Badge>
                          <Badge variant="neutral">{s.major}</Badge>
                          <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                            {s.slotLabel}
                          </span>
                        </div>
                        <Link
                          href={`/tinh-huong/${s.scenario.slug}`}
                          className="block font-heading text-lg font-extrabold text-[var(--heading)] hover:text-[var(--primary)]"
                        >
                          {s.scenario.title}
                        </Link>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Bạn cặp:{" "}
                          <b className="text-[var(--heading)]">
                            {peer ? `${peer.name} (${peer.selfLevel})` : "Chưa có bạn nhận"}
                          </b>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {s.meetingUrl && s.status !== "CANCELLED" && (
                          <a
                            href={s.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#19462b] px-3.5 text-xs font-bold text-white hover:opacity-90"
                          >
                            <Video className="h-3.5 w-3.5 text-[#9ee56f]" />
                            Vào Google Meet
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}

                        {s.status === "MATCHED" && (
                          <Button
                            size="sm"
                            disabled={busyId === s.id}
                            onClick={() => void handleSessionAction(s.id, "complete")}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Xác nhận hoàn thành (+35 EXP)
                          </Button>
                        )}

                        {(s.status === "OPEN" || s.status === "MATCHED") && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === s.id}
                            onClick={() => void handleSessionAction(s.id, "cancel")}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Hủy
                          </Button>
                        )}

                        {peer && (
                          <button
                            type="button"
                            onClick={() =>
                              setReportTarget({
                                targetType: "SESSION",
                                targetId: s.id,
                                targetUserId: peer.id,
                                targetUserName: peer.name,
                              })
                            }
                            className="inline-flex h-9 items-center gap-1 rounded-xl border border-rose-300 bg-rose-50 px-3 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                          >
                            <Flag className="h-3.5 w-3.5" />
                            Báo cáo / Chặn
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Rubric Feedback Trigger & Received Feedback */}
                    {(s.status === "MATCHED" || s.status === "COMPLETED") && peer && (
                      <div className="space-y-3 border-t border-[var(--border)] pt-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-[var(--heading)]">
                            <ClipboardCheck className="h-4 w-4 text-[var(--primary)]" />
                            <span>Phiếu nhận xét theo Rubric</span>
                          </div>
                          {!myRubric ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setRubricSessionId(showRubricForm ? null : s.id)
                              }
                            >
                              {showRubricForm
                                ? "Đóng biểu mẫu"
                                : "Điền phiếu nhận xét (+15 EXP)"}
                            </Button>
                          ) : (
                            <Badge variant="green">
                              Bạn đã chấm {myRubric.overallScore}/5 · Hài lòng{" "}
                              {myRubric.satisfactionRating}/5
                            </Badge>
                          )}
                        </div>

                        {showRubricForm && (
                          <form
                            onSubmit={handleSubmitRubric}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 space-y-3"
                          >
                            <p className="text-xs font-bold text-[var(--heading)]">
                              Chấm điểm bạn luyện ({peer.name}) theo 5 tiêu chí (thang 1–5):
                            </p>
                            <div className="grid gap-2.5 sm:grid-cols-2">
                              {DEFAULT_PRACTICE_RUBRIC.map((crit) => (
                                <div
                                  key={crit.id}
                                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-[var(--heading)]">
                                      {crit.criterion}
                                    </span>
                                    <span className="font-mono-num text-xs font-black text-[var(--primary)]">
                                      {rubricScores[crit.id] ?? 4}/5
                                    </span>
                                  </div>
                                  <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                                    {crit.description}
                                  </p>
                                  <div className="mt-2 flex gap-1.5">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                      <button
                                        key={n}
                                        type="button"
                                        onClick={() =>
                                          setRubricScores((prev) => ({
                                            ...prev,
                                            [crit.id]: n,
                                          }))
                                        }
                                        className={cn(
                                          "h-7 w-7 rounded-lg border text-xs font-bold cursor-pointer",
                                          (rubricScores[crit.id] ?? 4) === n
                                            ? "border-[#1b2d1c] bg-[#9ee56f] text-[#102414]"
                                            : "border-[var(--border)] bg-[var(--surface-alt)] text-[var(--muted-foreground)]"
                                        )}
                                      >
                                        {n}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-bold text-[var(--heading)]">
                                Mức độ hài lòng về buổi luyện (chỉ tiêu 0b ≥ 4/5):
                              </span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setSatisfactionRating(star)}
                                    className="p-1 cursor-pointer"
                                  >
                                    <Star
                                      className={cn(
                                        "h-5 w-5",
                                        star <= satisfactionRating
                                          ? "fill-amber-400 text-amber-400"
                                          : "text-slate-300"
                                      )}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs font-bold text-[var(--heading)]">
                                  Điểm mạnh của bạn luyện
                                </label>
                                <textarea
                                  required
                                  minLength={4}
                                  rows={2}
                                  value={strengths}
                                  onChange={(e) => setStrengths(e.target.value)}
                                  placeholder="Ví dụ: Dùng thuật ngữ chính xác, giọng rõ..."
                                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 text-xs outline-none"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-bold text-[var(--heading)]">
                                  Điểm cần cải thiện
                                </label>
                                <textarea
                                  required
                                  minLength={4}
                                  rows={2}
                                  value={improvements}
                                  onChange={(e) => setImprovements(e.target.value)}
                                  placeholder="Ví dụ: Chú ý thêm âm cuối -s/-ed..."
                                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 text-xs outline-none"
                                />
                              </div>
                            </div>

                            <Button type="submit" size="sm" disabled={submittingRubric}>
                              {submittingRubric ? "Đang lưu..." : "Gửi phiếu Rubric (+15 EXP)"}
                            </Button>
                          </form>
                        )}

                        {receivedRubric && (
                          <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-3.5 text-xs text-emerald-950 space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-extrabold">
                                Nhận xét bạn nhận được: {receivedRubric.overallScore}/5 điểm
                              </span>
                              {receivedRubric.mentorReviewed && (
                                <Badge variant="green">Mentor đã rà soát mẫu</Badge>
                              )}
                            </div>
                            <p>
                              <b>Điểm mạnh:</b> {receivedRubric.strengths}
                            </p>
                            <p>
                              <b>Cần cải thiện:</b> {receivedRubric.improvements}
                            </p>
                            {receivedRubric.mentorNote && (
                              <p className="italic text-emerald-800">
                                <b>Ghi chú Mentor:</b> {receivedRubric.mentorNote}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* TAB 4: BLOCKED USERS */}
        {tab === "blocked" && (
          <Card className="p-6 space-y-4">
            <h2 className="font-heading text-lg font-extrabold text-[var(--heading)] flex items-center gap-2">
              <Ban className="h-5 w-5 text-rose-600" />
              Danh sách tài khoản đã chặn ({blockedUsers.length})
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Các tài khoản trong danh sách này sẽ không thể ghép cặp với bạn và bài viết của họ sẽ bị ẩn trên bảng tin Cộng đồng.
            </p>
            {blockedUsers.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)]">
                Bạn chưa chặn tài khoản nào.
              </p>
            ) : (
              <div className="space-y-2.5">
                {blockedUsers.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[var(--heading)]">{b.blocked.name}</p>
                      <p className="text-[var(--muted-foreground)]">
                        {b.blocked.major} · {b.blocked.school}
                        {b.reason ? ` · ${b.reason}` : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleUnblock(b.blocked.id)}
                    >
                      Bỏ chặn
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {reportTarget && (
        <ReportBlockModal
          open={Boolean(reportTarget)}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.targetType}
          targetId={reportTarget.targetId}
          targetUserId={reportTarget.targetUserId}
          targetUserName={reportTarget.targetUserName}
          onBlocked={() => void reloadSessions()}
        />
      )}
    </div>
  );
}
