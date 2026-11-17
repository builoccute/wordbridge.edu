import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExamRunner, LuyenDeDashboard } from "@/components/exams";
import { loadExamDashboard, prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Luyện Đề TOEIC Online Chuẩn ETS | WORD BRIDGE",
  description:
    "Phòng luyện đề TOEIC ETS với chia bảng Nghe 100 câu & Đọc 100 câu, bộ đề Practice Vol & 2026 Hot.",
};

async function ExamsUnifiedLoader({
  searchParams,
}: {
  searchParams: Promise<{ setSlug?: string; testSlug?: string }>;
}) {
  const sp = await searchParams;
  const testSlug = (sp?.testSlug || "").trim();
  const setSlug = (sp?.setSlug || "").trim();

  if (testSlug) {
    const test = await prisma.examTest.findUnique({
      where: { slug: testSlug },
      include: {
        examSet: { select: { title: true, slug: true } },
        questions: {
          orderBy: { number: "asc" },
          select: {
            id: true,
            number: true,
            part: true,
            groupKey: true,
            promptText: true,
            passageTitle: true,
            passageHtml: true,
            audioScript: true,
            imageScene: true,
            optionsJson: true,
          },
        },
      },
    });
    if (!test) notFound();

    return (
      <ExamRunner
        test={{
          id: test.id,
          slug: test.slug,
          title: test.title,
          description: test.description,
          durationMinutes: test.durationMinutes,
          totalQuestions: test.totalQuestions,
          listeningCount: test.listeningCount,
          readingCount: test.readingCount,
          difficulty: test.difficulty,
          setTitle: test.examSet.title,
          setSlug: test.examSet.slug,
          questions: test.questions.map((q) => ({
            id: q.id,
            number: q.number,
            part: q.part,
            groupKey: q.groupKey,
            promptText: q.promptText,
            passageTitle: q.passageTitle,
            passageHtml: q.passageHtml,
            audioScript: q.audioScript,
            imageScene: q.imageScene,
            options: safeJsonParse<string[]>(q.optionsJson, []),
          })),
        }}
      />
    );
  }

  const data = await loadExamDashboard(setSlug || undefined);
  if (!data) notFound();
  return <LuyenDeDashboard sets={data.sets} activeSetSlug={setSlug || null} />;
}

export default function ExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ setSlug?: string; testSlug?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="h-[520px] animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface)]" />
        </div>
      }
    >
      <ExamsUnifiedLoader searchParams={searchParams} />
    </Suspense>
  );
}
