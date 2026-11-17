import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { safeJsonParse } from "@/lib/utils";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Shared PrismaClient singleton to avoid exhausting connections across Next.js HMR reloads. */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// === admin-data.ts ===
export interface AdminOverviewStats {
  usersCount: number;
  adminsCount: number;
  documentsCount: number;
  totalDocumentDownloads: number;
  totalDocumentViews: number;
  grammarTopicsCount: number;
  grammarLessonsCount: number;
  examSetsCount: number;
  examTestsCount: number;
  examQuestionsCount: number;
  examAttemptsCount: number;
  communityPostsCount: number;
  communityCommentsCount: number;
  vocabWordsCount: number;
  donationsPaidTotalVnd: number;
  donationsPaidCount: number;
  pendingDonationsCount: number;
}

export interface AdminCategoryBreakdown {
  id: string;
  slug: string;
  name: string;
  icon: string;
  documentCount: number;
  downloadCount: number;
  viewCount: number;
}

export interface AdminRecentDonationDTO {
  id: string;
  orderCode: string;
  amountVnd: number;
  donorName: string;
  message: string | null;
  status: string;
  createdAt: string;
  paidAt: string | null;
}

export interface AdminRecentAttemptDTO {
  id: string;
  totalScore: number;
  listeningScore: number;
  readingScore: number;
  durationSeconds: number;
  completedAt: string;
  user: { name: string; email: string };
  examTest: { title: string; slug: string };
}

export interface AdminOverviewPayload {
  stats: AdminOverviewStats;
  categories: AdminCategoryBreakdown[];
  recentDonations: AdminRecentDonationDTO[];
  recentAttempts: AdminRecentAttemptDTO[];
}

/** Shared server loader for Admin Overview & KPI analytics across API and Server Components. */
export async function getAdminOverviewData(): Promise<AdminOverviewPayload> {
  const [
    usersCount,
    adminsCount,
    documentsAgg,
    grammarTopicsCount,
    grammarLessonsCount,
    examSetsCount,
    examTestsCount,
    examQuestionsCount,
    examAttemptsCount,
    communityPostsCount,
    communityCommentsCount,
    vocabWordsCount,
    paidDonationsAgg,
    pendingDonationsCount,
    categories,
    recentDonations,
    recentAttempts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.document.aggregate({
      _count: { _all: true },
      _sum: { downloadCount: true, viewCount: true },
    }),
    prisma.grammarTopic.count(),
    prisma.grammarLesson.count(),
    prisma.examSet.count(),
    prisma.examTest.count(),
    prisma.examQuestion.count(),
    prisma.examAttempt.count(),
    prisma.communityPost.count(),
    prisma.communityComment.count(),
    prisma.userVocabWord.count(),
    prisma.donationRecord.aggregate({
      where: { status: "PAID" },
      _sum: { amountVnd: true },
      _count: { _all: true },
    }),
    prisma.donationRecord.count({ where: { status: "PENDING" } }),
    prisma.documentCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        documents: {
          select: { downloadCount: true, viewCount: true },
        },
      },
    }),
    prisma.donationRecord.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.examAttempt.findMany({
      orderBy: { completedAt: "desc" },
      take: 6,
      include: {
        user: { select: { name: true, email: true } },
        examTest: { select: { title: true, slug: true } },
      },
    }),
  ]);

  return {
    stats: {
      usersCount,
      adminsCount,
      documentsCount: documentsAgg._count._all,
      totalDocumentDownloads: documentsAgg._sum.downloadCount ?? 0,
      totalDocumentViews: documentsAgg._sum.viewCount ?? 0,
      grammarTopicsCount,
      grammarLessonsCount,
      examSetsCount,
      examTestsCount,
      examQuestionsCount,
      examAttemptsCount,
      communityPostsCount,
      communityCommentsCount,
      vocabWordsCount,
      donationsPaidTotalVnd: paidDonationsAgg._sum.amountVnd ?? 0,
      donationsPaidCount: paidDonationsAgg._count._all,
      pendingDonationsCount,
    },
    categories: categories.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      icon: cat.icon,
      documentCount: cat.documents.length,
      downloadCount: cat.documents.reduce((acc, d) => acc + d.downloadCount, 0),
      viewCount: cat.documents.reduce((acc, d) => acc + d.viewCount, 0),
    })),
    recentDonations: recentDonations.map((d) => ({
      id: d.id,
      orderCode: d.orderCode,
      amountVnd: d.amountVnd,
      donorName: d.donorName,
      message: d.message,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
      paidAt: d.paidAt ? d.paidAt.toISOString() : null,
    })),
    recentAttempts: recentAttempts.map((a) => ({
      id: a.id,
      totalScore: a.totalScore,
      listeningScore: a.listeningScore,
      readingScore: a.readingScore,
      durationSeconds: a.durationSeconds,
      completedAt: a.completedAt.toISOString(),
      user: a.user,
      examTest: a.examTest,
    })),
  };
}

// === community-data.ts ===
export interface CommunityPollOption {
  key: "A" | "B" | "C" | "D";
  text: string;
  votes: number;
}

export interface CommunityPollData {
  options: CommunityPollOption[];
  correctKey: "A" | "B" | "C" | "D";
  explanation: string;
}

export interface CommunityCommentDTO {
  id: string;
  author: string;
  content: string;
  timeAgo: string;
}

export interface CommunityPostDTO {
  id: string;
  authorId: string;
  author: string;
  handle: string;
  avatarText: string;
  avatarBg: string;
  badge: string | null;
  timeAgo: string;
  group: string;
  title: string;
  content: string;
  isPinned: boolean;
  likes: number;
  viewerLiked: boolean;
  viewerVotedKey: "A" | "B" | "C" | "D" | null;
  poll: CommunityPollData | null;
  comments: CommunityCommentDTO[];
}

const AVATAR_PALETTES = [
  "bg-[#9ee56f] text-[#102216]",
  "bg-amber-300 text-[#1b2d1c]",
  "bg-sky-300 text-[#102216]",
  "bg-[#19462b] text-[#9ee56f]",
  "bg-rose-300 text-[#1b2d1c]",
];

export function formatRelativeVi(date: Date): string {
  const diffMs = Math.max(0, Date.now() - date.getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return `${words[0][0] || ""}${words[words.length - 1][0] || ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "HV";
}

function pickPalette(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

export async function loadCommunityFeed(viewerUserId?: string | null): Promise<CommunityPostDTO[]> {
  let blockedUserIds: string[] = [];
  if (viewerUserId) {
    const blocks = await prisma.userBlock.findMany({
      where: {
        OR: [{ blockerId: viewerUserId }, { blockedId: viewerUserId }],
      },
      select: { blockerId: true, blockedId: true },
    });
    blockedUserIds = blocks.map((b) =>
      b.blockerId === viewerUserId ? b.blockedId : b.blockerId
    );
  }

  const rows = await prisma.communityPost.findMany({
    where: blockedUserIds.length > 0 ? { userId: { notIn: blockedUserIds } } : undefined,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 40,
    include: {
      user: { select: { id: true, name: true, email: true, role: true, streakDays: true } },
      likes: { select: { userId: true } },
      votes: viewerUserId ? { where: { userId: viewerUserId }, select: { optionKey: true } } : false,
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true } } },
      },
    },
  });

  return rows.map((row) => {
    const parsedPoll = row.pollJson ? safeJsonParse<CommunityPollData | null>(row.pollJson, null) : null;
    const viewerVotedRaw =
      Array.isArray(row.votes) && row.votes.length > 0 ? row.votes[0].optionKey : null;
    const viewerVotedKey =
      viewerVotedRaw === "A" ||
      viewerVotedRaw === "B" ||
      viewerVotedRaw === "C" ||
      viewerVotedRaw === "D"
        ? viewerVotedRaw
        : null;

    const viewerLiked = Boolean(
      viewerUserId && row.likes.some((l) => l.userId === viewerUserId)
    );

    const badge =
      row.authorBadge ||
      (row.user.role === "ADMIN"
        ? "Admin"
        : row.user.streakDays >= 7
        ? `Streak ${row.user.streakDays} ngày`
        : null);

    return {
      id: row.id,
      authorId: row.user.id,
      author: row.user.name,
      handle: `@${row.user.email.split("@")[0]}`,
      avatarText: getInitials(row.user.name),
      avatarBg: pickPalette(row.user.id),
      badge,
      timeAgo: formatRelativeVi(row.createdAt),
      group: row.group,
      title: row.title,
      content: row.content,
      isPinned: row.isPinned,
      likes: row.likes.length,
      viewerLiked,
      viewerVotedKey,
      poll: parsedPoll,
      comments: row.comments.map((cm) => ({
        id: cm.id,
        author: cm.user.name,
        content: cm.content,
        timeAgo: formatRelativeVi(cm.createdAt),
      })),
    };
  });
}

// === exam-workspace.ts ===
export interface ExamTestCardItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  listeningCount: number;
  readingCount: number;
  difficulty: string;
  isHot: boolean;
  bestScore: number | null;
}

export interface ExamSetDashboardItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  badge: string | null;
  tests: ExamTestCardItem[];
}

/**
 * Shared loader for the StudyChill-inspired /luyen-de Overview and /luyen-de/[setSlug] dashboard.
 */
export async function loadExamDashboard(selectedSetSlug?: string) {
  const [sets, user] = await Promise.all([
    prisma.examSet.findMany({
      orderBy: { order: "asc" },
      include: {
        tests: {
          orderBy: { order: "asc" },
        },
      },
    }),
    getCurrentUser(),
  ]);

  const bestByTestId = new Map<string, number>();
  if (user) {
    const attempts = await prisma.examAttempt.findMany({
      where: { userId: user.id },
      select: { examTestId: true, totalScore: true },
    });
    for (const a of attempts) {
      const prev = bestByTestId.get(a.examTestId) ?? 0;
      if (a.totalScore > prev) bestByTestId.set(a.examTestId, a.totalScore);
    }
  }

  const normalizedSets: ExamSetDashboardItem[] = sets.map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    description: s.description,
    badge: s.badge,
    tests: s.tests.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      description: t.description,
      durationMinutes: t.durationMinutes,
      totalQuestions: t.totalQuestions,
      listeningCount: t.listeningCount,
      readingCount: t.readingCount,
      difficulty: t.difficulty,
      isHot: t.isHot,
      bestScore: bestByTestId.get(t.id) ?? null,
    })),
  }));

  if (selectedSetSlug) {
    const found = normalizedSets.find((s) => s.slug === selectedSetSlug);
    if (!found) return null;
  }

  return {
    sets: normalizedSets,
    activeSetSlug: selectedSetSlug ?? null,
  };
}

// === grammar-workspace.ts ===
import type {
  GrammarQuizItem,
  GrammarSummary,
  GrammarVocabItem,
  KnowledgeSection,
  RoadmapTopicItem,
} from "@/components/grammar/grammar-lesson-viewer";

/**
 * Shared loader for the 2-column StudyChill Grammar Workspace (/ngu-phap & /ngu-phap/[slug]),
 * returning full roadmap accordion structure, user completion progress, and active lesson data.
 */
export async function loadGrammarWorkspace(requestedSlug?: string) {
  const [topics, user] = await Promise.all([
    prisma.grammarTopic.findMany({
      orderBy: { order: "asc" },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
      },
    }),
    getCurrentUser(),
  ]);

  const progressMap = new Map<string, { completed: boolean; bestScore: number }>();
  if (user) {
    const records = await prisma.userGrammarProgress.findMany({
      where: { userId: user.id },
      select: { lessonId: true, completed: true, bestScore: true },
    });
    for (const r of records) {
      progressMap.set(r.lessonId, { completed: r.completed, bestScore: r.bestScore });
    }
  }

  const allFlatLessons = topics.flatMap((t) =>
    t.lessons.map((l) => ({ topic: t, lesson: l }))
  );

  if (allFlatLessons.length === 0) {
    return null;
  }

  const activeEntry = requestedSlug
    ? allFlatLessons.find((e) => e.lesson.slug === requestedSlug) ?? null
    : allFlatLessons[0];

  if (!activeEntry) {
    return null;
  }

  const activeIdx = allFlatLessons.findIndex((e) => e.lesson.id === activeEntry.lesson.id);
  const nextEntry =
    activeIdx >= 0 && activeIdx + 1 < allFlatLessons.length
      ? allFlatLessons[activeIdx + 1]
      : null;

  const roadmap: RoadmapTopicItem[] = topics.map((t, tIdx) => ({
    id: t.id,
    order: tIdx + 1,
    title: t.title,
    targetLevel: t.targetLevel,
    estimatedMinutes: t.estimatedMinutes,
    lessons: t.lessons.map((l, lIdx) => {
      const k = safeJsonParse<KnowledgeSection[]>(l.knowledgeJson, []);
      const q = safeJsonParse<GrammarQuizItem[]>(l.testsJson, []);
      const prog = progressMap.get(l.id);
      return {
        id: l.id,
        slug: l.slug,
        title: l.title,
        order: lIdx + 1,
        completed: Boolean(prog?.completed),
        bestScore: prog?.bestScore ?? 0,
        quizCount: q.length,
        sectionHeadings: k.map((s) => s.heading),
      };
    }),
  }));

  const completedCount = roadmap.reduce(
    (sum, t) => sum + t.lessons.filter((l) => l.completed).length,
    0
  );
  const totalQuizCount = roadmap.reduce(
    (sum, t) => sum + t.lessons.reduce((lsum, l) => lsum + l.quizCount, 0),
    0
  );

  const activeProg = progressMap.get(activeEntry.lesson.id);

  return {
    roadmap,
    stats: {
      totalLessons: allFlatLessons.length,
      completedLessons: completedCount,
      totalQuizCount,
      activeIndex: activeIdx + 1,
      activeTopicOrder: topics.findIndex((t) => t.id === activeEntry.topic.id) + 1,
    },
    lesson: {
      id: activeEntry.lesson.id,
      slug: activeEntry.lesson.slug,
      title: activeEntry.lesson.title,
      topicId: activeEntry.topic.id,
      topicTitle: activeEntry.topic.title,
      targetLevel: activeEntry.topic.targetLevel,
    },
    knowledge: safeJsonParse<KnowledgeSection[]>(activeEntry.lesson.knowledgeJson, []),
    vocab: safeJsonParse<GrammarVocabItem[]>(activeEntry.lesson.vocabJson, []),
    tests: safeJsonParse<GrammarQuizItem[]>(activeEntry.lesson.testsJson, []),
    summary: safeJsonParse<GrammarSummary>(activeEntry.lesson.summaryJson, {
      takeaways: [],
      commonTraps: [],
    }),
    initialCompleted: Boolean(activeProg?.completed),
    initialBestScore: activeProg?.bestScore ?? 0,
    nextLesson: nextEntry
      ? { slug: nextEntry.lesson.slug, title: nextEntry.lesson.title }
      : null,
  };
}

// === startup-analytics.ts ===
export interface HypothesisMetric {
  code: "H1" | "H2" | "H3" | "H4" | "H5" | "H6";
  statement: string;
  thresholdLabel: string;
  thresholdPct: number;
  matchedCount: number;
  totalCount: number;
  actualPct: number;
  passed: boolean | null;
}

export interface SurveyAnalyticsSummary {
  totalResponses: number;
  targets: {
    totalTarget: number;
    n1Count: number;
    n1Target: number;
    n2Count: number;
    n2Target: number;
    n3Count: number;
    n3Target: number;
  };
  hypotheses: HypothesisMetric[];
  avgMonthlyPriceVnd: number;
  topPaidFeatures: Array<{ feature: string; count: number }>;
  preferredFormats: Array<{ format: string; count: number }>;
  ageGroups: Array<{ ageGroup: string; count: number }>;
  androidCount: number;
  iphoneCount: number;
}

export interface Phase0bKpiSummary {
  activeMembers: number;
  activeMembersTarget: number;
  completedSessions: number;
  completedSessionsTarget: number;
  scheduledOrCompletedSessions: number;
  completionRatePct: number;
  completionRateTarget: number;
  week2RetentionPct: number;
  week2RetentionTarget: number;
  avgSatisfaction: number;
  avgSatisfactionTarget: number;
  reviewsCount: number;
  openReportsCount: number;
  pendingApprovalsCount: number;
}

export async function getSurveyAnalytics(): Promise<SurveyAnalyticsSummary> {
  const rows = await prisma.surveyResponse.findMany({
    orderBy: { createdAt: "desc" },
  });

  const total = rows.length;
  const n1Count = rows.filter((r) => r.customerGroup === "N1").length;
  const n2Count = rows.filter((r) => r.customerGroup === "N2").length;
  const n3Count = rows.filter((r) => r.customerGroup === "N3").length;

  const pct = (count: number, denom = total) =>
    denom > 0 ? Math.round((count / denom) * 1000) / 10 : 0;

  // H1: >= 50% select "chưa sát" (2) or "rất chưa sát" (1)
  const h1Count = rows.filter((r) => r.careerRelevanceScore <= 2).length;
  // H2: >= 50% rank "Thiếu người luyện nói cùng" (or speaking lack) in top 2 difficulties
  const h2Count = rows.filter((r) => {
    const diffs = safeJsonParse<string[]>(r.topDifficultiesJson, []);
    return diffs.slice(0, 2).some((d) => d.includes("thiếu người luyện nói") || d === "lack_partner");
  }).length;
  // H3: >= 40% select "sẵn sàng" (4) or "rất sẵn sàng" (5)
  const h3Count = rows.filter((r) => r.pairWillingnessScore >= 4).length;
  // H4: >= 30% willing to try 4 weeks & leave contact email
  const h4Count = rows.filter(
    (r) => r.trialWilling && Boolean(r.trialEmail && r.trialEmail.trim().length > 3)
  ).length;
  // H5: >= 20% willing to pay
  const h5Count = rows.filter((r) => r.payWilling).length;
  // H6: >= 50% use Android and want to install app ("app" or "both")
  const h6Count = rows.filter(
    (r) => r.phoneType === "Android" && (r.preferPlatform === "app" || r.preferPlatform === "both")
  ).length;

  const featureCounts = new Map<string, number>();
  const formatCounts = new Map<string, number>();
  const ageCounts = new Map<string, number>();
  let priceSum = 0;
  let priceCount = 0;

  for (const r of rows) {
    if (r.payWilling && r.maxMonthlyPriceVnd > 0) {
      priceSum += r.maxMonthlyPriceVnd;
      priceCount += 1;
    }
    const feats = safeJsonParse<string[]>(r.desiredPaidFeaturesJson, []);
    for (const f of feats) {
      featureCounts.set(f, (featureCounts.get(f) || 0) + 1);
    }
    formatCounts.set(r.preferredFormat, (formatCounts.get(r.preferredFormat) || 0) + 1);
    ageCounts.set(r.ageGroup, (ageCounts.get(r.ageGroup) || 0) + 1);
  }

  const hypotheses: HypothesisMetric[] = [
    {
      code: "H1",
      statement: "Nội dung học hiện tại chưa sát tình huống nghề của người học",
      thresholdLabel: "≥ 50% chọn 'chưa sát' hoặc 'rất chưa sát' (mức 1–2)",
      thresholdPct: 50,
      matchedCount: h1Count,
      totalCount: total,
      actualPct: pct(h1Count),
      passed: total > 0 ? pct(h1Count) >= 50 : null,
    },
    {
      code: "H2",
      statement: "Thiếu cơ hội luyện nói cùng là khó khăn lớn",
      thresholdLabel: "≥ 50% xếp trong 2 khó khăn hàng đầu",
      thresholdPct: 50,
      matchedCount: h2Count,
      totalCount: total,
      actualPct: pct(h2Count),
      passed: total > 0 ? pct(h2Count) >= 50 : null,
    },
    {
      code: "H3",
      statement: "Sẵn sàng luyện theo cặp, nhóm cùng ngành theo lịch hẹn",
      thresholdLabel: "≥ 40% chọn 'sẵn sàng' hoặc 'rất sẵn sàng' (mức 4–5)",
      thresholdPct: 40,
      matchedCount: h3Count,
      totalCount: total,
      actualPct: pct(h3Count),
      passed: total > 0 ? pct(h3Count) >= 40 : null,
    },
    {
      code: "H4",
      statement: "Sẵn sàng dùng thử nền tảng ít nhất 4 tuần",
      thresholdLabel: "≥ 30% để lại thông tin liên hệ dùng thử",
      thresholdPct: 30,
      matchedCount: h4Count,
      totalCount: total,
      actualPct: pct(h4Count),
      passed: total > 0 ? pct(h4Count) >= 30 : null,
    },
    {
      code: "H5",
      statement: "Cá nhân sẵn sàng trả phí để có thêm tính năng mở rộng",
      thresholdLabel: "≥ 20% chọn sẵn sàng trả phí",
      thresholdPct: 20,
      matchedCount: h5Count,
      totalCount: total,
      actualPct: pct(h5Count),
      passed: total > 0 ? pct(h5Count) >= 20 : null,
    },
    {
      code: "H6",
      statement: "Phần lớn dùng điện thoại Android và muốn cài ứng dụng",
      thresholdLabel: "≥ 50% dùng Android & quan tâm cài ứng dụng",
      thresholdPct: 50,
      matchedCount: h6Count,
      totalCount: total,
      actualPct: pct(h6Count),
      passed: total > 0 ? pct(h6Count) >= 50 : null,
    },
  ];

  return {
    totalResponses: total,
    targets: {
      totalTarget: 150,
      n1Count,
      n1Target: 80,
      n2Count,
      n2Target: 40,
      n3Count,
      n3Target: 30,
    },
    hypotheses,
    avgMonthlyPriceVnd: priceCount > 0 ? Math.round(priceSum / priceCount) : 0,
    topPaidFeatures: Array.from(featureCounts.entries())
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count),
    preferredFormats: Array.from(formatCounts.entries()).map(([format, count]) => ({
      format,
      count,
    })),
    ageGroups: Array.from(ageCounts.entries()).map(([ageGroup, count]) => ({
      ageGroup,
      count,
    })),
    androidCount: rows.filter((r) => r.phoneType === "Android").length,
    iphoneCount: rows.filter((r) => r.phoneType === "iPhone").length,
  };
}

export async function getPhase0bKpis(): Promise<Phase0bKpiSummary> {
  const [
    activeMembers,
    completedSessions,
    matchedSessions,
    cancelledSessions,
    reviewsAgg,
    retainedUsers,
    openReportsCount,
    pendingUsersCount,
    pendingConsentsCount,
  ] = await Promise.all([
    prisma.user.count({ where: { approvalStatus: "APPROVED" } }),
    prisma.practiceSession.count({ where: { status: "COMPLETED" } }),
    prisma.practiceSession.count({ where: { status: "MATCHED" } }),
    prisma.practiceSession.count({ where: { status: "CANCELLED" } }),
    prisma.peerRubricReview.aggregate({
      _avg: { satisfactionRating: true },
      _count: { _all: true },
    }),
    prisma.user.count({
      where: {
        approvalStatus: "APPROVED",
        streakDays: { gte: 7 },
      },
    }),
    prisma.safetyReport.count({ where: { status: "OPEN" } }),
    prisma.user.count({ where: { approvalStatus: "PENDING" } }),
    prisma.parentConsent.count({ where: { status: "PENDING" } }),
  ]);

  const scheduledOrCompletedSessions = completedSessions + matchedSessions + cancelledSessions;
  const completionRatePct =
    scheduledOrCompletedSessions > 0
      ? Math.round((completedSessions / scheduledOrCompletedSessions) * 100)
      : 0;
  const week2RetentionPct =
    activeMembers > 0 ? Math.round((retainedUsers / activeMembers) * 100) : 0;

  return {
    activeMembers,
    activeMembersTarget: 50,
    completedSessions,
    completedSessionsTarget: 30,
    scheduledOrCompletedSessions,
    completionRatePct,
    completionRateTarget: 70,
    week2RetentionPct,
    week2RetentionTarget: 40,
    avgSatisfaction: Math.round((reviewsAgg._avg.satisfactionRating ?? 0) * 10) / 10,
    avgSatisfactionTarget: 4.0,
    reviewsCount: reviewsAgg._count._all,
    openReportsCount,
    pendingApprovalsCount: pendingUsersCount + pendingConsentsCount,
  };
}
