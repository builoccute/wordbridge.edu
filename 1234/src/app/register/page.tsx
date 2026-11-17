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
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { LoginCompanionArt } from "@/components/brand/mascot";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { computeAgeGroup, isMinorAgeGroup } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
import { LEARNER_TARGET_GROUPS, TRAINING_INSTITUTION_TYPES, VOCATIONAL_FIELDS_CATALOG } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const { user, guestSavedDocIds, refreshUser, notify } = useApp();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  // Optional VSVC Closed-Beta profile fields
  const [showBetaFields, setShowBetaFields] = React.useState(false);
  const [dateOfBirth, setDateOfBirth] = React.useState("");
  const [studentGroup, setStudentGroup] = React.useState("GROUP_C");
  const [institutionType, setInstitutionType] = React.useState("Trường Cao đẳng nghề");
  const [school, setSchool] = React.useState("Trường Cao đẳng nghề Việt Nam - Singapore");
  const [faculty, setFaculty] = React.useState("Khoa Công nghệ thông tin");
  const [fieldCode, setFieldCode] = React.useState("A");
  const [major, setMajor] = React.useState("Công nghệ thông tin");
  const [specialty, setSpecialty] = React.useState("Phát triển website");
  const [targetCareerRole, setTargetCareerRole] = React.useState("Kỹ thuật viên / Lập trình viên");
  const [studyYear, setStudyYear] = React.useState("Năm 1");
  const [selfLevel, setSelfLevel] = React.useState("Cơ bản (A2)");
  const [englishGoal, setEnglishGoal] = React.useState("Giao tiếp thực hành nghề, đọc tài liệu kỹ thuật và chuẩn bị thực tập");
  const [inviteCode, setInviteCode] = React.useState("");
  const [guardianName, setGuardianName] = React.useState("");
  const [guardianContact, setGuardianContact] = React.useState("");
  const [acceptRules, setAcceptRules] = React.useState(true);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      router.replace("/my-library");
    }
  }, [user, router]);

  const detectedAgeGroup = React.useMemo(
    () => (dateOfBirth ? computeAgeGroup(`${dateOfBirth}T00:00:00.000Z`) : "ADULT_18_PLUS"),
    [dateOfBirth]
  );
  const isMinor = isMinorAgeGroup(detectedAgeGroup);

  const handleSubmit = async (e: React.FormEvent) => {
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
          dateOfBirth: dateOfBirth || undefined,
          studentGroup,
          institutionType,
          school,
          faculty,
          major,
          specialty,
          targetCareerRole,
          studyYear,
          englishGoal,
          selfLevel,
          inviteCode: inviteCode.trim() || undefined,
          guardianName: guardianName.trim() || undefined,
          guardianContact: guardianContact.trim() || undefined,
          acceptBetaRules: acceptRules,
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

      window.localStorage.removeItem("lc_guest_saved_docs");
      window.dispatchEvent(new Event("lc-local-store"));
      await refreshUser();
      notify("Tạo tài khoản thành công! Chào mừng bạn gia nhập nền tảng.", "success");
      router.push("/my-library");
    } catch {
      setError("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f6f3ea] bg-dot-grid px-4 py-6 sm:px-6 sm:py-8 dark:bg-[#0e1511]">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between text-xs font-semibold text-[#5a6854] dark:text-slate-300">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 hover:text-[#162617] dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Về trang chủ</span>
          </Link>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#1a4d2e]" />
            <span>Đăng ký nhanh bằng Email &amp; Mật khẩu · Không bắt buộc Google</span>
          </span>
        </div>

        <div className="relative overflow-hidden rounded-[26px] border border-[#d9d5c8] bg-white shadow-[0_14px_40px_rgba(27,45,28,0.08)] dark:border-white/15 dark:bg-[#17211b]">
          <div className="grid md:grid-cols-[0.95fr_1.05fr]">
            {/* Left Companion Panel */}
            <div className="flex flex-col justify-between bg-[#ebf0e1] p-7 sm:p-9 md:border-r md:border-dashed md:border-[#cfd8c0] dark:border-white/10 dark:bg-[#131d16]">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#46633e]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#629b45]" />
                  <span>TẠO TÀI KHOẢN MỚI</span>
                </p>

                <h2 className="mt-2 font-display text-3xl font-black leading-[1.1] text-[#172c18] dark:text-white">
                  Bắt đầu tự học.
                  <span className="block text-[#48753e] dark:text-[#9ee56f]">
                    Không cần Google.
                  </span>
                </h2>
                <p className="mt-2.5 text-xs leading-relaxed text-[#556651] dark:text-slate-300">
                  Tạo tài khoản bằng Email &amp; Mật khẩu riêng để lưu tiến độ học TOEIC, thực hành
                  tình huống nghề 3 lớp và tham gia ghép cặp luyện nói VSVC.
                </p>
              </div>

              <div className="relative my-6 flex items-center justify-center">
                <div className="relative flex h-52 w-52 items-center justify-center rounded-full bg-[#dde6cd] dark:bg-[#1e3123]">
                  <LoginCompanionArt className="h-40 w-40" />
                  <div className="absolute -right-4 -top-2 rotate-[3deg] rounded-xl border border-[#cfd8c0] bg-white px-3 py-1.5 font-heading text-[11px] font-bold text-[#172c18] shadow-sm">
                    Chỉ mất 20 giây! ✨
                  </div>
                  <div className="absolute -left-5 bottom-4 -rotate-[4deg] inline-flex items-center gap-1.5 rounded-xl border border-[#cfd8c0] bg-white px-2.5 py-1 text-[10px] font-bold text-[#172c18] shadow-xs">
                    <BookOpen className="h-3 w-3 text-[#48753e]" />
                    Không thu CCCD
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-dashed border-[#c7d1b6] pt-4 text-[11px] text-[#4e614a] dark:text-slate-300">
                <p>✓ Dữ liệu tối thiểu theo Luật BVDLCN 91/2025/QH15.</p>
                <p>✓ Học viên &lt; 16 tuổi đăng ký kèm thông tin cha/mẹ/giám hộ.</p>
                <p>✓ Có thể xóa tài khoản &amp; rút khỏi thử nghiệm bất cứ lúc nào.</p>
              </div>
            </div>

            {/* Right Registration Form */}
            <div className="p-7 sm:p-9">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#788573]">
                {siteConfig.brand.shortName} · ĐĂNG KÝ TÀI KHOẢN
              </p>
              <h1 className="mt-1 font-display text-2xl font-black text-[#122618] dark:text-white">
                Tạo tài khoản &amp; mật khẩu
              </h1>
              <p className="mt-1 text-xs text-[#556758] dark:text-slate-300">
                Dùng bất kỳ email cá nhân hoặc email trường (<code>@vsvc.edu.vn</code>).
              </p>

              {guestSavedDocIds.length > 0 && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                  Sẽ tự động lưu <b>{guestSavedDocIds.length} tài liệu</b> bạn vừa đánh dấu.
                </div>
              )}

              {error && (
                <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-700 dark:text-rose-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-bold">Họ và tên hiển thị</label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--muted-foreground)]" />
                    <Input
                      required
                      minLength={2}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn An"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--muted-foreground)]" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="banhoc@example.com hoặc mssv@vsvc.edu.vn"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold">Mật khẩu (≥ 6 ký tự)</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--muted-foreground)]" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu"
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

                  <div>
                    <label className="mb-1 block text-xs font-bold">Nhập lại mật khẩu</label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--muted-foreground)]" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Xác nhận mật khẩu"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Expandable VSVC Closed-Beta Options */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3">
                  <button
                    type="button"
                    onClick={() => setShowBetaFields((v) => !v)}
                    className="flex w-full items-center justify-between text-left text-xs font-bold text-[var(--heading)] cursor-pointer"
                  >
                    <span>Thông tin ngành &amp; Mã mời VSVC (tuỳ chọn)</span>
                    <span className="text-[11px] text-[var(--primary)]">
                      {showBetaFields ? "Thu gọn" : "Mở rộng"}
                    </span>
                  </button>

                  {showBetaFields && (
                    <div className="mt-3 space-y-2.5 text-xs">
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block font-semibold">Ngày sinh</label>
                          <Input
                            type="date"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block font-semibold">Mã mời giáo viên</label>
                          <Input
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            placeholder="VD: VSVC-2026"
                            className="font-mono-num"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block font-semibold">Nhóm đối tượng người học</label>
                          <select
                            value={studentGroup}
                            onChange={(e) => {
                              const g = LEARNER_TARGET_GROUPS.find((x) => x.code === e.target.value);
                              setStudentGroup(e.target.value);
                              if (g) setInstitutionType(g.institutionType);
                            }}
                            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold"
                          >
                            {LEARNER_TARGET_GROUPS.map((g) => (
                              <option key={g.code} value={g.code}>
                                {g.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block font-semibold">Loại hình cơ sở đào tạo</label>
                          <select
                            value={institutionType}
                            onChange={(e) => setInstitutionType(e.target.value)}
                            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold"
                          >
                            {TRAINING_INSTITUTION_TYPES.map((inst) => (
                              <option key={inst.code} value={inst.name}>
                                {inst.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block font-semibold">Trường / Trung tâm (tùy chọn)</label>
                          <Input
                            value={school}
                            onChange={(e) => setSchool(e.target.value)}
                            placeholder="VD: Trung tâm GDNN-GDTX / Trường TC, CĐ nghề..."
                          />
                        </div>
                        <div>
                          <label className="mb-1 block font-semibold">Khoa / Bộ môn (tùy chọn)</label>
                          <Input
                            value={faculty}
                            onChange={(e) => setFaculty(e.target.value)}
                            placeholder="VD: Khoa Điện - Điện tử, Khoa Cơ khí..."
                          />
                        </div>
                      </div>

                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block font-semibold">Lĩnh vực đào tạo (A–P)</label>
                          <select
                            value={fieldCode}
                            onChange={(e) => {
                              const fc = e.target.value;
                              setFieldCode(fc);
                              const fObj = VOCATIONAL_FIELDS_CATALOG.find((x) => x.code === fc);
                              if (fObj) {
                                setMajor(fObj.name);
                                setSpecialty(fObj.specialties[0] || fObj.name);
                              }
                            }}
                            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold"
                          >
                            {VOCATIONAL_FIELDS_CATALOG.map((f) => (
                              <option key={f.code} value={f.code}>
                                {f.code}. {f.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block font-semibold">Chuyên ngành nghề nghiệp</label>
                          <select
                            value={specialty}
                            onChange={(e) => {
                              setSpecialty(e.target.value);
                              setMajor(e.target.value);
                            }}
                            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold"
                          >
                            {(
                              VOCATIONAL_FIELDS_CATALOG.find((x) => x.code === fieldCode)?.specialties || []
                            ).map((sp) => (
                              <option key={sp} value={sp}>
                                {sp}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-2.5 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block font-semibold">Vị trí việc làm định hướng</label>
                          <Input
                            value={targetCareerRole}
                            onChange={(e) => setTargetCareerRole(e.target.value)}
                            placeholder="VD: Kỹ thuật viên CNC..."
                          />
                        </div>
                        <div>
                          <label className="mb-1 block font-semibold">Trình độ / Năm học</label>
                          <Input
                            value={studyYear}
                            onChange={(e) => setStudyYear(e.target.value)}
                            placeholder="VD: Lớp 10 GDTX / Trung cấp Năm 1 / Đã đi làm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block font-semibold">Trình độ tiếng Anh tự đánh giá</label>
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
                      </div>

                      {isMinor && (
                        <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-amber-950">
                          <p className="font-bold">
                            {detectedAgeGroup === "UNDER_16"
                              ? "Dưới 16 tuổi: bắt buộc có thông tin cha/mẹ/người giám hộ (NĐ 147/2024):"
                              : "16–17 tuổi: cần Phiếu đồng ý của phụ huynh để tham gia ghép cặp."}
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Input
                              required={detectedAgeGroup === "UNDER_16"}
                              value={guardianName}
                              onChange={(e) => setGuardianName(e.target.value)}
                              placeholder="Họ tên Cha / Mẹ / Giám hộ"
                              className="bg-white"
                            />
                            <Input
                              required={detectedAgeGroup === "UNDER_16"}
                              value={guardianContact}
                              onChange={(e) => setGuardianContact(e.target.value)}
                              placeholder="SĐT hoặc email phụ huynh"
                              className="bg-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <label className="flex items-start gap-2 text-[11px] leading-relaxed text-[#556758] dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={acceptRules}
                    onChange={(e) => setAcceptRules(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#1a4d2e]"
                  />
                  <span>
                    Tôi đồng ý{" "}
                    <Link href="/chinh-sach/dieu-khoan-su-dung" className="font-bold underline">
                      Điều khoản sử dụng
                    </Link>
                    ,{" "}
                    <Link
                      href="/chinh-sach/bao-ve-du-lieu-ca-nhan"
                      className="font-bold underline"
                    >
                      Bảo vệ dữ liệu cá nhân
                    </Link>{" "}
                    và{" "}
                    <Link href="/chinh-sach/noi-quy-thu-nghiem-kin" className="font-bold underline">
                      Nội quy thử nghiệm kín
                    </Link>
                    .
                  </span>
                </label>

                <Button type="submit" disabled={loading} className="w-full h-11">
                  <CheckCircle2 className="h-4 w-4" />
                  {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản ngay"}
                </Button>
              </form>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-[#d9dfd2] pt-4 text-xs">
                <span className="text-[var(--muted-foreground)]">
                  Đã có tài khoản rồi?{" "}
                  <Link
                    href="/login"
                    className="font-bold text-[var(--primary)] underline underline-offset-2"
                  >
                    Đăng nhập bằng mật khẩu
                  </Link>
                </span>
                <a
                  href="/api/auth/google"
                  className="font-semibold text-[var(--muted-foreground)] hover:text-[var(--heading)] underline"
                >
                  Hoặc dùng Google
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
