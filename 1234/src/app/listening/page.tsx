import type { Metadata } from "next";
import { Suspense } from "react";
import { ListeningHub } from "@/components/listening/listening-hub";

export const metadata: Metadata = {
  title: "Luyện Nghe TOEIC, Dictation & Video Song Ngữ",
  description: "Lộ trình luyện nghe 3 chặng Part 1–4, nghe chép chính tả và video song ngữ.",
};

async function ListeningContent({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const sp = await searchParams;
  return <ListeningHub initialMode={sp.mode} />;
}

export default function ListeningHubPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  return (
    <Suspense fallback={<ListeningHub />}>
      <ListeningContent searchParams={searchParams} />
    </Suspense>
  );
}
