"use client";

import * as React from "react";
import { ArrowRight, Bell, BookMarked, Box, CheckCircle2, ChevronDown, Compass, Eye, EyeOff, Flame, Globe2, GraduationCap, Heart, KeyRound, Lock, LogOut, Mail, Map as MapIcon, Menu, MessageSquare, Moon, Phone, Share2, ShieldCheck, Sparkles, Star, Sun, Trophy, User as UserIcon, X } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui";
import { Button } from "@/components/ui";
import { LoginCompanionArt } from "@/components/brand/mascot";
import { siteConfig } from "@/lib/site-config";
import { FacebookBrandIcon, YoutubeBrandIcon } from "@/components/ui";
import { FeatureGlobe } from "@/components/home";
import { StudyIsland3D } from "@/components/three";
import { useApp } from "@/components/providers/app-provider";
import { siteConfig, type FeatureMapItem } from "@/lib/site-config";
import { usePathname } from "next/navigation";
import { Mascot } from "@/components/brand/mascot";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { Card } from "@/components/ui";

// === auth-modal.tsx ===
interface AuthModalProps {
  open: boolean;
  reason?: string;
  guestSavedDocIds: string[];
  onClose: () => void;
  onAuthenticated: () => Promise<void>;
}

export function AuthModal(props: AuthModalProps) {
  if (!props.open) return null;
  return <AuthModalInner {...props} />;
}

function AuthModalInner({
  open,
  reason,
  guestSavedDocIds,
  onClose,
  onAuthenticated,
}: AuthModalProps) {
  const [mode, setMode] = React.useState<"password" | "register" | "otp">("password");
  const [step, setStep] = React.useState<"email" | "otp">("email");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [name, setName] = React.useState("");
  const [inviteCode, setInviteCode] = React.useState("");
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
        body: JSON.stringify({
          email: email.trim(),
          password,
          guestSavedDocIds,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        error?: { message: string };
      };
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Email hoặc mật khẩu không đúng.");
        return;
      }
      await onAuthenticated();
    } catch {
      setError("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Mật khẩu cần tối thiểu 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          inviteCode: inviteCode.trim() || undefined,
          acceptBetaRules: true,
          guestSavedDocIds,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        error?: { message: string };
      };
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Không thể tạo tài khoản.");
        return;
      }
      await onAuthenticated();
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
        error?: { message: string };
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
        body: JSON.stringify({
          email,
          code: otp,
          name: name.trim() || undefined,
          inviteCode: inviteCode.trim() || undefined,
          guestSavedDocIds,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        error?: { message: string };
      };
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Mã OTP không hợp lệ.");
        return;
      }
      await onAuthenticated();
    } catch {
      setError("Không thể xác thực OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-[740px]"
      contentClassName="p-0 overflow-hidden rounded-3xl border-2 border-[#25442b] bg-[#ffffff] dark:bg-[#141d17]"
    >
      <div className="grid md:grid-cols-[260px_1fr]">
        {/* Left Companion Panel with Dot-Grid Background */}
        <div className="bg-dot-grid hidden md:flex flex-col items-center justify-between border-r border-[var(--border)] p-6">
          <div className="w-full" />
          <div className="w-48">
            <LoginCompanionArt className="h-auto w-full" />
          </div>
          <p className="text-center text-xs font-medium text-[var(--muted-foreground)]">
            Học chill, lưu tiến độ, lên hạng cùng {siteConfig.brand.mascotName}
          </p>
        </div>

        {/* Right Form Panel */}
        <div className="p-6 sm:p-8">
          <p className="font-heading text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
            {siteConfig.brand.shortName}
          </p>
          <h2 className="mt-1 font-heading text-2xl font-extrabold text-[var(--heading)]">
            Đăng nhập để tiếp tục
          </h2>
          <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
            {reason || "Đăng nhập để lưu tiến độ, nhận EXP và lên bảng xếp hạng."}
          </p>

          {guestSavedDocIds.length > 0 && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              Hệ thống sẽ tự động đồng bộ <b>{guestSavedDocIds.length} tài liệu</b> bạn vừa lưu tạm.
            </div>
          )}

          <div className="mt-5">
            <a
              href="/api/auth/google"
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#cfd6cc] bg-white px-4 py-2.5 text-sm font-semibold text-[#1e293b] shadow-xs transition hover:bg-[#f8faf7]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.6-5.4 3.6-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z"
                />
                <path
                  fill="#34A853"
                  d="M3.4 7.3l3.2 2.3C7.5 7.4 9.6 5.9 12 5.9c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.3 12 2.3 8.2 2.3 4.9 4.4 3.4 7.3z"
                />
                <path
                  fill="#FBBC05"
                  d="M12 21.7c2.6 0 4.8-.9 6.4-2.3l-3-2.4c-.8.6-1.9 1-3.4 1-2.6 0-4.9-1.8-5.7-4.2l-3.2 2.5c1.5 3.2 4.8 5.4 8.9 5.4z"
                />
                <path
                  fill="#4285F4"
                  d="M21.3 12.2c0-.6-.1-1.1-.2-1.6H12v3.9h5.4c-.3 1.3-1.1 2.4-2.2 3.1l3 2.4c1.8-1.6 3.1-4.1 3.1-7.8z"
                />
              </svg>
              Tiếp tục với Google
            </a>

            <div className="my-4 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
              <div className="h-px flex-1 border-b border-dashed border-[var(--border)]" />
              <span>hoặc dùng Email (không cần Google)</span>
              <div className="h-px flex-1 border-b border-dashed border-[var(--border)]" />
            </div>

            <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode("password");
                  setError(null);
                }}
                className={`rounded-lg py-1.5 transition cursor-pointer ${
                  mode === "password"
                    ? "bg-[#273d21] text-white"
                    : "text-[var(--muted-foreground)] hover:text-[var(--heading)]"
                }`}
              >
                Mật khẩu
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className={`rounded-lg py-1.5 transition cursor-pointer ${
                  mode === "register"
                    ? "bg-[#273d21] text-white"
                    : "text-[var(--muted-foreground)] hover:text-[var(--heading)]"
                }`}
              >
                Tạo TK mới
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("otp");
                  setError(null);
                }}
                className={`rounded-lg py-1.5 transition cursor-pointer ${
                  mode === "otp"
                    ? "bg-[#273d21] text-white"
                    : "text-[var(--muted-foreground)] hover:text-[var(--heading)]"
                }`}
              >
                Mã OTP
              </button>
            </div>

            {mode === "password" ? (
              <form onSubmit={handlePasswordLogin} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--heading)]">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ban@gmail.com"
                      className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[#2a5c30] focus:ring-2 focus:ring-[#2a5c30]/15"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--heading)]">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-10 text-sm text-[var(--foreground)] outline-none transition focus:border-[#2a5c30]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-xs font-medium text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#273d21] text-sm font-bold text-white transition hover:bg-[#1f321a] disabled:opacity-60 cursor-pointer"
                >
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : mode === "register" ? (
              <form onSubmit={handleRegisterPassword} className="space-y-2.5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--heading)]">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                    <input
                      required
                      minLength={2}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn An"
                      className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-3 text-sm text-[var(--foreground)] outline-none focus:border-[#2a5c30]"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--heading)]">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ban@gmail.com hoặc mssv@vsvc.edu.vn"
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[#2a5c30]"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu (≥ 6 ký tự)"
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[#2a5c30]"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[#2a5c30]"
                  />
                </div>
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Mã mời GV VSVC (tuỳ chọn, VD: VSVC-2026)"
                  className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-mono-num text-xs text-[var(--foreground)] outline-none focus:border-[#2a5c30]"
                />
                {error && <p className="text-xs font-medium text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#273d21] text-sm font-bold text-white transition hover:bg-[#1f321a] disabled:opacity-60 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {loading ? "Đang tạo..." : "Tạo tài khoản & Đăng nhập"}
                </button>
              </form>
            ) : step === "email" ? (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--heading)]">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ban@gmail.com"
                      className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[#2a5c30] focus:ring-2 focus:ring-[#2a5c30]/15"
                    />
                  </div>
                </div>

                {error && <p className="text-xs font-medium text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#273d21] text-sm font-bold text-white transition hover:bg-[#1f321a] disabled:opacity-60 cursor-pointer"
                >
                  {loading ? "Đang gửi mã..." : "Gửi mã đăng nhập"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div className="rounded-xl bg-[var(--surface-alt)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
                  Mã OTP 6 chữ số đã gửi tới <b className="text-[var(--heading)]">{email}</b>
                </div>

                {devHint && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Mã xác thực OTP: <b className="font-mono-num text-sm">{devHint}</b>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--heading)]">
                    Mã OTP 6 số
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                    <input
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="6 chữ số"
                      className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-3 font-mono-num text-sm tracking-widest text-[var(--foreground)] outline-none focus:border-[#2a5c30]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--heading)]">
                    Tên hiển thị (nếu lần đầu đăng ký)
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Minh Anh TOEIC"
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[#2a5c30]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--heading)]">
                    Mã mời giáo viên (tuỳ chọn · thử nghiệm kín VSVC)
                  </label>
                  <input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: VSVC-2026 (hoặc dùng email @vsvc.edu.vn)"
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-mono-num text-xs text-[var(--foreground)] outline-none focus:border-[#2a5c30]"
                  />
                </div>

                {error && <p className="text-xs font-medium text-red-600">{error}</p>}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setStep("email");
                      setError(null);
                    }}
                  >
                    Đổi email
                  </Button>
                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#273d21] text-sm font-bold text-white transition hover:bg-[#1f321a] disabled:opacity-60 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {loading ? "Đang xác nhận..." : "Xác nhận & Đăng nhập"}
                  </button>
                </div>
              </form>
            )}

            <p className="mt-4 text-xs text-[var(--muted-foreground)]">
              Cần khai đầy đủ hồ sơ (ngày sinh &lt;18 tuổi, ngành nghề)?{" "}
              <Link
                href="/register"
                onClick={onClose}
                className="font-bold text-[var(--heading)] underline underline-offset-2"
              >
                Mở trang Tạo tài khoản (/register)
              </Link>{" "}
              hoặc{" "}
              <Link
                href="/login"
                onClick={onClose}
                className="font-bold text-[var(--heading)] underline underline-offset-2"
              >
                Đăng nhập
              </Link>
              .
            </p>
            <p className="mt-1.5 text-[11px] text-[var(--muted-foreground)]">
              Cam kết Luật BVDLCN 91/2025/QH15: Không thu ảnh/video CCCD. Học viên &lt; 16 tuổi đăng
              ký bằng thông tin cha/mẹ/giám hộ tại{" "}
              <Link href="/chinh-sach/bao-ve-nguoi-duoi-18-tuoi" onClick={onClose} className="underline">
                chính sách &lt; 18 tuổi
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// === feature-map-modal.tsx ===
interface FeatureMapModalProps {
  open: boolean;
  onClose: () => void;
}

export function FeatureMapModal({ open, onClose }: FeatureMapModalProps) {
  const [active, setActive] = React.useState<FeatureMapItem>(siteConfig.featureMap[0]);
  const [view3D, setView3D] = React.useState<"globe" | "island">("globe");
  const { user } = useApp();

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-5xl"
      hideCloseButton
      contentClassName="p-0 overflow-hidden rounded-3xl border border-white/15 bg-[#1e2022] text-white shadow-2xl"
    >
      {/* Top Modal Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-base font-extrabold tracking-wide text-white uppercase">
            {siteConfig.brand.mascotName.toUpperCase()} CÓ GÌ
          </h2>
          <span className="text-xs font-semibold tracking-wider text-white/45 uppercase">
            8 TÍNH NĂNG
          </span>
        </div>

        <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#9ee56f] text-[10px] font-black text-[#122616]">
            {user ? user.name.slice(0, 1).toUpperCase() : "LC"}
          </span>
          <span className="rounded bg-[#9ee56f]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#9ee56f]">
            {user ? "HỌC VIÊN" : "ADMIN"}
          </span>
          <span className="text-xs font-semibold text-white/90">
            {user ? user.name : siteConfig.brand.ownerName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/bang-xep-hang"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:bg-white/10"
          >
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            Bảng xếp hạng
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-2.5 py-1.5 text-xs font-semibold text-white/75 transition hover:bg-white/15 hover:text-white cursor-pointer"
          >
            <span className="rounded border border-white/20 px-1 text-[10px]">ESC</span>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content: Left social rail | Center 8 rows | Right 3D Globe */}
      <div className="grid gap-5 px-5 py-6 lg:grid-cols-[72px_1.08fr_330px] items-center">
        {/* Left Social Rail */}
        <div className="hidden lg:flex flex-col items-center gap-2.5 border-r border-white/10 pr-4">
          <Link
            href="/documents"
            onClick={onClose}
            className="flex w-16 flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-[10px] text-white/75 hover:bg-white/10"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1877f2] text-white">
              <FacebookBrandIcon className="h-4 w-4" />
            </span>
            Tài liệu
          </Link>
          <Link
            href="/community"
            onClick={onClose}
            className="flex w-16 flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-[10px] text-white/75 hover:bg-white/10"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1877f2] text-white">
              <Bell className="h-4 w-4" />
            </span>
            Thông báo
          </Link>
          <a
            href={siteConfig.brand.youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className="flex w-16 flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-[10px] text-white/75 hover:bg-white/10"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white">
              <YoutubeBrandIcon className="h-4 w-4" />
            </span>
            YouTube
          </a>
          <Link
            href="/community"
            onClick={onClose}
            className="flex w-16 flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-[10px] text-white/75 hover:bg-white/10"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 border border-white/15 text-white font-bold">
              @
            </span>
            Cộng đồng
          </Link>
          <a
            href={siteConfig.brand.zaloUrl}
            target="_blank"
            rel="noreferrer"
            className="flex w-16 flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-[10px] text-white/75 hover:bg-white/10"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-white">
              <MessageSquare className="h-4 w-4" />
            </span>
            Zalo
          </a>
        </div>

        {/* Center 8 Feature Rows */}
        <div className="space-y-2">
          {siteConfig.featureMap.map((item, idx) => {
            const isSelected = item.id === active.id;
            const isHot = Boolean(item.badge);
            return (
              <Link
                key={item.id}
                href={item.href}
                onMouseEnter={() => setActive(item)}
                onClick={onClose}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition ${
                  isSelected
                    ? "border-rose-400/50 bg-gradient-to-r from-[#5a1632]/85 to-[#2b2429]/95 shadow-lg"
                    : idx < 2
                    ? "border-rose-500/20 bg-gradient-to-r from-[#45172b]/70 to-[#25272a]/90 hover:border-rose-400/45"
                    : "border-white/10 bg-[#25272a] hover:border-[#9ee56f]/40 hover:bg-[#2a2d31]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`inline-flex h-6 w-7 shrink-0 items-center justify-center rounded-md font-mono-num text-[11px] font-bold ${
                      isHot || isSelected
                        ? "bg-rose-500/25 text-rose-200 border border-rose-400/30"
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
                  {Array.from({ length: 5 }).map((_, sIdx) => (
                    <Star
                      key={sIdx}
                      className={`h-3 w-3 ${
                        sIdx < item.stars
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

        {/* Right Interactive 3D Stage (Globe <-> 3D Island Switcher) */}
        <div className="flex flex-col items-center justify-center">
          <div className="mb-2 inline-flex rounded-full border border-white/15 bg-white/5 p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setView3D("globe")}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 transition cursor-pointer ${
                view3D === "globe" ? "bg-[#9ee56f] text-[#142616]" : "text-white/70 hover:text-white"
              }`}
            >
              <Globe2 className="h-3 w-3" />
              Quả cầu 3D
            </button>
            <button
              type="button"
              onClick={() => setView3D("island")}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 transition cursor-pointer ${
                view3D === "island" ? "bg-[#9ee56f] text-[#142616]" : "text-white/70 hover:text-white"
              }`}
            >
              <Box className="h-3 w-3" />
              Mô hình 3D
            </button>
          </div>

          {view3D === "globe" ? (
            <FeatureGlobe
              items={siteConfig.featureMap}
              activeId={active.id}
              onSelect={setActive}
              size={300}
              darkStage
            />
          ) : (
            <StudyIsland3D
              items={siteConfig.featureMap}
              activeId={active.id}
              onSelect={setActive}
              size={300}
            />
          )}
          <p className="mt-2 text-center text-xs text-white/55">
            {active.description}
          </p>
        </div>
      </div>

      {/* Bottom 4 Quick Module Boxes */}
      <div className="grid gap-3 border-t border-white/10 bg-black/20 px-6 py-4 sm:grid-cols-4">
        {siteConfig.quickMapBoxes.map((box) => (
          <Link
            key={box.title}
            href={box.href}
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:border-[#9ee56f]/50 hover:bg-white/[0.08]"
          >
            <p className="font-heading text-sm font-bold text-white">{box.title}</p>
            <p className="mt-0.5 text-xs text-white/50">{box.subtitle}</p>
          </Link>
        ))}
      </div>
    </Modal>
  );
}

// === floating-mascot.tsx ===
export function FloatingMascot() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const { openFeatureMap } = useApp();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  // Mirror StudyChill: split right-sidebar studios (/luyen-de, /listening, /reading) dock Chillo on bottom-left
  const isLeftDock =
    pathname.startsWith("/luyen-de") ||
    pathname.startsWith("/listening") ||
    pathname.startsWith("/reading");

  return (
    <div
      className={cn(
        "fixed bottom-0 z-40",
        isLeftDock ? "left-3 sm:left-4" : "right-4 sm:right-6"
      )}
    >
      {open && (
        <div className="mb-3 w-76 rounded-2xl border-2 border-[#1b2d1c] bg-[#fdfbf6] p-4 shadow-[5px_5px_0_#1b2d1c] text-[#162617]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#9ee56f] border border-[#1b2d1c]">
                <Mascot size={26} mood="celebrate" />
              </div>
              <div>
                <p className="font-heading text-sm font-bold text-[#162617]">
                  {siteConfig.brand.mascotName} trợ lý TOEIC
                </p>
                <p className="text-[11px] text-[#5a6854]">
                  Chọn lối tắt để bắt đầu buổi học!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
              className="rounded-lg p-1 text-[#5a6854] hover:bg-black/5 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openFeatureMap();
              }}
              className="flex w-full items-center gap-2 rounded-xl border border-[#dfd9c8] bg-white px-3 py-2 text-left text-xs font-bold text-[#162617] transition hover:border-[#1b2d1c] hover:bg-[#f2f9ea] cursor-pointer"
            >
              <Compass className="h-4 w-4 text-[#1a4d2e]" />
              Khám phá bản đồ 8 tính năng
            </button>
            <Link
              href="/tinh-huong"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-xl border border-[#dfd9c8] bg-white px-3 py-2 text-xs font-bold text-[#162617] transition hover:border-[#1b2d1c] hover:bg-[#f2f9ea]"
            >
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Tình huống nghề 3 lớp (VSVC)
            </Link>
            <Link
              href="/ghep-cap"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-xl border border-[#dfd9c8] bg-white px-3 py-2 text-xs font-bold text-[#162617] transition hover:border-[#1b2d1c] hover:bg-[#f2f9ea]"
            >
              <Sparkles className="h-4 w-4 text-sky-600" />
              Ghép cặp luyện nói 1-1
            </Link>
            <Link
              href="/luyen-de"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-xl border border-[#dfd9c8] bg-white px-3 py-2 text-xs font-bold text-[#162617] transition hover:border-[#1b2d1c] hover:bg-[#f2f9ea]"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              Vào phòng luyện đề TOEIC
            </Link>
            <Link
              href="/ung-ho"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-xl border border-[#dfd9c8] bg-white px-3 py-2 text-xs font-bold text-[#162617] transition hover:border-[#1b2d1c] hover:bg-[#f2f9ea]"
            >
              <Heart className="h-4 w-4 text-rose-500" />
              Mời team ly cà phê
            </Link>
          </div>
        </div>
      )}

      {/* StudyChill Bottom-Right Docked Corner Tab */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Trợ lý ${siteConfig.brand.mascotName}`}
        className="group flex flex-col items-center rounded-t-2xl border-2 border-b-0 border-[#122616] bg-[#3f7a38] px-3 pt-2 pb-1.5 text-white shadow-lg transition hover:bg-[#498d41] cursor-pointer"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#193b21] border border-white/25 transition-transform group-hover:-translate-y-0.5">
          <Mascot size={32} mood={open ? "celebrate" : "happy"} />
        </div>
        <span className="mt-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#162617]">
          {siteConfig.brand.mascotName}
        </span>
      </button>
    </div>
  );
}

// === footer.tsx ===
export function Footer() {
  const pathname = usePathname();

  // Studio full-screen routes omit the bottom landing footer
  const hideOnStudio =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/luyen-de") ||
    pathname.startsWith("/listening") ||
    pathname.startsWith("/reading") ||
    pathname.startsWith("/ngu-phap") ||
    pathname.startsWith("/community");

  if (hideOnStudio) return null;

  const qrUrl = `https://img.vietqr.io/image/${siteConfig.vietqr.bankId}-${siteConfig.vietqr.accountNo}-compact2.png?amount=50000&addInfo=donate%20${encodeURIComponent(
    siteConfig.brand.name.toLowerCase()
  )}&accountName=${encodeURIComponent(siteConfig.vietqr.accountName)}`;

  return (
    <footer className="relative overflow-hidden bg-[#0e1a14] text-white/85 pt-14 pb-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-[#9ee56f]">
                <GraduationCap className="h-4.5 w-4.5" />
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight text-white">
                {siteConfig.brand.shortName}
              </span>
            </Link>
            <p className="mt-4 text-xs leading-relaxed text-white/60">
              Học tiếng Anh nhẹ nhàng: luyện TOEIC, từ vựng, ngữ pháp và kho tài liệu miễn phí.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-white/75">
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#9ee56f]" />
                <span>{siteConfig.brand.email}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-[#9ee56f]" />
                <span>{siteConfig.brand.hotline} (Zalo)</span>
              </li>
              <li className="flex items-center gap-2">
                <Share2 className="h-3.5 w-3.5 text-[#9ee56f]" />
                <span>Fanpage {siteConfig.brand.name}</span>
              </li>
            </ul>
          </div>

          {/* Column 2: HỌC TẬP */}
          <div>
            <h3 className="font-heading text-[11px] font-bold uppercase tracking-wider text-white/55">
              HỌC TẬP
            </h3>
            <ul className="mt-3.5 space-y-2.5 text-sm text-white/75">
              <li>
                <Link href="/listening" className="hover:text-[#9ee56f] transition">
                  Lộ trình Listening
                </Link>
              </li>
              <li>
                <Link href="/listening" className="hover:text-[#9ee56f] transition">
                  Luyện nghe
                </Link>
              </li>
              <li>
                <Link href="/reading" className="hover:text-[#9ee56f] transition">
                  Luyện đọc
                </Link>
              </li>
              <li>
                <Link href="/luyen-de" className="hover:text-[#9ee56f] transition">
                  Luyện đề TOEIC
                </Link>
              </li>
              <li>
                <Link href="/vocab/notebook" className="hover:text-[#9ee56f] transition">
                  Từ vựng
                </Link>
              </li>
              <li>
                <Link href="/ngu-phap" className="hover:text-[#9ee56f] transition">
                  Ngữ pháp
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: KHÁM PHÁ */}
          <div>
            <h3 className="font-heading text-[11px] font-bold uppercase tracking-wider text-white/55">
              KHÁM PHÁ
            </h3>
            <ul className="mt-3.5 space-y-2.5 text-sm text-white/75">
              <li>
                <Link href="/documents" className="hover:text-[#9ee56f] transition">
                  Kho tài liệu
                </Link>
              </li>
              <li>
                <Link href="/reading?mode=news" className="hover:text-[#9ee56f] transition">
                  Đọc báo song ngữ
                </Link>
              </li>
              <li>
                <Link href="/listening?mode=video" className="hover:text-[#9ee56f] transition">
                  Video song ngữ
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-[#9ee56f] transition">
                  Cộng đồng
                </Link>
              </li>
              <li>
                <Link href="/bang-xep-hang" className="hover:text-[#9ee56f] transition">
                  Bảng xếp hạng
                </Link>
              </li>
              <li>
                <Link href="/tinh-huong" className="hover:text-[#9ee56f] transition">
                  Tình huống nghề (3 lớp)
                </Link>
              </li>
              <li>
                <Link href="/ghep-cap" className="hover:text-[#9ee56f] transition">
                  Ghép cặp luyện nói
                </Link>
              </li>
              <li>
                <Link href="/khao-sat" className="hover:text-[#9ee56f] transition">
                  Khảo sát H1–H6
                </Link>
              </li>
              <li>
                <Link href="/de-an" className="hover:text-[#9ee56f] transition">
                  Đề án LV04 (VSVC)
                </Link>
              </li>
              <li>
                <Link href="/goi-hoc" className="hover:text-[#9ee56f] transition">
                  Gói học Freemium
                </Link>
              </li>
              <li>
                <Link href="/ung-dung-android" className="hover:text-[#9ee56f] transition">
                  Ứng dụng Android (APK)
                </Link>
              </li>
              <li>
                <Link href="/phu-huynh" className="hover:text-[#9ee56f] transition">
                  Cổng Phụ huynh (&lt;18)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: CHÍNH SÁCH */}
          <div>
            <h3 className="font-heading text-[11px] font-bold uppercase tracking-wider text-white/55">
              CHÍNH SÁCH
            </h3>
            <ul className="mt-3.5 space-y-2.5 text-sm text-white/75">
              {siteConfig.policies.slice(0, 6).map((p) => (
                <li key={p.slug}>
                  <Link href={`/chinh-sach/${p.slug}`} className="hover:text-[#9ee56f] transition">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: ỦNG HỘ */}
          <div>
            <h3 className="font-heading text-[11px] font-bold uppercase tracking-wider text-white/55">
              ỦNG HỘ {siteConfig.brand.shortName}
            </h3>
            <Link
              href="/ung-ho"
              className="mt-3.5 flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.04] p-3 transition hover:border-[#9ee56f]/50 hover:bg-white/[0.08]"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="VietQR ủng hộ"
                  className="h-full w-full object-contain"
                />
              </div>
              <p className="text-xs leading-relaxed text-white/70">
                Quét mã bằng app ngân hàng để mời team một ly cà phê.
              </p>
            </Link>
          </div>
        </div>

        {/* Legal bottom bar */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5 text-xs text-white/45">
          <span>
            © {siteConfig.brand.year} {siteConfig.brand.name} · Chủ sở hữu: {siteConfig.brand.ownerName}
          </span>
          <div className="flex flex-wrap items-center gap-4">
            {siteConfig.policies.slice(6).map((p) => (
              <Link
                key={p.slug}
                href={`/chinh-sach/${p.slug}`}
                className="hover:text-white transition"
              >
                {p.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Giant watermark matching StudyChill bottom footer */}
        <div
          aria-hidden="true"
          className="pointer-events-none mt-4 flex select-none items-center justify-center gap-4 overflow-hidden text-white/[0.045]"
        >
          <GraduationCap className="h-20 w-20 sm:h-28 sm:w-28 shrink-0" />
          <span className="font-display text-6xl font-black tracking-tight sm:text-8xl lg:text-[9.5rem] leading-none">
            {siteConfig.brand.shortName}
          </span>
        </div>
      </div>
    </footer>
  );
}

// === navbar.tsx ===
/** Top bar with StudyChill's transparent-over-hero scroll transition, dropdowns & focus mode awareness */
export function Navbar() {
  const pathname = usePathname();
  return <NavbarContent key={pathname} pathname={pathname} />;
}

function NavbarContent({ pathname }: { pathname: string }) {
  const { user, theme, toggleTheme, openAuthModal, openFeatureMap, logout, guestSavedDocIds } =
    useApp();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState<"listen" | "vocab" | "career" | "user" | null>(
    null
  );
  const [scrolled, setScrolled] = React.useState(false);
  const [docsLightsOn, setDocsLightsOn] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    const onDocsLights = (event: Event) => {
      const detail = (event as CustomEvent<boolean>).detail;
      setDocsLightsOn(Boolean(detail));
    };
    const rafId = window.requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("lc-docs-lights", onDocsLights);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("lc-docs-lights", onDocsLights);
    };
  }, []);

  // Dedicated full-workspace studio routes render their own compact chrome/sidebar (keeping top desktop clean like StudyChill)
  const isWorkspaceRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/luu-tru-ma-nguon") ||
    pathname.startsWith("/luyen-de") ||
    pathname.startsWith("/listening") ||
    pathname.startsWith("/reading") ||
    pathname.startsWith("/community");

  if (isWorkspaceRoute) {
    return null;
  }

  // Overlay hero routes: Desktop "/" & catalog "/documents" / "/documents/danh-muc/*" render transparent hero at y=0
  // Mobile "< md" on "/" renders Cozy Cream Mobile Home (matching StudyChill step_4.png)
  const isDocsPage =
    pathname === "/documents" || pathname.startsWith("/documents/danh-muc");
  const isOverlayHeroRoute = pathname === "/" || isDocsPage;
  const isDocsDarkTop = isDocsPage && !docsLightsOn && !scrolled;
  const isDocsDarkScrolled = isDocsPage && !docsLightsOn && scrolled;
  const isHeroDarkTop = (pathname === "/" && !scrolled) || isDocsDarkTop;
  const isDarkDesktopNav = isHeroDarkTop || isDocsDarkScrolled;
  const isLightInner = !isHeroDarkTop && !isDocsDarkScrolled;

  const isListenActive =
    pathname.startsWith("/luyen-de") ||
    pathname.startsWith("/listening") ||
    pathname.startsWith("/reading");
  const isVocabActive = pathname.startsWith("/vocab");
  const isCareerActive =
    pathname.startsWith("/tinh-huong") ||
    pathname.startsWith("/ghep-cap") ||
    pathname.startsWith("/khao-sat") ||
    pathname.startsWith("/de-an") ||
    pathname.startsWith("/goi-hoc") ||
    pathname.startsWith("/ung-dung-android") ||
    pathname.startsWith("/phu-huynh");

  return (
    <>
      <header
        className={cn(
          "top-0 z-40 w-full transition-colors duration-200",
          isOverlayHeroRoute
            ? scrolled
              ? isDocsDarkScrolled
                ? "fixed border-b border-white/10 bg-[#0b1326]/90 text-white shadow-sm backdrop-blur-md"
                : "fixed border-b border-[var(--border)] bg-[var(--bg)]/95 shadow-sm backdrop-blur-md"
              : docsLightsOn && isDocsPage
              ? "fixed border-b border-[#1b2d1c]/10 bg-white/75 backdrop-blur-md"
              : isDocsDarkTop
              ? "fixed bg-transparent text-white"
              : "fixed bg-[#f6f3ea]/85 border-b border-[var(--border)] backdrop-blur-md md:border-transparent md:bg-transparent md:backdrop-blur-none"
            : "sticky border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Left: Brand Wordmark matching StudyChill crisp white badge */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl py-1 transition hover:opacity-90"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white text-[#1a344c] shadow-xs">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span
              className={cn(
                "font-display text-lg font-extrabold tracking-tight sm:text-xl",
                isDocsDarkTop || isDocsDarkScrolled
                  ? "text-white"
                  : isHeroDarkTop
                  ? "text-[var(--heading)] md:text-white"
                  : "text-[var(--heading)]"
              )}
            >
              {siteConfig.brand.shortName}
            </span>
          </Link>

          {/* Center: Desktop Nav matching StudyChill exact 5-link structure */}
          <nav className="hidden lg:flex items-center gap-6" aria-label="Điều hướng chính">
            <Link
              href="/"
              className={cn(
                "relative whitespace-nowrap py-2 text-sm font-semibold transition",
                pathname === "/"
                  ? isDarkDesktopNav
                    ? "text-white"
                    : "text-[var(--primary)]"
                  : isDarkDesktopNav
                  ? "text-white/80 hover:text-white"
                  : "text-[var(--muted-foreground)] hover:text-[var(--heading)]"
              )}
            >
              Trang chủ
              {pathname === "/" && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#9ee56f]" />
              )}
            </Link>

            <Link
              href="/documents"
              className={cn(
                "relative whitespace-nowrap py-2 text-sm font-semibold transition",
                pathname.startsWith("/documents")
                  ? isDarkDesktopNav
                    ? "text-white"
                    : "text-[var(--primary)]"
                  : isDarkDesktopNav
                  ? "text-white/80 hover:text-white"
                  : "text-[var(--muted-foreground)] hover:text-[var(--heading)]"
              )}
            >
              Tài liệu
              {pathname.startsWith("/documents") && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#9ee56f]" />
              )}
            </Link>

            {/* Dropdown: Nghe - Đọc */}
            <div
              className="relative"
              onMouseEnter={() => setOpenMenu("listen")}
              onMouseLeave={() => setOpenMenu((m) => (m === "listen" ? null : m))}
            >
              <button
                type="button"
                onClick={() => setOpenMenu((m) => (m === "listen" ? null : "listen"))}
                className={cn(
                  "relative inline-flex items-center gap-1 whitespace-nowrap py-2 text-sm font-semibold transition cursor-pointer",
                  isListenActive
                    ? isDarkDesktopNav
                      ? "text-white"
                      : "text-[var(--primary)]"
                    : isDarkDesktopNav
                    ? "text-white/80 hover:text-white"
                    : "text-[var(--muted-foreground)] hover:text-[var(--heading)]"
                )}
              >
                Nghe - Đọc
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    openMenu === "listen" && "rotate-180"
                  )}
                />
              </button>

              {openMenu === "listen" && (
                <div className="absolute left-0 top-full pt-1.5 z-50">
                  <div className="w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#14171a] p-1.5 shadow-2xl">
                    {siteConfig.navDropdowns.listenRead.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-[#9ee56f]"
                      >
                        <div>{sub.label}</div>
                        {sub.description && (
                          <div className="mt-0.5 text-[11px] font-normal text-white/55">
                            {sub.description}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dropdown: Từ vựng */}
            <div
              className="relative"
              onMouseEnter={() => setOpenMenu("vocab")}
              onMouseLeave={() => setOpenMenu((m) => (m === "vocab" ? null : m))}
            >
              <button
                type="button"
                onClick={() => setOpenMenu((m) => (m === "vocab" ? null : "vocab"))}
                className={cn(
                  "relative inline-flex items-center gap-1 whitespace-nowrap py-2 text-sm font-semibold transition cursor-pointer",
                  isVocabActive
                    ? isDarkDesktopNav
                      ? "text-white"
                      : "text-[var(--primary)]"
                    : isDarkDesktopNav
                    ? "text-white/80 hover:text-white"
                    : "text-[var(--muted-foreground)] hover:text-[var(--heading)]"
                )}
              >
                Từ vựng
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    openMenu === "vocab" && "rotate-180"
                  )}
                />
                {isVocabActive && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#9ee56f]" />
                )}
              </button>

              {openMenu === "vocab" && (
                <div className="absolute left-0 top-full pt-1.5 z-50">
                  <div className="w-60 overflow-hidden rounded-2xl border border-white/10 bg-[#14171a] p-1.5 shadow-2xl">
                    {siteConfig.navDropdowns.vocab.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-[#9ee56f]"
                      >
                        <div>{sub.label}</div>
                        {sub.description && (
                          <div className="mt-0.5 text-[11px] font-normal text-white/55">
                            {sub.description}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/ngu-phap"
              className={cn(
                "relative whitespace-nowrap py-2 text-sm font-semibold transition",
                pathname.startsWith("/ngu-phap")
                  ? isDarkDesktopNav
                    ? "text-white"
                    : "text-[var(--primary)]"
                  : isDarkDesktopNav
                  ? "text-white/80 hover:text-white"
                  : "text-[var(--muted-foreground)] hover:text-[var(--heading)]"
              )}
            >
              Ngữ pháp
              {pathname.startsWith("/ngu-phap") && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#9ee56f]" />
              )}
            </Link>

            {/* Dropdown: Thực hành nghề (VSVC Startup MVP) */}
            <div
              className="relative"
              onMouseEnter={() => setOpenMenu("career")}
              onMouseLeave={() => setOpenMenu((m) => (m === "career" ? null : m))}
            >
              <button
                type="button"
                onClick={() => setOpenMenu((m) => (m === "career" ? null : "career"))}
                className={cn(
                  "relative inline-flex items-center gap-1 whitespace-nowrap py-2 text-sm font-semibold transition cursor-pointer",
                  isCareerActive
                    ? isDarkDesktopNav
                      ? "text-white"
                      : "text-[var(--primary)]"
                    : isDarkDesktopNav
                    ? "text-white/80 hover:text-white"
                    : "text-[var(--muted-foreground)] hover:text-[var(--heading)]"
                )}
              >
                Thực hành nghề
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    openMenu === "career" && "rotate-180"
                  )}
                />
                {isCareerActive && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#9ee56f]" />
                )}
              </button>

              {openMenu === "career" && (
                <div className="absolute left-0 top-full pt-1.5 z-50">
                  <div className="w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#14171a] p-1.5 shadow-2xl">
                    {siteConfig.navDropdowns.career.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-[#9ee56f]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{sub.label}</span>
                          {sub.badge && (
                            <span className="rounded bg-[#9ee56f]/20 px-1.5 py-0.5 text-[9px] font-extrabold text-[#9ee56f]">
                              {sub.badge}
                            </span>
                          )}
                        </div>
                        {sub.description && (
                          <div className="mt-0.5 text-[11px] font-normal text-white/55">
                            {sub.description}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Bản đồ pill */}
            <button
              type="button"
              onClick={openFeatureMap}
              aria-label="Bản đồ chức năng"
              className={cn(
                "inline-flex h-9 sm:h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 sm:px-3.5 text-xs font-bold transition cursor-pointer",
                isDocsDarkTop || isDocsDarkScrolled
                  ? "border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                  : isHeroDarkTop
                  ? "border-[#25442b] bg-white/80 text-[var(--heading)] md:border-white/25 md:bg-white/10 md:text-white md:backdrop-blur-sm md:hover:bg-white/20"
                  : "border-[#25442b] bg-[var(--surface)] text-[var(--heading)] hover:border-[#9ee56f] hover:bg-[#f2f9ea] dark:border-[var(--border-strong)]"
              )}
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Bản đồ</span>
            </button>

            {/* Quick Community blue circle button on Mobile matching StudyChill step_4.png */}
            <Link
              href="/community"
              aria-label="Cộng đồng"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#193b6b] bg-[#193b6b] text-white shadow-xs transition hover:opacity-90 md:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </Link>

            {/* Theme toggle */}
            {isLightInner && (
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Bật chế độ sáng" : "Bật chế độ tối"}
                className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] transition hover:text-[var(--heading)] cursor-pointer"
              >
                {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
              </button>
            )}

            {/* Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Thông báo học tập"
                className={cn(
                  "relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border transition cursor-pointer",
                  isHeroDarkTop
                    ? "border-white/20 bg-white/95 text-[#1b2d1c] hover:bg-white"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--heading)] hover:bg-[var(--surface-alt)]"
                )}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white" />
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-76 rounded-2xl border-2 border-[var(--sc-ink)] bg-[var(--surface)] p-3.5 shadow-[4px_4px_0_var(--sc-ink)] z-50">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                    <p className="font-heading text-xs font-bold uppercase tracking-wide text-[var(--heading)]">
                      Bảng tin {siteConfig.brand.name}
                    </p>
                    <Link
                      href="/bang-xep-hang"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-semibold text-[var(--primary)] hover:underline"
                    >
                      Đua top tuần
                    </Link>
                  </div>
                  <div className="mt-2.5 space-y-2 text-xs text-[var(--muted-foreground)]">
                    <p className="rounded-xl bg-[var(--surface-alt)] p-2.5">
                      <Sparkles className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
                      Đã mở kho 5 bộ đề Practice TOEIC &amp; Lộ trình Ngữ pháp miễn phí.
                    </p>
                    {guestSavedDocIds.length > 0 && !user && (
                      <p className="rounded-xl bg-amber-50 p-2.5 text-amber-900">
                        Đang giữ {guestSavedDocIds.length} tài liệu tạm. Đăng nhập để đồng bộ vĩnh viễn!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Auth / User button */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenMenu((m) => (m === "user" ? null : "user"))}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-full border pl-1.5 pr-3 text-xs font-bold transition cursor-pointer",
                    isHeroDarkTop
                      ? "border-white/20 bg-white/95 text-[#162617]"
                      : "border-[#1b2d1c] bg-[var(--surface)] text-[var(--heading)] dark:border-[var(--border-strong)]"
                  )}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#163426] font-bold text-[#9ee56f]">
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline max-w-[90px] truncate">{user.name}</span>
                  <span className="hidden md:inline-flex items-center gap-0.5 rounded-full bg-[#9ee56f]/30 px-1.5 py-0.5 font-mono-num text-[10px] text-[#1a4d2e] dark:text-[#9ee56f]">
                    <Flame className="h-3 w-3 text-orange-500" />
                    {user.xp}
                  </span>
                </button>

                {openMenu === "user" && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border-2 border-[var(--sc-ink)] bg-[var(--surface)] p-2 shadow-[4px_4px_0_var(--sc-ink)] z-50">
                    <div className="border-b border-[var(--border)] px-3 py-2">
                      <p className="truncate text-xs font-bold text-[var(--heading)]">{user.name}</p>
                      <p className="truncate text-[11px] text-[var(--muted-foreground)]">{user.email}</p>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      <Link
                        href="/my-library"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--heading)] hover:bg-[var(--surface-alt)]"
                      >
                        <BookMarked className="h-3.5 w-3.5 text-[var(--primary)]" />
                        Kho cá nhân
                      </Link>
                      <Link
                        href="/bang-xep-hang"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--heading)] hover:bg-[var(--surface-alt)]"
                      >
                        <Trophy className="h-3.5 w-3.5 text-amber-500" />
                        Bảng xếp hạng
                      </Link>
                      {user.role === "ADMIN" && (
                        <>
                          <Link
                            href="/admin"
                            className="flex items-center gap-2 rounded-xl bg-[#9ee56f]/20 px-3 py-2 text-xs font-bold text-[#19462b] hover:bg-[#9ee56f]/35 dark:text-[#9ee56f]"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Admin Studio
                          </Link>
                          <Link
                            href="/luu-tru-ma-nguon"
                            className="flex items-center gap-2 rounded-xl bg-[#19462b] px-3 py-2 text-xs font-bold text-[#9ee56f] hover:opacity-95"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Lưu trữ mã nguồn
                          </Link>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/register"
                  className={cn(
                    "hidden sm:inline-flex h-9 sm:h-10 items-center justify-center rounded-full border px-3.5 text-xs font-bold transition",
                    isHeroDarkTop
                      ? "border-white/30 bg-white/15 text-white hover:bg-white/25"
                      : "border-[#1b2d1c] bg-[#9ee56f] text-[#102414] hover:brightness-105"
                  )}
                >
                  Tạo TK
                </Link>
                <button
                  type="button"
                  onClick={() => openAuthModal()}
                  aria-label="Đăng nhập"
                  className={cn(
                    "inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border transition cursor-pointer",
                    isHeroDarkTop
                      ? "border-white/25 bg-white/95 text-[#1b2d1c] hover:bg-white"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--heading)] hover:border-[var(--primary)]"
                  )}
                >
                  <UserIcon className="h-4 w-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Mở thực đơn điều hướng"
              className={cn(
                "inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border lg:hidden cursor-pointer",
                isDocsDarkTop || isDocsDarkScrolled
                  ? "border-white/25 bg-white/10 text-white"
                  : isHeroDarkTop
                  ? "border-[#1b2d1c]/20 bg-white/80 text-[var(--heading)] md:border-white/25 md:bg-white/10 md:text-white"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--heading)]"
              )}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs lg:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="ml-auto flex h-full w-80 max-w-full flex-col justify-between bg-[var(--surface)] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <span className="font-display text-lg font-extrabold text-[var(--heading)]">
                  {siteConfig.brand.shortName}
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Đóng"
                  className="rounded-xl p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-1">
                <Link
                  href="/"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[var(--heading)] hover:bg-[var(--surface-alt)]"
                >
                  Trang chủ
                </Link>
                <Link
                  href="/documents"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[var(--heading)] hover:bg-[var(--surface-alt)]"
                >
                  Tài liệu miễn phí
                </Link>
                <Link
                  href="/luyen-de"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[var(--heading)] hover:bg-[var(--surface-alt)]"
                >
                  Luyện Đề TOEIC
                </Link>
                <Link
                  href="/listening"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[var(--heading)] hover:bg-[var(--surface-alt)]"
                >
                  Luyện Nghe
                </Link>
                <Link
                  href="/reading"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[var(--heading)] hover:bg-[var(--surface-alt)]"
                >
                  Luyện Đọc
                </Link>
                <Link
                  href="/vocab/notebook"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[var(--heading)] hover:bg-[var(--surface-alt)]"
                >
                  Sổ từ vựng
                </Link>
                <Link
                  href="/ngu-phap"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[var(--heading)] hover:bg-[var(--surface-alt)]"
                >
                  Lộ trình Ngữ pháp
                </Link>
                <Link
                  href="/community"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[var(--heading)] hover:bg-[var(--surface-alt)]"
                >
                  Cộng đồng
                </Link>
                <Link
                  href="/bang-xep-hang"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[var(--heading)] hover:bg-[var(--surface-alt)]"
                >
                  Bảng xếp hạng
                </Link>
                <Link
                  href="/ung-ho"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[var(--heading)] hover:bg-[var(--surface-alt)]"
                >
                  Ủng hộ team
                </Link>
                <div className="my-1.5 border-t border-[var(--border)] pt-1.5">
                  <p className="px-3.5 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--primary)]">
                    Thực hành nghề &amp; Đề án VSVC
                  </p>
                  {siteConfig.navDropdowns.career.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className="block rounded-xl px-3.5 py-2 text-sm font-semibold text-[var(--heading)] hover:bg-[var(--surface-alt)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-[var(--border)] pt-4">
              {user ? (
                <>
                  <Link href="/my-library" onClick={() => setDrawerOpen(false)}>
                    <Button variant="secondary" className="w-full justify-start">
                      <BookMarked className="h-4 w-4" />
                      Kho cá nhân ({user.xp} XP)
                    </Button>
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link href="/admin" onClick={() => setDrawerOpen(false)}>
                      <Button variant="primary" className="w-full justify-start">
                        <ShieldCheck className="h-4 w-4" />
                        Admin Studio
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600"
                    onClick={() => {
                      setDrawerOpen(false);
                      void logout();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link href="/register" onClick={() => setDrawerOpen(false)} className="block">
                    <Button variant="secondary" className="w-full">
                      Tạo tài khoản &amp; mật khẩu
                    </Button>
                  </Link>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setDrawerOpen(false);
                      openAuthModal();
                    }}
                  >
                    Đăng nhập (Mật khẩu / OTP / Google)
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// === phase-preview-card.tsx ===
interface PhasePreviewCardProps {
  phaseBadge: string;
  title: string;
  description: string;
  highlights: string[];
}

export function PhasePreviewCard({
  phaseBadge,
  title,
  description,
  highlights,
}: PhasePreviewCardProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Card className="p-6 sm:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3 max-w-2xl">
            <Badge variant="gold">
              <Sparkles className="h-3.5 w-3.5" />
              {phaseBadge}
            </Badge>
            <h1 className="font-heading text-2xl font-extrabold text-[var(--heading)] sm:text-3xl">
              {title}
            </h1>
            <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
              {description}
            </p>
            <ul className="space-y-1.5 pt-2 text-sm text-[var(--foreground)]">
              {highlights.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 pt-4">
              <Link href="/luyen-de">
                <Button>
                  Luyện đề TOEIC ngay
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/ngu-phap">
                <Button variant="outline">Học Ngữ pháp 250–990</Button>
              </Link>
              <Link href="/documents">
                <Button variant="secondary">Kho tài liệu</Button>
              </Link>
            </div>
          </div>

          <div className="shrink-0 flex justify-center">
            <Mascot size={112} mood="study" />
          </div>
        </div>
      </Card>
    </div>
  );
}
