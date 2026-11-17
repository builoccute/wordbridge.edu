import type { Metadata } from "next";
import { Suspense } from "react";
import { SurveyClient } from "@/components/survey/survey-client";
import { getSurveyAnalytics } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Khảo Sát Nhu Cầu & Kiểm Chứng Giả Thuyết H1–H6",
  description:
    "Bộ câu hỏi khảo sát 15 câu (Phụ lục A) phục vụ kiểm chứng giả thuyết H1–H6 cho Đề án Nền tảng thực hành và kết nối cộng đồng ngoại ngữ VSVC.",
};

async function SurveyLoader() {
  const initialSummary = await getSurveyAnalytics();
  return <SurveyClient initialSummary={initialSummary} />;
}

export default function SurveyPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="h-56 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface)]" />
        </div>
      }
    >
      <SurveyLoader />
    </Suspense>
  );
}
