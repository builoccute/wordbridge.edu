import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, BookOpen, Download, Eye, FileText } from "lucide-react";
import { DocumentDetailActions, DocumentsExplorer } from "@/components/documents";
import { Badge, Card } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kho Tài Liệu TOEIC & Tiếng Anh Nghề Nghiệp",
  description:
    "Tổng hợp tài liệu tiếng Anh chuyên ngành và TOEIC chọn lọc: từ vựng, ngữ pháp, lộ trình, đề thi có giải chi tiết, listening và reading.",
};

function renderPreviewLines(content: string) {
  return content.split("\n").map((line, index) => {
    if (line.startsWith("# ")) {
      return (
        <h2 key={index} className="mt-4 font-heading text-xl font-bold text-[var(--heading)]">
          {line.slice(2)}
        </h2>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h3 key={index} className="mt-5 font-heading text-base font-bold text-[var(--primary)]">
          {line.slice(3)}
        </h3>
      );
    }
    if (line.trim().startsWith("- ") || /^\d+\.\s/.test(line.trim())) {
      return (
        <li key={index} className="ml-4 text-sm leading-relaxed text-[var(--foreground)]">
          {line.trim().replace(/^-\s*/, "")}
        </li>
      );
    }
    if (line.trim() === "") {
      return <div key={index} className="h-2" />;
    }
    return (
      <p key={index} className="text-sm leading-relaxed text-[var(--foreground)]">
        {line}
      </p>
    );
  });
}

async function DocumentsUnifiedLoader({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; categorySlug?: string }>;
}) {
  const sp = await searchParams;
  const docSlug = (sp?.slug || "").trim();
  const catSlug = (sp?.categorySlug || "").trim();

  if (docSlug) {
    const doc = await prisma.document.findUnique({
      where: { slug: docSlug },
      include: { category: true },
    });
    if (!doc) notFound();

    await prisma.document.update({
      where: { id: doc.id },
      data: { viewCount: { increment: 1 } },
    });

    const [related, user] = await Promise.all([
      prisma.document.findMany({
        where: { categoryId: doc.categoryId, id: { not: doc.id } },
        take: 3,
        orderBy: { downloadCount: "desc" },
      }),
      getCurrentUser(),
    ]);

    let initialSaved = false;
    if (user) {
      const saved = await prisma.userSavedDocument.findUnique({
        where: { userId_documentId: { userId: user.id, documentId: doc.id } },
      });
      initialSaved = Boolean(saved);
    }

    const tags = safeJsonParse<string[]>(doc.tagsJson, []);

    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Link
          href={`/documents/danh-muc/${doc.category.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại {doc.category.name}
        </Link>

        <Card className="mt-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="green">{doc.category.name}</Badge>
            <Badge variant="gold">{doc.level}</Badge>
            <Badge variant="neutral">
              {doc.fileType} · {doc.pageCount} trang · {doc.fileSizeLabel}
            </Badge>
          </div>

          <h1 className="mt-4 font-heading text-2xl font-extrabold text-[var(--heading)] sm:text-3xl">
            {doc.title}
          </h1>
          <p className="mt-2.5 text-base leading-relaxed text-[var(--muted-foreground)]">
            {doc.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-[var(--primary)]" />
              {doc.viewCount + 1} lượt xem
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Download className="h-4 w-4 text-[var(--gold)]" />
              {doc.downloadCount} lượt tải
            </span>
            {tags.map((tag) => (
              <span key={tag} className="rounded-lg bg-[var(--surface-alt)] px-2 py-0.5">
                #{tag}
              </span>
            ))}
          </div>

          <div className="mt-6 border-t border-[var(--border)] pt-5">
            <DocumentDetailActions docId={doc.id} initialSaved={initialSaved} />
          </div>
        </Card>

        <Card className="mt-6 bg-study-grid p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <BookOpen className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="font-heading text-lg font-bold text-[var(--heading)]">
              Nội dung tóm tắt &amp; Điểm trọng tâm
            </h2>
          </div>
          <div className="space-y-1.5">{renderPreviewLines(doc.previewContent)}</div>
        </Card>

        {related.length > 0 && (
          <div className="mt-8">
            <h2 className="font-heading text-xl font-bold text-[var(--heading)]">
              Tài liệu liên quan cùng chuyên đề
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <Link key={item.id} href={`/documents/${item.slug}`} className="group">
                  <Card className="h-full p-4 group-hover:border-[var(--primary)]">
                    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <FileText className="h-4 w-4 text-[var(--primary)]" />
                      <span>{item.level}</span>
                    </div>
                    <p className="mt-2 font-heading text-sm font-bold text-[var(--heading)] group-hover:text-[var(--primary)]">
                      {item.title}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const activeCategory = catSlug
    ? await prisma.documentCategory.findUnique({ where: { slug: catSlug } })
    : null;
  if (catSlug && !activeCategory) {
    notFound();
  }

  const [documents, categories, user] = await Promise.all([
    prisma.document.findMany({
      where: catSlug ? { category: { slug: catSlug } } : undefined,
      include: { category: { select: { id: true, slug: true, name: true } } },
      orderBy: [{ isFeatured: "desc" }, { downloadCount: "desc" }],
    }),
    prisma.documentCategory.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { documents: true } } },
    }),
    getCurrentUser(),
  ]);

  let savedIds: string[] = [];
  if (user) {
    const saved = await prisma.userSavedDocument.findMany({
      where: { userId: user.id },
      select: { documentId: true },
    });
    savedIds = saved.map((s) => s.documentId);
  }

  return (
    <DocumentsExplorer
      documents={documents}
      categories={categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        count: c._count.documents,
      }))}
      initialSavedIds={savedIds}
      activeCategorySlug={activeCategory?.slug}
      activeCategoryTitle={activeCategory?.name}
      activeCategoryDescription={activeCategory?.description}
    />
  );
}

export default function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; categorySlug?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="h-44 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface)]" />
        </div>
      }
    >
      <DocumentsUnifiedLoader searchParams={searchParams} />
    </Suspense>
  );
}
