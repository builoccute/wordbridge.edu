import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ScenarioDetailClient, ScenariosExplorer } from "@/components/scenarios";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMatchingScope } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Thư Viện Tình Huống Nghề Nghiệp (Cơ Chế 3 Lớp) | WORD BRIDGE",
  description:
    "Thực hành tiếng Anh theo chuyên ngành và tình huống nghề nghiệp phục vụ học viên GDNN-GDTX, trung cấp nghề, cao đẳng nghề, đại học và người đi làm.",
};

async function ScenariosUnifiedLoader({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const sp = await searchParams;
  const slug = (sp?.slug || "").trim();

  if (slug) {
    const [scenario, viewer] = await Promise.all([
      prisma.careerScenario.findUnique({ where: { slug } }),
      getCurrentUser(),
    ]);
    if (!scenario) notFound();

    const scope = viewer ? getMatchingScope(viewer.ageGroup) : "ADULT_18_PLUS";
    const openSessions = await prisma.practiceSession.findMany({
      where: {
        scenarioId: scenario.id,
        status: "OPEN",
        ageGroupScope: scope,
        ...(viewer && scope === "UNDER_18" ? { school: viewer.school } : {}),
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
      include: {
        host: { select: { name: true, school: true, major: true, selfLevel: true } },
      },
    });

    return (
      <ScenarioDetailClient
        scenario={scenario}
        openSessions={openSessions.map((s) => ({
          id: s.id,
          slotLabel: s.slotLabel,
          scheduledAtIso: s.scheduledAt.toISOString(),
          major: s.major,
          level: s.level,
          school: s.school,
          ageGroupScope: s.ageGroupScope,
          hostName: s.host.name,
        }))}
      />
    );
  }

  const rows = await prisma.careerScenario.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: {
      sessions: {
        where: { status: "OPEN" },
        select: { id: true },
      },
    },
  });

  const scenarios = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    major: r.major,
    level: r.level,
    summary: r.summary,
    durationMinutes: r.durationMinutes,
    isFree: r.isFree,
    authorName: r.authorName,
    reviewedByTeacher: r.reviewedByTeacher,
    openSessionsCount: r.sessions.length,
  }));

  return <ScenariosExplorer scenarios={scenarios} />;
}

export default function ScenariosPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="h-44 animate-pulse rounded-3xl bg-[var(--surface)] border border-[var(--border)]" />
        </div>
      }
    >
      <ScenariosUnifiedLoader searchParams={searchParams} />
    </Suspense>
  );
}
