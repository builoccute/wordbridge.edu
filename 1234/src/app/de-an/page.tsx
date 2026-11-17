import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Layers,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { Card } from "@/components/ui";
import { siteConfig } from "@/lib/site-config";
import { getPhase0bKpis, getSurveyAnalytics } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Đề Án Khởi Nghiệp LV04 · Nền Tảng Thực Hành Ngoại Ngữ VSVC",
  description:
    "Hồ sơ trực tuyến Đề án Cuộc thi Học sinh với ý tưởng khởi nghiệp cấp Thành phố 2026–2027 · Trường CĐ nghề Việt Nam – Singapore.",
};

async function ProposalDashboardLoader() {
  const [kpis, survey] = await Promise.all([getPhase0bKpis(), getSurveyAnalytics()]);
  const p = siteConfig.startupProject;

  const kpiCards = [
    {
      label: "Thành viên hoạt động (0b)",
      value: `${kpis.activeMembers}`,
      target: `≥ ${kpis.activeMembersTarget}`,
      ok: kpis.activeMembers >= kpis.activeMembersTarget,
    },
    {
      label: "Buổi ghép cặp hoàn thành",
      value: `${kpis.completedSessions}`,
      target: `≥ ${kpis.completedSessionsTarget}`,
      ok: kpis.completedSessions >= kpis.completedSessionsTarget,
    },
    {
      label: "Tỷ lệ hoàn thành buổi hẹn",
      value: `${kpis.completionRatePct}%`,
      target: `≥ ${kpis.completionRateTarget}%`,
      ok: kpis.completionRatePct >= kpis.completionRateTarget,
    },
    {
      label: "Giữ chân tuần 2 (Streak ≥7)",
      value: `${kpis.week2RetentionPct}%`,
      target: `≥ ${kpis.week2RetentionTarget}%`,
      ok: kpis.week2RetentionPct >= kpis.week2RetentionTarget,
    },
    {
      label: "Mức hài lòng trung bình",
      value: `${kpis.avgSatisfaction || "—"}/5`,
      target: `≥ ${kpis.avgSatisfactionTarget}/5`,
      ok: kpis.avgSatisfaction >= kpis.avgSatisfactionTarget,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f3ea] bg-paper-grid pb-20 pt-8 text-[#1b2d1c] dark:bg-[#0e1511] dark:text-[#eef3e8]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        {/* Competition Banner */}
        <section className="rounded-[28px] border-2 border-[#1b2d1c] bg-[#13291b] p-6 sm:p-9 text-white sc-shadow space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9ee56f] px-3 py-1 text-xs font-black text-[#0d1c12]">
              <Award className="h-3.5 w-3.5" />
              {p.fieldCode} · {p.competition}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
              {p.unit}
            </span>
          </div>

          <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
            {p.title}
          </h1>
          <p className="text-sm leading-relaxed text-emerald-100/85 max-w-3xl">
            {p.organizer} · Ngày lập đề án: {p.proposalDate} · Hạn nộp Sở GD&amp;ĐT:{" "}
            <b className="text-[#9ee56f]">{p.submissionDeadline}</b> · Giáo viên hướng dẫn:{" "}
            <b>{p.advisor}</b>.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/tinh-huong">
              <Button>
                <Layers className="h-4 w-4" />
                Trải nghiệm Tình huống 3 lớp
              </Button>
            </Link>
            <Link href="/ghep-cap">
              <Button variant="secondary">
                <Users className="h-4 w-4" />
                Vào Phòng Ghép cặp
              </Button>
            </Link>
            <Link href="/khao-sat">
              <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                <ClipboardCheck className="h-4 w-4" />
                Làm khảo sát H1–H6 ({survey.totalResponses}/150)
              </Button>
            </Link>
          </div>
        </section>

        {/* Live Phase 0b KPI Progress */}
        <Card className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Badge variant="green">Số liệu hệ thống trực tiếp</Badge>
              <h2 className="mt-1 font-heading text-xl font-extrabold text-[var(--heading)]">
                Chỉ tiêu Giai đoạn 0b (Thử nghiệm kín ~3 tuần tại VSVC)
              </h2>
            </div>
            <Link href="/khao-sat" className="text-xs font-bold text-[var(--primary)] hover:underline">
              Xem tiến độ Khảo sát H1–H6 ({survey.totalResponses} phản hồi) &rarr;
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {kpiCards.map((k) => (
              <div
                key={k.label}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4"
              >
                <p className="text-[11px] font-semibold text-[var(--muted-foreground)]">{k.label}</p>
                <p className="mt-1 font-mono-num text-2xl font-black text-[var(--heading)]">
                  {k.value}
                </p>
                <p className="mt-1 text-[11px] font-bold text-[var(--primary)]">
                  Mục tiêu: {k.target} {k.ok ? "· Đạt" : "· Đang thu thập"}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Legal Bases & Team */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 space-y-3">
            <h2 className="font-heading text-lg font-extrabold text-[var(--heading)] flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--primary)]" />
              Căn cứ pháp lý &amp; Kế hoạch triển khai
            </h2>
            <ul className="space-y-2 text-xs leading-relaxed text-[var(--foreground)]">
              {p.legalBases.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 space-y-3">
            <h2 className="font-heading text-lg font-extrabold text-[var(--heading)] flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-[var(--primary)]" />
              Nhóm thực hiện (Lớp T25DH2DA · VSVC)
            </h2>
            <div className="space-y-2.5">
              {p.team.map((m) => (
                <div
                  key={m.email}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-heading text-sm font-extrabold text-[var(--heading)]">
                      {m.name}
                    </span>
                    <Badge variant="green">{m.roleBadge}</Badge>
                  </div>
                  <p className="mt-1 text-[var(--muted-foreground)]">{m.responsibility}</p>
                  <p className="mt-1 font-mono-num text-[11px] text-[var(--heading)]">
                    {m.phone} · {m.email}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Competitor Matrix */}
        <Card className="p-6 space-y-4 overflow-x-auto">
          <div>
            <h2 className="font-heading text-xl font-extrabold text-[var(--heading)]">
              Phân tích Đối thủ &amp; Khoảng trống Thị trường (Mục V)
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Bảng so sánh theo tiêu chí đánh giá ban đầu; cập nhật dùng thử thực tế trước 02/12/2026.
            </p>
          </div>
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b-2 border-[var(--border-strong)] text-[var(--heading)]">
                <th className="py-2.5 pr-3">Giải pháp</th>
                <th className="py-2.5 px-2">Nội dung theo ngành</th>
                <th className="py-2.5 px-2">Luyện nói người thật</th>
                <th className="py-2.5 px-2">Cộng đồng cùng ngành</th>
                <th className="py-2.5 px-2">Chi phí thấp HSSV</th>
                <th className="py-2.5 pl-2">Giao diện tiếng Việt</th>
              </tr>
            </thead>
            <tbody>
              {p.competitorMatrix.map((c) => {
                const isProject = c.name.startsWith("Dự án");
                return (
                  <tr
                    key={c.name}
                    className={
                      isProject
                        ? "border-b border-[var(--border)] bg-[#eaf5e3] dark:bg-[#192e1d] font-bold"
                        : "border-b border-[var(--border)]"
                    }
                  >
                    <td className="py-2.5 pr-3 text-[var(--heading)]">{c.name}</td>
                    <td className="py-2.5 px-2">{c.careerContent}</td>
                    <td className="py-2.5 px-2">{c.realSpeaking}</td>
                    <td className="py-2.5 px-2">{c.careerCommunity}</td>
                    <td className="py-2.5 px-2">{c.lowCost}</td>
                    <td className="py-2.5 pl-2">{c.vietnameseUi}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* Roadmap 4 Phases */}
        <Card className="p-6 space-y-4">
          <h2 className="font-heading text-xl font-extrabold text-[var(--heading)]">
            Lộ trình Ra mắt 4 Giai đoạn (Mục VII.3)
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {p.roadmapPhases.map((r) => (
              <div
                key={r.phase}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 space-y-1.5"
              >
                <Badge variant="gold">{r.time}</Badge>
                <h3 className="font-heading text-sm font-extrabold text-[var(--heading)]">
                  {r.phase}
                </h3>
                <p className="text-xs text-[var(--foreground)]">
                  <b>Phạm vi:</b> {r.scope}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  <b>Điều kiện chuyển giai đoạn:</b> {r.exitCriteria}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Judge FAQs */}
        <Card className="p-6 space-y-4">
          <h2 className="font-heading text-xl font-extrabold text-[var(--heading)]">
            Giải đáp Câu hỏi Ban giám khảo (Mục VI.4)
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {p.judgeFaqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 space-y-1.5"
              >
                <p className="font-heading text-sm font-extrabold text-[var(--heading)]">
                  {faq.q}
                </p>
                <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Integrity & AI Transparency */}
        <Card className="p-6 space-y-3 border-2 border-[#1b2d1c]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-extrabold text-[var(--heading)] flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[var(--primary)]" />
              Cam kết Tính trung thực &amp; Kê khai sử dụng AI (Mục XII)
            </h2>
            <div className="flex gap-2">
              <Link href="/chinh-sach/noi-quy-thu-nghiem-kin">
                <Button size="sm" variant="outline">
                  Nội quy thử nghiệm kín
                </Button>
              </Link>
              <Link href="/goi-hoc">
                <Button size="sm">
                  Mô hình Freemium
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-[var(--foreground)]">{p.aiDeclaration}</p>
          <p className="text-[11px] text-[var(--muted-foreground)]">
            <Sparkles className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
            Lưu ý pháp lý (Mục VIII): Nhóm không phải đơn vị tư vấn pháp lý; nội dung pháp lý được
            tổng hợp từ Nghị định 147/2024/NĐ-CP và Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15, đối
            chiếu cùng giáo viên hướng dẫn và bộ phận pháp chế nhà trường trước khi mở rộng.
          </p>
        </Card>
      </div>
    </div>
  );
}

export default function ProposalPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="h-56 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface)]" />
        </div>
      }
    >
      <ProposalDashboardLoader />
    </Suspense>
  );
}
