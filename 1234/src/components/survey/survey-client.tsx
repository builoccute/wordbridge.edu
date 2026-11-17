"use client";

import * as React from "react";
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { Card } from "@/components/ui";
import { Input } from "@/components/ui";
import type { SurveyAnalyticsSummary } from "@/lib/prisma";
import { cn, formatVnd } from "@/lib/utils";

const PURPOSE_OPTIONS = ["Học tập trên lớp", "Thực tập", "Phỏng vấn xin việc", "Công việc hiện tại", "Khác"];
const METHOD_OPTIONS = [
  "Ứng dụng điện thoại",
  "Video YouTube",
  "Công cụ AI (ChatGPT...)",
  "Lớp học ở trường / trung tâm",
  "Tự đọc tài liệu",
  "Chưa luyện thường xuyên",
];
const DIFFICULTY_OPTIONS = [
  { id: "lack_career_content", label: "Thiếu nội dung sát ngành" },
  { id: "lack_partner", label: "Thiếu người luyện nói cùng" },
  { id: "shy_speaking", label: "Ngại nói, sợ sai" },
  { id: "lack_time", label: "Thiếu thời gian" },
  { id: "lack_motivation", label: "Thiếu động lực duy trì" },
  { id: "cost", label: "Chi phí học cao" },
];
const PRODUCT_OPTIONS = [
  "Duolingo",
  "ELSA Speak",
  "HelloTalk",
  "Tandem",
  "Gia sư trực tuyến (italki/Preply/Cambly)",
  "ChatGPT / AI hội thoại",
  "Khác",
];
const PAID_FEATURE_OPTIONS = [
  "Toàn bộ tình huống ngành",
  "Ghép cặp ưu tiên không giới hạn buổi",
  "Nhận xét của mentor",
  "Lộ trình cá nhân theo vị trí việc làm",
  "Luyện phỏng vấn 1-1",
  "Chứng nhận hoàn thành",
  "Học ngoại tuyến trên ứng dụng",
];

export function SurveyClient({ initialSummary }: { initialSummary: SurveyAnalyticsSummary }) {
  const { notify } = useApp();
  const [summary, setSummary] = React.useState<SurveyAnalyticsSummary>(initialSummary);
  const [activeTab, setActiveTab] = React.useState<"form" | "analytics">("form");
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // 15 questions state (Anonymous - NO full name collected per Phụ lục A Q2)
  const [customerGroup, setCustomerGroup] = React.useState<"N1" | "N2" | "N3">("N1");
  const [major, setMajor] = React.useState("Tin học");
  const [ageGroup, setAgeGroup] = React.useState<"UNDER_16" | "AGE_16_17" | "ADULT_18_PLUS">(
    "ADULT_18_PLUS"
  );
  const [under18GuardianConsent, setUnder18GuardianConsent] = React.useState(false);
  const [englishLevel, setEnglishLevel] = React.useState(2);
  const [purposes, setPurposes] = React.useState<string[]>(["Thực tập", "Phỏng vấn xin việc"]);
  const [currentMethods, setCurrentMethods] = React.useState<string[]>(["Ứng dụng điện thoại"]);
  const [weeklyFrequency, setWeeklyFrequency] = React.useState("1 - 2 buổi/tuần");
  const [careerRelevanceScore, setCareerRelevanceScore] = React.useState(2);
  const [topDifficulties, setTopDifficulties] = React.useState<string[]>([
    "Thiếu người luyện nói cùng",
    "Thiếu nội dung sát ngành",
    "Ngại nói, sợ sai",
  ]);
  const [hasDroppedBefore, setHasDroppedBefore] = React.useState(true);
  const [dropReason, setDropReason] = React.useState("");
  const [productsTried, setProductsTried] = React.useState<string[]>(["Duolingo"]);
  const [productFeedback, setProductFeedback] = React.useState("");
  const [pairWillingnessScore, setPairWillingnessScore] = React.useState(4);
  const [preferredFormat, setPreferredFormat] = React.useState<"video" | "voice" | "text">("video");
  const [privacyConcerns, setPrivacyConcerns] = React.useState("");
  const [trialWilling, setTrialWilling] = React.useState(false);
  const [trialEmail, setTrialEmail] = React.useState("");
  const [payWilling, setPayWilling] = React.useState(false);
  const [desiredPaidFeatures, setDesiredPaidFeatures] = React.useState<string[]>([]);
  const [maxMonthlyPriceVnd, setMaxMonthlyPriceVnd] = React.useState(50000);
  const [phoneType, setPhoneType] = React.useState<"Android" | "iPhone" | "Khác">("Android");
  const [preferPlatform, setPreferPlatform] = React.useState<"web" | "app" | "both">("both");

  const toggleListItem = (list: string[], value: string, setFn: (next: string[]) => void, max?: number) => {
    if (list.includes(value)) {
      setFn(list.filter((x) => x !== value));
    } else if (!max || list.length < max) {
      setFn([...list, value]);
    } else {
      notify(`Bạn chọn tối đa ${max} mục ở câu này nhé.`, "info");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerGroup,
          major,
          ageGroup,
          under18GuardianConsent,
          englishLevel,
          purposes,
          currentMethods,
          weeklyFrequency,
          careerRelevanceScore,
          topDifficulties,
          hasDroppedBefore,
          dropReason,
          productsTried,
          productFeedback,
          pairWillingnessScore,
          preferredFormat,
          privacyConcerns,
          trialWilling,
          trialEmail,
          payWilling,
          desiredPaidFeatures,
          maxMonthlyPriceVnd,
          phoneType,
          preferPlatform,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { summary: SurveyAnalyticsSummary };
        error?: { message: string };
      };
      if (!json.success || !json.data) {
        notify(json.error?.message || "Không thể gửi khảo sát.", "error");
        return;
      }
      setSummary(json.data.summary);
      setSubmitted(true);
      setActiveTab("analytics");
      notify("Cảm ơn bạn đã đóng góp khảo sát ẩn danh!", "success");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f3ea] bg-paper-grid pb-20 pt-8 text-[#1b2d1c] dark:bg-[#0e1511] dark:text-[#eef3e8]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-6">
        {/* Header */}
        <section className="rounded-[28px] border-2 border-[#1b2d1c] bg-[#163426] p-6 sm:p-8 text-white sc-shadow">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9ee56f] px-3 py-1 text-xs font-black text-[#0d1c12]">
                <ClipboardList className="h-3.5 w-3.5" />
                Phụ lục A · Khảo sát kiểm chứng H1 – H6
              </span>
              <h1 className="font-display text-3xl font-black sm:text-4xl">
                Khảo sát Nhu cầu Ngoại ngữ Theo Ngành
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/85">
                Khảo sát ẩn danh (không thu họ tên) phục vụ Đề án khởi nghiệp Trường CĐ nghề Việt
                Nam – Singapore. Hạn thu thập phân tích: 17 – 24/11/2026 (mục tiêu ≥ 150 phản hồi).
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-center min-w-[160px]">
              <p className="text-[11px] uppercase tracking-wider text-white/70">Đã thu thập</p>
              <p className="font-mono-num text-3xl font-black text-[#9ee56f]">
                {summary.totalResponses}
                <span className="text-sm font-semibold text-white/70">
                  /{summary.targets.totalTarget}
                </span>
              </p>
              <p className="text-[11px] text-white/70">
                N1: {summary.targets.n1Count} · N2: {summary.targets.n2Count} · N3:{" "}
                {summary.targets.n3Count}
              </p>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="inline-flex rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-bold cursor-pointer",
              activeTab === "form" ? "bg-[#19462b] text-white" : "text-[var(--muted-foreground)]"
            )}
          >
            Phiếu khảo sát 15 câu (Phụ lục A)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5",
              activeTab === "analytics"
                ? "bg-[#19462b] text-white"
                : "text-[var(--muted-foreground)]"
            )}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Tiến độ Kiểm chứng H1–H6
          </button>
        </div>

        {activeTab === "form" ? (
          <Card className="p-6 sm:p-8">
            {submitted && (
              <div className="mb-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-950 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>
                  Phản hồi của bạn đã được lưu ẩn danh và cập nhật trực tiếp vào bảng kiểm chứng giả
                  thuyết H1–H6!
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 text-sm">
              {/* Q1 */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-extrabold text-[var(--heading)]">
                    1a. Bạn thuộc nhóm đối tượng nào?
                  </label>
                  <select
                    value={customerGroup}
                    onChange={(e) => setCustomerGroup(e.target.value as "N1" | "N2" | "N3")}
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold"
                  >
                    <option value="N1">N1. HSSV trường nghề, cao đẳng (mục tiêu ≥ 80)</option>
                    <option value="N2">N2. Sinh viên đại học chuyên môn (mục tiêu ≥ 40)</option>
                    <option value="N3">N3. Người đang làm việc chuyên môn (mục tiêu ≥ 30)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-extrabold text-[var(--heading)]">
                    1b. Ngành học hoặc lĩnh vực của bạn?
                  </label>
                  <Input
                    required
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="Ví dụ: Cơ khí, Điện - Điện tử, Tin học, Kế toán..."
                  />
                </div>
              </div>

              {/* Q2 */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 space-y-3">
                <label className="block text-xs font-extrabold text-[var(--heading)]">
                  2. Bạn thuộc nhóm tuổi nào? (Khảo sát ẩn danh, không hỏi họ tên)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { v: "UNDER_16" as const, l: "Dưới 16 tuổi" },
                    { v: "AGE_16_17" as const, l: "16 – 17 tuổi" },
                    { v: "ADULT_18_PLUS" as const, l: "Từ 18 tuổi trở lên" },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setAgeGroup(opt.v)}
                      className={cn(
                        "rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer",
                        ageGroup === opt.v
                          ? "border-[#1b2d1c] bg-[#9ee56f] text-[#102414]"
                          : "border-[var(--border)] bg-[var(--surface)]"
                      )}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>

                {ageGroup !== "ADULT_18_PLUS" && (
                  <label className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={under18GuardianConsent}
                      onChange={(e) => setUnder18GuardianConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#1a4d2e]"
                    />
                    <span>
                      <b>Bắt buộc với người dưới 18 tuổi:</b> Tôi xác nhận đã được phụ huynh hoặc
                      giáo viên phụ trách đồng ý cho tham gia khảo sát ẩn danh này.
                    </span>
                  </label>
                )}
              </div>

              {/* Q3 */}
              <div>
                <label className="mb-1.5 block text-xs font-extrabold text-[var(--heading)]">
                  3. Bạn tự đánh giá trình độ tiếng Anh hiện tại? (Thang 1 = Mất gốc đến 5 = Thành thạo)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { n: 1, l: "1 · Mất gốc" },
                    { n: 2, l: "2 · Cơ bản" },
                    { n: 3, l: "3 · Trung bình" },
                    { n: 4, l: "4 · Khá" },
                    { n: 5, l: "5 · Thành thạo" },
                  ].map((item) => (
                    <button
                      key={item.n}
                      type="button"
                      onClick={() => setEnglishLevel(item.n)}
                      className={cn(
                        "rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer",
                        englishLevel === item.n
                          ? "border-[#1b2d1c] bg-[#19462b] text-white"
                          : "border-[var(--border)] bg-[var(--surface-alt)]"
                      )}
                    >
                      {item.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q4 */}
              <div>
                <label className="mb-1.5 block text-xs font-extrabold text-[var(--heading)]">
                  4. Bạn cần dùng tiếng Anh cho việc gì trong 12 tháng tới?
                </label>
                <div className="flex flex-wrap gap-2">
                  {PURPOSE_OPTIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleListItem(purposes, p, setPurposes)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold cursor-pointer",
                        purposes.includes(p)
                          ? "border-[#1b2d1c] bg-[#9ee56f] text-[#102414]"
                          : "border-[var(--border)] bg-[var(--surface-alt)]"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q5 */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-extrabold text-[var(--heading)]">
                    5a. Hiện bạn đang luyện bằng cách nào?
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {METHOD_OPTIONS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleListItem(currentMethods, m, setCurrentMethods)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-[11px] font-semibold cursor-pointer",
                          currentMethods.includes(m)
                            ? "border-[#1b2d1c] bg-[#19462b] text-white"
                            : "border-[var(--border)] bg-[var(--surface-alt)]"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-extrabold text-[var(--heading)]">
                    5b. Tần suất mỗi tuần?
                  </label>
                  <select
                    value={weeklyFrequency}
                    onChange={(e) => setWeeklyFrequency(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold"
                  >
                    <option value="Hầu như không luyện">Hầu như không luyện</option>
                    <option value="1 - 2 buổi/tuần">1 – 2 buổi/tuần</option>
                    <option value="3 - 4 buổi/tuần">3 – 4 buổi/tuần</option>
                    <option value="Hằng ngày">Hằng ngày</option>
                  </select>
                </div>
              </div>

              {/* Q6 [H1] */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4">
                <label className="mb-2 block text-xs font-extrabold text-[var(--heading)]">
                  6. [H1] Nội dung bạn đang học sát với tình huống nghề của bạn đến mức nào?
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { n: 1, l: "1 · Rất chưa sát" },
                    { n: 2, l: "2 · Chưa sát" },
                    { n: 3, l: "3 · Bình thường" },
                    { n: 4, l: "4 · Khá sát" },
                    { n: 5, l: "5 · Rất sát" },
                  ].map((opt) => (
                    <button
                      key={opt.n}
                      type="button"
                      onClick={() => setCareerRelevanceScore(opt.n)}
                      className={cn(
                        "rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer",
                        careerRelevanceScore === opt.n
                          ? "border-[#1b2d1c] bg-[#9ee56f] text-[#102414]"
                          : "border-[var(--border)] bg-[var(--surface)]"
                      )}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q7 [H2] */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 space-y-2">
                <label className="block text-xs font-extrabold text-[var(--heading)]">
                  7. [H2] Chọn và xếp hạng 3 khó khăn lớn nhất theo thứ tự ưu tiên (bấm theo thứ tự #1 → #2 → #3):
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTY_OPTIONS.map((d) => {
                    const rankIdx = topDifficulties.indexOf(d.label);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() =>
                          toggleListItem(topDifficulties, d.label, setTopDifficulties, 3)
                        }
                        className={cn(
                          "rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer",
                          rankIdx >= 0
                            ? "border-[#1b2d1c] bg-[#19462b] text-white"
                            : "border-[var(--border)] bg-[var(--surface)]"
                        )}
                      >
                        {rankIdx >= 0 ? `#${rankIdx + 1} · ` : ""}
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q8 & Q9 */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-[var(--heading)]">
                    8. Bạn đã từng bỏ dở một ứng dụng hoặc khóa học tiếng Anh chưa? Vì sao?
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setHasDroppedBefore(true)}
                      className={cn(
                        "rounded-lg border px-3 py-1 text-xs font-bold cursor-pointer",
                        hasDroppedBefore ? "bg-[#19462b] text-white" : "bg-[var(--surface-alt)]"
                      )}
                    >
                      Đã từng bỏ dở
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasDroppedBefore(false)}
                      className={cn(
                        "rounded-lg border px-3 py-1 text-xs font-bold cursor-pointer",
                        !hasDroppedBefore ? "bg-[#19462b] text-white" : "bg-[var(--surface-alt)]"
                      )}
                    >
                      Chưa bỏ dở
                    </button>
                  </div>
                  <Input
                    value={dropReason}
                    onChange={(e) => setDropReason(e.target.value)}
                    placeholder="Lý do bỏ dở (chán, không có người luyện cùng, bận...)"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-[var(--heading)]">
                    9. Bạn đã dùng sản phẩm nào? Điều thích và chưa thích?
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRODUCT_OPTIONS.map((pr) => (
                      <button
                        key={pr}
                        type="button"
                        onClick={() => toggleListItem(productsTried, pr, setProductsTried)}
                        className={cn(
                          "rounded-lg border px-2 py-1 text-[11px] font-semibold cursor-pointer",
                          productsTried.includes(pr)
                            ? "border-[#1b2d1c] bg-[#9ee56f] text-[#102414]"
                            : "border-[var(--border)] bg-[var(--surface-alt)]"
                        )}
                      >
                        {pr}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={productFeedback}
                    onChange={(e) => setProductFeedback(e.target.value)}
                    placeholder="Điều bạn thích / chưa thích ở các ứng dụng đó..."
                  />
                </div>
              </div>

              {/* Q10 [H3] & Q11 */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4">
                  <label className="mb-2 block text-xs font-extrabold text-[var(--heading)]">
                    10. [H3] Mức sẵn sàng luyện nói theo cặp/nhóm cùng ngành theo lịch hẹn hàng tuần?
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { n: 1, l: "1 · Rất không" },
                      { n: 2, l: "2 · Không" },
                      { n: 3, l: "3 · Phân vân" },
                      { n: 4, l: "4 · Sẵn sàng" },
                      { n: 5, l: "5 · Rất sẵn sàng" },
                    ].map((opt) => (
                      <button
                        key={opt.n}
                        type="button"
                        onClick={() => setPairWillingnessScore(opt.n)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-xs font-bold cursor-pointer",
                          pairWillingnessScore === opt.n
                            ? "border-[#1b2d1c] bg-[#9ee56f] text-[#102414]"
                            : "border-[var(--border)] bg-[var(--surface)]"
                        )}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4">
                  <label className="mb-2 block text-xs font-extrabold text-[var(--heading)]">
                    11. Bạn thoải mái với hình thức luyện tập nào?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { v: "video" as const, l: "Họp video" },
                      { v: "voice" as const, l: "Chỉ giọng nói (Audio)" },
                      { v: "text" as const, l: "Nhắn tin có cấu trúc" },
                    ].map((f) => (
                      <button
                        key={f.v}
                        type="button"
                        onClick={() => setPreferredFormat(f.v)}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-xs font-bold cursor-pointer",
                          preferredFormat === f.v
                            ? "border-[#1b2d1c] bg-[#19462b] text-white"
                            : "border-[var(--border)] bg-[var(--surface)]"
                        )}
                      >
                        {f.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Q12 */}
              <div>
                <label className="mb-1.5 block text-xs font-extrabold text-[var(--heading)]">
                  12. Bạn có lo ngại gì về quyền riêng tư khi luyện cùng bạn mới? Điều kiện nào khiến bạn yên tâm?
                </label>
                <Input
                  value={privacyConcerns}
                  onChange={(e) => setPrivacyConcerns(e.target.value)}
                  placeholder="Ví dụ: Chỉ ghép cùng trường, không lộ SĐT, không ghi âm..."
                />
              </div>

              {/* Q13 [H4] */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 space-y-2">
                <label className="flex items-center gap-2 text-xs font-extrabold text-[var(--heading)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={trialWilling}
                    onChange={(e) => setTrialWilling(e.target.checked)}
                    className="h-4 w-4 accent-[#1a4d2e]"
                  />
                  <span>13. [H4] Tôi muốn dùng thử nền tảng ít nhất 4 tuần và đồng ý để lại email nhận thư mời.</span>
                </label>
                {trialWilling && (
                  <Input
                    type="email"
                    required
                    value={trialEmail}
                    onChange={(e) => setTrialEmail(e.target.value)}
                    placeholder="Nhập email để nhận mã mời dùng thử 4 tuần..."
                  />
                )}
              </div>

              {/* Q14 [H5] */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 space-y-3">
                <label className="flex items-center gap-2 text-xs font-extrabold text-[var(--heading)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payWilling}
                    onChange={(e) => setPayWilling(e.target.checked)}
                    className="h-4 w-4 accent-[#1a4d2e]"
                  />
                  <span>14. [H5] Tôi sẵn sàng trả phí (hoặc phụ huynh thanh toán) để mở thêm tính năng nâng cao.</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PAID_FEATURE_OPTIONS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleListItem(desiredPaidFeatures, f, setDesiredPaidFeatures)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-[11px] font-semibold cursor-pointer",
                        desiredPaidFeatures.includes(f)
                          ? "border-[#1b2d1c] bg-[#9ee56f] text-[#102414]"
                          : "border-[var(--border)] bg-[var(--surface)]"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                {payWilling && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold">Mức chi tối đa mỗi tháng (VNĐ):</span>
                    {[29000, 49000, 79000, 99000, 149000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setMaxMonthlyPriceVnd(amt)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 font-mono-num font-bold cursor-pointer",
                          maxMonthlyPriceVnd === amt
                            ? "border-[#1b2d1c] bg-[#19462b] text-white"
                            : "border-[var(--border)] bg-[var(--surface)]"
                        )}
                      >
                        {formatVnd(amt)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Q15 [H6] */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-extrabold text-[var(--heading)]">
                    15a. [H6] Điện thoại bạn đang dùng?
                  </label>
                  <div className="flex gap-2">
                    {(["Android", "iPhone", "Khác"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPhoneType(p)}
                        className={cn(
                          "rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer",
                          phoneType === p
                            ? "border-[#1b2d1c] bg-[#9ee56f] text-[#102414]"
                            : "border-[var(--border)] bg-[var(--surface-alt)]"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-extrabold text-[var(--heading)]">
                    15b. Bạn muốn sử dụng qua nền tảng nào?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { v: "web" as const, l: "Trình duyệt Web" },
                      { v: "app" as const, l: "Ứng dụng (App)" },
                      { v: "both" as const, l: "Cả Web & App" },
                    ].map((pl) => (
                      <button
                        key={pl.v}
                        type="button"
                        onClick={() => setPreferPlatform(pl.v)}
                        className={cn(
                          "rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer",
                          preferPlatform === pl.v
                            ? "border-[#1b2d1c] bg-[#19462b] text-white"
                            : "border-[var(--border)] bg-[var(--surface-alt)]"
                        )}
                      >
                        {pl.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                  <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
                  Dữ liệu ẩn danh theo Luật BVDLCN 91/2025/QH15.
                </span>
                <Button type="submit" size="lg" disabled={submitting}>
                  <Sparkles className="h-4 w-4" />
                  {submitting ? "Đang ghi nhận..." : "Gửi phiếu khảo sát"}
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <div className="space-y-5">
            <Card className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-heading text-lg font-extrabold text-[var(--heading)]">
                  Bảng kiểm chứng 6 Giả thuyết (Mục IV.2 Đề án)
                </h2>
                <Badge variant="neutral">
                  Cỡ mẫu thực tế: {summary.totalResponses} / {summary.targets.totalTarget}
                </Badge>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Lưu ý phương pháp luận (Mục IV.3): mẫu khảo sát thu thập theo thuận tiện, các ô sẽ
                được phân tích đối chiếu trước khi nộp hồ sơ ngày 02/12/2026. Nếu H1 hoặc H2 không
                đạt ngưỡng, nhóm sẽ điều chỉnh định vị.
              </p>

              <div className="space-y-3">
                {summary.hypotheses.map((h) => (
                  <div
                    key={h.code}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="green">{h.code}</Badge>
                        <span className="font-heading text-sm font-bold text-[var(--heading)]">
                          {h.statement}
                        </span>
                      </div>
                      <Badge
                        variant={
                          h.passed === null ? "neutral" : h.passed ? "green" : "gold"
                        }
                      >
                        {h.passed === null
                          ? "Chưa có dữ liệu"
                          : h.passed
                          ? `Đạt ngưỡng (${h.actualPct}%)`
                          : `Chưa đạt (${h.actualPct}%)`}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted-foreground)]">
                      <span>Ngưỡng chấp nhận: {h.thresholdLabel}</span>
                      <span className="font-mono-num font-bold text-[var(--heading)]">
                        {h.matchedCount}/{h.totalCount} phản hồi ({h.actualPct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
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
        )}
      </div>
    </div>
  );
}
