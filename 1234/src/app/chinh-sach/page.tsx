import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui";
import { Card } from "@/components/ui";
import { siteConfig } from "@/lib/site-config";

export function generateStaticParams() {
  return siteConfig.policies.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const slug = sp?.slug || "dieu-khoan-su-dung";
  const policy = siteConfig.policies.find((p) => p.slug === slug);
  if (!policy) return { title: "Chính sách" };
  return {
    title: policy.title,
    description: `${policy.title} của nền tảng tự học ${siteConfig.brand.name} & Đề án ${siteConfig.startupProject.unit}.`,
  };
}

function PolicySpecificBody({ slug, title }: { slug: string; title: string }) {
  if (slug === "noi-quy-thu-nghiem-kin") {
    return (
      <div className="space-y-4 text-sm leading-relaxed text-[var(--foreground)]">
        <p>
          Nội quy này áp dụng cho toàn bộ học sinh, sinh viên tham gia{" "}
          <strong>Giai đoạn 0a/0b (Thử nghiệm kín)</strong> tại{" "}
          <strong>{siteConfig.startupProject.unit}</strong> (Phụ lục B Đề án khởi nghiệp LV04).
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Chỉ học sinh, sinh viên của Trường Cao đẳng nghề Việt Nam – Singapore (đăng nhập bằng
            email trường <code>@vsvc.edu.vn</code> hoặc mã mời giáo viên phụ trách và được duyệt)
            được tham gia ghép cặp luyện nói.
          </li>
          <li>
            Người dưới 18 tuổi chỉ tham gia khi có <strong>Phiếu đồng ý của phụ huynh</strong>{" "}
            hoặc người giám hộ; chỉ ghép cặp với bạn cùng trường, cùng nhóm tuổi; không có tính
            năng nhắn tin riêng 1-1.
          </li>
          <li>
            Nền tảng chỉ thu thập tối thiểu: họ tên, email do trường cấp/liên hệ, ngày sinh, ngành,
            trình độ tự đánh giá, khung giờ rảnh; <strong>không thu giấy tờ tùy thân (CCCD)</strong>.
          </li>
          <li>
            Buổi luyện không được ghi âm, ghi hình lưu trên hệ thống; thành viên không ghi âm người
            khác khi chưa được đồng ý.
          </li>
          <li>
            Không chia sẻ thông tin liên hệ cá nhân của người khác; không quấy rối, phân biệt đối
            xử, đăng nội dung vi phạm pháp luật.
          </li>
          <li>
            Thành viên (hoặc phụ huynh với người dưới 18 tuổi) có quyền xem, sửa, tải dữ liệu hoặc
            xóa tài khoản &amp; rút khỏi thử nghiệm bất cứ lúc nào tại{" "}
            <Link href="/my-library" className="font-bold text-[var(--primary)] underline">
              Kho cá nhân
            </Link>
            .
          </li>
          <li>
            Mỗi phiên luyện và bài viết đều có nút <strong>Báo cáo vi phạm</strong> và{" "}
            <strong>Chặn</strong>; thành viên vi phạm có thể bị loại khỏi nhóm thử nghiệm.
          </li>
        </ul>
      </div>
    );
  }

  if (slug === "bao-ve-nguoi-duoi-18-tuoi") {
    return (
      <div className="space-y-4 text-sm leading-relaxed text-[var(--foreground)]">
        <p>
          Thực hiện theo <strong>Nghị định 147/2024/NĐ-CP</strong> và nguyên tắc an toàn học đường
          của Trường Cao đẳng nghề Việt Nam – Singapore:
        </p>
        <h2 className="font-heading text-base font-bold text-[var(--heading)]">
          1. Trẻ em dưới 16 tuổi
        </h2>
        <p>
          Người dưới 16 tuổi khi khai ngày sinh bắt buộc đăng ký kèm thông tin cha, mẹ hoặc người
          giám hộ chịu trách nhiệm giám sát và xác nhận Phiếu đồng ý.
        </p>
        <h2 className="font-heading text-base font-bold text-[var(--heading)]">
          2. Người từ 16 đến dưới 18 tuổi
        </h2>
        <p>
          Bắt buộc hoàn tất Phiếu đồng ý của phụ huynh/người giám hộ được duyệt trước khi mở hoặc
          nhận lịch ghép cặp luyện nói.
        </p>
        <h2 className="font-heading text-base font-bold text-[var(--heading)]">
          3. Cô lập nhóm tuổi &amp; Cổng giám sát Phụ huynh
        </h2>
        <p>
          Hệ thống kiểm tra nhóm tuổi trực tiếp ở máy chủ: học viên dưới 18 tuổi{" "}
          <strong>chỉ ghép cặp với bạn cùng trường và cùng nhóm tuổi (&lt; 18)</strong>, không có
          nhắn tin riêng 1-1, và phụ huynh/giáo viên có thể theo dõi lịch luyện trực tiếp tại{" "}
          <Link href="/phu-huynh" className="font-bold text-[var(--primary)] underline">
            Cổng Giám sát Phụ huynh (/phu-huynh)
          </Link>
          .
        </p>
      </div>
    );
  }

  if (slug === "bao-ve-du-lieu-ca-nhan") {
    return (
      <div className="space-y-4 text-sm leading-relaxed text-[var(--foreground)]">
        <p>
          Chính sách này tham chiếu các nguyên tắc của{" "}
          <strong>Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15</strong> (hiệu lực 01/01/2026) và{" "}
          <strong>Nghị định 147/2024/NĐ-CP</strong>:
        </p>
        <h2 className="font-heading text-base font-bold text-[var(--heading)]">
          1. Thu thập tối thiểu &amp; Không thu giấy tờ tùy thân
        </h2>
        <p>
          Nền tảng chỉ lưu họ tên, email, ngày sinh (để phân nhóm bảo vệ), ngành học, trình độ tự
          đánh giá, khung giờ rảnh và lịch sử học tập. Nền tảng{" "}
          <strong>không yêu cầu ảnh, video giấy tờ tùy thân (CCCD/CMND)</strong> để xác thực tài
          khoản và <strong>không lưu bản ghi âm/ghi hình</strong> các buổi luyện nói.
        </p>
        <h2 className="font-heading text-base font-bold text-[var(--heading)]">
          2. Quyền xem, sửa, xóa dữ liệu &amp; Người phụ trách dữ liệu
        </h2>
        <p>
          Thành viên (hoặc phụ huynh với người dưới 18 tuổi) có quyền xem, tải bản sao dữ liệu
          JSON, chỉnh sửa hồ sơ hoặc xóa toàn bộ dữ liệu tài khoản bất cứ lúc nào tại mục{" "}
          <Link href="/my-library" className="font-bold text-[var(--primary)] underline">
            Kho cá nhân &rarr; Quyền dữ liệu cá nhân
          </Link>
          . Thành viên phụ trách bảo vệ dữ liệu của nhóm: <strong>Bùi Tấn Lộc</strong> (
          <code>builoc.contact@gmail.com</code> · <code>0988504210</code>).
        </p>
        <h2 className="font-heading text-base font-bold text-[var(--heading)]">
          3. Quy trình ứng phó sự cố (72 giờ)
        </h2>
        <p>
          Mọi sự cố dữ liệu cá nhân có nguy cơ gây tổn hại được xử lý, thông báo tới giáo viên hướng
          dẫn, bộ phận phụ trách của nhà trường và cơ quan chuyên trách trong vòng{" "}
          <strong>72 giờ</strong> theo quy định pháp luật.
        </p>
      </div>
    );
  }

  if (slug === "thong-tin-chu-so-huu") {
    return (
      <div className="space-y-4 text-sm leading-relaxed text-[var(--foreground)]">
        <p>
          Sản phẩm kết hợp giữa hệ sinh thái tự học <strong>{siteConfig.brand.name}</strong> (do{" "}
          <strong>{siteConfig.brand.ownerName}</strong> khởi xướng) và{" "}
          <strong>Đề án Dự án Khởi nghiệp {siteConfig.startupProject.fieldCode}</strong> tham dự{" "}
          <em>{siteConfig.startupProject.competition}</em> tại{" "}
          <strong>{siteConfig.startupProject.unit}</strong>.
        </p>
        <h2 className="font-heading text-base font-bold text-[var(--heading)]">
          Nhóm thực hiện Đề án Khởi nghiệp VSVC
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          {siteConfig.startupProject.team.map((m) => (
            <li key={m.email}>
              <strong>{m.name}</strong> ({m.roleBadge} · Lớp {m.className}) — {m.email} · {m.phone}
            </li>
          ))}
        </ul>
        <p>
          Giáo viên hướng dẫn: <strong>{siteConfig.startupProject.advisor}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm leading-relaxed text-[var(--foreground)]">
      <p>
        Tài liệu này quy định các nguyên tắc vận hành đối với mục <strong>{title}</strong> trên nền
        tảng học tập trực tuyến <strong>{siteConfig.brand.name}</strong> và phân hệ Thực hành ngoại
        ngữ nghề nghiệp <strong>{siteConfig.startupProject.unit}</strong>.
      </p>
      <h2 className="font-heading text-base font-bold text-[var(--heading)]">
        1. Phạm vi áp dụng &amp; Giai đoạn 0 miễn phí
      </h2>
      <p>
        Trong Giai đoạn 0 (thử nghiệm kín), toàn bộ tính năng tình huống 3 lớp, ghép cặp cùng ngành,
        kho tài liệu, ngữ pháp và luyện đề đều miễn phí. Giai đoạn 1 mới triển khai gói trả phí cá
        nhân sau khi hoàn tất đăng ký kinh doanh, cổng thanh toán hợp pháp và cơ chế phụ huynh đồng
        ý/thanh toán đối với người dưới 18 tuổi.
      </p>
      <h2 className="font-heading text-base font-bold text-[var(--heading)]">
        2. Bảo mật thông tin &amp; Giao dịch minh bạch
      </h2>
      <p>
        Hệ thống chỉ lưu thông tin tối thiểu phục vụ học tập. Mọi khoản đóng góp tự nguyện hoặc giao
        dịch qua VietQR / SePay đều có mã đối soát riêng và chính sách hoàn tiền rõ ràng.
      </p>
      <h2 className="font-heading text-base font-bold text-[var(--heading)]">
        3. Liên hệ hỗ trợ &amp; Khiếu nại
      </h2>
      <p>
        Mọi thắc mắc hoặc yêu cầu chỉnh sửa/xóa dữ liệu cá nhân xin gửi về email{" "}
        <strong>{siteConfig.brand.email}</strong> hoặc <strong>builoc.contact@gmail.com</strong>{" "}
        (SĐT: <strong>0988504210</strong>).
      </p>
    </div>
  );
}

async function PolicyContent({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const sp = await searchParams;
  const slug = sp?.slug || "dieu-khoan-su-dung";
  const policy = siteConfig.policies.find((p) => p.slug === slug);
  if (!policy) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Về trang chủ
      </Link>

      <Card className="mt-5 p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2">
          <Badge variant="green">
            <ShieldCheck className="h-3.5 w-3.5" />
            Chính sách &amp; Pháp lý
          </Badge>
          <span className="text-xs text-[var(--muted-foreground)]">
            Cập nhật {siteConfig.brand.year} · Tham chiếu NĐ 147/2024 &amp; Luật 91/2025
          </span>
        </div>

        <h1 className="font-heading text-2xl font-extrabold text-[var(--heading)] sm:text-3xl">
          {policy.title}
        </h1>

        <PolicySpecificBody slug={policy.slug} title={policy.title} />

        <div className="border-t border-[var(--border)] pt-4 flex flex-wrap gap-2">
          {siteConfig.policies.map((p) => (
            <Link
              key={p.slug}
              href={`/chinh-sach/${p.slug}`}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
                p.slug === policy.slug
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--surface-alt)] text-[var(--muted-foreground)] hover:text-[var(--heading)]"
              }`}
            >
              {p.title}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function PolicyPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="h-64 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface)]" />
        </div>
      }
    >
      <PolicyContent searchParams={searchParams} />
    </Suspense>
  );
}
