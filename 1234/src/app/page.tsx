import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { HomeClient } from "@/components/home";

async function HomeContent() {
  const [
    documentsCount,
    grammarTopicsCount,
    grammarLessonsCount,
    examSetsCount,
    examTestsCount,
    examQuestionsCount,
    scenariosCount,
    openSessionsCount,
    surveyResponsesCount,
    leaders,
  ] = await Promise.all([
    prisma.document.count(),
    prisma.grammarTopic.count(),
    prisma.grammarLesson.count(),
    prisma.examSet.count(),
    prisma.examTest.count(),
    prisma.examQuestion.count(),
    prisma.careerScenario.count(),
    prisma.practiceSession.count({ where: { status: "OPEN" } }),
    prisma.surveyResponse.count(),
    prisma.user.findMany({
      orderBy: [{ xp: "desc" }, { streakDays: "desc" }],
      take: 8,
      select: {
        id: true,
        name: true,
        xp: true,
        streakDays: true,
      },
    }),
  ]);

  return (
    <HomeClient
      stats={{
        documentsCount,
        grammarTopicsCount,
        grammarLessonsCount,
        examSetsCount,
        examTestsCount,
        examQuestionsCount,
        scenariosCount,
        openSessionsCount,
        surveyResponsesCount,
      }}
      leaders={leaders}
    />
  );
}

function HomeFallback() {
  return (
    <div className="space-y-8">
      <section className="sc-perspective-stage relative min-h-[86vh] sm:min-h-[90vh] flex flex-col justify-center pt-20 pb-12 text-white">
        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-4 py-1.5 text-xs font-semibold text-white/90">
              Tài liệu học tập miễn phí
            </span>
            <h1 className="mt-5 font-display font-black uppercase tracking-tight">
              <span className="block text-6xl sm:text-7xl lg:text-[5.5rem] leading-[0.95] sc-hero-word-lime">
                TOEIC
              </span>
              <span className="mt-1 block text-4xl sm:text-5xl lg:text-[3.7rem] leading-[1.05] sc-hero-word-white">
                LINGOCHILL
              </span>
            </h1>
          </div>
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/mascot/hero-wizard.png"
              alt="Mochi LingoChill"
              className="h-64 w-auto object-contain sm:h-80"
            />
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="h-64 rounded-3xl bg-[var(--surface)] border border-[var(--border)] animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}
