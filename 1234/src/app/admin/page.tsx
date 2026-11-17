import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminAccessGate } from "@/components/admin";
import { AdminShell } from "@/components/admin";
import { getAdminOverviewData } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin Studio | Quản trị hệ thống",
  description: "Bảng điều khiển quản trị học viên, tài liệu, đề thi TOEIC, ngữ pháp và cộng đồng LingoChill.",
  robots: { index: false, follow: false },
};

async function AdminGateLoader() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return <AdminAccessGate currentUser={user} />;
  }

  const initialOverview = await getAdminOverviewData();
  return <AdminShell adminUser={user} initialOverview={initialOverview} />;
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f6f3ea] p-6 sm:p-10 dark:bg-[#0c130e]">
          <div className="mx-auto max-w-6xl space-y-4">
            <div className="h-14 w-64 animate-pulse rounded-2xl bg-[var(--surface)]" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((idx) => (
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
      <AdminGateLoader />
    </Suspense>
  );
}
