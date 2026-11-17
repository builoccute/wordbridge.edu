import type { Metadata } from "next";
import { Suspense } from "react";
import { ParentMonitorClient } from "@/components/safety";

export const metadata: Metadata = {
  title: "Cổng Giám Sát Phụ Huynh & Giáo Viên (< 18 Tuổi)",
  description:
    "Phụ huynh và giáo viên phụ trách theo dõi lịch luyện nói, nhóm tuổi ghép cặp và trạng thái đồng ý tham gia thử nghiệm kín của học viên dưới 18 tuổi.",
};

async function ParentMonitorLoader({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  return <ParentMonitorClient initialCode={code || ""} />;
}

export default function ParentMonitorPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="h-48 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface)]" />
        </div>
      }
    >
      <ParentMonitorLoader searchParams={searchParams} />
    </Suspense>
  );
}
