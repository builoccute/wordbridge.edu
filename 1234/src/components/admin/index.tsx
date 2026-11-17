"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, BarChart3, BookOpen, CheckCircle2, ChevronDown, ChevronUp, ClipboardCheck, Clock, Database, Download, ExternalLink, FileText, Flame, FolderPlus, GraduationCap, HeartHandshake, KeyRound, Layers, LayoutDashboard, ListChecks, Lock, LogOut, Mail, Menu, MessageSquare, Moon, Pencil, Pin, PinOff, Plus, RefreshCw, Search, ShieldAlert, ShieldCheck, Sparkles, Star, Sun, Trash2, Trophy, UserCheck, Users, X, XCircle } from "lucide-react";
import { adminRequest } from "@/components/admin/admin-types";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mascot } from "@/components/brand/mascot";
import { useApp } from "@/components/providers/app-provider";
import { Input } from "@/components/ui";
import { Tilt3D } from "@/components/ui";
import type { PublicUser } from "@/lib/auth";
import { siteConfig } from "@/lib/site-config";
import type { AdminTabId } from "@/components/admin/admin-types";
import { formatShortDateTime } from "@/components/admin/admin-types";
import { Badge } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { AdminOverviewPayload } from "@/lib/prisma";
import { formatViNumber, formatVnd } from "@/lib/utils";
import { adminRequest, formatShortDateTime, type AdminUserRow } from "@/components/admin/admin-types";
import { Modal } from "@/components/ui";
import { cn, formatViNumber } from "@/lib/utils";
import { adminRequest, type AdminCategoryRow, type AdminDocumentRow, } from "@/components/admin/admin-types";
import { cn, formatViNumber, formatVnd, safeJsonParse } from "@/lib/utils";
import { adminRequest, type AdminExamQuestionRow, type AdminExamSetRow, type AdminExamTestRow, } from "@/components/admin/admin-types";
import { cn, safeJsonParse } from "@/lib/utils";
import { adminRequest, type AdminGrammarLessonRow, type AdminGrammarTopicRow, } from "@/components/admin/admin-types";
import { adminRequest, formatShortDateTime, type AdminCommunityPostRow, } from "@/components/admin/admin-types";
import { adminRequest, formatShortDateTime, type AdminDonationRow, } from "@/components/admin/admin-types";
import { cn, formatVnd } from "@/lib/utils";
import { Card } from "@/components/ui";
import type { Phase0bKpiSummary, SurveyAnalyticsSummary } from "@/lib/prisma";
import { adminRequest, type AdminTabId } from "@/components/admin/admin-types";
import { SourceStorageStudio } from "@/components/storage/source-storage-studio";

// === admin-shared.tsx ===
/** Shared async data loader hook for Admin tabs that avoids synchronous setState inside effects. */
export function useAdminQuery<T>(
  url: string,
  initialValue: T,
  notify: (message: string, tone?: "success" | "info" | "error") => void
) {
  const [data, setData] = React.useState<T>(initialValue);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    adminRequest<T>(url)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) {
          notify(err instanceof Error ? err.message : "Không thể tải dữ liệu quản trị.", "error");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url, notify]);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminRequest<T>(url);
      setData(res);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể tải dữ liệu quản trị.", "error");
    } finally {
      setLoading(false);
    }
  }, [url, notify]);

  return { data, setData, loading, reload };
}

interface AdminPanelHeaderProps {
  title: string;
  description: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  actions?: React.ReactNode;
}

/** Shared section heading strip used across all Admin Studio management tabs. */
export function AdminPanelHeader({
  title,
  description,
  onRefresh,
  refreshing = false,
  actions,
}: AdminPanelHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-heading text-xl font-extrabold tracking-tight text-[var(--heading)] sm:text-2xl">
          {title}
        </h2>
        <p className="mt-0.5 text-xs sm:text-sm text-[var(--muted-foreground)]">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Làm mới
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}

interface AdminDeleteButtonProps {
  onConfirm: () => Promise<void> | void;
  busy?: boolean;
  label?: string;
}

/** Two-step inline delete confirmation button avoiding native window.confirm() popups. */
export function AdminDeleteButton({
  onConfirm,
  busy = false,
  label = "Xoá",
}: AdminDeleteButtonProps) {
  const [armed, setArmed] = React.useState(false);

  if (armed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-1.5 py-0.5 dark:border-rose-500/40 dark:bg-rose-950/40">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            await onConfirm();
            setArmed(false);
          }}
          className="cursor-pointer px-1.5 py-0.5 text-[11px] font-bold text-rose-700 hover:underline disabled:opacity-50 dark:text-rose-300"
        >
          Xác nhận
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setArmed(false)}
          className="cursor-pointer px-1 py-0.5 text-[11px] font-semibold text-[var(--muted-foreground)] hover:text-[var(--heading)]"
        >
          Huỷ
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => setArmed(true)}
      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-950/30"
    >
      <Trash2 className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}

export function AdminEmptyState({
  icon,
  message,
}: {
  icon: React.ReactNode;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-alt)] px-4 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--muted-foreground)]">
        {icon}
      </div>
      <p className="mt-3 text-sm font-medium text-[var(--muted-foreground)]">{message}</p>
    </div>
  );
}

export const adminFieldClass =
  "flex h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]";

export const adminTextareaClass =
  "w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]";

// === admin-access-gate.tsx ===
interface AdminAccessGateProps {
  currentUser: PublicUser | null;
}

/** Server-enforced access screen allowing authenticated ADMIN OTP sign-in or account switch. */
export function AdminAccessGate({ currentUser }: AdminAccessGateProps) {
  const router = useRouter();
  const { refreshUser, logout, notify } = useApp();
  const [authMethod, setAuthMethod] = React.useState<"password" | "otp">("password");
  const [step, setStep] = React.useState<"email" | "otp">("email");
  const [email, setEmail] = React.useState(siteConfig.brand.email);
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [devHint, setDevHint] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { user?: PublicUser };
        error?: { message?: string };
      };
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Email hoặc mật khẩu không đúng.");
        return;
      }
      await refreshUser();
      if (json.data?.user?.role === "ADMIN") {
        notify("Đăng nhập Admin Studio thành công!", "success");
      } else {
        notify("Tài khoản này chưa được cấp quyền ADMIN.", "error");
      }
      router.refresh();
    } catch {
      setError("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { devOtpHint?: string };
        error?: { message?: string };
      };
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Không thể gửi mã OTP.");
        return;
      }
      setDevHint(json.data?.devOtpHint ?? null);
      setStep("otp");
    } catch {
      setError("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { user?: PublicUser };
        error?: { message?: string };
      };
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Mã OTP không hợp lệ.");
        return;
      }
      await refreshUser();
      if (json.data?.user?.role === "ADMIN") {
        notify("Đăng nhập Admin Studio thành công!", "success");
      } else {
        notify("Tài khoản này chưa được cấp quyền ADMIN.", "error");
      }
      router.refresh();
    } catch {
      setError("Xác thực OTP thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutSwitch = async () => {
    await logout();
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#f6f3ea] bg-paper-grid px-4 py-10 sm:px-6 dark:bg-[#0c130e]">
      <div className="mx-auto max-w-xl">
        <div className="mb-5 flex items-center justify-between text-xs font-semibold text-[var(--muted-foreground)]">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 hover:text-[var(--heading)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Về trang chủ {siteConfig.brand.name}</span>
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-bold">
            <ShieldCheck className="h-3.5 w-3.5 text-[#19462b] dark:text-[#9ee56f]" />
            Khu vực Quản trị
          </span>
        </div>

        <Tilt3D maxTilt={4} scale={1.005} glare={false}>
          <div className="rounded-[28px] border-2 border-[#1b2d1c] bg-white p-6 sm:p-8 shadow-[6px_6px_0_#1b2d1c] dark:border-[#9ee56f]/35 dark:bg-[#16211a] dark:shadow-[6px_6px_0_#070d09]">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-[#1b2d1c] bg-[#9ee56f] shadow-[3px_3px_0_#1b2d1c]">
                <Mascot size={34} mood={currentUser ? "study" : "happy"} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#48753e] dark:text-[#9ee56f]">
                  LingoChill Admin Studio
                </p>
                <h1 className="font-heading text-2xl font-extrabold text-[var(--heading)]">
                  Xác thực quyền Quản trị viên
                </h1>
              </div>
            </div>

            {currentUser && currentUser.role !== "ADMIN" ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-200">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-300" />
                    <div>
                      <p className="font-bold">Truy cập bị từ chối (403 Forbidden)</p>
                      <p className="mt-1 text-xs leading-relaxed">
                        Tài khoản hiện tại <b>{currentUser.email}</b> đang giữ quyền{" "}
                        <code className="rounded bg-rose-100 px-1.5 py-0.5 font-mono text-[11px] dark:bg-rose-900">
                          {currentUser.role}
                        </code>
                        . Vui lòng đăng xuất và đăng nhập bằng email quản trị có quyền{" "}
                        <b>ADMIN</b>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <Button variant="primary" onClick={handleLogoutSwitch}>
                    <LogOut className="h-4 w-4" />
                    Đăng xuất để đổi tài khoản Admin
                  </Button>
                  <Link href="/my-library">
                    <Button variant="outline">Về Kho cá nhân</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Đăng nhập bằng mật khẩu hoặc mã OTP Email của tài khoản có vai trò{" "}
                  <span className="font-bold text-[var(--heading)]">ADMIN</span> để quản lý toàn
                  bộ hệ thống LingoChill.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod("password");
                      setError(null);
                    }}
                    className={`cursor-pointer rounded-xl py-2 text-xs font-bold transition ${
                      authMethod === "password"
                        ? "bg-[#19462b] text-white shadow-xs"
                        : "text-[var(--muted-foreground)] hover:text-[var(--heading)]"
                    }`}
                  >
                    Email & Mật khẩu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod("otp");
                      setError(null);
                    }}
                    className={`cursor-pointer rounded-xl py-2 text-xs font-bold transition ${
                      authMethod === "otp"
                        ? "bg-[#19462b] text-white shadow-xs"
                        : "text-[var(--muted-foreground)] hover:text-[var(--heading)]"
                    }`}
                  >
                    Mã OTP 6 số
                  </button>
                </div>

                {authMethod === "password" ? (
                  <form onSubmit={handlePasswordLogin} className="mt-4 space-y-3.5">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                        Email quản trị viên
                      </label>
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={siteConfig.brand.email}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                        Mật khẩu
                      </label>
                      <Input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu Admin"
                      />
                    </div>

                    {error && (
                      <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                        {error}
                      </p>
                    )}

                    <Button type="submit" loading={loading} className="w-full">
                      <Lock className="h-4 w-4" />
                      Đăng nhập vào Admin Studio
                    </Button>
                  </form>
                ) : step === "email" ? (
                  <form onSubmit={handleRequestOtp} className="mt-5 space-y-3.5">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                        Email quản trị viên
                      </label>
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={siteConfig.brand.email}
                      />
                    </div>

                    {error && (
                      <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                        {error}
                      </p>
                    )}

                    <Button type="submit" loading={loading} className="w-full">
                      <Mail className="h-4 w-4" />
                      Nhận mã OTP xác thực Admin
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="mt-5 space-y-3.5">
                    {devHint && (
                      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 font-bold">
                            <Sparkles className="h-3.5 w-3.5" />
                            OTP Local Dev cho {email}:
                          </span>
                          <button
                            type="button"
                            onClick={() => setOtp(devHint)}
                            className="cursor-pointer rounded-lg bg-amber-200/80 px-2.5 py-1 font-mono text-sm font-extrabold tracking-widest text-amber-950 hover:bg-amber-300"
                          >
                            {devHint} (Điền nhanh)
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                        Mã OTP 6 chữ số đã gửi tới {email}
                      </label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Nhập 6 chữ số OTP"
                        className="font-mono text-center text-lg font-bold tracking-[0.35em]"
                      />
                    </div>

                    {error && (
                      <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                        {error}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button type="submit" loading={loading} className="flex-1">
                        <KeyRound className="h-4 w-4" />
                        Vào Admin Studio
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setStep("email");
                          setOtp("");
                          setError(null);
                        }}
                      >
                        Đổi email
                      </Button>
                    </div>
                  </form>
                )}

                <div className="mt-5 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5 text-xs text-[var(--muted-foreground)]">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#19462b] dark:text-[#9ee56f]" />
                  <span>
                    Tài khoản Admin mặc định seed sẵn: <b>{siteConfig.brand.email}</b>
                  </span>
                </div>
              </div>
            )}
          </div>
        </Tilt3D>
      </div>
    </div>
  );
}

// === overview-tab.tsx ===
interface OverviewTabProps {
  data: AdminOverviewPayload;
  onRefresh: () => void;
  refreshing: boolean;
  onNavigateTab: (tab: AdminTabId) => void;
}

export function OverviewTab({
  data,
  onRefresh,
  refreshing,
  onNavigateTab,
}: OverviewTabProps) {
  const { stats, categories, recentAttempts, recentDonations } = data;
  const maxDownloads = Math.max(1, ...categories.map((c) => c.downloadCount));

  const kpiCards = [
    {
      label: "Học viên & Quản trị",
      value: formatViNumber(stats.usersCount),
      sub: `${stats.adminsCount} Admin · ${formatViNumber(stats.vocabWordsCount)} từ SRS`,
      icon: <Users className="h-5 w-5 text-[#19462b] dark:text-[#9ee56f]" />,
      accent: "bg-[#ebf5e3] dark:bg-[#193b21]",
      tab: "users" as AdminTabId,
    },
    {
      label: "Kho Tài liệu",
      value: formatViNumber(stats.documentsCount),
      sub: `${formatViNumber(stats.totalDocumentDownloads)} lượt tải · ${formatViNumber(
        stats.totalDocumentViews
      )} xem`,
      icon: <FileText className="h-5 w-5 text-teal-700 dark:text-teal-300" />,
      accent: "bg-teal-50 dark:bg-teal-950/40",
      tab: "documents" as AdminTabId,
    },
    {
      label: "Đề thi & Ngữ pháp",
      value: `${stats.examTestsCount} đề / ${stats.grammarLessonsCount} bài`,
      sub: `${formatViNumber(stats.examQuestionsCount)} câu hỏi · ${formatViNumber(
        stats.examAttemptsCount
      )} lượt thi`,
      icon: <GraduationCap className="h-5 w-5 text-amber-700 dark:text-amber-300" />,
      accent: "bg-amber-50 dark:bg-amber-950/40",
      tab: "exams" as AdminTabId,
    },
    {
      label: "Ủng hộ & Cộng đồng",
      value: formatVnd(stats.donationsPaidTotalVnd),
      sub: `${stats.pendingDonationsCount} đơn chờ duyệt · ${stats.communityPostsCount} bài viết`,
      icon: <HeartHandshake className="h-5 w-5 text-rose-700 dark:text-rose-300" />,
      accent: "bg-rose-50 dark:bg-rose-950/40",
      tab: "donations" as AdminTabId,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPanelHeader
        title="Tổng quan hệ thống LingoChill"
        description="Theo dõi tăng trưởng người học, kho tài liệu TOEIC, ngân hàng đề thi, cộng đồng và giao dịch VietQR theo thời gian thực."
        onRefresh={onRefresh}
        refreshing={refreshing}
      />

      {/* Top 4 KPI Cards with subtle 3D tilt */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <Tilt3D key={card.label} maxTilt={6} scale={1.015}>
            <button
              type="button"
              onClick={() => onNavigateTab(card.tab)}
              className="group flex h-full w-full cursor-pointer flex-col justify-between rounded-2xl border-2 border-[#1b2d1c] bg-[var(--surface)] p-4 text-left shadow-[4px_4px_0_#1b2d1c] transition hover:-translate-y-0.5 dark:border-[#9ee56f]/30 dark:shadow-[4px_4px_0_#070e09]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                    {card.label}
                  </p>
                  <p className="mt-2 font-display text-2xl font-extrabold text-[var(--heading)]">
                    {card.value}
                  </p>
                </div>
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] ${card.accent}`}
                >
                  {card.icon}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2.5 text-xs text-[var(--muted-foreground)]">
                <span className="truncate">{card.sub}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5" />
              </div>
            </button>
          </Tilt3D>
        ))}
      </div>

      {/* Middle Row: Category Download Bars + Quick Shortcuts */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="border-2 border-[#1b2d1c]/15 dark:border-[var(--border)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4.5 w-4.5 text-[var(--primary)]" />
              Lượt tải theo Danh mục Tài liệu
            </CardTitle>
            <button
              type="button"
              onClick={() => onNavigateTab("documents")}
              className="cursor-pointer text-xs font-bold text-[var(--primary)] hover:underline"
            >
              Quản lý tài liệu →
            </button>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {categories.map((cat) => {
              const pct = Math.max(8, Math.round((cat.downloadCount / maxDownloads) * 100));
              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--heading)]">
                      {cat.name}{" "}
                      <span className="font-normal text-[var(--muted-foreground)]">
                        ({cat.documentCount} tài liệu)
                      </span>
                    </span>
                    <span className="font-mono font-bold text-[var(--heading)]">
                      {formatViNumber(cat.downloadCount)} tải · {formatViNumber(cat.viewCount)} xem
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#19462b] to-[#9ee56f] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-2 border-[#1b2d1c]/15 dark:border-[var(--border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4.5 w-4.5 text-amber-500" />
              Thao tác nhanh Quản trị
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
            {[
              {
                title: "Thêm tài liệu PDF / ETS mới",
                sub: `${stats.documentsCount} tài liệu đang phát hành`,
                tab: "documents" as AdminTabId,
                icon: <FileText className="h-4 w-4 text-teal-600" />,
              },
              {
                title: "Soạn bộ đề & câu hỏi Part 1–7",
                sub: `${stats.examSetsCount} bộ đề · ${stats.examQuestionsCount} câu hỏi`,
                tab: "exams" as AdminTabId,
                icon: <GraduationCap className="h-4 w-4 text-amber-600" />,
              },
              {
                title: "Mở rộng Lộ trình Ngữ pháp",
                sub: `${stats.grammarTopicsCount} chặng · ${stats.grammarLessonsCount} bài học`,
                tab: "grammar" as AdminTabId,
                icon: <BookOpen className="h-4 w-4 text-emerald-700" />,
              },
              {
                title: "Ghim thông báo Cộng đồng",
                sub: `${stats.communityPostsCount} bài · ${stats.communityCommentsCount} bình luận`,
                tab: "community" as AdminTabId,
                icon: <MessageSquare className="h-4 w-4 text-sky-600" />,
              },
            ].map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => onNavigateTab(item.tab)}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3.5 py-2.5 text-left transition hover:border-[var(--primary)] hover:bg-[var(--muted)]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[var(--heading)]">{item.title}</p>
                    <p className="truncate text-[11px] text-[var(--muted-foreground)]">
                      {item.sub}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Recent Exam Attempts & Recent Donations */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-2 border-[#1b2d1c]/15 dark:border-[var(--border)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4.5 w-4.5 text-amber-500" />
              Lượt nộp bài TOEIC gần đây
            </CardTitle>
            <button
              type="button"
              onClick={() => onNavigateTab("exams")}
              className="cursor-pointer text-xs font-bold text-[var(--primary)] hover:underline"
            >
              Xem đề thi →
            </button>
          </CardHeader>
          <CardContent>
            {recentAttempts.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)]">Chưa có lượt làm bài nào.</p>
            ) : (
              <div className="space-y-2.5">
                {recentAttempts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[var(--heading)]">
                        {a.user.name}{" "}
                        <span className="font-normal text-[var(--muted-foreground)]">
                          · {a.examTest.title}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                        L {a.listeningScore} · R {a.readingScore} ·{" "}
                        {formatShortDateTime(a.completedAt)}
                      </p>
                    </div>
                    <Badge variant="green" className="font-mono shrink-0">
                      {a.totalScore} / 990
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-[#1b2d1c]/15 dark:border-[var(--border)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <HeartHandshake className="h-4.5 w-4.5 text-rose-500" />
              Giao dịch Ủng hộ mới nhất
            </CardTitle>
            <button
              type="button"
              onClick={() => onNavigateTab("donations")}
              className="cursor-pointer text-xs font-bold text-[var(--primary)] hover:underline"
            >
              Duyệt VietQR →
            </button>
          </CardHeader>
          <CardContent>
            {recentDonations.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)]">Chưa có giao dịch nào.</p>
            ) : (
              <div className="space-y-2.5">
                {recentDonations.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[var(--heading)]">
                        {d.donorName}{" "}
                        <span className="font-mono text-[11px] font-semibold text-[var(--muted-foreground)]">
                          #{d.orderCode}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[var(--muted-foreground)]">
                        {d.message || "Không có lời nhắn"} · {formatShortDateTime(d.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs font-extrabold text-[var(--heading)]">
                        {formatVnd(d.amountVnd)}
                      </span>
                      <Badge
                        variant={
                          d.status === "PAID"
                            ? "green"
                            : d.status === "PENDING"
                            ? "gold"
                            : "rose"
                        }
                      >
                        {d.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// === users-tab.tsx ===
interface UsersTabProps {
  currentAdminId: string;
  onDataChanged: () => void;
}

export function UsersTab({ currentAdminId, onDataChanged }: UsersTabProps) {
  const { notify } = useApp();
  const [users, setUsers] = React.useState<AdminUserRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"ALL" | "ADMIN" | "USER">("ALL");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const [editUser, setEditUser] = React.useState<AdminUserRow | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editRole, setEditRole] = React.useState<"USER" | "ADMIN">("USER");
  const [editXp, setEditXp] = React.useState("0");
  const [editStreak, setEditStreak] = React.useState("1");
  const [editTarget, setEditTarget] = React.useState("650");
  const [savingEdit, setSavingEdit] = React.useState(false);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [newRole, setNewRole] = React.useState<"USER" | "ADMIN">("USER");
  const [newXp, setNewXp] = React.useState("20");
  const [creating, setCreating] = React.useState(false);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminRequest<{ users: AdminUserRow[] }>("/api/admin/users");
      setUsers(data.users);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể tải danh sách học viên.", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  React.useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return fetchUsers();
    });
    return () => {
      active = false;
    };
  }, [fetchUsers]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [users, search, roleFilter]);

  const openEditModal = (u: AdminUserRow) => {
    setEditUser(u);
    setEditName(u.name);
    setEditRole(u.role === "ADMIN" ? "ADMIN" : "USER");
    setEditXp(String(u.xp));
    setEditStreak(String(u.streakDays));
    setEditTarget(String(u.targetScore));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSavingEdit(true);
    try {
      const data = await adminRequest<{ user: AdminUserRow }>(`/api/admin/users/${editUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName,
          role: editRole,
          xp: Number(editXp),
          streakDays: Number(editStreak),
          targetScore: Number(editTarget),
        }),
      });
      setUsers((prev) => prev.map((row) => (row.id === data.user.id ? data.user : row)));
      setEditUser(null);
      notify(`Đã cập nhật tài khoản ${data.user.name}.`, "success");
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Cập nhật thất bại.", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const data = await adminRequest<{ user: AdminUserRow }>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: newEmail,
          name: newName,
          role: newRole,
          xp: Number(newXp),
        }),
      });
      setUsers((prev) => [data.user, ...prev]);
      setCreateOpen(false);
      setNewEmail("");
      setNewName("");
      setNewRole("USER");
      setNewXp("20");
      notify(`Đã thêm thành viên ${data.user.name}.`, "success");
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể thêm thành viên.", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleBoostXp = async (u: AdminUserRow, delta: number) => {
    setBusyId(u.id);
    try {
      const data = await adminRequest<{ user: AdminUserRow }>(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ xp: u.xp + delta }),
      });
      setUsers((prev) => prev.map((row) => (row.id === data.user.id ? data.user : row)));
      notify(`Đã cộng +${delta} EXP cho ${u.name}.`, "success");
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Lỗi thưởng EXP.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteUser = async (u: AdminUserRow) => {
    setBusyId(u.id);
    try {
      await adminRequest<{ deletedId: string }>(`/api/admin/users/${u.id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((row) => row.id !== u.id));
      notify(`Đã xoá tài khoản ${u.email}.`, "success");
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể xoá người dùng.", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPanelHeader
        title="Quản lý Học viên & Bảng xếp hạng"
        description="Phân quyền ADMIN / USER, điều chỉnh điểm EXP, streak học tập và mục tiêu TOEIC."
        onRefresh={fetchUsers}
        refreshing={loading}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Thêm thành viên
          </Button>
        }
      />

      {/* Filter Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(["ALL", "ADMIN", "USER"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold transition",
                roleFilter === r
                  ? "border-[#1b2d1c] bg-[#19462b] text-white"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--heading)]"
              )}
            >
              {r === "ALL" ? `Tất cả (${users.length})` : r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="h-56 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
      ) : filtered.length === 0 ? (
        <AdminEmptyState icon={<Users className="h-5 w-5" />} message="Không có thành viên phù hợp." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
          <table className="w-full min-w-[780px] text-left text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-alt)] text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              <tr>
                <th className="px-4 py-3">Thành viên</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">EXP</th>
                <th className="px-4 py-3">Streak</th>
                <th className="px-4 py-3">Mục tiêu</th>
                <th className="px-4 py-3">Hoạt động</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((u) => (
                <tr key={u.id} className="transition hover:bg-[var(--surface-alt)]/60">
                  <td className="px-4 py-3">
                    <div className="font-bold text-[var(--heading)]">
                      {u.name}
                      {u.id === currentAdminId && (
                        <span className="ml-1.5 rounded bg-[#9ee56f]/30 px-1.5 py-0.5 text-[10px] font-extrabold text-[#19462b] dark:text-[#9ee56f]">
                          Bạn
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">
                      {u.email} · {formatShortDateTime(u.createdAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === "ADMIN" ? "green" : "neutral"}>
                      {u.role === "ADMIN" && <ShieldCheck className="h-3 w-3" />}
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-[var(--heading)]">
                    {formatViNumber(u.xp)}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold">{u.streakDays} ngày</td>
                  <td className="px-4 py-3 font-mono font-semibold">{u.targetScore}</td>
                  <td className="px-4 py-3 text-[11px] text-[var(--muted-foreground)]">
                    {u._count.examAttempts} đề · {u._count.savedDocuments} lưu ·{" "}
                    {u._count.vocabWords} từ
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => handleBoostXp(u, 50)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300"
                      >
                        <Sparkles className="h-3 w-3" />
                        +50 EXP
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border-strong)] px-2.5 py-1 text-xs font-semibold text-[var(--heading)] hover:bg-[var(--muted)]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Sửa
                      </button>
                      {u.id !== currentAdminId && (
                        <AdminDeleteButton
                          busy={busyId === u.id}
                          onConfirm={() => handleDeleteUser(u)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit User Modal */}
      <Modal
        open={Boolean(editUser)}
        onClose={() => setEditUser(null)}
        title={`Chỉnh sửa thành viên: ${editUser?.name ?? ""}`}
        description={editUser?.email}
      >
        <form onSubmit={handleSaveEdit} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-bold">Họ tên hiển thị</label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold">Vai trò</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as "USER" | "ADMIN")}
                className={adminFieldClass}
              >
                <option value="USER">USER (Học viên)</option>
                <option value="ADMIN">ADMIN (Quản trị)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Mục tiêu TOEIC</label>
              <Input
                type="number"
                min={300}
                max={990}
                step={5}
                value={editTarget}
                onChange={(e) => setEditTarget(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold">Điểm EXP</label>
              <Input
                type="number"
                min={0}
                max={1000000}
                value={editXp}
                onChange={(e) => setEditXp(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Chuỗi Streak (ngày)</label>
              <Input
                type="number"
                min={0}
                max={3650}
                value={editStreak}
                onChange={(e) => setEditStreak(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
              Huỷ
            </Button>
            <Button type="submit" loading={savingEdit}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create User Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Thêm thành viên / Quản trị viên mới"
      >
        <form onSubmit={handleCreateUser} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-bold">Email</label>
            <Input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="user@lingochill.local"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">Họ tên</label>
            <Input
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold">Vai trò</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as "USER" | "ADMIN")}
                className={adminFieldClass}
              >
                <option value="USER">USER (Học viên)</option>
                <option value="ADMIN">ADMIN (Quản trị)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">EXP ban đầu</label>
              <Input
                type="number"
                min={0}
                value={newXp}
                onChange={(e) => setNewXp(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" loading={creating}>
              Tạo tài khoản
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// === documents-tab.tsx ===
interface DocumentsTabProps {
  onDataChanged: () => void;
}

interface DocFormState {
  title: string;
  description: string;
  categoryId: string;
  level: string;
  fileType: string;
  pageCount: string;
  fileSizeLabel: string;
  isFree: boolean;
  priceVnd: string;
  externalUrl: string;
  tags: string;
  previewContent: string;
  isFeatured: boolean;
}

const EMPTY_DOC_FORM: DocFormState = {
  title: "",
  description: "",
  categoryId: "",
  level: "Mọi trình độ",
  fileType: "PDF",
  pageCount: "24",
  fileSizeLabel: "2.4 MB",
  isFree: true,
  priceVnd: "0",
  externalUrl: "",
  tags: "TOEIC, PDF, StudyChill",
  previewContent: "",
  isFeatured: false,
};

export function DocumentsTab({ onDataChanged }: DocumentsTabProps) {
  const { notify } = useApp();
  const [docs, setDocs] = React.useState<AdminDocumentRow[]>([]);
  const [categories, setCategories] = React.useState<AdminCategoryRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [catFilter, setCatFilter] = React.useState("ALL");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const [docModalMode, setDocModalMode] = React.useState<"create" | "edit" | null>(null);
  const [editingDocId, setEditingDocId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<DocFormState>(EMPTY_DOC_FORM);
  const [savingDoc, setSavingDoc] = React.useState(false);

  const [catModalOpen, setCatModalOpen] = React.useState(false);
  const [catName, setCatName] = React.useState("");
  const [catDesc, setCatDesc] = React.useState("");
  const [savingCat, setSavingCat] = React.useState(false);

  const fetchDocs = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminRequest<{
        documents: AdminDocumentRow[];
        categories: AdminCategoryRow[];
      }>("/api/admin/documents");
      setDocs(data.documents);
      setCategories(data.categories);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể tải kho tài liệu.", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  React.useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return fetchDocs();
    });
    return () => {
      active = false;
    };
  }, [fetchDocs]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return docs.filter((d) => {
      if (catFilter !== "ALL" && d.categoryId !== catFilter) return false;
      if (!q) return true;
      return d.title.toLowerCase().includes(q) || d.slug.toLowerCase().includes(q);
    });
  }, [docs, search, catFilter]);

  const openCreateModal = () => {
    setForm({
      ...EMPTY_DOC_FORM,
      categoryId: categories[0]?.id || "",
    });
    setEditingDocId(null);
    setDocModalMode("create");
  };

  const openEditModal = (d: AdminDocumentRow) => {
    const parsedTags = safeJsonParse<string[]>(d.tagsJson, []);
    setForm({
      title: d.title,
      description: d.description,
      categoryId: d.categoryId,
      level: d.level,
      fileType: d.fileType,
      pageCount: String(d.pageCount),
      fileSizeLabel: d.fileSizeLabel,
      isFree: d.isFree,
      priceVnd: String(d.priceVnd),
      externalUrl: d.externalUrl || "",
      tags: parsedTags.join(", "),
      previewContent: d.previewContent,
      isFeatured: d.isFeatured,
    });
    setEditingDocId(d.id);
    setDocModalMode("edit");
  };

  const handleSubmitDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDoc(true);
    try {
      const payload = {
        ...form,
        pageCount: Number(form.pageCount),
        priceVnd: form.isFree ? 0 : Number(form.priceVnd),
      };

      if (docModalMode === "create") {
        const data = await adminRequest<{ document: AdminDocumentRow }>("/api/admin/documents", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setDocs((prev) => [data.document, ...prev]);
        notify(`Đã xuất bản tài liệu "${data.document.title}".`, "success");
      } else if (docModalMode === "edit" && editingDocId) {
        const data = await adminRequest<{ document: AdminDocumentRow }>(
          `/api/admin/documents/${editingDocId}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        );
        setDocs((prev) => prev.map((row) => (row.id === data.document.id ? data.document : row)));
        notify(`Đã cập nhật "${data.document.title}".`, "success");
      }
      setDocModalMode(null);
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Lưu tài liệu thất bại.", "error");
    } finally {
      setSavingDoc(false);
    }
  };

  const handleToggleFeatured = async (d: AdminDocumentRow) => {
    setBusyId(d.id);
    try {
      const data = await adminRequest<{ document: AdminDocumentRow }>(
        `/api/admin/documents/${d.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ isFeatured: !d.isFeatured }),
        }
      );
      setDocs((prev) => prev.map((row) => (row.id === data.document.id ? data.document : row)));
      notify(
        data.document.isFeatured ? "Đã gắn nổi bật tài liệu." : "Đã bỏ gắn nổi bật.",
        "info"
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : "Cập nhật thất bại.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteDoc = async (d: AdminDocumentRow) => {
    setBusyId(d.id);
    try {
      await adminRequest<{ deletedId: string }>(`/api/admin/documents/${d.id}`, {
        method: "DELETE",
      });
      setDocs((prev) => prev.filter((row) => row.id !== d.id));
      notify(`Đã xoá tài liệu "${d.title}".`, "success");
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Xoá tài liệu thất bại.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCat(true);
    try {
      const data = await adminRequest<{ category: AdminCategoryRow }>("/api/admin/documents", {
        method: "POST",
        body: JSON.stringify({ kind: "category", name: catName, description: catDesc }),
      });
      setCategories((prev) => [...prev, data.category]);
      setCatModalOpen(false);
      setCatName("");
      setCatDesc("");
      notify(`Đã thêm danh mục "${data.category.name}".`, "success");
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể tạo danh mục.", "error");
    } finally {
      setSavingCat(false);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPanelHeader
        title="Quản lý Kho Tài liệu"
        description="Xuất bản, chỉnh sửa, gắn nổi bật hoặc tạo danh mục mới cho thư viện tài liệu TOEIC miễn phí."
        onRefresh={fetchDocs}
        refreshing={loading}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setCatModalOpen(true)}>
              <FolderPlus className="h-4 w-4" />
              Thêm danh mục
            </Button>
            <Button size="sm" onClick={openCreateModal} disabled={categories.length === 0}>
              <Plus className="h-4 w-4" />
              Thêm tài liệu
            </Button>
          </>
        }
      />

      {/* Search & Category Pills */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc slug tài liệu..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCatFilter("ALL")}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1 text-xs font-bold transition",
              catFilter === "ALL"
                ? "border-[#1b2d1c] bg-[#19462b] text-white"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--heading)]"
            )}
          >
            Tất cả ({docs.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCatFilter(cat.id)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs font-bold transition",
                catFilter === cat.id
                  ? "border-[#1b2d1c] bg-[#19462b] text-white"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--heading)]"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="h-56 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
      ) : filtered.length === 0 ? (
        <AdminEmptyState icon={<FileText className="h-5 w-5" />} message="Chưa có tài liệu nào." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-alt)] text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              <tr>
                <th className="px-4 py-3">Tài liệu</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3">Trình độ / File</th>
                <th className="px-4 py-3">Học phí</th>
                <th className="px-4 py-3">Tương tác</th>
                <th className="px-4 py-3">Nổi bật</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((d) => (
                <tr key={d.id} className="transition hover:bg-[var(--surface-alt)]/60">
                  <td className="px-4 py-3 max-w-[260px]">
                    <p className="truncate font-bold text-[var(--heading)]">{d.title}</p>
                    <p className="truncate font-mono text-[11px] text-[var(--muted-foreground)]">
                      /{d.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="neutral">{d.category.name}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[var(--heading)]">{d.level}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      {d.fileType} · {d.pageCount} trang · {d.fileSizeLabel}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {d.isFree ? (
                      <Badge variant="green">Miễn phí</Badge>
                    ) : (
                      <Badge variant="gold">{formatVnd(d.priceVnd)}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px]">
                    {formatViNumber(d.downloadCount)} tải · {formatViNumber(d.viewCount)} xem
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={busyId === d.id}
                      onClick={() => handleToggleFeatured(d)}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition",
                        d.isFeatured
                          ? "border-amber-400 bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
                          : "border-[var(--border)] bg-[var(--surface-alt)] text-[var(--muted-foreground)]"
                      )}
                    >
                      <Star className={cn("h-3 w-3", d.isFeatured && "fill-current")} />
                      {d.isFeatured ? "Featured" : "Thường"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/documents/${d.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-[var(--muted-foreground)] hover:text-[var(--heading)]"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Xem
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEditModal(d)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border-strong)] px-2.5 py-1 text-xs font-semibold text-[var(--heading)] hover:bg-[var(--muted)]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Sửa
                      </button>
                      <AdminDeleteButton
                        busy={busyId === d.id}
                        onConfirm={() => handleDeleteDoc(d)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Document Modal */}
      <Modal
        open={Boolean(docModalMode)}
        onClose={() => setDocModalMode(null)}
        maxWidthClass="max-w-2xl"
        title={docModalMode === "create" ? "Thêm tài liệu mới" : "Chỉnh sửa tài liệu"}
      >
        <form onSubmit={handleSubmitDoc} className="space-y-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold">Tiêu đề tài liệu</label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="VD: Bộ 600 Từ Vựng TOEIC Essential PDF"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Danh mục</label>
              <select
                required
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className={adminFieldClass}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold">Mô tả ngắn</label>
            <Input
              required
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả nội dung & đối tượng phù hợp..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-bold">Trình độ</label>
              <Input
                value={form.level}
                onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Định dạng</label>
              <Input
                value={form.fileType}
                onChange={(e) => setForm((f) => ({ ...f, fileType: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Số trang</label>
              <Input
                type="number"
                min={1}
                value={form.pageCount}
                onChange={(e) => setForm((f) => ({ ...f, pageCount: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Dung lượng</label>
              <Input
                value={form.fileSizeLabel}
                onChange={(e) => setForm((f) => ({ ...f, fileSizeLabel: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold">Tags (phân cách dấu phẩy)</label>
              <Input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">URL tải ngoài (tuỳ chọn)</label>
              <Input
                value={form.externalUrl}
                onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
                placeholder="Để trống nếu xuất file hướng dẫn nội bộ"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3.5 py-2.5 text-xs">
            <label className="flex cursor-pointer items-center gap-2 font-bold">
              <input
                type="checkbox"
                checked={form.isFree}
                onChange={(e) => setForm((f) => ({ ...f, isFree: e.target.checked }))}
              />
              Miễn phí tải
            </label>
            {!form.isFree && (
              <div className="flex items-center gap-2">
                <span className="font-bold">Giá (VNĐ):</span>
                <Input
                  type="number"
                  min={0}
                  value={form.priceVnd}
                  onChange={(e) => setForm((f) => ({ ...f, priceVnd: e.target.value }))}
                  className="h-8 w-32"
                />
              </div>
            )}
            <label className="flex cursor-pointer items-center gap-2 font-bold">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
              />
              Hiển thị Nổi bật
            </label>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold">Nội dung xem trước (Markdown)</label>
            <textarea
              rows={4}
              value={form.previewContent}
              onChange={(e) => setForm((f) => ({ ...f, previewContent: e.target.value }))}
              className={adminTextareaClass}
              placeholder="Tóm tắt mục lục, ví dụ mẫu..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDocModalMode(null)}>
              Huỷ
            </Button>
            <Button type="submit" loading={savingDoc}>
              {docModalMode === "create" ? "Xuất bản tài liệu" : "Lưu cập nhật"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Category Modal */}
      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title="Tạo danh mục tài liệu mới"
      >
        <form onSubmit={handleCreateCategory} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-bold">Tên danh mục</label>
            <Input
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="VD: Phát âm & Giao tiếp"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">Mô tả ngắn</label>
            <Input
              required
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              placeholder="Mô tả nhóm tài liệu này..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCatModalOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" loading={savingCat}>
              Tạo danh mục
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// === exams-tab.tsx ===
interface ExamsTabProps {
  onDataChanged: () => void;
}

const INITIAL_EXAMS_DATA: { sets: AdminExamSetRow[] } = { sets: [] };

export function ExamsTab({ onDataChanged }: ExamsTabProps) {
  const { notify } = useApp();
  const {
    data: examsData,
    setData: setExamsData,
    loading,
    reload: fetchSets,
  } = useAdminQuery("/api/admin/exams", INITIAL_EXAMS_DATA, notify);
  const sets = examsData.sets;
  const setSets = (updater: (prev: AdminExamSetRow[]) => AdminExamSetRow[]) =>
    setExamsData((prev) => ({ sets: updater(prev.sets) }));
  const [busyId, setBusyId] = React.useState<string | null>(null);

  // Selected test for Question Bank drawer
  const [selectedTest, setSelectedTest] = React.useState<AdminExamTestRow | null>(null);
  const [questions, setQuestions] = React.useState<AdminExamQuestionRow[]>([]);
  const [loadingQuestions, setLoadingQuestions] = React.useState(false);

  // Set modal
  const [setModalOpen, setSetModalOpen] = React.useState(false);
  const [setTitle, setSetTitle] = React.useState("");
  const [setBadge, setSetBadge] = React.useState("ETS 2026");
  const [setDesc, setSetDesc] = React.useState("");
  const [savingSet, setSavingSet] = React.useState(false);

  // Test modal (create/edit)
  const [testModalMode, setTestModalMode] = React.useState<"create" | "edit" | null>(null);
  const [editingTestId, setEditingTestId] = React.useState<string | null>(null);
  const [testSetId, setTestSetId] = React.useState("");
  const [testTitle, setTestTitle] = React.useState("");
  const [testDesc, setTestDesc] = React.useState("");
  const [testDuration, setTestDuration] = React.useState("25");
  const [testDifficulty, setTestDifficulty] = React.useState("Trung cấp 600+");
  const [testIsHot, setTestIsHot] = React.useState(false);
  const [savingTest, setSavingTest] = React.useState(false);

  // Question modal (create/edit)
  const [qModalMode, setQModalMode] = React.useState<"create" | "edit" | null>(null);
  const [editingQId, setEditingQId] = React.useState<string | null>(null);
  const [qPart, setQPart] = React.useState("5");
  const [qPrompt, setQPrompt] = React.useState("");
  const [qOptA, setQOptA] = React.useState("");
  const [qOptB, setQOptB] = React.useState("");
  const [qOptC, setQOptC] = React.useState("");
  const [qOptD, setQOptD] = React.useState("");
  const [qCorrectIndex, setQCorrectIndex] = React.useState(0);
  const [qExplanation, setQExplanation] = React.useState("");
  const [qAudioScript, setQAudioScript] = React.useState("");
  const [qPassageTitle, setQPassageTitle] = React.useState("");
  const [savingQ, setSavingQ] = React.useState(false);

  const openQuestionsForTest = async (test: AdminExamTestRow) => {
    setSelectedTest(test);
    setLoadingQuestions(true);
    try {
      const data = await adminRequest<{
        test: AdminExamTestRow & { questions: AdminExamQuestionRow[] };
      }>(`/api/admin/exams/${test.id}/questions`);
      setQuestions(data.test.questions);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể tải danh sách câu hỏi.", "error");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleCreateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSet(true);
    try {
      const data = await adminRequest<{ set: AdminExamSetRow }>("/api/admin/exams", {
        method: "POST",
        body: JSON.stringify({
          kind: "set",
          title: setTitle,
          badge: setBadge,
          description: setDesc,
        }),
      });
      setSets((prev) => [...prev, { ...data.set, tests: data.set.tests ?? [] }]);
      setSetModalOpen(false);
      setSetTitle("");
      setSetDesc("");
      notify(`Đã tạo bộ đề "${data.set.title}".`, "success");
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể tạo bộ đề.", "error");
    } finally {
      setSavingSet(false);
    }
  };

  const openCreateTestModal = (preselectedSetId?: string) => {
    setTestSetId(preselectedSetId || sets[0]?.id || "");
    setTestTitle("");
    setTestDesc("Đề luyện tập TOEIC sát cấu trúc ETS kèm giải thích chi tiết.");
    setTestDuration("25");
    setTestDifficulty("Trung cấp 600+");
    setTestIsHot(false);
    setEditingTestId(null);
    setTestModalMode("create");
  };

  const openEditTestModal = (test: AdminExamTestRow) => {
    setTestSetId(test.examSetId);
    setTestTitle(test.title);
    setTestDesc(test.description);
    setTestDuration(String(test.durationMinutes));
    setTestDifficulty(test.difficulty);
    setTestIsHot(test.isHot);
    setEditingTestId(test.id);
    setTestModalMode("edit");
  };

  const handleSubmitTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTest(true);
    try {
      if (testModalMode === "create") {
        await adminRequest<{ test: AdminExamTestRow }>("/api/admin/exams", {
          method: "POST",
          body: JSON.stringify({
            kind: "test",
            examSetId: testSetId,
            title: testTitle,
            description: testDesc,
            durationMinutes: Number(testDuration),
            difficulty: testDifficulty,
            isHot: testIsHot,
          }),
        });
        notify(`Đã thêm đề thi "${testTitle}".`, "success");
      } else if (testModalMode === "edit" && editingTestId) {
        await adminRequest<{ test: AdminExamTestRow }>(`/api/admin/exams/${editingTestId}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: testTitle,
            description: testDesc,
            durationMinutes: Number(testDuration),
            difficulty: testDifficulty,
            isHot: testIsHot,
          }),
        });
        notify(`Đã cập nhật đề thi "${testTitle}".`, "success");
      }
      setTestModalMode(null);
      await fetchSets();
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Lưu đề thi thất bại.", "error");
    } finally {
      setSavingTest(false);
    }
  };

  const handleToggleHot = async (test: AdminExamTestRow) => {
    setBusyId(test.id);
    try {
      const data = await adminRequest<{ test: AdminExamTestRow }>(`/api/admin/exams/${test.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isHot: !test.isHot }),
      });
      setSets((prev) =>
        prev.map((s) => ({
          ...s,
          tests: s.tests.map((t) => (t.id === test.id ? { ...t, isHot: data.test.isHot } : t)),
        }))
      );
      notify(data.test.isHot ? "Đã gắn nhãn HOT." : "Đã bỏ nhãn HOT.", "info");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể đổi trạng thái HOT.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteTest = async (test: AdminExamTestRow) => {
    setBusyId(test.id);
    try {
      await adminRequest<{ deletedId: string }>(`/api/admin/exams/${test.id}`, {
        method: "DELETE",
      });
      if (selectedTest?.id === test.id) {
        setSelectedTest(null);
        setQuestions([]);
      }
      await fetchSets();
      notify(`Đã xoá đề "${test.title}".`, "success");
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Xoá đề thi thất bại.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteSet = async (set: AdminExamSetRow) => {
    setBusyId(set.id);
    try {
      await adminRequest<{ deletedId: string }>(`/api/admin/exams/${set.id}?kind=set`, {
        method: "DELETE",
      });
      if (selectedTest && selectedTest.examSetId === set.id) {
        setSelectedTest(null);
        setQuestions([]);
      }
      await fetchSets();
      notify(`Đã xoá bộ đề "${set.title}".`, "success");
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Xoá bộ đề thất bại.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const openCreateQuestionModal = () => {
    setEditingQId(null);
    setQPart("5");
    setQPrompt("");
    setQOptA("");
    setQOptB("");
    setQOptC("");
    setQOptD("");
    setQCorrectIndex(0);
    setQExplanation("");
    setQAudioScript("");
    setQPassageTitle("");
    setQModalMode("create");
  };

  const openEditQuestionModal = (q: AdminExamQuestionRow) => {
    const opts = safeJsonParse<string[]>(q.optionsJson, []);
    setEditingQId(q.id);
    setQPart(String(q.part));
    setQPrompt(q.promptText);
    setQOptA(opts[0] || "");
    setQOptB(opts[1] || "");
    setQOptC(opts[2] || "");
    setQOptD(opts[3] || "");
    setQCorrectIndex(q.correctIndex);
    setQExplanation(q.explanation);
    setQAudioScript(q.audioScript || "");
    setQPassageTitle(q.passageTitle || "");
    setQModalMode("edit");
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest) return;
    setSavingQ(true);
    try {
      const options = [qOptA, qOptB, qOptC, qOptD].map((v) => v.trim()).filter(Boolean);
      if (qModalMode === "create") {
        await adminRequest<{ question: AdminExamQuestionRow }>("/api/admin/exams", {
          method: "POST",
          body: JSON.stringify({
            kind: "question",
            examTestId: selectedTest.id,
            part: Number(qPart),
            promptText: qPrompt,
            options,
            correctIndex: qCorrectIndex,
            explanation: qExplanation,
            audioScript: qAudioScript,
          }),
        });
        notify("Đã thêm câu hỏi mới vào đề thi.", "success");
      } else if (qModalMode === "edit" && editingQId) {
        await adminRequest<{ question: AdminExamQuestionRow }>(
          `/api/admin/exams/questions/${editingQId}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              part: Number(qPart),
              promptText: qPrompt,
              options,
              correctIndex: qCorrectIndex,
              explanation: qExplanation,
              audioScript: qAudioScript,
              passageTitle: qPassageTitle,
            }),
          }
        );
        notify("Đã cập nhật câu hỏi.", "success");
      }
      setQModalMode(null);
      await openQuestionsForTest(selectedTest);
      await fetchSets();
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Lưu câu hỏi thất bại.", "error");
    } finally {
      setSavingQ(false);
    }
  };

  const handleDeleteQuestion = async (q: AdminExamQuestionRow) => {
    setBusyId(q.id);
    try {
      await adminRequest<{ deletedId: string }>(`/api/admin/exams/questions/${q.id}`, {
        method: "DELETE",
      });
      setQuestions((prev) => prev.filter((item) => item.id !== q.id));
      await fetchSets();
      notify(`Đã xoá Câu ${q.number}.`, "success");
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể xoá câu hỏi.", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPanelHeader
        title="Ngân hàng Đề thi & Câu hỏi TOEIC"
        description="Quản lý bộ đề (ETS / Economy), các đề thi con, nhãn HOT và ngân hàng câu hỏi Part 1–7."
        onRefresh={fetchSets}
        refreshing={loading}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setSetModalOpen(true)}>
              <FolderPlus className="h-4 w-4" />
              Tạo bộ đề
            </Button>
            <Button size="sm" onClick={() => openCreateTestModal()} disabled={sets.length === 0}>
              <Plus className="h-4 w-4" />
              Thêm đề thi
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="h-56 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
      ) : sets.length === 0 ? (
        <AdminEmptyState icon={<GraduationCap className="h-5 w-5" />} message="Chưa có bộ đề nào." />
      ) : (
        <div className="space-y-4">
          {sets.map((set) => (
            <Card key={set.id} className="border-2 border-[#1b2d1c]/15 dark:border-[var(--border)]">
              <CardHeader className="flex flex-col gap-3 border-b border-[var(--border)] bg-[var(--surface-alt)]/60 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{set.title}</CardTitle>
                    {set.badge && <Badge variant="gold">{set.badge}</Badge>}
                    <Badge variant="neutral">{set.tests.length} đề thi</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{set.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => openCreateTestModal(set.id)}>
                    <Plus className="h-3.5 w-3.5" />
                    Thêm đề
                  </Button>
                  <AdminDeleteButton
                    busy={busyId === set.id}
                    label="Xoá bộ"
                    onConfirm={() => handleDeleteSet(set)}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {set.tests.length === 0 ? (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Chưa có đề thi nào trong bộ đề này.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {set.tests.map((test) => {
                      const isActive = selectedTest?.id === test.id;
                      return (
                        <div
                          key={test.id}
                          className={cn(
                            "flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between",
                            isActive && "rounded-xl bg-[#9ee56f]/15 px-3 py-3"
                          )}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-[var(--heading)]">
                                {test.title}
                              </span>
                              <Badge variant="neutral" className="font-mono text-[11px]">
                                {test._count.questions} câu ({test.listeningCount}L ·{" "}
                                {test.readingCount}R)
                              </Badge>
                              <Badge variant="blue" className="text-[11px]">
                                {test.durationMinutes} phút
                              </Badge>
                              <span className="text-[11px] text-[var(--muted-foreground)]">
                                {test._count.attempts} lượt thi · {test.difficulty}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              disabled={busyId === test.id}
                              onClick={() => handleToggleHot(test)}
                              className={cn(
                                "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition",
                                test.isHot
                                  ? "border-orange-400 bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-200"
                                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)]"
                              )}
                            >
                              <Flame className="h-3 w-3" />
                              {test.isHot ? "HOT" : "Bình thường"}
                            </button>

                            <Button
                              variant={isActive ? "primary" : "outline"}
                              size="sm"
                              onClick={() => openQuestionsForTest(test)}
                            >
                              <ListChecks className="h-3.5 w-3.5" />
                              Câu hỏi ({test._count.questions})
                            </Button>

                            <Link
                              href={`/luyen-de/thi/${test.slug}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--heading)]"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Mở
                            </Link>

                            <button
                              type="button"
                              onClick={() => openEditTestModal(test)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border-strong)] px-2.5 py-1.5 text-xs font-semibold text-[var(--heading)] hover:bg-[var(--muted)]"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Sửa
                            </button>

                            <AdminDeleteButton
                              busy={busyId === test.id}
                              onConfirm={() => handleDeleteTest(test)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Test Question Bank Drawer */}
      {selectedTest && (
        <Card className="border-2 border-[#19462b] bg-[var(--surface)] shadow-[5px_5px_0_#19462b] dark:border-[#9ee56f]/45 dark:shadow-[5px_5px_0_#070d09]">
          <CardHeader className="flex flex-col gap-3 border-b border-[var(--border)] bg-[#f2f9ea] sm:flex-row sm:items-center sm:justify-between dark:bg-[#142318]">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#19462b] dark:text-[#9ee56f]">
                Ngân hàng câu hỏi của đề thi
              </p>
              <CardTitle className="mt-0.5 text-lg">
                {selectedTest.title} ({questions.length} câu)
              </CardTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={openCreateQuestionModal}>
                <Plus className="h-4 w-4" />
                Thêm câu hỏi
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedTest(null)}>
                Đóng danh sách
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {loadingQuestions ? (
              <div className="h-36 animate-pulse rounded-xl bg-[var(--muted)]" />
            ) : questions.length === 0 ? (
              <AdminEmptyState
                icon={<ListChecks className="h-5 w-5" />}
                message="Đề thi này chưa có câu hỏi nào. Nhấn '+ Thêm câu hỏi' để bắt đầu soạn."
              />
            ) : (
              <div className="space-y-3">
                {questions.map((q) => {
                  const opts = safeJsonParse<string[]>(q.optionsJson, []);
                  return (
                    <div
                      key={q.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-[#19462b] px-2 py-0.5 font-mono text-xs font-bold text-[#9ee56f]">
                            Câu {q.number}
                          </span>
                          <Badge variant={q.part <= 4 ? "blue" : "gold"}>Part {q.part}</Badge>
                          {q.audioScript && <Badge variant="neutral">Có Audio Script</Badge>}
                          {q.passageTitle && <Badge variant="neutral">Có Passage</Badge>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditQuestionModal(q)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--heading)] hover:bg-[var(--muted)]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Sửa
                          </button>
                          <AdminDeleteButton
                            busy={busyId === q.id}
                            onConfirm={() => handleDeleteQuestion(q)}
                          />
                        </div>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-[var(--heading)]">
                        {q.promptText}
                      </p>

                      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                        {opts.map((opt, idx) => {
                          const letter = ["A", "B", "C", "D"][idx] || String(idx + 1);
                          const isCorrect = idx === q.correctIndex;
                          return (
                            <div
                              key={letter}
                              className={cn(
                                "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs",
                                isCorrect
                                  ? "border-emerald-400 bg-emerald-50 font-bold text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200"
                                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)]"
                              )}
                            >
                              {isCorrect && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                              <span>
                                ({letter}) {opt}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                        <b>Giải thích:</b> {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Exam Set Modal */}
      <Modal
        open={setModalOpen}
        onClose={() => setSetModalOpen(false)}
        title="Tạo Bộ đề TOEIC mới"
      >
        <form onSubmit={handleCreateSet} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-bold">Tên bộ đề</label>
            <Input
              required
              value={setTitle}
              onChange={(e) => setSetTitle(e.target.value)}
              placeholder="VD: ETS TOEIC 2026 New Format"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">Nhãn phụ (Badge)</label>
            <Input value={setBadge} onChange={(e) => setSetBadge(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">Mô tả bộ đề</label>
            <textarea
              rows={3}
              required
              value={setDesc}
              onChange={(e) => setSetDesc(e.target.value)}
              className={adminTextareaClass}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setSetModalOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" loading={savingSet}>
              Tạo bộ đề
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create / Edit Exam Test Modal */}
      <Modal
        open={Boolean(testModalMode)}
        onClose={() => setTestModalMode(null)}
        title={testModalMode === "create" ? "Thêm đề thi mới" : "Chỉnh sửa thông tin đề thi"}
      >
        <form onSubmit={handleSubmitTest} className="space-y-3.5">
          {testModalMode === "create" && (
            <div>
              <label className="mb-1 block text-xs font-bold">Thuộc bộ đề</label>
              <select
                value={testSetId}
                onChange={(e) => setTestSetId(e.target.value)}
                className={adminFieldClass}
              >
                {sets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-bold">Tên đề thi</label>
            <Input
              required
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="VD: ETS 2026 Test 03"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold">Thời lượng (phút)</label>
              <Input
                type="number"
                min={5}
                max={120}
                value={testDuration}
                onChange={(e) => setTestDuration(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Độ khó</label>
              <Input
                value={testDifficulty}
                onChange={(e) => setTestDifficulty(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">Mô tả đề thi</label>
            <textarea
              rows={3}
              value={testDesc}
              onChange={(e) => setTestDesc(e.target.value)}
              className={adminTextareaClass}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={testIsHot}
              onChange={(e) => setTestIsHot(e.target.checked)}
            />
            Đánh dấu đề HOT nổi bật
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setTestModalMode(null)}>
              Huỷ
            </Button>
            <Button type="submit" loading={savingTest}>
              {testModalMode === "create" ? "Tạo đề thi" : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create / Edit Question Modal */}
      <Modal
        open={Boolean(qModalMode)}
        onClose={() => setQModalMode(null)}
        maxWidthClass="max-w-2xl"
        title={qModalMode === "create" ? "Thêm câu hỏi mới" : "Chỉnh sửa câu hỏi"}
      >
        <form onSubmit={handleSubmitQuestion} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold">TOEIC Part (1–7)</label>
              <select
                value={qPart}
                onChange={(e) => setQPart(e.target.value)}
                className={adminFieldClass}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                  <option key={p} value={p}>
                    Part {p} ({p <= 4 ? "Listening" : "Reading"})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Đáp án đúng</label>
              <select
                value={qCorrectIndex}
                onChange={(e) => setQCorrectIndex(Number(e.target.value))}
                className={adminFieldClass}
              >
                <option value={0}>Đáp án (A)</option>
                <option value={1}>Đáp án (B)</option>
                <option value={2}>Đáp án (C)</option>
                <option value={3}>Đáp án (D)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold">Nội dung câu hỏi</label>
            <textarea
              rows={2}
              required
              value={qPrompt}
              onChange={(e) => setQPrompt(e.target.value)}
              className={adminTextareaClass}
              placeholder="VD: The board members reviewed the _______ proposal yesterday."
            />
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold">Phương án A</label>
              <Input required value={qOptA} onChange={(e) => setQOptA(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Phương án B</label>
              <Input required value={qOptB} onChange={(e) => setQOptB(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Phương án C</label>
              <Input required value={qOptC} onChange={(e) => setQOptC(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Phương án D</label>
              <Input value={qOptD} onChange={(e) => setQOptD(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold">Giải thích chi tiết</label>
            <textarea
              rows={2}
              value={qExplanation}
              onChange={(e) => setQExplanation(e.target.value)}
              className={adminTextareaClass}
            />
          </div>

          {Number(qPart) <= 4 ? (
            <div>
              <label className="mb-1 block text-xs font-bold">Audio Script (Listening)</label>
              <textarea
                rows={2}
                value={qAudioScript}
                onChange={(e) => setQAudioScript(e.target.value)}
                className={adminTextareaClass}
              />
            </div>
          ) : (
            qModalMode === "edit" && (
              <div>
                <label className="mb-1 block text-xs font-bold">Tiêu đề đoạn đọc (nếu có)</label>
                <Input
                  value={qPassageTitle}
                  onChange={(e) => setQPassageTitle(e.target.value)}
                />
              </div>
            )
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setQModalMode(null)}>
              Huỷ
            </Button>
            <Button type="submit" loading={savingQ}>
              {qModalMode === "create" ? "Lưu câu hỏi" : "Cập nhật câu hỏi"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// === grammar-tab.tsx ===
interface GrammarTabProps {
  onDataChanged: () => void;
}

export function GrammarTab({ onDataChanged }: GrammarTabProps) {
  const { notify } = useApp();
  const [topics, setTopics] = React.useState<AdminGrammarTopicRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  // Topic Modal
  const [topicModalMode, setTopicModalMode] = React.useState<"create" | "edit" | null>(null);
  const [editingTopicId, setEditingTopicId] = React.useState<string | null>(null);
  const [topicTitle, setTopicTitle] = React.useState("");
  const [topicDesc, setTopicDesc] = React.useState("");
  const [topicLevel, setTopicLevel] = React.useState("450+");
  const [topicMinutes, setTopicMinutes] = React.useState("25");
  const [savingTopic, setSavingTopic] = React.useState(false);

  // Lesson Modal
  const [lessonModalMode, setLessonModalMode] = React.useState<"create" | "edit" | null>(null);
  const [editingLessonId, setEditingLessonId] = React.useState<string | null>(null);
  const [lessonTopicId, setLessonTopicId] = React.useState("");
  const [lessonTitle, setLessonTitle] = React.useState("");
  const [lessonFormula, setLessonFormula] = React.useState("S + V + O");
  const [lessonSummary, setLessonSummary] = React.useState("");
  const [lessonExampleEn, setLessonExampleEn] = React.useState("");
  const [lessonExampleVi, setLessonExampleVi] = React.useState("");
  const [lessonTrap, setLessonTrap] = React.useState("");
  const [savingLesson, setSavingLesson] = React.useState(false);

  const fetchGrammar = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminRequest<{ topics: AdminGrammarTopicRow[] }>("/api/admin/grammar");
      setTopics(data.topics);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể tải lộ trình ngữ pháp.", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  React.useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return fetchGrammar();
    });
    return () => {
      active = false;
    };
  }, [fetchGrammar]);

  const openCreateTopic = () => {
    setEditingTopicId(null);
    setTopicTitle("");
    setTopicDesc("");
    setTopicLevel("450+");
    setTopicMinutes("25");
    setTopicModalMode("create");
  };

  const openEditTopic = (t: AdminGrammarTopicRow) => {
    setEditingTopicId(t.id);
    setTopicTitle(t.title);
    setTopicDesc(t.description);
    setTopicLevel(t.targetLevel);
    setTopicMinutes(String(t.estimatedMinutes));
    setTopicModalMode("edit");
  };

  const handleSubmitTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTopic(true);
    try {
      if (topicModalMode === "create") {
        await adminRequest<{ topic: AdminGrammarTopicRow }>("/api/admin/grammar", {
          method: "POST",
          body: JSON.stringify({
            kind: "topic",
            title: topicTitle,
            description: topicDesc,
            targetLevel: topicLevel,
            estimatedMinutes: Number(topicMinutes),
          }),
        });
        notify(`Đã thêm chặng "${topicTitle}".`, "success");
      } else if (topicModalMode === "edit" && editingTopicId) {
        await adminRequest<{ topic: AdminGrammarTopicRow }>(`/api/admin/grammar/${editingTopicId}`, {
          method: "PATCH",
          body: JSON.stringify({
            kind: "topic",
            title: topicTitle,
            description: topicDesc,
            targetLevel: topicLevel,
            estimatedMinutes: Number(topicMinutes),
          }),
        });
        notify(`Đã cập nhật chặng "${topicTitle}".`, "success");
      }
      setTopicModalMode(null);
      await fetchGrammar();
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Lưu chặng thất bại.", "error");
    } finally {
      setSavingTopic(false);
    }
  };

  const openCreateLesson = (preselectedTopicId?: string) => {
    setEditingLessonId(null);
    setLessonTopicId(preselectedTopicId || topics[0]?.id || "");
    setLessonTitle("");
    setLessonFormula("a / an / the + (Adj) + NOUN");
    setLessonSummary("");
    setLessonExampleEn("The team submitted the quarterly report ahead of schedule.");
    setLessonExampleVi("Nhóm đã nộp báo cáo quý sớm hơn lịch trình.");
    setLessonTrap("");
    setLessonModalMode("create");
  };

  const openEditLesson = (l: AdminGrammarLessonRow) => {
    setEditingLessonId(l.id);
    setLessonTopicId(l.topicId);
    setLessonTitle(l.title);
    setLessonModalMode("edit");
  };

  const handleSubmitLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLesson(true);
    try {
      if (lessonModalMode === "create") {
        await adminRequest<{ lesson: AdminGrammarLessonRow }>("/api/admin/grammar", {
          method: "POST",
          body: JSON.stringify({
            kind: "lesson",
            topicId: lessonTopicId,
            title: lessonTitle,
            formula: lessonFormula,
            summaryNote: lessonSummary,
            example: lessonExampleEn,
            exampleVi: lessonExampleVi,
            trapTip: lessonTrap,
          }),
        });
        notify(`Đã tạo bài học "${lessonTitle}".`, "success");
      } else if (lessonModalMode === "edit" && editingLessonId) {
        await adminRequest<{ lesson: AdminGrammarLessonRow }>(
          `/api/admin/grammar/${editingLessonId}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              kind: "lesson",
              title: lessonTitle,
            }),
          }
        );
        notify(`Đã cập nhật bài học "${lessonTitle}".`, "success");
      }
      setLessonModalMode(null);
      await fetchGrammar();
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Lưu bài học thất bại.", "error");
    } finally {
      setSavingLesson(false);
    }
  };

  const handleDeleteTopic = async (t: AdminGrammarTopicRow) => {
    setBusyId(t.id);
    try {
      await adminRequest<{ deletedId: string }>(`/api/admin/grammar/${t.id}?kind=topic`, {
        method: "DELETE",
      });
      await fetchGrammar();
      notify(`Đã xoá chặng "${t.title}".`, "success");
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể xoá chặng.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteLesson = async (l: AdminGrammarLessonRow) => {
    setBusyId(l.id);
    try {
      await adminRequest<{ deletedId: string }>(`/api/admin/grammar/${l.id}`, {
        method: "DELETE",
      });
      await fetchGrammar();
      notify(`Đã xoá bài "${l.title}".`, "success");
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể xoá bài học.", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPanelHeader
        title="Quản lý Lộ trình Ngữ pháp"
        description="Quản lý các chặng lộ trình từ 250+ đến 990 cùng các bài học chi tiết có công thức, từ vựng & quiz."
        onRefresh={fetchGrammar}
        refreshing={loading}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={openCreateTopic}>
              <FolderPlus className="h-4 w-4" />
              Thêm chặng mới
            </Button>
            <Button size="sm" onClick={() => openCreateLesson()} disabled={topics.length === 0}>
              <Plus className="h-4 w-4" />
              Thêm bài học
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="h-56 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
      ) : topics.length === 0 ? (
        <AdminEmptyState icon={<BookOpen className="h-5 w-5" />} message="Chưa có chặng ngữ pháp nào." />
      ) : (
        <div className="space-y-4">
          {topics.map((topic, idx) => (
            <Card
              key={topic.id}
              className="border-2 border-[#1b2d1c]/15 dark:border-[var(--border)]"
            >
              <CardHeader className="flex flex-col gap-3 border-b border-[var(--border)] bg-[var(--surface-alt)]/60 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-[#19462b] px-2 py-0.5 font-mono text-xs font-bold text-[#9ee56f]">
                      Chặng {idx + 1}
                    </span>
                    <CardTitle className="text-base">{topic.title}</CardTitle>
                    <Badge variant="gold">Target {topic.targetLevel}</Badge>
                    <Badge variant="neutral">{topic.estimatedMinutes} phút</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{topic.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => openCreateLesson(topic.id)}>
                    <Plus className="h-3.5 w-3.5" />
                    Thêm bài
                  </Button>
                  <button
                    type="button"
                    onClick={() => openEditTopic(topic)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border-strong)] px-2.5 py-1.5 text-xs font-semibold text-[var(--heading)] hover:bg-[var(--muted)]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Sửa
                  </button>
                  <AdminDeleteButton
                    busy={busyId === topic.id}
                    label="Xoá chặng"
                    onConfirm={() => handleDeleteTopic(topic)}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {topic.lessons.length === 0 ? (
                  <p className="text-xs text-[var(--muted-foreground)]">Chưa có bài học nào.</p>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {topic.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex flex-col gap-2 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[var(--muted-foreground)]">
                              #{lesson.order}
                            </span>
                            <span className="text-sm font-bold text-[var(--heading)]">
                              {lesson.title}
                            </span>
                            {lesson._count && (
                              <Badge variant="green" className="text-[11px]">
                                {lesson._count.progress} học viên đã học
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 font-mono text-[11px] text-[var(--muted-foreground)]">
                            /ngu-phap/{lesson.slug}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/ngu-phap/${lesson.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--heading)]"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Xem bài
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEditLesson(lesson)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border-strong)] px-2.5 py-1 text-xs font-semibold text-[var(--heading)] hover:bg-[var(--muted)]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Sửa
                          </button>
                          <AdminDeleteButton
                            busy={busyId === lesson.id}
                            onConfirm={() => handleDeleteLesson(lesson)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Topic Modal */}
      <Modal
        open={Boolean(topicModalMode)}
        onClose={() => setTopicModalMode(null)}
        title={topicModalMode === "create" ? "Thêm Chặng Ngữ pháp mới" : "Chỉnh sửa Chặng Ngữ pháp"}
      >
        <form onSubmit={handleSubmitTopic} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-bold">Tiêu đề chặng</label>
            <Input
              required
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              placeholder="VD: Mệnh đề Quan hệ & Rút gọn"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold">Mức mục tiêu</label>
              <select
                value={topicLevel}
                onChange={(e) => setTopicLevel(e.target.value)}
                className={adminFieldClass}
              >
                {["250+", "450+", "650+", "800+", "990"].map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Thời lượng ước tính (phút)</label>
              <Input
                type="number"
                min={5}
                max={180}
                value={topicMinutes}
                onChange={(e) => setTopicMinutes(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">Mô tả chặng</label>
            <textarea
              rows={3}
              required
              value={topicDesc}
              onChange={(e) => setTopicDesc(e.target.value)}
              className={adminTextareaClass}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setTopicModalMode(null)}>
              Huỷ
            </Button>
            <Button type="submit" loading={savingTopic}>
              {topicModalMode === "create" ? "Tạo chặng" : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lesson Modal */}
      <Modal
        open={Boolean(lessonModalMode)}
        onClose={() => setLessonModalMode(null)}
        maxWidthClass="max-w-xl"
        title={lessonModalMode === "create" ? "Thêm Bài học Ngữ pháp mới" : "Đổi tên Bài học"}
      >
        <form onSubmit={handleSubmitLesson} className="space-y-3.5">
          {lessonModalMode === "create" && (
            <div>
              <label className="mb-1 block text-xs font-bold">Thuộc chặng</label>
              <select
                value={lessonTopicId}
                onChange={(e) => setLessonTopicId(e.target.value)}
                className={adminFieldClass}
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-bold">Tiêu đề bài học</label>
            <Input
              required
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              placeholder="VD: Rút gọn mệnh đề quan hệ V-ing / V3"
            />
          </div>

          {lessonModalMode === "create" && (
            <>
              <div>
                <label className="mb-1 block text-xs font-bold">Công thức ghi nhớ nhanh</label>
                <Input
                  value={lessonFormula}
                  onChange={(e) => setLessonFormula(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">Tóm tắt trọng tâm bài học</label>
                <textarea
                  rows={2}
                  value={lessonSummary}
                  onChange={(e) => setLessonSummary(e.target.value)}
                  className={adminTextareaClass}
                  placeholder="Giải thích quy tắc sử dụng..."
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold">Câu ví dụ (EN)</label>
                  <Input
                    value={lessonExampleEn}
                    onChange={(e) => setLessonExampleEn(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Nghĩa tiếng Việt</label>
                  <Input
                    value={lessonExampleVi}
                    onChange={(e) => setLessonExampleVi(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">Mẹo tránh bẫy ETS</label>
                <Input
                  value={lessonTrap}
                  onChange={(e) => setLessonTrap(e.target.value)}
                  placeholder="Lưu ý bẫy phổ biến trong Part 5..."
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setLessonModalMode(null)}>
              Huỷ
            </Button>
            <Button type="submit" loading={savingLesson}>
              {lessonModalMode === "create" ? "Xuất bản bài học" : "Lưu cập nhật"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// === community-tab.tsx ===
interface CommunityTabProps {
  onDataChanged: () => void;
}

const COMMUNITY_GROUPS = [
  "Hỏi bài - Giải đáp",
  "Kinh nghiệm học tập",
  "Luyện đề - Thi cử",
  "Luyện nghe & Dictation",
];

export function CommunityTab({ onDataChanged }: CommunityTabProps) {
  const { notify } = useApp();
  const [posts, setPosts] = React.useState<AdminCommunityPostRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [groupFilter, setGroupFilter] = React.useState("ALL");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [newGroup, setNewGroup] = React.useState(COMMUNITY_GROUPS[0]);
  const [newTitle, setNewTitle] = React.useState("");
  const [newContent, setNewContent] = React.useState("");
  const [newBadge, setNewBadge] = React.useState("Admin");
  const [newPinned, setNewPinned] = React.useState(true);
  const [savingPost, setSavingPost] = React.useState(false);

  const fetchPosts = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminRequest<{ posts: AdminCommunityPostRow[] }>("/api/admin/community");
      setPosts(data.posts);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể tải bài viết cộng đồng.", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  React.useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return fetchPosts();
    });
    return () => {
      active = false;
    };
  }, [fetchPosts]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (groupFilter !== "ALL" && p.group !== groupFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.user.name.toLowerCase().includes(q)
      );
    });
  }, [posts, search, groupFilter]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPost(true);
    try {
      const data = await adminRequest<{ post: AdminCommunityPostRow }>("/api/admin/community", {
        method: "POST",
        body: JSON.stringify({
          group: newGroup,
          title: newTitle,
          content: newContent,
          authorBadge: newBadge,
          isPinned: newPinned,
        }),
      });
      setPosts((prev) => [data.post, ...prev]);
      setCreateOpen(false);
      setNewTitle("");
      setNewContent("");
      notify("Đã đăng bài viết quản trị lên Cộng đồng!", "success");
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Đăng bài thất bại.", "error");
    } finally {
      setSavingPost(false);
    }
  };

  const handleTogglePin = async (post: AdminCommunityPostRow) => {
    setBusyId(post.id);
    try {
      const data = await adminRequest<{ post: AdminCommunityPostRow }>(
        `/api/admin/community/${post.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ isPinned: !post.isPinned }),
        }
      );
      setPosts((prev) => prev.map((p) => (p.id === post.id ? data.post : p)));
      notify(data.post.isPinned ? "Đã ghim bài lên đầu bảng tin." : "Đã bỏ ghim bài.", "info");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể ghim bài.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeletePost = async (post: AdminCommunityPostRow) => {
    setBusyId(post.id);
    try {
      await adminRequest<{ deletedId: string }>(`/api/admin/community/${post.id}`, {
        method: "DELETE",
      });
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      notify("Đã xoá bài viết khỏi cộng đồng.", "success");
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Xoá bài viết thất bại.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    setBusyId(commentId);
    try {
      await adminRequest<{ deletedId: string }>(`/api/admin/community/comments/${commentId}`, {
        method: "DELETE",
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: p.comments.filter((c) => c.id !== commentId),
                _count: { ...p._count, comments: Math.max(0, p._count.comments - 1) },
              }
            : p
        )
      );
      notify("Đã xoá bình luận vi phạm.", "success");
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Xoá bình luận thất bại.", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPanelHeader
        title="Kiểm duyệt Cộng đồng & Thông báo"
        description="Ghim bài hướng dẫn trọng tâm, kiểm duyệt bình luận thành viên và đăng thông báo chính thức."
        onRefresh={fetchPosts}
        refreshing={loading}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Đăng bài Admin
          </Button>
        }
      />

      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề, nội dung hoặc tác giả..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setGroupFilter("ALL")}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1 text-xs font-bold transition",
              groupFilter === "ALL"
                ? "border-[#1b2d1c] bg-[#19462b] text-white"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)]"
            )}
          >
            Tất cả ({posts.length})
          </button>
          {COMMUNITY_GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroupFilter(g)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs font-bold transition",
                groupFilter === g
                  ? "border-[#1b2d1c] bg-[#19462b] text-white"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)]"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-56 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
      ) : filtered.length === 0 ? (
        <AdminEmptyState icon={<MessageSquare className="h-5 w-5" />} message="Không có bài viết phù hợp." />
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => {
            const isExpanded = expandedId === post.id;
            return (
              <div
                key={post.id}
                className={cn(
                  "rounded-2xl border bg-[var(--surface)] p-4 shadow-xs transition",
                  post.isPinned
                    ? "border-2 border-[#19462b] dark:border-[#9ee56f]/50"
                    : "border-[var(--border)]"
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {post.isPinned && (
                        <Badge variant="green">
                          <Pin className="h-3 w-3" />
                          Đã ghim
                        </Badge>
                      )}
                      <Badge variant="neutral">{post.group}</Badge>
                      {post.authorBadge && <Badge variant="gold">{post.authorBadge}</Badge>}
                      <span className="text-xs font-bold text-[var(--heading)]">
                        {post.user.name}
                      </span>
                      <span className="text-[11px] text-[var(--muted-foreground)]">
                        · {formatShortDateTime(post.createdAt)}
                      </span>
                    </div>

                    <h3 className="mt-2 font-heading text-base font-bold text-[var(--heading)]">
                      {post.title}
                    </h3>
                    <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-[var(--muted-foreground)]">
                      {post.content}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[var(--muted-foreground)]">
                      <span>❤️ {post._count.likes} lượt thích</span>
                      <span>💬 {post._count.comments} bình luận</span>
                      <span>📊 {post._count.votes} bình chọn</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Button
                      variant={post.isPinned ? "primary" : "outline"}
                      size="sm"
                      disabled={busyId === post.id}
                      onClick={() => handleTogglePin(post)}
                    >
                      {post.isPinned ? (
                        <>
                          <PinOff className="h-3.5 w-3.5" />
                          Bỏ ghim
                        </>
                      ) : (
                        <>
                          <Pin className="h-3.5 w-3.5" />
                          Ghim bài
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : post.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                      Bình luận ({post.comments.length})
                    </Button>

                    <AdminDeleteButton
                      busy={busyId === post.id}
                      onConfirm={() => handleDeletePost(post)}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3.5 space-y-2 border-t border-[var(--border)] pt-3">
                    {post.comments.length === 0 ? (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Chưa có bình luận nào dưới bài viết này.
                      </p>
                    ) : (
                      post.comments.map((cm) => (
                        <div
                          key={cm.id}
                          className="flex items-start justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-[var(--heading)]">
                              {cm.user.name}{" "}
                              <span className="font-normal text-[11px] text-[var(--muted-foreground)]">
                                ({cm.user.email}) · {formatShortDateTime(cm.createdAt)}
                              </span>
                            </p>
                            <p className="mt-0.5 text-[var(--foreground)]">{cm.content}</p>
                          </div>
                          <button
                            type="button"
                            disabled={busyId === cm.id}
                            onClick={() => handleDeleteComment(post.id, cm.id)}
                            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300"
                          >
                            <Trash2 className="h-3 w-3" />
                            Xoá
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Official Admin Post Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidthClass="max-w-xl"
        title="Đăng thông báo / Bài viết Admin"
      >
        <form onSubmit={handleCreatePost} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold">Chuyên mục</label>
              <select
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                className={adminFieldClass}
              >
                {COMMUNITY_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Huy hiệu tác giả</label>
              <Input
                value={newBadge}
                onChange={(e) => setNewBadge(e.target.value)}
                placeholder="Admin / Mentor"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold">Tiêu đề bài viết</label>
            <Input
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="VD: Thông báo cập nhật bộ đề ETS mới nhất tuần này"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold">Nội dung</label>
            <textarea
              rows={4}
              required
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className={adminTextareaClass}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={newPinned}
              onChange={(e) => setNewPinned(e.target.checked)}
            />
            Ghim ngay lên đầu Cộng đồng
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" loading={savingPost}>
              Đăng bài ngay
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// === donations-tab.tsx ===
interface DonationsTabProps {
  onDataChanged: () => void;
}

export function DonationsTab({ onDataChanged }: DonationsTabProps) {
  const { notify } = useApp();
  const [donations, setDonations] = React.useState<AdminDonationRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "PAID" | "PENDING" | "CANCELLED">(
    "ALL"
  );
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [donorName, setDonorName] = React.useState("");
  const [amountVnd, setAmountVnd] = React.useState("50000");
  const [message, setMessage] = React.useState("");
  const [newStatus, setNewStatus] = React.useState<"PAID" | "PENDING">("PAID");
  const [savingNew, setSavingNew] = React.useState(false);

  const fetchDonations = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminRequest<{ donations: AdminDonationRow[] }>("/api/admin/donations");
      setDonations(data.donations);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể tải danh sách ủng hộ.", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  React.useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return fetchDonations();
    });
    return () => {
      active = false;
    };
  }, [fetchDonations]);

  const summary = React.useMemo(() => {
    const paidRows = donations.filter((d) => d.status === "PAID");
    const pendingRows = donations.filter((d) => d.status === "PENDING");
    return {
      paidSum: paidRows.reduce((s, d) => s + d.amountVnd, 0),
      paidCount: paidRows.length,
      pendingCount: pendingRows.length,
    };
  }, [donations]);

  const filtered = React.useMemo(() => {
    if (statusFilter === "ALL") return donations;
    return donations.filter((d) => d.status === statusFilter);
  }, [donations, statusFilter]);

  const handleUpdateStatus = async (
    row: AdminDonationRow,
    status: "PAID" | "PENDING" | "CANCELLED"
  ) => {
    setBusyId(row.id);
    try {
      const data = await adminRequest<{ donation: AdminDonationRow }>(
        `/api/admin/donations/${row.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );
      setDonations((prev) => prev.map((d) => (d.id === row.id ? data.donation : d)));
      notify(`Đơn #${row.orderCode} đã chuyển sang ${status}.`, "success");
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Cập nhật trạng thái thất bại.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteDonation = async (row: AdminDonationRow) => {
    setBusyId(row.id);
    try {
      await adminRequest<{ deletedId: string }>(`/api/admin/donations/${row.id}`, {
        method: "DELETE",
      });
      setDonations((prev) => prev.filter((d) => d.id !== row.id));
      notify(`Đã xoá đơn #${row.orderCode}.`, "success");
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể xoá bản ghi.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNew(true);
    try {
      const data = await adminRequest<{ donation: AdminDonationRow }>("/api/admin/donations", {
        method: "POST",
        body: JSON.stringify({
          donorName,
          amountVnd: Number(amountVnd),
          message,
          status: newStatus,
        }),
      });
      setDonations((prev) => [data.donation, ...prev]);
      setCreateOpen(false);
      setDonorName("");
      setAmountVnd("50000");
      setMessage("");
      notify(`Đã ghi nhận đơn ủng hộ #${data.donation.orderCode}.`, "success");
      onDataChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể tạo bản ghi.", "error");
    } finally {
      setSavingNew(false);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPanelHeader
        title="Quản lý Ủng hộ & Đối soát VietQR"
        description="Theo dõi mã QR ủng hộ server, xác nhận giao dịch chuyển khoản thủ công hoặc ghi nhận ủng hộ trực tiếp."
        onRefresh={fetchDonations}
        refreshing={loading}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Ghi nhận thủ công
          </Button>
        }
      />

      {/* Summary Strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border-2 border-[#19462b] bg-[#ebf5e3] p-4 dark:border-[#9ee56f]/40 dark:bg-[#142318]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#46633e] dark:text-[#9ee56f]">
            Tổng đã xác nhận (PAID)
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold text-[#162617] dark:text-white">
            {formatVnd(summary.paidSum)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Lượt đã thanh toán
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold text-[var(--heading)]">
            {summary.paidCount} lượt
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Đang chờ đối soát (PENDING)
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold text-amber-600 dark:text-amber-300">
            {summary.pendingCount} đơn
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            { id: "ALL", label: `Tất cả (${donations.length})` },
            { id: "PAID", label: "Đã thanh toán (PAID)" },
            { id: "PENDING", label: "Chờ đối soát (PENDING)" },
            { id: "CANCELLED", label: "Đã huỷ (CANCELLED)" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold transition",
              statusFilter === tab.id
                ? "border-[#1b2d1c] bg-[#19462b] text-white"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--heading)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="h-56 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
      ) : filtered.length === 0 ? (
        <AdminEmptyState icon={<HeartHandshake className="h-5 w-5" />} message="Chưa có giao dịch nào." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
          <table className="w-full min-w-[780px] text-left text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-alt)] text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              <tr>
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Người ủng hộ</th>
                <th className="px-4 py-3">Số tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3 text-right">Đối soát</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((row) => (
                <tr key={row.id} className="transition hover:bg-[var(--surface-alt)]/60">
                  <td className="px-4 py-3 font-mono font-extrabold text-[var(--heading)]">
                    #{row.orderCode}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-[var(--heading)]">{row.donorName}</p>
                    <p className="max-w-xs truncate text-[11px] text-[var(--muted-foreground)]">
                      {row.message || "Không có lời nhắn"}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono font-extrabold text-[var(--heading)]">
                    {formatVnd(row.amountVnd)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        row.status === "PAID"
                          ? "green"
                          : row.status === "PENDING"
                          ? "gold"
                          : "rose"
                      }
                    >
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[var(--muted-foreground)]">
                    <p>Tạo: {formatShortDateTime(row.createdAt)}</p>
                    {row.paidAt && <p>Duyệt: {formatShortDateTime(row.paidAt)}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {row.status !== "PAID" && (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => handleUpdateStatus(row, "PAID")}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-400 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Duyệt PAID
                        </button>
                      )}
                      {row.status === "PAID" && (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => handleUpdateStatus(row, "PENDING")}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          Pending
                        </button>
                      )}
                      {row.status !== "CANCELLED" && (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => handleUpdateStatus(row, "CANCELLED")}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-[var(--muted-foreground)] hover:text-[var(--heading)]"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Huỷ
                        </button>
                      )}
                      <AdminDeleteButton
                        busy={busyId === row.id}
                        onConfirm={() => handleDeleteDonation(row)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Manual Donation Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Ghi nhận giao dịch ủng hộ thủ công"
      >
        <form onSubmit={handleCreateManual} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-bold">Tên người ủng hộ</label>
            <Input
              required
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="VD: Minh Anh TOEIC 900"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold">Số tiền (VNĐ)</label>
              <Input
                type="number"
                min={1000}
                required
                value={amountVnd}
                onChange={(e) => setAmountVnd(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Trạng thái</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as "PAID" | "PENDING")}
                className={adminFieldClass}
              >
                <option value="PAID">PAID (Đã nhận)</option>
                <option value="PENDING">PENDING (Chờ kiểm tra)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">Lời nhắn</label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Cảm ơn LingoChill giữ đề miễn phí!"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" loading={savingNew}>
              Lưu bản ghi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// === startup-tabs.tsx ===
interface ApprovalsPayload {
  pendingUsers: Array<{
    id: string;
    name: string;
    email: string;
    school: string;
    major: string;
    ageGroup: string;
    approvalStatus: string;
    parentConsentStatus: string;
    inviteCodeUsed: string | null;
  }>;
  allBetaUsers: Array<{
    id: string;
    name: string;
    email: string;
    school: string;
    major: string;
    ageGroup: string;
    approvalStatus: string;
    parentConsentStatus: string;
    parentMonitorCode: string | null;
  }>;
  parentConsents: Array<{
    id: string;
    userId: string;
    studentName: string;
    studentAgeGroup: string;
    guardianName: string;
    guardianRelation: string;
    guardianPhone: string;
    guardianEmail: string | null;
    status: string;
    reviewedBy: string | null;
    user: { email: string; parentMonitorCode: string | null };
  }>;
  inviteCodes: Array<{
    id: string;
    code: string;
    school: string;
    major: string;
    teacherName: string;
    maxUses: number;
    usedCount: number;
    isActive: boolean;
  }>;
}

export function AdminApprovalsTab({ onDataChanged }: { onDataChanged: () => void }) {
  const { notify } = useApp();
  const [data, setData] = React.useState<ApprovalsPayload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [newCode, setNewCode] = React.useState("");
  const [newMajor, setNewMajor] = React.useState("Tất cả ngành");
  const [newTeacher, setNewTeacher] = React.useState("GV Nguyễn Xuân Tùng");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const payload = await adminRequest<ApprovalsPayload>("/api/admin/approvals");
      setData(payload);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể tải danh sách duyệt.", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  React.useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  const handleDecision = async (
    type: "USER_APPROVAL" | "PARENT_CONSENT" | "INVITE_TOGGLE",
    id: string,
    status?: string
  ) => {
    await adminRequest("/api/admin/approvals", {
      method: "PATCH",
      body: JSON.stringify({ type, id, status }),
    });
    notify("Đã cập nhật trạng thái duyệt.", "success");
    onDataChanged();
    await load();
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    await adminRequest("/api/admin/approvals", {
      method: "POST",
      body: JSON.stringify({
        code: newCode.trim().toUpperCase(),
        major: newMajor,
        teacherName: newTeacher,
      }),
    });
    setNewCode("");
    notify("Đã tạo mã mời giáo viên mới.", "success");
    await load();
  };

  if (loading && !data) {
    return <Card className="p-8 text-sm text-[var(--muted-foreground)]">Đang tải dữ liệu duyệt...</Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-extrabold text-[var(--heading)]">
            Duyệt thành viên Thử nghiệm kín VSVC &amp; Phiếu Phụ huynh
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Quản lý danh sách HSSV vào nhóm kín, duyệt phiếu đồng ý của phụ huynh (&lt;18 tuổi) và
            cấp mã mời giáo viên phụ trách.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void load()}>
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </Button>
      </div>

      {/* Invite Codes */}
      <Card className="p-5 space-y-4">
        <h3 className="font-heading text-base font-extrabold text-[var(--heading)]">
          Mã mời giáo viên phụ trách ({data?.inviteCodes.length ?? 0})
        </h3>
        <form onSubmit={handleCreateInvite} className="grid gap-2 sm:grid-cols-4">
          <Input
            required
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            placeholder="Mã mới (VD: VSVC-LOP26)"
            className="font-mono-num"
          />
          <select
            value={newMajor}
            onChange={(e) => setNewMajor(e.target.value)}
            className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold"
          >
            <option value="Tất cả ngành">Tất cả ngành</option>
            {siteConfig.startupProject.majors.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <Input
            value={newTeacher}
            onChange={(e) => setNewTeacher(e.target.value)}
            placeholder="Giáo viên phụ trách"
          />
          <Button type="submit" size="sm">
            <Plus className="h-4 w-4" />
            Tạo mã mời
          </Button>
        </form>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {data?.inviteCodes.map((inv) => (
            <div
              key={inv.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3 text-xs flex items-center justify-between gap-2"
            >
              <div>
                <p className="font-mono-num text-sm font-black text-[var(--heading)]">{inv.code}</p>
                <p className="text-[var(--muted-foreground)]">
                  {inv.major} · {inv.usedCount}/{inv.maxUses} lượt
                </p>
                <p className="text-[11px]">{inv.teacherName}</p>
              </div>
              <Button
                size="sm"
                variant={inv.isActive ? "outline" : "secondary"}
                onClick={() => void handleDecision("INVITE_TOGGLE", inv.id)}
              >
                {inv.isActive ? "Đang bật" : "Đã tắt"}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Parent Consents */}
      <Card className="p-5 space-y-3">
        <h3 className="font-heading text-base font-extrabold text-[var(--heading)] flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-[var(--primary)]" />
          Phiếu đồng ý Phụ huynh cho học viên &lt; 18 tuổi ({data?.parentConsents.length ?? 0})
        </h3>
        {data?.parentConsents.length === 0 ? (
          <p className="text-xs text-[var(--muted-foreground)]">Chưa có phiếu đồng ý nào.</p>
        ) : (
          <div className="space-y-2.5">
            {data?.parentConsents.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3.5 text-xs flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[var(--heading)]">{c.studentName}</span>
                    <Badge variant={c.status === "APPROVED" ? "green" : "gold"}>{c.status}</Badge>
                    <Badge variant="neutral">{c.studentAgeGroup}</Badge>
                    {c.user.parentMonitorCode && (
                      <span className="font-mono-num text-[11px] text-[var(--primary)]">
                        {c.user.parentMonitorCode}
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--muted-foreground)]">
                    Phụ huynh: <b>{c.guardianName}</b> ({c.guardianRelation}) · SĐT:{" "}
                    {c.guardianPhone} {c.guardianEmail ? `· ${c.guardianEmail}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  {c.status !== "APPROVED" && (
                    <Button
                      size="sm"
                      onClick={() => void handleDecision("PARENT_CONSENT", c.id, "APPROVED")}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Duyệt phiếu
                    </Button>
                  )}
                  {c.status !== "REVOKED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleDecision("PARENT_CONSENT", c.id, "REVOKED")}
                    >
                      <XCircle className="h-3.5 w-3.5 text-rose-600" />
                      Thu hồi
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pending / All Beta Students */}
      <Card className="p-5 space-y-3">
        <h3 className="font-heading text-base font-extrabold text-[var(--heading)]">
          Danh sách duyệt thành viên nhóm kín ({data?.allBetaUsers.length ?? 0})
        </h3>
        <div className="space-y-2">
          {data?.allBetaUsers.map((u) => (
            <div
              key={u.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-xs flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-[var(--heading)]">{u.name}</span>
                  <span className="text-[var(--muted-foreground)]">{u.email}</span>
                  <Badge
                    variant={
                      u.approvalStatus === "APPROVED"
                        ? "green"
                        : u.approvalStatus === "PENDING"
                        ? "gold"
                        : "neutral"
                    }
                  >
                    {u.approvalStatus}
                  </Badge>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  {u.major} · {u.school} · {u.ageGroup}
                </p>
              </div>
              <div className="flex gap-2">
                {u.approvalStatus !== "APPROVED" && (
                  <Button
                    size="sm"
                    onClick={() => void handleDecision("USER_APPROVAL", u.id, "APPROVED")}
                  >
                    Duyệt vào nhóm
                  </Button>
                )}
                {u.approvalStatus !== "SUSPENDED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleDecision("USER_APPROVAL", u.id, "SUSPENDED")}
                  >
                    Tạm khóa
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function AdminScenariosTab({ onDataChanged }: { onDataChanged: () => void }) {
  const { notify } = useApp();
  const [scenarios, setScenarios] = React.useState<
    Array<{
      id: string;
      slug: string;
      title: string;
      major: string;
      level: string;
      authorName: string;
      reviewedByTeacher: string;
      _count: { sessions: number };
    }>
  >([]);
  const [title, setTitle] = React.useState("");
  const [major, setMajor] = React.useState("Cơ khí");
  const [level, setLevel] = React.useState("Cơ bản (A2)");
  const [summary, setSummary] = React.useState("");
  const [reviewedByTeacher, setReviewedByTeacher] = React.useState(
    "GV chuyên môn Khoa · VSVC"
  );

  const load = React.useCallback(async () => {
    const res = await adminRequest<{ scenarios: typeof scenarios }>("/api/admin/scenarios");
    setScenarios(res.scenarios);
  }, []);

  React.useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminRequest("/api/admin/scenarios", {
      method: "POST",
      body: JSON.stringify({ title, major, level, summary, reviewedByTeacher }),
    });
    setTitle("");
    setSummary("");
    notify("Đã thêm tình huống nghề nghiệp 3 lớp mới!", "success");
    onDataChanged();
    await load();
  };

  const handleDelete = async (id: string) => {
    await adminRequest(`/api/admin/scenarios?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    notify("Đã xóa tình huống.", "info");
    await load();
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4">
        <h2 className="font-heading text-lg font-extrabold text-[var(--heading)] flex items-center gap-2">
          <Layers className="h-5 w-5 text-[var(--primary)]" />
          Thêm Tình huống Nghề nghiệp (3 Lớp)
        </h2>
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên tình huống (VD: Kiểm tra lỗi PLC...)"
            />
            <select
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-semibold"
            >
              {siteConfig.startupProject.majors.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-semibold"
            >
              {siteConfig.startupProject.selfLevels.map((lv) => (
                <option key={lv} value={lv}>
                  {lv}
                </option>
              ))}
            </select>
          </div>
          <Input
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Mô tả ngắn bối cảnh nghề nghiệp và mục tiêu luyện tập..."
          />
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={reviewedByTeacher}
              onChange={(e) => setReviewedByTeacher(e.target.value)}
              placeholder="Giáo viên chuyên môn rà soát"
              className="flex-1"
            />
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" />
              Lưu tình huống mới
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="font-heading text-base font-extrabold text-[var(--heading)]">
          Danh sách tình huống đã rà soát ({scenarios.length})
        </h3>
        <div className="space-y-2">
          {scenarios.map((sc) => (
            <div
              key={sc.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-xs flex flex-wrap items-center justify-between gap-2"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="green">{sc.major}</Badge>
                  <Badge variant="neutral">{sc.level}</Badge>
                  <span className="font-bold text-[var(--heading)]">{sc.title}</span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                  Tác giả: {sc.authorName} · Rà soát: {sc.reviewedByTeacher} · {sc._count.sessions}{" "}
                  lịch ghép cặp
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => void handleDelete(sc.id)}>
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function AdminSafetyTab({ onDataChanged }: { onDataChanged: () => void }) {
  const { notify } = useApp();
  const [data, setData] = React.useState<{
    reports: Array<{
      id: string;
      category: string;
      targetType: string;
      description: string;
      status: string;
      reporter: { name: string; email: string };
      reportedUser: { id: string; name: string; approvalStatus: string } | null;
    }>;
    rubrics: Array<{
      id: string;
      overallScore: number;
      satisfactionRating: number;
      strengths: string;
      mentorReviewed: boolean;
      mentorNote: string | null;
      reviewer: { name: string };
      targetUser: { name: string };
      session: { major: string; slotLabel: string };
    }>;
    kpis: Phase0bKpiSummary;
  } | null>(null);

  const load = React.useCallback(async () => {
    const res = await adminRequest<typeof data>("/api/admin/safety");
    setData(res);
  }, []);

  React.useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  const handleReport = async (id: string, status: string, suspendReportedUser = false) => {
    await adminRequest("/api/admin/safety", {
      method: "PATCH",
      body: JSON.stringify({
        type: "REPORT",
        id,
        status,
        suspendReportedUser,
        resolutionNote: suspendReportedUser
          ? "Đã khóa tài khoản vi phạm theo Nội quy Phụ lục B."
          : "Đã kiểm tra xử lý báo cáo.",
      }),
    });
    notify("Đã xử lý báo cáo an toàn.", "success");
    onDataChanged();
    await load();
  };

  const handleMentorReview = async (id: string) => {
    await adminRequest("/api/admin/safety", {
      method: "PATCH",
      body: JSON.stringify({ type: "MENTOR_RUBRIC", id }),
    });
    notify("Đã đánh dấu Mentor đã rà soát mẫu rubric.", "success");
    await load();
  };

  if (!data) {
    return <Card className="p-8 text-sm text-[var(--muted-foreground)]">Đang tải dữ liệu an toàn...</Card>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-3">
        <h2 className="font-heading text-lg font-extrabold text-[var(--heading)] flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[var(--primary)]" />
          Chỉ số Thử nghiệm kín Giai đoạn 0b
        </h2>
        <div className="grid gap-3 sm:grid-cols-4 text-xs">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3">
            <p className="text-[var(--muted-foreground)]">Thành viên đã duyệt</p>
            <p className="font-mono-num text-xl font-black text-[var(--heading)]">
              {data.kpis.activeMembers}/{data.kpis.activeMembersTarget}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3">
            <p className="text-[var(--muted-foreground)]">Buổi ghép cặp xong</p>
            <p className="font-mono-num text-xl font-black text-[var(--heading)]">
              {data.kpis.completedSessions}/{data.kpis.completedSessionsTarget}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3">
            <p className="text-[var(--muted-foreground)]">Tỷ lệ hoàn thành</p>
            <p className="font-mono-num text-xl font-black text-[var(--heading)]">
              {data.kpis.completionRatePct}% (≥70%)
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3">
            <p className="text-[var(--muted-foreground)]">Hài lòng trung bình</p>
            <p className="font-mono-num text-xl font-black text-[var(--heading)]">
              {data.kpis.avgSatisfaction}/5 (≥4.0)
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="font-heading text-base font-extrabold text-[var(--heading)] flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-600" />
          Báo cáo vi phạm ({data.reports.length})
        </h3>
        {data.reports.length === 0 ? (
          <p className="text-xs text-[var(--muted-foreground)]">Chưa có báo cáo vi phạm nào.</p>
        ) : (
          <div className="space-y-2.5">
            {data.reports.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3.5 text-xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={r.status === "OPEN" ? "gold" : "green"}>{r.status}</Badge>
                    <Badge variant="neutral">{r.category}</Badge>
                    <span className="font-bold text-[var(--heading)]">
                      Người báo: {r.reporter.name}
                    </span>
                    {r.reportedUser && (
                      <span className="text-rose-700 font-semibold">
                        Đối tượng: {r.reportedUser.name} ({r.reportedUser.approvalStatus})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleReport(r.id, "REVIEWED", false)}
                    >
                      Đánh dấu đã xem
                    </Button>
                    {r.reportedUser && (
                      <Button
                        size="sm"
                        className="bg-rose-700 hover:bg-rose-800 text-white"
                        onClick={() => void handleReport(r.id, "ACTION_TAKEN", true)}
                      >
                        Khóa người vi phạm
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-[var(--foreground)]">{r.description}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="font-heading text-base font-extrabold text-[var(--heading)] flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-[var(--primary)]" />
          Rà soát mẫu ngẫu nhiên Phiếu Rubric (Mục XI)
        </h3>
        <div className="space-y-2">
          {data.rubrics.map((rb) => (
            <div
              key={rb.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3 text-xs flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="font-bold text-[var(--heading)]">
                  {rb.reviewer.name} &rarr; {rb.targetUser.name} ({rb.session.major}) ·{" "}
                  {rb.overallScore}/5 điểm · Hài lòng {rb.satisfactionRating}/5
                </p>
                <p className="text-[var(--muted-foreground)]">Điểm mạnh: {rb.strengths}</p>
              </div>
              {rb.mentorReviewed ? (
                <Badge variant="green">Mentor đã rà soát</Badge>
              ) : (
                <Button size="sm" variant="outline" onClick={() => void handleMentorReview(rb.id)}>
                  Xác nhận Mentor đã rà soát
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function AdminSurveysTab() {
  const [payload, setPayload] = React.useState<{
    analytics: SurveyAnalyticsSummary;
    responses: unknown[];
  } | null>(null);

  React.useEffect(() => {
    void adminRequest<{ analytics: SurveyAnalyticsSummary; responses: unknown[] }>(
      "/api/admin/surveys"
    ).then(setPayload);
  }, []);

  if (!payload) {
    return <Card className="p-8 text-sm text-[var(--muted-foreground)]">Đang tải kết quả khảo sát H1–H6...</Card>;
  }

  const { analytics } = payload;

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-extrabold text-[var(--heading)] flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[var(--primary)]" />
              Kết quả Khảo sát H1–H6 ({analytics.totalResponses}/{analytics.targets.totalTarget} mẫu)
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              N1: {analytics.targets.n1Count}/{analytics.targets.n1Target} · N2:{" "}
              {analytics.targets.n2Count}/{analytics.targets.n2Target} · N3:{" "}
              {analytics.targets.n3Count}/{analytics.targets.n3Target} · Android:{" "}
              {analytics.androidCount} · iPhone: {analytics.iphoneCount}
            </p>
          </div>
          <a
            href="/api/admin/surveys"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-xs font-bold text-[var(--heading)]"
          >
            <Download className="h-3.5 w-3.5" />
            Xem JSON số liệu
          </a>
        </div>

        <div className="space-y-2.5">
          {analytics.hypotheses.map((h) => (
            <div
              key={h.code}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3.5 text-xs space-y-1.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[var(--heading)]">
                  [{h.code}] {h.statement}
                </span>
                <Badge
                  variant={h.passed === null ? "neutral" : h.passed ? "green" : "gold"}
                >
                  {h.actualPct}% (Ngưỡng ≥{h.thresholdPct}%)
                </Badge>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                <div
                  className={cn(
                    "h-full rounded-full",
                    h.actualPct >= h.thresholdPct ? "bg-[#1a4d2e]" : "bg-amber-500"
                  )}
                  style={{ width: `${Math.min(100, h.actualPct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// === admin-shell.tsx ===
interface AdminShellProps {
  adminUser: PublicUser;
  initialOverview: AdminOverviewPayload;
}

export function AdminShell({ adminUser, initialOverview }: AdminShellProps) {
  const router = useRouter();
  const { theme, toggleTheme, logout, notify } = useApp();
  const [activeTab, setActiveTab] = React.useState<AdminTabId>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [overview, setOverview] = React.useState<AdminOverviewPayload>(initialOverview);
  const [refreshingOverview, setRefreshingOverview] = React.useState(false);

  const refreshOverview = React.useCallback(async () => {
    setRefreshingOverview(true);
    try {
      const fresh = await adminRequest<AdminOverviewPayload>("/api/admin/overview");
      setOverview(fresh);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể làm mới thống kê.", "error");
    } finally {
      setRefreshingOverview(false);
    }
  }, [notify]);

  const navItems: Array<{
    id: AdminTabId;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: "overview",
      label: "Tổng quan",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: "users",
      label: "Người dùng",
      icon: <Users className="h-4 w-4" />,
      badge: overview.stats.usersCount,
    },
    {
      id: "documents",
      label: "Kho Tài liệu",
      icon: <FileText className="h-4 w-4" />,
      badge: overview.stats.documentsCount,
    },
    {
      id: "exams",
      label: "Đề thi TOEIC",
      icon: <GraduationCap className="h-4 w-4" />,
      badge: overview.stats.examTestsCount,
    },
    {
      id: "grammar",
      label: "Lộ trình Ngữ pháp",
      icon: <BookOpen className="h-4 w-4" />,
      badge: overview.stats.grammarLessonsCount,
    },
    {
      id: "community",
      label: "Cộng đồng",
      icon: <MessageSquare className="h-4 w-4" />,
      badge: overview.stats.communityPostsCount,
    },
    {
      id: "donations",
      label: "Ủng hộ VietQR",
      icon: <HeartHandshake className="h-4 w-4" />,
      badge:
        overview.stats.pendingDonationsCount > 0
          ? overview.stats.pendingDonationsCount
          : undefined,
    },
    {
      id: "approvals",
      label: "Duyệt VSVC & Phụ huynh",
      icon: <UserCheck className="h-4 w-4" />,
    },
    {
      id: "scenarios",
      label: "Tình huống 3 lớp",
      icon: <Layers className="h-4 w-4" />,
    },
    {
      id: "safety",
      label: "Ghép cặp & An toàn",
      icon: <ShieldAlert className="h-4 w-4" />,
    },
    {
      id: "surveys",
      label: "Khảo sát H1–H6",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      id: "storage",
      label: "Lưu trữ mã nguồn",
      icon: <Database className="h-4 w-4" />,
    },
  ];

  const handleSelectTab = (tab: AdminTabId) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await logout();
    router.refresh();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0f241b] p-4 text-white">
      <div>
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#9ee56f] text-[#0f241b] shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-base font-extrabold tracking-tight leading-none">
                {siteConfig.brand.shortName}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#9ee56f]">
                Admin Studio
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Đóng thanh điều hướng"
            className="rounded-xl p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-4 space-y-1">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition",
                  active
                    ? "bg-[#9ee56f] text-[#0f241b] shadow-xs"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                )}
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-mono text-[10px] font-extrabold",
                      active
                        ? "bg-[#0f241b]/15 text-[#0f241b]"
                        : item.id === "donations" && overview.stats.pendingDonationsCount > 0
                        ? "bg-amber-400 text-[#0f241b]"
                        : "bg-white/10 text-white/80"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 border-t border-white/10 pt-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="truncate text-xs font-bold text-white">{adminUser.name}</p>
          <p className="truncate text-[11px] text-white/60">{adminUser.email}</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#9ee56f]/20 px-2 py-0.5 text-[10px] font-extrabold text-[#9ee56f]">
            <ShieldCheck className="h-3 w-3" />
            ROLE: ADMIN
          </span>
        </div>

        <Link
          href="/luu-tru-ma-nguon"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#9ee56f]/40 bg-[#9ee56f]/15 px-3 py-2 text-xs font-extrabold text-[#9ee56f] transition hover:bg-[#9ee56f]/25"
        >
          <Database className="h-3.5 w-3.5" />
          Lưu trữ mã nguồn (/luu-tru-ma-nguon)
        </Link>

        <Link
          href="/"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-white/85 transition hover:bg-white/10"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Về trang học viên
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-500/20"
        >
          <LogOut className="h-3.5 w-3.5" />
          Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f3ea] bg-paper-grid text-[var(--foreground)] dark:bg-[#0c130e]">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-[#1b2d1c] lg:sticky lg:top-0 lg:block lg:h-screen">
          {sidebarContent}
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="h-full w-72 max-w-full" onClick={(e) => e.stopPropagation()}>
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Right Workspace */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Utility Header */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 backdrop-blur-md sm:px-6">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Mở menu quản trị"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--heading)] lg:hidden"
              >
                <Menu className="h-4.5 w-4.5" />
              </button>
              <div>
                <p className="font-heading text-sm font-extrabold text-[var(--heading)]">
                  {navItems.find((i) => i.id === activeTab)?.label}
                </p>
                <p className="hidden text-[11px] text-[var(--muted-foreground)] sm:block">
                  Hệ thống quản trị tập trung · {siteConfig.brand.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Chuyển giao diện sáng/tối"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--heading)] hover:bg-[var(--muted)]"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>

              <Link
                href="/"
                className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#1b2d1c] bg-white px-3 text-xs font-bold text-[#162617] shadow-[2px_2px_0_#1b2d1c] transition hover:-translate-y-0.5 dark:border-[#9ee56f]/35 dark:bg-[#16211a] dark:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Trang chủ
              </Link>
            </div>
          </header>

          {/* Main Tab Content */}
          <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">
            {activeTab === "overview" && (
              <OverviewTab
                data={overview}
                onRefresh={refreshOverview}
                refreshing={refreshingOverview}
                onNavigateTab={handleSelectTab}
              />
            )}
            {activeTab === "users" && (
              <UsersTab currentAdminId={adminUser.id} onDataChanged={refreshOverview} />
            )}
            {activeTab === "documents" && <DocumentsTab onDataChanged={refreshOverview} />}
            {activeTab === "exams" && <ExamsTab onDataChanged={refreshOverview} />}
            {activeTab === "grammar" && <GrammarTab onDataChanged={refreshOverview} />}
            {activeTab === "community" && <CommunityTab onDataChanged={refreshOverview} />}
            {activeTab === "donations" && <DonationsTab onDataChanged={refreshOverview} />}
            {activeTab === "approvals" && <AdminApprovalsTab onDataChanged={refreshOverview} />}
            {activeTab === "scenarios" && <AdminScenariosTab onDataChanged={refreshOverview} />}
            {activeTab === "safety" && <AdminSafetyTab onDataChanged={refreshOverview} />}
            {activeTab === "surveys" && <AdminSurveysTab />}
            {activeTab === "storage" && (
              <SourceStorageStudio adminUser={adminUser} standalonePage={false} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
