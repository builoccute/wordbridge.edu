"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import { LoginCompanionArt } from "@/components/brand/mascot";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { siteConfig } from "@/lib/site-config";

export default function LoginPage() {
  const router = useRouter();
  const { user, guestSavedDocIds, refreshUser, notify } = useApp();
  const [authMethod, setAuthMethod] = React.useState<"password" | "otp">("password");
  const [step, setStep] = React.useState<"email" | "otp">("email");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [name, setName] = React.useState("");
  const [inviteCode, setInviteCode] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [devHint, setDevHint] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      router.replace("/my-library");
    }
  }, [user, router]);

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
      window.localStorage.removeItem("lc_guest_saved_docs");
      window.dispatchEvent(new Event("lc-local-store"));
      await refreshUser();
      notify("Đăng nhập thành công!", "success");
      router.push("/my-library");
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
        setError(json.error?.message || "Không thể gửi OTP.");
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
      window.localStorage.removeItem("lc_guest_saved_docs");
      await refreshUser();
      notify("Đăng nhập thành công!", "success");
      router.push("/my-library");
    } catch {
      setError("Xác thực thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f6f3ea] bg-dot-grid px-4 py-6 sm:px-6 sm:py-8 dark:bg-[#0e1511]">
      <div className="mx-auto max-w-4xl">
        {/* Top Navigation Row matching StudyChill step_47 */}
        <div className="mb-4 flex items-center justify-between text-xs font-semibold text-[#5a6854] dark:text-slate-300">
          <Link href="/" className="inline-flex items-center gap-1.5 hover:text-[#162617] dark:hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Về trang chủ</span>
          </Link>
          <span className="inline-flex items-center gap-1.5">
            <span>🍃</span>
            <span>Một góc nhỏ, nhiều tiến bộ.</span>
          </span>
        </div>

        <div className="relative overflow-hidden rounded-[26px] border border-[#d9d5c8] bg-white shadow-[0_14px_40px_rgba(27,45,28,0.08)] dark:border-white/15 dark:bg-[#17211b]">
          <div className="grid md:grid-cols-[1.02fr_0.98fr]">
            {/* Left Soft Sage Mascot Column matching StudyChill step_47 */}
            <div className="flex flex-col justify-between bg-[#ebf0e1] p-7 sm:p-9 md:border-r md:border-dashed md:border-[#cfd8c0] dark:border-white/10 dark:bg-[#131d16]">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#46633e]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#629b45]" />
                  <span>GÓC HỌC TẬP CỦA BẠN</span>
                </p>

                <h2 className="mt-2 font-display text-3xl font-black leading-[1.1] text-[#172c18] dark:text-white">
                  Học một chút.
                  <span className="block text-[#48753e] dark:text-[#9ee56f]">
                    Chill một chút.
                  </span>
                </h2>
                <p className="mt-2.5 max-w-xs text-xs leading-relaxed text-[#556651] dark:text-slate-300">
                  Gác lại bộn bề, trở về góc học quen. {siteConfig.brand.mascotName} đã sẵn sàng học
                  cùng bạn rồi!
                </p>
              </div>

              {/* Centered Circle Illustration + Floating Stickers */}
              <div className="relative my-6 flex items-center justify-center">
                <div className="relative flex h-56 w-56 items-center justify-center rounded-full bg-[#dde6cd] dark:bg-[#1e3123]">
                  <LoginCompanionArt className="h-44 w-44" />

                  <div className="absolute -right-4 -top-2 rotate-[3deg] rounded-xl border border-[#cfd8c0] bg-white px-3 py-1.5 font-heading text-[11px] font-bold text-[#172c18] shadow-sm">
                    Chào bạn, mình là {siteConfig.brand.mascotName}! ✨
                  </div>
                  <div className="absolute -left-5 bottom-6 -rotate-[4deg] inline-flex items-center gap-1.5 rounded-xl border border-[#cfd8c0] bg-white px-2.5 py-1 text-[10px] font-bold text-[#172c18] shadow-xs">
                    <BookOpen className="h-3 w-3 text-[#48753e]" />
                    Học theo cách của bạn
                  </div>
                  <div className="absolute -right-5 bottom-2 rotate-[2deg] inline-flex items-center gap-1 rounded-xl border border-[#dfd1b2] bg-[#f7ebd1] px-2.5 py-1 text-[10px] font-bold text-[#614515] shadow-xs">
                    ✓ Tiến bộ mỗi ngày
                  </div>
                </div>
              </div>

              {/* Bottom Feature Meta & Verse */}
              <div className="border-t border-dashed border-[#c7d1b6] pt-4 text-center">
                <div className="flex items-center justify-center gap-4 text-[11px] font-semibold text-[#4e614a] dark:text-slate-300">
                  <span>📖 Tài liệu</span>
                  <span>🎯 Luyện đề</span>
                  <span>✨ Sổ SRS</span>
                </div>
                <p className="mt-2 text-xs italic text-[#5e6e58] dark:text-slate-400">
                  Mỗi ngày một trang nhỏ, mỗi bước một ước mơ
                </p>
              </div>
            </div>

            {/* Right Form Column */}
            <div className="relative flex flex-col justify-between p-7 sm:p-9">
              {/* Masking tape decoration top right */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-6 top-3 h-4 w-14 rotate-[3deg] bg-[#ece3c8]/80"
              />

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#788573]">
                  TIẾP TỤC HÀNH TRÌNH
                </p>
                <h1 className="mt-1.5 font-display text-2xl font-black text-[#122618] dark:text-white">
                  Mừng bạn trở lại!
                </h1>
                <p className="mt-1 text-xs text-[#556758] dark:text-slate-300">
                  Một buổi học hay đang chờ bạn phía trước.
                </p>

                <a
                  href="/api/auth/google"
                  className="mt-5 flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-[#d6d9d2] bg-white text-sm font-bold text-[#122618] shadow-xs transition hover:border-[#48753e] hover:bg-[#fcfaf4]"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.6-5.4 3.6-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.1 14.6 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-2H12z"
                    />
                    <path
                      fill="#34A853"
                      d="M3.7 7.1l3.2 2.3C7.7 7.2 9.7 5.7 12 5.7c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.1 14.6 2 12 2 8.2 2 4.9 4.2 3.7 7.1z"
                    />
                    <path
                      fill="#4285F4"
                      d="M12 22c2.6 0 4.8-.9 6.4-2.4l-3-2.5c-.8.6-1.9 1-3.4 1-3.9 0-5.1-2.6-5.3-3.5l-3.2 2.4C4.9 19.9 8.2 22 12 22z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M6.7 14.6c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L3.5 8.1C2.9 9.3 2.5 10.6 2.5 12s.4 2.7 1 3.9l3.2-1.3z"
                    />
                  </svg>
                  Tiếp tục với Google
                </a>

                <div className="my-5 flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                  <span className="h-px flex-1 border-t border-dashed border-[#cfd6c9]" />
                  <span>hoặc đăng nhập bằng email</span>
                  <span className="h-px flex-1 border-t border-dashed border-[#cfd6c9]" />
                </div>

            {error && (
              <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-xl border border-[#d6d9d2] bg-[#f4f2eb] p-1 text-xs font-bold dark:border-white/10 dark:bg-[#101813]">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("password");
                  setError(null);
                }}
                className={`rounded-lg py-2 transition cursor-pointer ${
                  authMethod === "password"
                    ? "bg-[#19462b] text-white shadow-xs"
                    : "text-[#556758] hover:text-[#122618] dark:text-slate-300"
                }`}
              >
                Email &amp; Mật khẩu
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("otp");
                  setError(null);
                }}
                className={`rounded-lg py-2 transition cursor-pointer ${
                  authMethod === "otp"
                    ? "bg-[#19462b] text-white shadow-xs"
                    : "text-[#556758] hover:text-[#122618] dark:text-slate-300"
                }`}
              >
                Mã OTP 6 số
              </button>
            </div>

            {authMethod === "password" ? (
              <form onSubmit={handlePasswordLogin} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-bold">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--muted-foreground)]" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="banhoc@example.com"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--muted-foreground)]" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu của bạn"
                      className="pl-9 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      className="absolute right-2.5 top-2.5 text-[var(--muted-foreground)] hover:text-[var(--heading)] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Đang đăng nhập..." : "Đăng nhập bằng mật khẩu"}
                </Button>
                <p className="pt-1 text-center text-xs text-[var(--muted-foreground)]">
                  Chưa có tài khoản?{" "}
                  <Link
                    href="/register"
                    className="font-bold text-[var(--primary)] underline underline-offset-2"
                  >
                    Tạo tài khoản &amp; mật khẩu mới
                  </Link>
                </p>
              </form>
            ) : step === "email" ? (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-bold">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--muted-foreground)]" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="banhoc@example.com"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Tên hiển thị (tuỳ chọn)</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Minh Anh TOEIC"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">
                    Mã mời giáo viên (nếu vào nhóm kín VSVC)
                  </label>
                  <Input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: VSVC-2026 (hoặc dùng @vsvc.edu.vn)"
                    className="font-mono-num"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Đang gửi..." : "Gửi mã OTP 6 số"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                {devHint && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-200">
                    <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                    Local OTP:{" "}
                    <button
                      type="button"
                      onClick={() => setOtp(devHint)}
                      className="cursor-pointer rounded bg-emerald-600 px-2 py-0.5 font-mono-num font-bold text-white"
                    >
                      {devHint}
                    </button>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-bold">Nhập mã OTP (6 chữ số)</label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--muted-foreground)]" />
                    <Input
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="pl-9 font-mono-num tracking-widest"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("email")}
                    className="flex-1"
                  >
                    Đổi email
                  </Button>
                  <Button type="submit" disabled={loading || otp.length !== 6} className="flex-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Xác nhận
                  </Button>
                </div>
              </form>
            )}
              </div>

              <div className="mt-6 border-t border-dashed border-[#d9dfd2] pt-4 text-center text-[11px] leading-relaxed text-[#6b7867]">
                Tiếp tục nghĩa là bạn đồng ý{" "}
                <Link href="/chinh-sach/dieu-khoan-su-dung" className="font-bold underline hover:text-[#162617]">
                  Điều khoản sử dụng
                </Link>
                ,{" "}
                <Link href="/chinh-sach/bao-ve-du-lieu-ca-nhan" className="font-bold underline hover:text-[#162617]">
                  Bảo vệ dữ liệu cá nhân (Luật 91/2025)
                </Link>{" "}
                và{" "}
                <Link href="/chinh-sach/noi-quy-thu-nghiem-kin" className="font-bold underline hover:text-[#162617]">
                  Nội quy thử nghiệm kín
                </Link>
                . Không yêu cầu ảnh CCCD.
              </div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-[#7a8675]">
          {siteConfig.brand.name} · Học nhẹ nhàng, vững vàng tiến bước.
        </p>
      </div>
    </div>
  );
}
