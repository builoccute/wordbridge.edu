import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { Card } from "@/components/ui";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Mô Hình Freemium & Gói Học Dự Kiến",
  description:
    "Giai đoạn 0 thử nghiệm kín miễn phí 100%. Gói trả phí cá nhân dự kiến ở Giai đoạn 1 được kiểm chứng bằng giả thuyết H5.",
};

export default function PricingFreemiumPage() {
  const { freemiumPlans } = siteConfig.startupProject;

  return (
    <div className="min-h-screen bg-[#f6f3ea] bg-paper-grid pb-20 pt-8 text-[#1b2d1c] dark:bg-[#0e1511] dark:text-[#eef3e8]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-8">
        <section className="rounded-[28px] border-2 border-[#1b2d1c] bg-[#163426] p-6 sm:p-9 text-white sc-shadow space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9ee56f] px-3 py-1 text-xs font-black text-[#0d1c12]">
            <Sparkles className="h-3.5 w-3.5" />
            Giai đoạn 0 · Miễn phí 100% (Chưa mở thu phí)
          </span>
          <h1 className="font-display text-3xl font-black sm:text-4xl">
            Mô hình Freemium cho HSSV &amp; Người đi làm
          </h1>
          <p className="text-sm leading-relaxed text-emerald-100/85 max-w-3xl">
            Toàn bộ học sinh, sinh viên tham gia thử nghiệm kín Giai đoạn 0a/0b sử dụng{" "}
            <b className="text-[#9ee56f]">miễn phí hoàn toàn</b>. Gói trả phí dự kiến chỉ triển khai
            từ Giai đoạn 1 sau khi kiểm chứng giả thuyết H5 (mức sẵn sàng trả phí ≥ 20%), hoàn tất
            đăng ký kinh doanh và tích hợp cổng thanh toán hợp pháp.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 sm:p-7 flex flex-col justify-between space-y-6 border-2 border-[#1b2d1c]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="green">Đang mở · Giai đoạn 0</Badge>
                <span className="font-mono-num text-2xl font-black text-[var(--heading)]">
                  0 ₫
                </span>
              </div>
              <div>
                <h2 className="font-heading text-2xl font-extrabold text-[var(--heading)]">
                  Gói Miễn Phí (Free)
                </h2>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Đủ dùng cho nhu cầu làm quen tình huống nghề và luyện tập định kỳ hàng tuần.
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-[var(--foreground)]">
                {freemiumPlans.freeFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link href="/tinh-huong">
              <Button className="w-full">
                Bắt đầu học miễn phí ngay
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Card>

          <Card className="p-6 sm:p-7 flex flex-col justify-between space-y-6 bg-[#fcfaf4] dark:bg-[var(--surface)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="gold">Dự kiến · Giai đoạn 1 (2027)</Badge>
                <span className="font-mono-num text-sm font-black text-[var(--primary)]">
                  Giá chốt theo H5
                </span>
              </div>
              <div>
                <h2 className="font-heading text-2xl font-extrabold text-[var(--heading)]">
                  Gói Chuyên Sâu (Theo tháng / khóa)
                </h2>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Dành cho cá nhân cần thư viện đầy đủ mọi ngành, ghép cặp không giới hạn và nhận
                  xét trực tiếp từ mentor.
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-[var(--foreground)]">
                {freemiumPlans.proFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link href="/khao-sat">
              <Button variant="outline" className="w-full">
                Góp ý mức giá mong muốn ở Khảo sát H5
              </Button>
            </Link>
          </Card>
        </div>

        {/* Legal & Under-18 Payment Policy */}
        <Card className="p-6 space-y-3">
          <h2 className="font-heading text-lg font-extrabold text-[var(--heading)] flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[var(--primary)]" />
            Nguyên tắc Pháp lý khi mở Thu phí (Mục VIII &amp; IX)
          </h2>
          <div className="grid gap-3 sm:grid-cols-3 text-xs text-[var(--muted-foreground)]">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3.5">
              <p className="font-bold text-[var(--heading)]">1. Phụ huynh đồng ý với người &lt;18</p>
              <p className="mt-1">
                Với học viên dưới 18 tuổi, phụ huynh hoặc người giám hộ là người đồng ý và trực tiếp
                thanh toán.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3.5">
              <p className="font-bold text-[var(--heading)]">2. Đăng ký kinh doanh &amp; Cổng hợp pháp</p>
              <p className="mt-1">
                Chỉ mở thu phí sau khi đăng ký hình thức kinh doanh phù hợp và dùng cổng thanh toán
                được cấp phép.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3.5">
              <p className="font-bold text-[var(--heading)]">3. Minh bạch hoàn tiền</p>
              <p className="mt-1">
                Áp dụng chính sách đổi trả, hoàn tiền rõ ràng theo quy định bảo vệ quyền lợi người
                tiêu dùng.
              </p>
            </div>
          </div>
          <div className="pt-2 flex flex-wrap gap-3 text-xs">
            <Link
              href="/chinh-sach/thanh-toan"
              className="inline-flex items-center gap-1 font-bold text-[var(--primary)] hover:underline"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Xem Chính sách Thanh toán &amp; Hoàn tiền
            </Link>
            <Link
              href="/ung-ho"
              className="inline-flex items-center gap-1 font-bold text-[var(--heading)] hover:underline"
            >
              Hoặc ủng hộ tự nguyện duy trì server (VietQR) &rarr;
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
