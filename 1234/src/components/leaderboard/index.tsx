"use client";

import * as React from "react";
import { Award, Crown, Flame, Medal, Sparkles, Trophy, UserCheck, Zap } from "lucide-react";
import { Tilt3D } from "@/components/ui";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LeaderboardTrophy3D } from "@/components/three";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui";

// === podium-3d-cards.tsx ===
export interface PodiumLeaderEntry {
  id: string;
  name: string;
  xp: number;
  streakDays: number;
}

interface Podium3DCardsProps {
  first: PodiumLeaderEntry;
  second: PodiumLeaderEntry;
  third: PodiumLeaderEntry;
  metric?: "xp" | "streak";
  className?: string;
}

interface PodiumSlotTheme {
  rank: 1 | 2 | 3;
  crownColor: string;
  cardClass: string;
  topCapClass: string;
  avatarClass: string;
  baseClass: string;
  laurelHeight: string;
  rankTextClass: string;
}

const SLOT_THEMES: Record<1 | 2 | 3, PodiumSlotTheme> = {
  2: {
    rank: 2,
    crownColor: "h-5 w-5 text-slate-400 fill-slate-300",
    cardClass:
      "rounded-2xl border-2 border-[#7f9175] bg-gradient-to-b from-white to-[#f6f8f3] dark:border-slate-500/50 dark:from-[#1d2720] dark:to-[#161e18] shadow-[4px_4px_0_#95a689,7px_7px_0_rgba(45,62,42,0.14)]",
    topCapClass: "h-1.5 bg-gradient-to-r from-[#cfd8c6] via-white to-[#cfd8c6] opacity-90",
    avatarClass:
      "h-12 w-12 border-2 border-slate-300 bg-gradient-to-br from-rose-500 to-rose-700 text-lg text-white shadow-[0_6px_14px_rgba(225,29,72,0.28)]",
    baseClass:
      "bg-gradient-to-b from-[#c2d0b4] to-[#a7b997] dark:from-[#2e412d] dark:to-[#223121] border-t-2 border-white/50",
    laurelHeight: "py-4 text-2xl",
    rankTextClass: "text-[#2d3e2a] dark:text-[#d1e5c8]",
  },
  1: {
    rank: 1,
    crownColor: "h-6 w-6 text-amber-500 fill-amber-400",
    cardClass:
      "rounded-2xl border-2 border-[#6e9938] bg-gradient-to-b from-[#f9fdf3] via-[#f2f9e7] to-[#e9f4d7] dark:border-[#9ee56f]/60 dark:from-[#1f3421] dark:to-[#152517] shadow-[4px_4px_0_#7ea644,9px_9px_0_rgba(29,50,23,0.18),0_14px_28px_rgba(126,166,68,0.22)]",
    topCapClass: "h-2 bg-gradient-to-r from-[#d2eb9e] via-[#fffdf4] to-[#d2eb9e]",
    avatarClass:
      "h-14 w-14 border-2 border-amber-400 bg-gradient-to-br from-orange-500 to-orange-700 text-xl text-white shadow-[0_8px_18px_rgba(234,88,12,0.34)]",
    baseClass:
      "bg-gradient-to-b from-[#b9d783] to-[#9ab962] dark:from-[#3d5c2b] dark:to-[#2b431e] border-t-2 border-white/65",
    laurelHeight: "py-6 text-3xl",
    rankTextClass: "text-[#1d3217] dark:text-[#eaf8d8]",
  },
  3: {
    rank: 3,
    crownColor: "h-5 w-5 text-amber-700 fill-amber-600",
    cardClass:
      "rounded-2xl border-2 border-[#a89867] bg-gradient-to-b from-white to-[#faf6ea] dark:border-amber-700/50 dark:from-[#262319] dark:to-[#1c1a12] shadow-[4px_4px_0_#b8aa7a,7px_7px_0_rgba(71,61,31,0.14)]",
    topCapClass: "h-1.5 bg-gradient-to-r from-[#e2d7b4] via-[#fffef7] to-[#e2d7b4] opacity-90",
    avatarClass:
      "h-12 w-12 border-2 border-amber-600 bg-gradient-to-br from-amber-100 to-amber-200 text-lg text-amber-900 shadow-[0_6px_14px_rgba(180,83,9,0.2)]",
    baseClass:
      "bg-gradient-to-b from-[#d8cda2] to-[#bfb180] dark:from-[#433c27] dark:to-[#312c1c] border-t-2 border-white/50",
    laurelHeight: "py-3.5 text-2xl",
    rankTextClass: "text-[#473d1f] dark:text-[#ede4c6]",
  },
};

/**
 * Spatial 3D stepped championship podium cards (#2 - #1 - #3) with cursor-driven tilt,
 * Z-elevated floating crowns & medallions, and extruded stepped pedestal blocks.
 */
export function Podium3DCards({
  first,
  second,
  third,
  metric = "xp",
  className,
}: Podium3DCardsProps) {
  const orderedSlots: Array<{ entry: PodiumLeaderEntry; theme: PodiumSlotTheme }> = [
    { entry: second, theme: SLOT_THEMES[2] },
    { entry: first, theme: SLOT_THEMES[1] },
    { entry: third, theme: SLOT_THEMES[3] },
  ];

  return (
    <div className={cn("perspective-1200 grid grid-cols-3 items-end gap-3.5 pt-6", className)}>
      {orderedSlots.map(({ entry, theme }) => {
        const isFirst = theme.rank === 1;
        return (
          <Tilt3D
            key={`${theme.rank}-${entry.id}`}
            maxTilt={isFirst ? 10 : 8}
            scale={isFirst ? 1.035 : 1.02}
            className="rounded-2xl"
          >
            <div className="flex flex-col items-center preserve-3d">
              <Crown
                className={cn(
                  "depth-3d-lg mb-2 drop-shadow-[0_4px_6px_rgba(0,0,0,0.18)]",
                  theme.crownColor
                )}
              />

              <div className={cn("w-full overflow-hidden text-center preserve-3d", theme.cardClass)}>
                {/* Top 3D Bevel Edge */}
                <div aria-hidden="true" className={theme.topCapClass} />

                <div className={cn("preserve-3d", isFirst ? "p-3.5 sm:p-5" : "p-3 sm:p-4")}>
                  <div
                    className={cn(
                      "depth-3d-lg mx-auto flex items-center justify-center rounded-full font-display font-extrabold",
                      theme.avatarClass
                    )}
                  >
                    {entry.name.slice(0, 1).toUpperCase()}
                  </div>

                  <p
                    className={cn(
                      "depth-3d-md mt-2.5 truncate font-heading text-[var(--heading)]",
                      isFirst ? "text-sm sm:text-base font-extrabold" : "text-xs sm:text-sm font-bold"
                    )}
                  >
                    {entry.name}
                  </p>

                  <p
                    className={cn(
                      "depth-3d-sm font-mono-num",
                      isFirst
                        ? "text-xs font-extrabold text-[var(--heading)]"
                        : "text-[11px] font-bold text-[var(--muted-foreground)]"
                    )}
                  >
                    {metric === "streak" ? (
                      <>
                        {entry.streakDays} <span className="text-[10px] font-normal">ngày</span>
                      </>
                    ) : (
                      <>
                        {entry.xp} <span className="text-[10px] font-normal">EXP</span>
                      </>
                    )}
                  </p>

                  <p className="depth-3d-sm mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-bold text-orange-500">
                    <Flame className="h-3 w-3 fill-current" />
                    {metric === "streak" ? `${entry.xp} EXP` : entry.streakDays}
                  </p>
                </div>

                <div
                  className={cn(
                    "font-display font-black preserve-3d",
                    theme.baseClass,
                    theme.laurelHeight,
                    theme.rankTextClass
                  )}
                >
                  <span className="depth-3d-md inline-block">🌿 {theme.rank} 🌿</span>
                </div>
              </div>
            </div>
          </Tilt3D>
        );
      })}
    </div>
  );
}

// === leaderboard-client.tsx ===
export interface LeaderboardUserRow {
  id: string;
  name: string;
  xp: number;
  streakDays: number;
  targetScore: number | null;
}

type RankMetric = "xp" | "streak";
type TimeFrame = "week" | "month" | "all";

const HALL_OF_FAME = [
  {
    month: "Tháng 11 2026",
    winners: [
      { rank: 1, name: "Minh Anh 905", score: "4,820 EXP", tag: "905 TOEIC" },
      { rank: 2, name: "Quốc Bảo", score: "4,410 EXP", tag: "865 TOEIC" },
      { rank: 3, name: "Thảo Vy", score: "3,990 EXP", tag: "830 TOEIC" },
    ],
  },
  {
    month: "Tháng 10 2026",
    winners: [
      { rank: 1, name: "Khánh Linh", score: "5,150 EXP", tag: "920 TOEIC" },
      { rank: 2, name: "Đức Duy", score: "4,680 EXP", tag: "880 TOEIC" },
      { rank: 3, name: "Hải Yến", score: "4,230 EXP", tag: "845 TOEIC" },
    ],
  },
];

export function LeaderboardClient({ users }: { users: LeaderboardUserRow[] }) {
  const { user, openAuthModal } = useApp();
  const [metric, setMetric] = React.useState<RankMetric>("xp");
  const [timeframe, setTimeframe] = React.useState<TimeFrame>("all");

  const rankedUsers = React.useMemo(() => {
    const scale = timeframe === "week" ? 0.35 : timeframe === "month" ? 0.72 : 1;
    return [...users]
      .map((u) => ({
        ...u,
        displayXp: timeframe === "all" ? u.xp : Math.max(10, Math.round(u.xp * scale)),
        displayStreak:
          timeframe === "week" ? Math.min(7, u.streakDays) : u.streakDays,
      }))
      .sort((a, b) => {
        if (metric === "streak") {
          return b.displayStreak - a.displayStreak || b.displayXp - a.displayXp;
        }
        return b.displayXp - a.displayXp || b.displayStreak - a.displayStreak;
      });
  }, [users, metric, timeframe]);

  const currentUserIdx = React.useMemo(() => {
    if (!user) return -1;
    return rankedUsers.findIndex((row) => row.id === user.id);
  }, [rankedUsers, user]);

  return (
    <div className="min-h-screen bg-[#f6f3ea] bg-paper-grid pb-20 pt-8 text-[#1b2d1c] dark:bg-[#0e1511] dark:text-[#eef3e8]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* ===================================================================== */}
        {/* STUDYCHILL 2-COL HERO: CONC. LIGHT CARD + DARK FOREST "CỦA BẠN" CARD */}
        {/* ===================================================================== */}
        <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
          <div className="relative overflow-hidden rounded-[26px] border-2 border-[#1b2d1c] bg-white p-6 sm:p-8 sc-shadow dark:border-[#9ee56f]/30 dark:bg-[#17211b]">
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full border border-[#dce4d7] opacity-60 dark:border-white/10"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -right-4 top-2 h-40 w-40 rounded-full border border-[#dce4d7] opacity-60 dark:border-white/10"
              aria-hidden="true"
            />
            <span
              className="pointer-events-none absolute bottom-1 right-6 select-none font-display text-7xl font-black tracking-widest text-[#edf1e8] dark:text-white/5"
              aria-hidden="true"
            >
              TOP
            </span>

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1b2d1c] bg-[#fef3c7] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#78350f]">
                <Trophy className="h-3.5 w-3.5 text-[#b45309]" />
                Bảng xếp hạng thời gian thực
              </span>
              <h1 className="mt-3 font-display text-3xl font-black tracking-tight text-[#122618] sm:text-4xl dark:text-white">
                Đua top{" "}
                <span className="underline decoration-[#b88c58] decoration-[3px] underline-offset-4">
                  cùng bạn học
                </span>
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#4f6152] dark:text-slate-300">
                Tích lũy điểm EXP từ mỗi bài luyện đề 200 câu, quiz ngữ pháp và duy trì chuỗi ngày
                học liên tục để ghi danh vào Bảng vàng hàng tháng.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/luyen-de">
                  <Button variant="primary" size="md">
                    <Zap className="h-4 w-4" />
                    Làm đề kiếm EXP ngay
                  </Button>
                </Link>
                <Link href="/ngu-phap">
                  <Button variant="outline" size="md">
                    <Sparkles className="h-4 w-4" />
                    Quiz Ngữ pháp (+25 EXP)
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Dark Forest "CỦA BẠN" Rank Summary Card */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-[26px] border-2 border-[#1b2d1c] bg-[#1e4d30] p-6 text-white sc-shadow">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9ee56f]">
                    CỦA BẠN
                  </span>
                  <p className="mt-0.5 font-display text-xl font-black text-white">
                    {user ? user.name : "Học viên"}
                  </p>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/mascot/card-reading.png"
                  alt="Mochi đua top"
                  className="h-14 w-14 shrink-0 object-contain drop-shadow"
                />
              </div>

              {user ? (
                <>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-black text-white">
                      {currentUserIdx >= 0 ? `#${currentUserIdx + 1}` : "TOP 20+"}
                    </span>
                    <span className="text-xs font-semibold text-emerald-100/80">
                      · {user.name}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl border border-white/15 bg-black/20 p-3 text-center">
                      <p className="font-mono-num text-lg font-black text-[#9ee56f]">{user.xp}</p>
                      <p className="text-[10px] text-emerald-100/75">Tổng EXP</p>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-black/20 p-3 text-center">
                      <p className="font-mono-num text-lg font-black text-[#f5b942]">
                        {user.streakDays}
                      </p>
                      <p className="text-[10px] text-emerald-100/75">Chuỗi ngày</p>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-black/20 p-3 text-center">
                      <p className="font-mono-num text-lg font-black text-white">
                        {user.targetScore || 750}
                      </p>
                      <p className="text-[10px] text-emerald-100/75">Mục tiêu</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-3 font-display text-xl font-black leading-snug">
                    Đăng nhập để lưu điểm EXP &amp; leo hạng cùng cộng đồng!
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-emerald-100/80">
                    Mọi kết quả luyện đề và quiz sau khi đăng nhập đều được cộng dồn tự động.
                  </p>
                  <button
                    type="button"
                    onClick={() => openAuthModal("Đăng nhập 10 giây để ghi danh Bảng xếp hạng.")}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#1b2d1c] bg-[#9ee56f] py-2.5 text-xs font-black text-[#122618] shadow-[2px_2px_0px_#0e1b13] hover:brightness-105 cursor-pointer"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    Đăng nhập ghi danh ngay
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* MAIN BODY: LEFT RANKING LIST + RIGHT "BẢNG VÀNG" HALL OF FAME         */}
        {/* ===================================================================== */}
        <div className="mt-7 grid gap-6 lg:grid-cols-[1.65fr_1fr]">
          {/* Left Ranking Panel */}
          <section className="space-y-4">
            {/* Filter Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#1b2d1c] bg-white p-2.5 sc-shadow-sm dark:border-white/15 dark:bg-[#17211b]">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMetric("xp")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition cursor-pointer",
                    metric === "xp"
                      ? "bg-[#19462b] text-white"
                      : "text-[#4f6152] hover:bg-[#f4f1e6] dark:text-slate-300"
                  )}
                >
                  <Zap className="h-3.5 w-3.5" />
                  EXP
                </button>
                <button
                  type="button"
                  onClick={() => setMetric("streak")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition cursor-pointer",
                    metric === "streak"
                      ? "bg-[#19462b] text-white"
                      : "text-[#4f6152] hover:bg-[#f4f1e6] dark:text-slate-300"
                  )}
                >
                  <Flame className="h-3.5 w-3.5" />
                  Chuỗi ngày
                </button>
              </div>

              <div className="flex items-center gap-1">
                {(
                  [
                    { id: "week", label: "Tuần này" },
                    { id: "month", label: "Tháng này" },
                    { id: "all", label: "Mọi thời gian" },
                  ] as const
                ).map((tf) => (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => setTimeframe(tf.id)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer",
                      timeframe === tf.id
                        ? "border border-[#1b2d1c] bg-[#eaf5e3] text-[#19462b]"
                        : "text-[#5f7261] hover:bg-[#f6f3ea] dark:text-slate-300"
                    )}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {!user && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#1b2d1c] bg-[#eaf5e3] px-5 py-3.5">
                <p className="text-xs font-bold text-[#19462b]">
                  Bạn đang xem ở chế độ khách — đăng nhập để tên bạn xuất hiện trên bảng vàng!
                </p>
                <button
                  type="button"
                  onClick={() => openAuthModal()}
                  className="rounded-lg bg-[#19462b] px-3 py-1.5 text-xs font-extrabold text-[#9ee56f] cursor-pointer"
                >
                  Đăng nhập
                </button>
              </div>
            )}

            {/* Interactive 3D Podium Showcase when >= 3 ranked learners exist */}
            {rankedUsers.length >= 3 && (
              <div className="rounded-3xl border-2 border-[#1b2d1c] bg-white p-5 sc-shadow-sm dark:border-white/15 dark:bg-[#17211b]">
                <Podium3DCards
                  first={{
                    id: rankedUsers[0].id,
                    name: rankedUsers[0].name,
                    xp: rankedUsers[0].displayXp,
                    streakDays: rankedUsers[0].displayStreak,
                  }}
                  second={{
                    id: rankedUsers[1].id,
                    name: rankedUsers[1].name,
                    xp: rankedUsers[1].displayXp,
                    streakDays: rankedUsers[1].displayStreak,
                  }}
                  third={{
                    id: rankedUsers[2].id,
                    name: rankedUsers[2].name,
                    xp: rankedUsers[2].displayXp,
                    streakDays: rankedUsers[2].displayStreak,
                  }}
                  metric={metric}
                />
              </div>
            )}

            {/* Real Users Ranked List */}
            <div className="overflow-hidden rounded-3xl border-2 border-[#1b2d1c] bg-white sc-shadow-sm dark:border-white/15 dark:bg-[#17211b]">
              {rankedUsers.length === 0 ? (
                <div className="p-10 text-center text-sm text-[#556758]">
                  Chưa có học viên nào ghi điểm EXP. Hãy làm bài thi đầu tiên để mở bảng vàng!
                </div>
              ) : (
                <div className="divide-y divide-[#ece7da] dark:divide-white/10">
                  {rankedUsers.map((row, idx) => {
                    const rank = idx + 1;
                    const isSelf = user?.id === row.id;
                    const rankBadgeClass =
                      rank === 1
                        ? "border-[#b45309] bg-[#fef3c7] text-[#92400e]"
                        : rank === 2
                        ? "border-[#475569] bg-[#f1f5f9] text-[#334155]"
                        : rank === 3
                        ? "border-[#9a3412] bg-[#ffedd5] text-[#9a3412]"
                        : "border-[#cfd6c9] bg-[#fcfaf4] text-[#4f6152]";

                    return (
                      <div
                        key={row.id}
                        className={cn(
                          "flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 transition",
                          isSelf
                            ? "bg-[#eaf5e3]/75 dark:bg-[#19462b]/40"
                            : "hover:bg-[#fcfaf4] dark:hover:bg-white/5"
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3.5">
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 font-mono-num text-sm font-black",
                              rankBadgeClass
                            )}
                          >
                            {rank}
                          </span>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate font-display text-sm font-extrabold text-[#122618] dark:text-white">
                                {row.name}
                              </span>
                              {isSelf && (
                                <span className="rounded-full bg-[#19462b] px-2 py-0.5 text-[10px] font-bold text-[#9ee56f]">
                                  Bạn
                                </span>
                              )}
                              {row.targetScore && (
                                <span className="rounded-full border border-[#dce4d7] bg-[#f8f6ef] px-2 py-0.5 font-mono-num text-[10px] font-bold text-[#4f6152] dark:border-white/15 dark:bg-white/5 dark:text-slate-300">
                                  Goal {row.targetScore}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 flex items-center gap-2 text-xs text-[#556758] dark:text-slate-400">
                              <span className="inline-flex items-center gap-1">
                                <Flame className="h-3 w-3 text-amber-500" />
                                {row.displayStreak} ngày liên tiếp
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="block font-mono-num text-base font-black text-[#19462b] dark:text-[#9ee56f]">
                            {metric === "streak"
                              ? `${row.displayStreak} ngày`
                              : `${row.displayXp.toLocaleString("vi-VN")} EXP`}
                          </span>
                          <span className="block font-mono-num text-[11px] text-[#647566] dark:text-slate-400">
                            {metric === "streak"
                              ? `${row.displayXp.toLocaleString("vi-VN")} EXP`
                              : `${row.displayStreak} ngày streak`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Right "Cúp Vô Địch 3D" & "Bảng vàng" Monthly Hall of Fame */}
          <aside className="space-y-4">
            <LeaderboardTrophy3D
              topName={rankedUsers[0]?.name || "Minh Anh TOEIC"}
              topXp={rankedUsers[0]?.displayXp ?? 1240}
              height={208}
            />

            <div className="rounded-3xl border-2 border-[#1b2d1c] bg-white p-5 sc-shadow-sm dark:border-white/15 dark:bg-[#17211b]">
              <div className="flex items-center justify-between border-b border-[#ece7da] pb-3 dark:border-white/10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#b45309]">
                    HALL OF FAME
                  </p>
                  <h2 className="font-display text-xl font-black text-[#122618] dark:text-white">
                    Bảng vàng tháng
                  </h2>
                </div>
                <Award className="h-6 w-6 text-[#d97706]" />
              </div>

              <div className="mt-4 space-y-4">
                {HALL_OF_FAME.map((period) => (
                  <div
                    key={period.month}
                    className="rounded-2xl border border-[#dcd7ca] bg-[#fcfaf4] p-4 dark:border-white/10 dark:bg-[#1f2c24]"
                  >
                    <p className="font-display text-xs font-black uppercase tracking-wider text-[#19462b] dark:text-[#9ee56f]">
                      {period.month}
                    </p>
                    <div className="mt-2.5 space-y-2">
                      {period.winners.map((w) => (
                        <div
                          key={w.name}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Medal
                              className={cn(
                                "h-4 w-4 shrink-0",
                                w.rank === 1
                                  ? "text-amber-500"
                                  : w.rank === 2
                                  ? "text-slate-400"
                                  : "text-orange-600"
                              )}
                            />
                            <span className="truncate font-bold text-[#122618] dark:text-white">
                              {w.name}
                            </span>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="font-mono-num font-extrabold text-[#19462b] dark:text-[#9ee56f]">
                              {w.score}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
