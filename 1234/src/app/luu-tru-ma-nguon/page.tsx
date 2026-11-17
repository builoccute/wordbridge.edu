import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminAccessGate } from "@/components/admin";
import { SourceStorageStudio } from "@/components/storage/source-storage-studio";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Lưu trữ mã nguồn | WORD BRIDGE SOURCE STORAGE",
  description:
    "Phân hệ lưu trữ mã nguồn và dữ liệu độc lập (SQLite BLOB bền vững) tích hợp bảo mật PIN 6 chữ số, tự động lưu, quản lý phiên bản, thùng rác và khôi phục.",
  robots: { index: false, follow: false },
};

async function StorageGateLoader() {
  const user = await getCurrentUser();
  // Lớp bảo vệ 1 & 2 phía máy chủ: Chưa đăng nhập hoặc không có quyền ADMIN không được phép vào kho
  if (!user || user.role !== "ADMIN") {
    return <AdminAccessGate currentUser={user} />;
  }

  return <SourceStorageStudio adminUser={user} standalonePage={true} />;
}

export default function SourceStoragePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f6f3ea] p-6 sm:p-10 dark:bg-[#0c130e]">
          <div className="mx-auto max-w-7xl space-y-4">
            <div className="h-16 w-80 animate-pulse rounded-2xl bg-[var(--surface)]" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className="h-28 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
                />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <StorageGateLoader />
    </Suspense>
  );
}
