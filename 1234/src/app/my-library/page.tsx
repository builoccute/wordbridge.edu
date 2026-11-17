import type { Metadata } from "next";
import { Suspense } from "react";
import { MyLibraryClient } from "@/components/library/my-library-client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Kho Cá Nhân & Tiến Độ Học Tập",
  description: "Theo dõi tài liệu đã lưu, chuyên đề ngữ pháp hoàn thành, điểm luyện đề TOEIC và chuỗi streak.",
};

async function MyLibraryLoader() {
  const [user, allDocs] = await Promise.all([
    getCurrentUser(),
    prisma.document.findMany({
      include: { category: { select: { name: true } } },
      take: 40,
    }),
  ]);

  const allDocsCatalog = allDocs.map((d) => ({
    id: d.id,
    slug: d.slug,
    title: d.title,
    level: d.level,
    categoryName: d.category.name,
  }));

  if (!user) {
    return (
      <MyLibraryClient
        initialUser={null}
        savedDocs={[]}
        allDocsCatalog={allDocsCatalog}
        grammarProgress={[]}
        examAttempts={[]}
      />
    );
  }

  const [savedRecords, grammarRecords, attemptRecords] = await Promise.all([
    prisma.userSavedDocument.findMany({
      where: { userId: user.id },
      include: { document: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userGrammarProgress.findMany({
      where: { userId: user.id },
      include: { lesson: { include: { topic: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.examAttempt.findMany({
      where: { userId: user.id },
      include: { examTest: { select: { slug: true, title: true } } },
      orderBy: { completedAt: "desc" },
      take: 15,
    }),
  ]);

  return (
    <MyLibraryClient
      initialUser={user}
      savedDocs={savedRecords.map((r) => ({
        id: r.document.id,
        slug: r.document.slug,
        title: r.document.title,
        level: r.document.level,
        categoryName: r.document.category.name,
      }))}
      allDocsCatalog={allDocsCatalog}
      grammarProgress={grammarRecords.map((g) => ({
        lessonSlug: g.lesson.slug,
        lessonTitle: g.lesson.title,
        topicTitle: g.lesson.topic.title,
        completed: g.completed,
        bestScore: g.bestScore,
        totalQuestions: g.totalQuestions,
      }))}
      examAttempts={attemptRecords.map((a) => ({
        id: a.id,
        testSlug: a.examTest.slug,
        testTitle: a.examTest.title,
        listeningScore: a.listeningScore,
        readingScore: a.readingScore,
        totalScore: a.totalScore,
        durationSeconds: a.durationSeconds,
        completedAtIso: a.completedAt.toISOString(),
      }))}
    />
  );
}

export default function MyLibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="h-56 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface)]" />
        </div>
      }
    >
      <MyLibraryLoader />
    </Suspense>
  );
}
