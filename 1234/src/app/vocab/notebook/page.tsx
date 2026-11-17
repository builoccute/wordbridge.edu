import { Suspense } from "react";
import { VocabNotebookClient, type VocabTabKey } from "@/components/vocab/vocab-notebook-client";

export const metadata = {
  title: "Sổ tay Từ vựng & In Flashcard",
};

function parseTab(raw?: string): VocabTabKey {
  if (raw === "my" || raw === "personal") return "my";
  if (raw === "review") return "review";
  if (raw === "print") return "print";
  return "decks";
}

async function VocabNotebookLoader({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  return <VocabNotebookClient initialTab={parseTab(params?.tab)} />;
}

export default function VocabNotebookPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  return (
    <Suspense fallback={<VocabNotebookClient />}>
      <VocabNotebookLoader searchParams={searchParams} />
    </Suspense>
  );
}
