import type { Metadata } from "next";
import { Suspense } from "react";
import { ReadingHub } from "@/components/reading/reading-hub";

export const metadata: Metadata = {
  title: "Luyện Đọc, Báo Song Ngữ & Scanning/Skimming",
  description: "Đọc báo song ngữ tra từ 1 chạm và rèn tốc độ Scanning & Skimming Part 7.",
};

async function ReadingContent({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const sp = await searchParams;
  return <ReadingHub initialMode={sp.mode} />;
}

export default function ReadingHubPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  return (
    <Suspense fallback={<ReadingHub />}>
      <ReadingContent searchParams={searchParams} />
    </Suspense>
  );
}
