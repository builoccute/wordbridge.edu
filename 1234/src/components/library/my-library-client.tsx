"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  CheckCircle2,
  Download,
  FileCheck2,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  UserCheck,
} from "lucide-react";
import { Mascot } from "@/components/brand/mascot";
import { useApp } from "@/components/providers/app-provider";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { Card } from "@/components/ui";
import { Input } from "@/components/ui";
import { getAgeGroupLabel, isMinorAgeGroup } from "@/lib/utils";
import type { PublicUser } from "@/lib/auth";
import { siteConfig } from "@/lib/site-config";
import { cn, formatTimer, safeJsonParse } from "@/lib/utils";

interface MyLibraryProps {
  initialUser: PublicUser | null;
  savedDocs: Array<{
    id: string;
    slug: string;
    title: string;
    level: string;
    categoryName: string;
  }>;
  allDocsCatalog: Array<{
    id: string;
    slug: string;
    title: string;
    level: string;
    categoryName: string;
  }>;
  grammarProgress: Array<{
    lessonSlug: string;
    lessonTitle: string;
    topicTitle: string;
    completed: boolean;
    bestScore: number;
    totalQuestions: number;
  }>;
  examAttempts: Array<{
    id: string;
    testSlug: string;
    testTitle: string;
    listeningScore: number;
    readingScore: number;
    totalScore: number;
    durationSeconds: number;
    completedAtIso: string;
  }>;
}

export function MyLibraryClient({
  initialUser,
  savedDocs,
  allDocsCatalog,
  grammarProgress,
  examAttempts,
}: MyLibraryProps) {
  const { user, guestSavedDocIds, openAuthModal, refreshUser, logout, notify } = useApp();
  const activeUser = user ?? initialUser;
  const [editingProfile, setEditingProfile] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState(activeUser?.name ?? "");
  const [targetDraft, setTargetDraft] = React.useState(String(activeUser?.targetScore ?? 750));
  const [savingProfile, setSavingProfile] = React.useState(false);

  // VSVC Closed-Beta MVP Profile & Data Rights state
  const [profileName, setProfileName] = React.useState(activeUser?.name || "");
  const [dob, setDob] = React.useState(() => {
    if (!activeUser?.dateOfBirth) return "";
    const d = new Date(activeUser.dateOfBirth);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  });
  const [school, setSchool] = React.useState(
    activeUser?.school || siteConfig.startupProject.unit
  );
  const [major, setMajor] = React.useState(activeUser?.major || "Tin học");
  const [studentGroup, setStudentGroup] = React.useState(activeUser?.studentGroup || "N1");
  const [selfLevel, setSelfLevel] = React.useState(activeUser?.selfLevel || "Cơ bản (A2)");
  const [availableSlots, setAvailableSlots] = React.useState<string[]>(() =>
    safeJsonParse<string[]>(activeUser?.availableSlotsJson || "[]", [])
  );
  const [inviteCode, setInviteCode] = React.useState("");
  const [guardianName, setGuardianName] = React.useState(activeUser?.guardianName || "");
  const [guardianRelation, setGuardianRelation] = React.useState(
    activeUser?.guardianRelation || "Phụ huynh"
  );
  const [guardianContact, setGuardianContact] = React.useState(activeUser?.guardianContact || "");
  const [acceptRules, setAcceptRules] = React.useState(Boolean(activeUser?.betaRulesAcceptedAt));
  const [savingBetaProfile, setSavingBetaProfile] = React.useState(false);

  // Parent Consent form
  const [consentPhone, setConsentPhone] = React.useState("");
  const [consentEmail, setConsentEmail] = React.useState("");
  const [consentCheck1, setConsentCheck1] = React.useState(true);
  const [consentCheck2, setConsentCheck2] = React.useState(true);
  const [consentCheck3, setConsentCheck3] = React.useState(true);
  const [submittingConsent, setSubmittingConsent] = React.useState(false);

  // Data export / withdrawal & password setup
  const [exportJson, setExportJson] = React.useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const [deletingAccount, setDeletingAccount] = React.useState(false);
  const [currentPasswordDraft, setCurrentPasswordDraft] = React.useState("");
  const [newPasswordDraft, setNewPasswordDraft] = React.useState("");
  const [savingPassword, setSavingPassword] = React.useState(false);

  const handleSetOrChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordDraft.length < 6) {
      notify("Mật khẩu mới cần tối thiểu 6 ký tự.", "error");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPasswordDraft || undefined,
          newPassword: newPasswordDraft,
        }),
      });
      const json = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!json.success) {
        notify(json.error?.message || "Không thể lưu mật khẩu.", "error");
        return;
      }
      setCurrentPasswordDraft("");
      setNewPasswordDraft("");
      notify("Đã lưu mật khẩu cho tài khoản! Bạn có thể đăng nhập bằng Email + Mật khẩu.", "success");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveBetaProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBetaProfile(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          dateOfBirth: dob || undefined,
          school,
          major,
          studentGroup,
          selfLevel,
          availableSlots,
          inviteCode: inviteCode.trim() || undefined,
          guardianName: guardianName.trim() || undefined,
          guardianRelation: guardianRelation.trim() || undefined,
          guardianContact: guardianContact.trim() || undefined,
          acceptBetaRules: acceptRules,
          acceptDataPolicy: true,
        }),
      });
      const json = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!json.success) {
        notify(json.error?.message || "Không thể cập nhật hồ sơ.", "error");
        return;
      }
      setInviteCode("");
      await refreshUser();
      notify("Đã cập nhật hồ sơ thử nghiệm kín VSVC!", "success");
    } finally {
      setSavingBetaProfile(false);
    }
  };

  const handleSubmitParentConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingConsent(true);
    try {
      const res = await fetch("/api/parent-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guardianName: guardianName || "Phụ huynh học viên",
          guardianRelation,
          guardianPhone: consentPhone || guardianContact,
          guardianEmail: consentEmail,
          agreedRules: consentCheck1,
          agreedDataPolicy: consentCheck2,
          agreedUnder18Protection: consentCheck3,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { message?: string };
        error?: { message: string };
      };
      if (!json.success) {
        notify(json.error?.message || "Không thể gửi phiếu đồng ý.", "error");
        return;
      }
      await refreshUser();
      notify(json.data?.message || "Đã gửi phiếu đồng ý phụ huynh!", "success");
    } finally {
      setSubmittingConsent(false);
    }
  };

  const handleExportMyData = async () => {
    const res = await fetch("/api/auth/my-data", { cache: "no-store" });
    const json = (await res.json()) as { success: boolean; data?: unknown };
    if (json.success && json.data) {
      setExportJson(JSON.stringify(json.data, null, 2));
      notify("Đã tải bản sao dữ liệu cá nhân theo Luật BVDLCN 91/2025/QH15.", "success");
    }
  };

  const handleWithdrawAndDelete = async () => {
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Người dùng tự rút khỏi thử nghiệm và yêu cầu xóa dữ liệu.",
        }),
      });
      const json = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!json.success) {
        notify(json.error?.message || "Không thể xóa dữ liệu.", "error");
        return;
      }
      setConfirmDeleteOpen(false);
      await logout();
      notify("Đã xóa toàn bộ dữ liệu cá nhân và rút khỏi thử nghiệm.", "info");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameDraft.trim(),
          targetScore: Number(targetDraft),
        }),
      });
      const json = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!json.success) {
        notify(json.error?.message || "Không thể cập nhật hồ sơ.", "error");
        return;
      }
      await refreshUser();
      setEditingProfile(false);
      notify("Đã lưu mục tiêu và tên hiển thị!", "success");
    } catch {
      notify("Không thể kết nối máy chủ.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const guestDocs = React.useMemo(() => {
    if (activeUser) return [];
    const set = new Set(guestSavedDocIds);
    return allDocsCatalog.filter((d) => set.has(d.id));
  }, [activeUser, guestSavedDocIds, allDocsCatalog]);

  if (!activeUser) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 space-y-6">
        <Card className="p-8 text-center">
          <div className="mx-auto flex justify-center">
            <Mascot size={88} mood="happy" />
          </div>
          <Badge variant="gold" className="mt-3">Chế độ khách</Badge>
          <h1 className="mt-2 font-heading text-2xl font-extrabold text-[var(--heading)]">
            Kho cá nhân &amp; Nhật ký tiến độ
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--muted-foreground)]">
            Tạo tài khoản bằng Email &amp; Mật khẩu riêng (hoặc đăng nhập bằng OTP 6 số / Google) để đồng bộ tài liệu đã lưu, lịch luyện ghép cặp và bảng điểm.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button size="lg">Tạo tài khoản &amp; mật khẩu</Button>
            </Link>
            <Button size="lg" variant="secondary" onClick={() => openAuthModal()}>
              Đăng nhập
            </Button>
            <Link href="/luyen-de">
              <Button size="lg" variant="outline">Làm thử đề TOEIC ngay</Button>
            </Link>
          </div>
        </Card>

        {guestDocs.length > 0 && (
          <Card className="p-6">
            <h2 className="font-heading text-lg font-bold text-[var(--heading)]">
              Tài liệu bạn vừa lưu tạm ({guestDocs.length})
            </h2>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Những tài liệu này đang nằm trong trình duyệt và sẽ tự động chuyển lên tài khoản ngay khi bạn đăng nhập.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {guestDocs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.slug}`}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-3.5 hover:border-[var(--primary)]"
                >
                  <div>
                    <Badge variant="green">{doc.categoryName}</Badge>
                    <p className="mt-1.5 text-sm font-bold text-[var(--heading)]">{doc.title}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-8">
      {/* Profile Header */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Mascot size={74} mood="cheer" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="green">Hồ sơ học tập</Badge>
                {activeUser.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1 rounded-full border border-[#1b2d1c] bg-[#9ee56f] px-2.5 py-0.5 text-[11px] font-black text-[#122618]"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Mở Admin Studio
                  </Link>
                )}
              </div>
              <h1 className="mt-1 font-heading text-2xl font-extrabold text-[var(--heading)]">
                {activeUser.name}
              </h1>
              <p className="text-xs text-[var(--muted-foreground)]">{activeUser.email}</p>
              <button
                type="button"
                onClick={() => {
                  setNameDraft(activeUser.name);
                  setTargetDraft(String(activeUser.targetScore));
                  setEditingProfile((v) => !v);
                }}
                className="mt-2 text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
              >
                {editingProfile ? "Đóng chỉnh sửa" : "Chỉnh sửa tên & mục tiêu →"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-center">
              <Sparkles className="mx-auto h-4 w-4 text-[var(--primary)]" />
              <p className="mt-1 font-mono-num text-xl font-bold text-[var(--heading)]">
                {activeUser.xp}
              </p>
              <p className="text-[11px] text-[var(--muted-foreground)]">Điểm XP</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-center">
              <Flame className="mx-auto h-4 w-4 text-amber-500" />
              <p className="mt-1 font-mono-num text-xl font-bold text-[var(--heading)]">
                {activeUser.streakDays} ngày
              </p>
              <p className="text-[11px] text-[var(--muted-foreground)]">Streak</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-center">
              <Trophy className="mx-auto h-4 w-4 text-[var(--gold)]" />
              <p className="mt-1 font-mono-num text-xl font-bold text-[var(--heading)]">
                {activeUser.targetScore}
              </p>
              <p className="text-[11px] text-[var(--muted-foreground)]">Mục tiêu</p>
            </div>
          </div>
        </div>

        {editingProfile && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-5 grid gap-3 border-t border-[var(--border)] pt-5 sm:grid-cols-[1fr_180px_auto] sm:items-end"
          >
            <div>
              <label className="mb-1 block text-xs font-bold">Tên hiển thị</label>
              <Input
                required
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Tên của bạn"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Mục tiêu TOEIC (300–990)</label>
              <Input
                type="number"
                min={300}
                max={990}
                step={5}
                value={targetDraft}
                onChange={(e) => setTargetDraft(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </form>
        )}
      </Card>

      {/* Exam Attempts */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-[var(--heading)]">
            <FileCheck2 className="h-5 w-5 text-[var(--primary)]" />
            Lịch sử luyện đề TOEIC ({examAttempts.length})
          </h2>
          <Link href="/luyen-de" className="text-xs font-semibold text-[var(--primary)] hover:underline">
            Làm thêm đề &rarr;
          </Link>
        </div>

        {examAttempts.length === 0 ? (
          <Card className="mt-3 p-6 text-sm text-[var(--muted-foreground)]">
            Bạn chưa nộp đề thi nào. Hãy thử sức ngay ở mục{" "}
            <Link href="/luyen-de" className="font-semibold text-[var(--primary)] underline">
              Luyện đề TOEIC
            </Link>
            !
          </Card>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {examAttempts.map((att) => (
              <Card key={att.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/luyen-de/thi/${att.testSlug}`}
                    className="font-heading text-sm font-bold text-[var(--heading)] hover:text-[var(--primary)]"
                  >
                    {att.testTitle}
                  </Link>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    L: {att.listeningScore} · R: {att.readingScore} · Thời gian: {formatTimer(att.durationSeconds)}
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--primary-soft)] px-3 py-1.5 text-center">
                  <span className="font-mono-num text-lg font-extrabold text-[var(--primary)]">
                    {att.totalScore}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Grammar Progress + Saved Docs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-[var(--heading)]">
              <CheckCircle2 className="h-5 w-5 text-[var(--primary)]" />
              Ngữ pháp đã học ({grammarProgress.length})
            </h2>
            <Link href="/ngu-phap" className="text-xs font-semibold text-[var(--primary)] hover:underline">
              Mở lộ trình &rarr;
            </Link>
          </div>
          <div className="mt-3 space-y-2.5">
            {grammarProgress.length === 0 ? (
              <Card className="p-5 text-sm text-[var(--muted-foreground)]">
                Chưa có bài học ngữ pháp nào hoàn thành.
              </Card>
            ) : (
              grammarProgress.map((gp) => (
                <Link key={gp.lessonSlug} href={`/ngu-phap/${gp.lessonSlug}`} className="block">
                  <Card className="p-4 hover:border-[var(--primary)]">
                    <p className="text-xs text-[var(--muted-foreground)]">{gp.topicTitle}</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="font-heading text-sm font-bold text-[var(--heading)]">
                        {gp.lessonTitle}
                      </p>
                      <Badge variant="green">
                        {gp.bestScore}/{gp.totalQuestions}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-[var(--heading)]">
              <BookMarked className="h-5 w-5 text-[var(--gold)]" />
              Tài liệu đã lưu ({savedDocs.length})
            </h2>
            <Link href="/documents" className="text-xs font-semibold text-[var(--primary)] hover:underline">
              Duyệt thêm &rarr;
            </Link>
          </div>
          <div className="mt-3 space-y-2.5">
            {savedDocs.length === 0 ? (
              <Card className="p-5 text-sm text-[var(--muted-foreground)]">
                Bạn chưa đánh dấu tài liệu nào.
              </Card>
            ) : (
              savedDocs.map((doc) => (
                <Link key={doc.id} href={`/documents/${doc.slug}`} className="block">
                  <Card className="p-4 hover:border-[var(--primary)]">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="green">{doc.categoryName}</Badge>
                      <Badge variant="neutral">{doc.level}</Badge>
                    </div>
                    <p className="mt-1.5 font-heading text-sm font-bold text-[var(--heading)]">
                      {doc.title}
                    </p>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      {/* VSVC Closed-Beta MVP Profile & Under-18 Protection */}
      <section id="ho-so-vsvc" className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Badge variant="green">Mục VII.2 · Hồ sơ tối thiểu</Badge>
              <h2 className="mt-1 font-heading text-lg font-extrabold text-[var(--heading)]">
                Hồ sơ Thử nghiệm kín &amp; Ghép cặp VSVC
              </h2>
            </div>
            <Badge variant={activeUser.approvalStatus === "APPROVED" ? "green" : "gold"}>
              {activeUser.approvalStatus === "APPROVED" ? "Đã duyệt nhóm kín" : activeUser.approvalStatus}
            </Badge>
          </div>

          <p className="text-xs text-[var(--muted-foreground)]">
            Chỉ thu thập họ tên, ngày sinh (phân nhóm tuổi bảo vệ), ngành, trình độ tự đánh giá và
            khung giờ rảnh. Không thu giấy tờ tùy thân (CCCD).
          </p>

          <form onSubmit={handleSaveBetaProfile} className="space-y-3 text-xs">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-bold text-[var(--heading)]">Họ và tên</label>
                <Input
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-[var(--heading)]">
                  Ngày sinh ({getAgeGroupLabel(activeUser.ageGroup)})
                </label>
                <Input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-bold text-[var(--heading)]">Nhóm khách hàng</label>
                <select
                  value={studentGroup}
                  onChange={(e) => setStudentGroup(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold"
                >
                  <option value="N1">N1 · HSSV trường nghề / cao đẳng</option>
                  <option value="N2">N2 · Sinh viên đại học</option>
                  <option value="N3">N3 · Người đang đi làm</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-bold text-[var(--heading)]">Ngành / Khoa</label>
                <select
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold"
                >
                  {siteConfig.startupProject.majors.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-bold text-[var(--heading)]">Trình độ tự đánh giá</label>
                <select
                  value={selfLevel}
                  onChange={(e) => setSelfLevel(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold"
                >
                  {siteConfig.startupProject.selfLevels.map((lv) => (
                    <option key={lv} value={lv}>
                      {lv}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-bold text-[var(--heading)]">
                  Mã mời giáo viên (nếu cần duyệt nhanh)
                </label>
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder={activeUser.inviteCodeUsed || "Ví dụ: VSVC-2026"}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-bold text-[var(--heading)]">Trường / Đơn vị</label>
                <Input value={school} onChange={(e) => setSchool(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block font-bold text-[var(--heading)]">
                  Liên hệ giám hộ (bắt buộc nếu &lt; 16 tuổi)
                </label>
                <Input
                  value={guardianContact}
                  onChange={(e) => setGuardianContact(e.target.value)}
                  placeholder="SĐT hoặc email cha/mẹ/người giám hộ"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-bold text-[var(--heading)]">
                Khung giờ rảnh luyện nói mỗi tuần
              </label>
              <div className="flex flex-wrap gap-1.5">
                {siteConfig.startupProject.defaultTimeSlots.map((slot) => {
                  const selected = availableSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() =>
                        setAvailableSlots((prev) =>
                          prev.includes(slot) ? prev.filter((x) => x !== slot) : [...prev, slot]
                        )
                      }
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-[11px] font-semibold cursor-pointer",
                        selected
                          ? "border-[#1b2d1c] bg-[#9ee56f] text-[#102414]"
                          : "border-[var(--border)] bg-[var(--surface-alt)]"
                      )}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptRules}
                onChange={(e) => setAcceptRules(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#1a4d2e]"
              />
              <span>
                Tôi đồng ý tuân thủ{" "}
                <Link href="/chinh-sach/noi-quy-thu-nghiem-kin" className="font-bold underline">
                  Nội quy thử nghiệm kín (Phụ lục B)
                </Link>{" "}
                và Chính sách bảo vệ dữ liệu cá nhân.
              </span>
            </label>

            <Button type="submit" disabled={savingBetaProfile}>
              {savingBetaProfile ? "Đang lưu..." : "Lưu hồ sơ VSVC"}
            </Button>
          </form>
        </Card>

        {/* Parent Consent & Data Rights */}
        <div className="space-y-6">
          <Card id="phieu-phu-huynh" className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Badge variant={isMinorAgeGroup(activeUser.ageGroup) ? "gold" : "neutral"}>
                  Mục VIII · Bảo vệ người &lt; 18 tuổi
                </Badge>
                <h2 className="mt-1 font-heading text-lg font-extrabold text-[var(--heading)]">
                  Phiếu đồng ý Phụ huynh / Giám hộ
                </h2>
              </div>
              <Badge variant={activeUser.parentConsentStatus === "APPROVED" ? "green" : "gold"}>
                {activeUser.parentConsentStatus === "APPROVED"
                  ? "Đã duyệt"
                  : activeUser.parentConsentStatus === "PENDING"
                  ? "Đang chờ GV duyệt"
                  : activeUser.parentConsentStatus}
              </Badge>
            </div>

            {activeUser.parentMonitorCode && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2">
                <span>
                  Mã theo dõi dành cho Phụ huynh:{" "}
                  <b className="font-mono-num">{activeUser.parentMonitorCode}</b>
                </span>
                <Link
                  href={`/phu-huynh?code=${activeUser.parentMonitorCode}`}
                  className="font-bold underline"
                >
                  Mở Cổng Phụ huynh &rarr;
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmitParentConsent} className="space-y-3 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-[var(--heading)]">
                    Họ tên Cha / Mẹ / Giám hộ
                  </label>
                  <Input
                    required
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[var(--heading)]">Quan hệ</label>
                  <Input
                    required
                    value={guardianRelation}
                    onChange={(e) => setGuardianRelation(e.target.value)}
                    placeholder="Cha / Mẹ / Người giám hộ"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-[var(--heading)]">
                    SĐT Phụ huynh xác nhận
                  </label>
                  <Input
                    required
                    value={consentPhone}
                    onChange={(e) => setConsentPhone(e.target.value)}
                    placeholder="09xxxxxxxx"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[var(--heading)]">
                    Email Phụ huynh (tuỳ chọn)
                  </label>
                  <Input
                    type="email"
                    value={consentEmail}
                    onChange={(e) => setConsentEmail(e.target.value)}
                    placeholder="phuhuynh@gmail.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentCheck1}
                    onChange={(e) => setConsentCheck1(e.target.checked)}
                    className="mt-0.5 accent-[#1a4d2e]"
                  />
                  <span>Phụ huynh đồng ý cho học viên tham gia thử nghiệm kín tại VSVC.</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentCheck2}
                    onChange={(e) => setConsentCheck2(e.target.checked)}
                    className="mt-0.5 accent-[#1a4d2e]"
                  />
                  <span>
                    Xác nhận cơ chế bảo vệ: chỉ ghép cặp cùng trường &amp; cùng nhóm tuổi (&lt;18),
                    không nhắn tin riêng, không lưu ghi âm.
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentCheck3}
                    onChange={(e) => setConsentCheck3(e.target.checked)}
                    className="mt-0.5 accent-[#1a4d2e]"
                  />
                  <span>Phụ huynh nắm được quyền theo dõi lịch luyện, xem/sửa/xóa dữ liệu của con.</span>
                </label>
              </div>

              <Button type="submit" variant="outline" disabled={submittingConsent}>
                <UserCheck className="h-4 w-4" />
                {submittingConsent ? "Đang gửi phiếu..." : "Gửi Phiếu đồng ý Phụ huynh"}
              </Button>
            </form>
          </Card>

          <Card className="p-6 space-y-4 border-2 border-[#1b2d1c]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[var(--primary)]" />
              <h2 className="font-heading text-lg font-extrabold text-[var(--heading)]">
                Quyền Dữ liệu Cá nhân (Luật 91/2025/QH15 &amp; Phụ lục B)
              </h2>
            </div>
            <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
              Bạn (hoặc phụ huynh của học viên dưới 18 tuổi) có quyền xem, trích xuất bản sao dữ
              liệu hoặc xóa vĩnh viễn toàn bộ dữ liệu để rút khỏi thử nghiệm bất cứ lúc nào.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Button type="button" variant="outline" size="sm" onClick={handleExportMyData}>
                <Download className="h-3.5 w-3.5" />
                Xem / Trích xuất dữ liệu của tôi
              </Button>
              {activeUser.role !== "ADMIN" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50"
                  onClick={() => setConfirmDeleteOpen((v) => !v)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Rút khỏi thử nghiệm &amp; Xóa dữ liệu
                </Button>
              )}
            </div>

            {confirmDeleteOpen && (
              <div className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-xs text-rose-950 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-rose-700" />
                  Xác nhận xóa vĩnh viễn tài khoản và toàn bộ dữ liệu cá nhân?
                </p>
                <p>Hành động này không thể hoàn tác. Bạn có thể đăng ký lại sau nếu muốn.</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={deletingAccount}
                    className="bg-rose-700 hover:bg-rose-800 text-white"
                    onClick={handleWithdrawAndDelete}
                  >
                    {deletingAccount ? "Đang xóa..." : "Xác nhận xóa vĩnh viễn"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDeleteOpen(false)}
                  >
                    Giữ lại tài khoản
                  </Button>
                </div>
              </div>
            )}

            {exportJson && (
              <pre className="max-h-56 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3 font-mono-num text-[11px]">
                {exportJson}
              </pre>
            )}

            <form
              onSubmit={handleSetOrChangePassword}
              className="space-y-2.5 border-t border-[var(--border)] pt-4 text-xs"
            >
              <p className="font-bold text-[var(--heading)]">
                Đặt hoặc Đổi mật khẩu đăng nhập (không cần Google / OTP)
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  type="password"
                  value={currentPasswordDraft}
                  onChange={(e) => setCurrentPasswordDraft(e.target.value)}
                  placeholder="Mật khẩu hiện tại (bỏ trống nếu chưa từng đặt)"
                />
                <Input
                  type="password"
                  minLength={6}
                  required
                  value={newPasswordDraft}
                  onChange={(e) => setNewPasswordDraft(e.target.value)}
                  placeholder="Mật khẩu mới (≥ 6 ký tự)"
                />
              </div>
              <Button type="submit" size="sm" variant="outline" disabled={savingPassword}>
                {savingPassword ? "Đang lưu..." : "Lưu mật khẩu"}
              </Button>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
}
