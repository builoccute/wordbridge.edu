import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GrammarLessonViewer } from "@/components/grammar/grammar-lesson-viewer";
import { loadGrammarWorkspace } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Ngữ Pháp TOEIC & Tiếng Anh Nghề Nghiệp Toàn Diện",
  description:
    "Lộ trình học ngữ pháp 6 chặng với bảng bên trái, bài giảng cô đọng, phát âm từ vựng và quiz chấm EXP ngay.",
};

async function GrammarWorkspaceLoader({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const sp = await searchParams;
  const slug = (sp?.slug || "").trim();
  const workspace = await loadGrammarWorkspace(slug || undefined);
  if (!workspace) {
    if (slug) notFound();
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-[var(--muted-foreground)]">
        Chưa có bài học ngữ pháp nào trong cơ sở dữ liệu.
      </div>
    );
  }

  return <GrammarLessonViewer {...workspace} />;
}

export default function GrammarPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="h-[520px] animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface)]" />
        </div>
      }
    >
      <GrammarWorkspaceLoader searchParams={searchParams} />
    </Suspense>
  );
}
