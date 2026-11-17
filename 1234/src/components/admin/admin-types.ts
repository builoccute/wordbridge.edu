export type AdminTabId =
  | "overview"
  | "users"
  | "documents"
  | "exams"
  | "grammar"
  | "community"
  | "donations"
  | "approvals"
  | "scenarios"
  | "safety"
  | "surveys"
  | "storage";

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  xp: number;
  streakDays: number;
  targetScore: number;
  createdAt: string;
  _count: {
    examAttempts: number;
    savedDocuments: number;
    vocabWords: number;
  };
}

export interface AdminCategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  _count?: { documents: number };
}

export interface AdminDocumentRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  categoryId: string;
  level: string;
  fileType: string;
  pageCount: number;
  fileSizeLabel: string;
  isFree: boolean;
  priceVnd: number;
  externalUrl: string | null;
  previewContent: string;
  tagsJson: string;
  viewCount: number;
  downloadCount: number;
  isFeatured: boolean;
  createdAt: string;
  category: { id: string; name: string; slug: string };
}

export interface AdminExamTestRow {
  id: string;
  examSetId: string;
  slug: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  listeningCount: number;
  readingCount: number;
  difficulty: string;
  isHot: boolean;
  order: number;
  _count: { questions: number; attempts: number };
}

export interface AdminExamSetRow {
  id: string;
  slug: string;
  title: string;
  badge: string | null;
  description: string;
  order: number;
  tests: AdminExamTestRow[];
}

export interface AdminExamQuestionRow {
  id: string;
  examTestId: string;
  number: number;
  part: number;
  promptText: string;
  passageTitle: string | null;
  passageHtml: string | null;
  audioScript: string | null;
  optionsJson: string;
  correctIndex: number;
  explanation: string;
}

export interface AdminGrammarLessonRow {
  id: string;
  topicId: string;
  slug: string;
  title: string;
  order: number;
  _count?: { progress: number };
}

export interface AdminGrammarTopicRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  targetLevel: string;
  order: number;
  estimatedMinutes: number;
  lessons: AdminGrammarLessonRow[];
}

export interface AdminCommunityCommentRow {
  id: string;
  content: string;
  createdAt: string;
  user: { name: string; email: string };
}

export interface AdminCommunityPostRow {
  id: string;
  group: string;
  title: string;
  content: string;
  authorBadge: string | null;
  isPinned: boolean;
  createdAt: string;
  user: { name: string; email: string; role: string };
  comments: AdminCommunityCommentRow[];
  _count: { likes: number; comments: number; votes: number };
}

export interface AdminDonationRow {
  id: string;
  orderCode: string;
  amountVnd: number;
  donorName: string;
  message: string | null;
  status: string;
  sepayTxId: string | null;
  createdAt: string;
  paidAt: string | null;
}

/** Shared JSON fetch wrapper for admin endpoints that throws normalized Vietnamese error messages. */
export async function adminRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json()) as {
    success: boolean;
    data?: T;
    error?: { message?: string };
  };
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error?.message || "Yêu cầu quản trị thất bại.");
  }
  return json.data;
}

export function formatShortDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
