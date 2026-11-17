"use client";

import * as React from "react";
import { Ban, Calendar, CheckCircle2, Eye, Flag, LockKeyhole, Search, ShieldAlert, ShieldCheck, UserCheck } from "lucide-react";
import { Modal } from "@/components/ui";
import { Button } from "@/components/ui";
import { useApp } from "@/components/providers/app-provider";
import { Badge } from "@/components/ui";
import { Card } from "@/components/ui";
import { Input } from "@/components/ui";
import { getAgeGroupLabel } from "@/lib/utils";

// === report-block-modal.tsx ===
const REPORT_CATEGORIES = [
  { value: "HARASSMENT", label: "Quấy rối / Ngôn từ thiếu tôn trọng" },
  { value: "PERSONAL_CONTACT_LEAK", label: "Ép chia sẻ liên hệ cá nhân (SĐT, Zalo, MXH)" },
  { value: "UNAPPROVED_RECORDING", label: "Ghi âm / ghi hình khi chưa được đồng ý" },
  { value: "UNDER_18_SAFETY", label: "Vi phạm quy tắc an toàn người dưới 18 tuổi" },
  { value: "SPAM_INAPPROPRIATE", label: "Nội dung sai chủ đề / spam / vi phạm pháp luật" },
  { value: "OTHER", label: "Vấn đề khác" },
] as const;

interface ReportBlockModalProps {
  open: boolean;
  onClose: () => void;
  targetType: "SESSION" | "COMMUNITY_POST" | "USER";
  targetId: string;
  targetUserId?: string | null;
  targetUserName?: string;
  onBlocked?: () => void;
}

export function ReportBlockModal({
  open,
  onClose,
  targetType,
  targetId,
  targetUserId,
  targetUserName,
  onBlocked,
}: ReportBlockModalProps) {
  const { user, openAuthModal, notify } = useApp();
  const [category, setCategory] = React.useState<string>("HARASSMENT");
  const [description, setDescription] = React.useState("");
  const [alsoBlock, setAlsoBlock] = React.useState(Boolean(targetUserId));
  const [submitting, setSubmitting] = React.useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal("Đăng nhập để gửi báo cáo vi phạm hoặc chặn tài khoản.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/safety/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedUserId: targetUserId || null,
          targetType,
          targetId,
          category,
          description,
        }),
      });
      const json = (await res.json()) as { success: boolean; error?: { message: string } };
      if (!json.success) {
        notify(json.error?.message || "Không thể gửi báo cáo.", "error");
        return;
      }

      if (alsoBlock && targetUserId && targetUserId !== user.id) {
        await fetch("/api/safety/block", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blockedUserId: targetUserId,
            reason: `Chặn kèm báo cáo (${category})`,
          }),
        });
        onBlocked?.();
      }

      notify(
        alsoBlock && targetUserId
          ? "Đã gửi báo cáo cho giáo viên phụ trách và chặn thành viên này."
          : "Đã gửi báo cáo vi phạm cho giáo viên phụ trách.",
        "success"
      );
      setDescription("");
      onClose();
    } catch {
      notify("Lỗi kết nối máy chủ khi gửi báo cáo.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlockOnly = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (!targetUserId || targetUserId === user.id) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/safety/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockedUserId: targetUserId,
          reason: "Người dùng chủ động chặn ghép cặp & bảng tin",
        }),
      });
      const json = (await res.json()) as { success: boolean; error?: { message: string } };
      if (json.success) {
        notify(`Đã chặn ${targetUserName || "thành viên này"}.`, "info");
        onBlocked?.();
        onClose();
      } else {
        notify(json.error?.message || "Không thể chặn.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidthClass="max-w-lg">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 border-[#1b2d1c] bg-rose-100 text-rose-700">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-heading text-lg font-extrabold text-[var(--heading)]">
              Báo cáo vi phạm &amp; Chặn an toàn
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Báo cáo sẽ gửi trực tiếp đến Giáo viên phụ trách &amp; Mentor để kiểm duyệt theo Nội quy thử nghiệm kín (Phụ lục B).
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-[var(--heading)]">
              Nhóm hành vi vi phạm
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            >
              {REPORT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-[var(--heading)]">
              Mô tả chi tiết tình huống
            </label>
            <textarea
              required
              minLength={6}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ví dụ: Yêu cầu gửi SĐT riêng hoặc ghi âm không xin phép..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
          </div>

          {targetUserId && targetUserId !== user?.id && (
            <label className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-xs font-semibold text-[var(--heading)] cursor-pointer">
              <input
                type="checkbox"
                checked={alsoBlock}
                onChange={(e) => setAlsoBlock(e.target.checked)}
                className="h-4 w-4 accent-[#1a4d2e]"
              />
              <span>
                Đồng thời chặn <b>{targetUserName || "thành viên này"}</b> (không ghép cặp hoặc hiển thị bài viết nữa)
              </span>
            </label>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            {targetUserId && targetUserId !== user?.id && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={handleBlockOnly}
              >
                <Ban className="h-3.5 w-3.5 text-rose-600" />
                Chỉ chặn nhanh
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submitting}>
              <Flag className="h-3.5 w-3.5" />
              {submitting ? "Đang gửi..." : "Gửi báo cáo"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// === parent-monitor-client.tsx ===
interface MonitorStudent {
  id: string;
  name: string;
  school: string;
  major: string;
  selfLevel: string;
  ageGroup: string;
  parentConsentStatus: string;
  guardianName: string | null;
  guardianRelation: string | null;
  approvalStatus: string;
  parentMonitorCode: string | null;
}

interface MonitorSession {
  id: string;
  scenarioTitle: string;
  scenarioSlug: string;
  major: string;
  level: string;
  school: string;
  ageGroupScope: string;
  scheduledAt: string;
  slotLabel: string;
  status: string;
  partnerName: string;
  partnerSchool: string;
  noRecordingConfirmed: boolean;
}

export function ParentMonitorClient({ initialCode = "" }: { initialCode?: string }) {
  const { notify } = useApp();
  const [code, setCode] = React.useState(initialCode || "VSVC-PH-DEMO18");
  const [loading, setLoading] = React.useState(false);
  const [student, setStudent] = React.useState<MonitorStudent | null>(null);
  const [sessions, setSessions] = React.useState<MonitorSession[]>([]);
  const [safetyGuarantees, setSafetyGuarantees] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const lookupByCode = React.useCallback(
    async (targetCode: string) => {
      const clean = targetCode.trim().toUpperCase();
      if (!clean) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/parent-monitor?code=${encodeURIComponent(clean)}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as {
          success: boolean;
          data?: {
            student: MonitorStudent;
            sessions: MonitorSession[];
            safetyGuarantees: string[];
          };
          error?: { message: string };
        };
        if (!res.ok || !json.success || !json.data) {
          setStudent(null);
          setSessions([]);
          setError(json.error?.message || "Không tìm thấy mã theo dõi phụ huynh.");
          return;
        }
        setStudent(json.data.student);
        setSessions(json.data.sessions);
        setSafetyGuarantees(json.data.safetyGuarantees);
      } catch {
        notify("Lỗi kết nối máy chủ.", "error");
      } finally {
        setLoading(false);
      }
    },
    [notify]
  );

  React.useEffect(() => {
    if (!initialCode) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return lookupByCode(initialCode);
    });
    return () => {
      active = false;
    };
  }, [initialCode, lookupByCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void lookupByCode(code);
  };

  return (
    <div className="min-h-screen bg-[#f6f3ea] bg-paper-grid pb-20 pt-8 text-[#1b2d1c] dark:bg-[#0e1511] dark:text-[#eef3e8]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-6">
        <section className="rounded-[28px] border-2 border-[#1b2d1c] bg-[#163426] p-6 sm:p-8 text-white sc-shadow space-y-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9ee56f] px-3 py-1 text-xs font-black text-[#0d1c12]">
            <Eye className="h-3.5 w-3.5" />
            Mục VII.2 &amp; VIII · Bảo vệ học viên dưới 18 tuổi
          </span>
          <h1 className="font-display text-3xl font-black sm:text-4xl">
            Cổng Giám sát Lịch luyện dành cho Phụ huynh &amp; Giáo viên
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/85 max-w-3xl">
            Phụ huynh hoặc người giám hộ nhập <b>Mã theo dõi (ví dụ: VSVC-PH-DEMO18)</b> để xem
            lịch ghép cặp, trường học và nhóm tuổi của bạn luyện cùng học viên dưới 18 tuổi.
          </p>
        </section>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-extrabold text-[var(--heading)]">
                Mã theo dõi Phụ huynh (lấy tại Hồ sơ học viên / Kho cá nhân)
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: VSVC-PH-DEMO18"
                  className="pl-9 font-mono-num"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              <Search className="h-4 w-4" />
              {loading ? "Đang tra cứu..." : "Xem lịch luyện"}
            </Button>
          </form>

          {error && (
            <p className="mt-3 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
              {error}
            </p>
          )}
        </Card>

        {student && (
          <div className="space-y-5">
            <Card className="p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge variant="green">Hồ sơ đang giám sát</Badge>
                  <h2 className="mt-1.5 font-heading text-xl font-extrabold text-[var(--heading)]">
                    {student.name}
                  </h2>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {student.school} · Ngành {student.major} · {student.selfLevel}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="gold">{getAgeGroupLabel(student.ageGroup)}</Badge>
                  <Badge variant={student.parentConsentStatus === "APPROVED" ? "green" : "gold"}>
                    <UserCheck className="h-3 w-3" />
                    Phiếu phụ huynh:{" "}
                    {student.parentConsentStatus === "APPROVED" ? "Đã duyệt" : student.parentConsentStatus}
                  </Badge>
                </div>
              </div>

              {student.guardianName && (
                <p className="text-xs text-[var(--foreground)]">
                  <b>Người giám hộ đăng ký:</b> {student.guardianName} (
                  {student.guardianRelation || "Phụ huynh"})
                </p>
              )}

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 space-y-1.5">
                <p className="text-xs font-extrabold text-[var(--heading)] flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
                  Cơ chế bảo vệ đang áp dụng tự động:
                </p>
                {safetyGuarantees.map((g) => (
                  <p key={g} className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
                    {g}
                  </p>
                ))}
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="font-heading text-lg font-extrabold text-[var(--heading)] flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[var(--primary)]" />
                Lịch luyện nói theo cặp ({sessions.length} buổi)
              </h3>
              {sessions.length === 0 ? (
                <p className="text-xs text-[var(--muted-foreground)]">
                  Học viên chưa có buổi ghép cặp nào được đặt.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={s.status === "COMPLETED" ? "green" : "gold"}>
                            {s.status}
                          </Badge>
                          <Badge variant="neutral">{s.slotLabel}</Badge>
                          <Badge variant="neutral">
                            {s.ageGroupScope === "UNDER_18" ? "Cùng nhóm < 18 tuổi" : s.ageGroupScope}
                          </Badge>
                        </div>
                        <p className="mt-1.5 font-heading text-sm font-bold text-[var(--heading)]">
                          {s.scenarioTitle}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Bạn cùng luyện: <b>{s.partnerName}</b> · {s.partnerSchool}
                        </p>
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-700 dark:text-[#9ee56f]">
                        {s.noRecordingConfirmed ? "✓ Không lưu ghi âm" : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
