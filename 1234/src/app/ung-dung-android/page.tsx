import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Ứng Dụng Android (APK) & PWA Đa Nền Tảng",
  description:
    "Kế hoạch đóng gói nền tảng web thành ứng dụng Android (Capacitor/TWA), phát hành ưu tiên Google Play và quy trình ký số APK an toàn.",
};

export default function AndroidAppPage() {
  return (
    <div className="min-h-screen bg-[#f6f3ea] bg-paper-grid pb-20 pt-8 text-[#1b2d1c] dark:bg-[#0e1511] dark:text-[#eef3e8]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-8">
        <section className="rounded-[28px] border-2 border-[#1b2d1c] bg-[#13291b] p-6 sm:p-9 text-white sc-shadow space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9ee56f] px-3 py-1 text-xs font-black text-[#0d1c12]">
            <Smartphone className="h-3.5 w-3.5" />
            Web trước · Ứng dụng Android (APK) ở Giai đoạn 1
          </span>
          <h1 className="font-display text-3xl font-black sm:text-4xl">
            Ứng dụng Android &amp; Trải nghiệm Di động
          </h1>
          <p className="text-sm leading-relaxed text-emerald-100/85 max-w-3xl">
            Nền tảng được xây dựng dưới dạng Web Responsive hoạt động mượt ngay trên trình duyệt điện
            thoại và máy tính. Ở Giai đoạn 1 (năm 2027), cùng một mã nguồn web sẽ được đóng gói
            thành ứng dụng Android bằng <b>Capacitor</b> hoặc <b>Trusted Web Activity (TWA)</b> để
            giảm chi phí phát triển.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 space-y-4">
            <Badge variant="green">Ưu tiên 1 · Giai đoạn 1 (2027)</Badge>
            <h2 className="font-heading text-xl font-extrabold text-[var(--heading)]">
              Phát hành chính thức trên Google Play
            </h2>
            <ul className="space-y-2.5 text-xs text-[var(--foreground)]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                <span>
                  Có kiểm duyệt bảo mật Google Play Protect và cập nhật tự động cho học sinh, sinh
                  viên.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                <span>
                  Tuân thủ nghiêm chính sách cửa hàng ứng dụng dành cho đối tượng có người dùng dưới
                  18 tuổi và thanh toán minh bạch.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                <span>
                  Nhu cầu thực tế của việc cài đặt ứng dụng trên Android đang được đo lường qua{" "}
                  <b>Giả thuyết H6</b>.
                </span>
              </li>
            </ul>
            <Link href="/khao-sat">
              <Button variant="outline" size="sm">
                Đóng góp khảo sát H6 (Android / iPhone)
              </Button>
            </Link>
          </Card>

          <Card className="p-6 space-y-4">
            <Badge variant="gold">Phương án bổ sung · Ký số nghiêm ngặt</Badge>
            <h2 className="font-heading text-xl font-extrabold text-[var(--heading)]">
              Tệp APK chính thức &amp; Phòng chống giả mạo
            </h2>
            <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
              Việc bật cài đặt từ nguồn không xác định tiềm ẩn rủi ro bảo mật. Vì vậy ở Giai đoạn 0,
              hệ thống <b>chưa phát hành tệp APK</b>. Khi phát hành bổ sung ở Giai đoạn 1, nhóm chỉ
              công bố tại <b>một địa chỉ duy nhất</b> kèm chữ ký số và mã kiểm tra SHA-256:
            </p>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3 font-mono-num text-[11px] space-y-1">
              <p className="font-bold text-[var(--heading)] flex items-center gap-1.5">
                <LockKeyhole className="h-3.5 w-3.5 text-[var(--primary)]" />
                Trạng thái phát hành APK hiện tại: Chưa mở (Giai đoạn 0b)
              </p>
              <p className="text-[var(--muted-foreground)]">
                Định dạng đóng gói dự kiến: Android App Bundle (.aab) cho Google Play &amp; Signed
                Release (.apk) có mã băm SHA-256 công khai.
              </p>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <span>
                Khuyến cáo an toàn: Không tải tệp APK từ nhóm chat lạ hoặc liên kết không phải tên
                miền chính thức của dự án.
              </span>
            </div>
          </Card>
        </div>

        {/* Use Right Now via PWA */}
        <Card className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 max-w-2xl">
            <h2 className="font-heading text-lg font-extrabold text-[var(--heading)] flex items-center gap-2">
              <Download className="h-5 w-5 text-[var(--primary)]" />
              Dùng ngay trên điện thoại Android như App (Web App / PWA)
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Trong thời gian thử nghiệm kín Giai đoạn 0, bạn mở trang web bằng Chrome trên Android
              &rarr; bấm menu <b>⋮</b> &rarr; chọn <b>“Thêm vào màn hình chính” (Install app)</b> để
              truy cập nhanh toàn màn hình qua <code>manifest.webmanifest</code> có sẵn.
            </p>
          </div>
          <Link href="/tinh-huong" className="shrink-0">
            <Button>
              <ShieldCheck className="h-4 w-4" />
              Mở Tình huống trên Web ngay
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
