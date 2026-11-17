import { Suspense } from "react";
import { LeaderboardClient } from "@/components/leaderboard";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Bảng xếp hạng & Bảng vàng EXP",
};

async function LeaderboardDataLoader() {
  const users = await prisma.user.findMany({
    orderBy: [{ xp: "desc" }, { streakDays: "desc" }],
    take: 20,
    select: {
      id: true,
      name: true,
      xp: true,
      streakDays: true,
      targetScore: true,
    },
  });

  return <LeaderboardClient users={users} />;
}

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f6f3ea] bg-paper-grid px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
              <div className="rounded-[26px] border-2 border-[#1b2d1c] bg-white p-6 sm:p-8 sc-shadow">
                <span className="inline-flex rounded-full border border-[#1b2d1c] bg-[#fef3c7] px-3 py-1 text-[11px] font-extrabold text-[#78350f]">
                  Bảng xếp hạng thời gian thực
                </span>
                <h1 className="mt-3 font-display text-3xl font-black text-[#122618]">
                  Đua top cùng bạn học
                </h1>
                <p className="mt-2 text-xs text-[#4f6152]">
                  Đang tải bảng điểm EXP và chuỗi học tập mới nhất...
                </p>
              </div>
              <div className="h-48 animate-pulse rounded-[26px] border-2 border-[#1b2d1c] bg-[#275137] sc-shadow" />
            </div>
            <div className="h-64 animate-pulse rounded-3xl border-2 border-[#1b2d1c] bg-white" />
          </div>
        </div>
      }
    >
      <LeaderboardDataLoader />
    </Suspense>
  );
}
