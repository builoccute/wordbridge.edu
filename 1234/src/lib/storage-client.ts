import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getCurrentUser, type PublicUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const VAULT_COOKIE_NAME = "wb_vault_session";
export const VAULT_SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours strict max

function getStorageServiceBaseUrl(): string {
  return (process.env.WB_STORAGE_SERVICE_URL || "http://127.0.0.1:4100").replace(/\/+$/, "");
}

function getStorageServiceToken(): string {
  return process.env.WB_STORAGE_SERVICE_TOKEN || "wb-storage-internal-secret-2026";
}

export async function getVaultSessionToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(VAULT_COOKIE_NAME)?.value || null;
  } catch {
    return null;
  }
}

export async function setVaultSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const isSecure =
    process.env.COOKIE_SECURE === "true" ||
    (process.env.NEXT_PUBLIC_SITE_URL || "").startsWith("https://");

  cookieStore.set(VAULT_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: isSecure,
    path: "/",
    maxAge: VAULT_SESSION_TTL_SECONDS,
  });
}

export async function clearVaultSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(VAULT_COOKIE_NAME);
  } catch {
    // ignore outside request context
  }
}

export interface StorageServiceResponse<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: {
    code: string;
    message: string;
    [key: string]: unknown;
  };
}

export async function callStorageService<T = unknown>(
  path: string,
  options?: {
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
    user?: PublicUser | null;
    vaultToken?: string | null;
    request?: NextRequest;
  }
): Promise<StorageServiceResponse<T>> {
  const method = options?.method || (options?.body ? "POST" : "GET");
  const user = options?.user !== undefined ? options.user : await getCurrentUser();
  const vaultToken =
    options?.vaultToken !== undefined ? options.vaultToken : await getVaultSessionToken();

  const ip =
    options?.request?.headers.get("x-forwarded-for") ||
    options?.request?.headers.get("x-real-ip") ||
    "127.0.0.1";
  const ua = options?.request?.headers.get("user-agent") || "WordBridge-NextWorker/1.0";

  const headers: Record<string, string> = {
    "X-Storage-Service-Token": getStorageServiceToken(),
    "X-Actor-Id": user?.id || "",
    "X-Actor-Email": user?.email || "",
    "X-Actor-Name": encodeURIComponent(user?.name || ""),
    "X-Actor-Role": user?.role || "GUEST",
    "X-Vault-Session": vaultToken || "",
    "X-Forwarded-For": ip,
    "User-Agent": ua,
  };

  if (method === "POST") {
    headers["Content-Type"] = "application/json; charset=utf-8";
  }

  try {
    const res = await fetch(`${getStorageServiceBaseUrl()}${path}`, {
      method,
      headers,
      body: method === "POST" ? JSON.stringify(options?.body || {}) : undefined,
      cache: "no-store",
    });

    const json = (await res.json()) as {
      success: boolean;
      data?: T;
      error?: { code: string; message: string; [key: string]: unknown };
    };

    if (!res.ok || !json.success) {
      return {
        ok: false,
        status: res.status,
        error: json.error || {
          code: "STORAGE_SERVICE_ERROR",
          message: "Yêu cầu đến dịch vụ lưu trữ thất bại.",
        },
      };
    }

    return {
      ok: true,
      status: res.status,
      data: json.data,
    };
  } catch (err) {
    console.error("[WORD BRIDGE STORAGE CLIENT] Connection error:", err);
    return {
      ok: false,
      status: 503,
      error: {
        code: "STORAGE_SERVICE_UNREACHABLE",
        message:
          "Không thể kết nối tới Dịch vụ lưu trữ SQLite độc lập. Dữ liệu gốc trên website vẫn được bảo toàn.",
      },
    };
  }
}

/**
 * Non-blocking auto-archive event dispatcher (Phần V.1 - V.4).
 * Never interrupts or throws into the primary document/post/comment creation flow.
 */
export async function emitAutoArchiveEvent(params: {
  eventType:
    | "DOCUMENT_CREATED"
    | "DOCUMENT_UPDATED"
    | "POST_CREATED"
    | "POST_UPDATED"
    | "COMMENT_CREATED"
    | "COMMENT_UPDATED";
  itemType: "DOCUMENT" | "COMMUNITY_POST" | "COMMUNITY_COMMENT";
  sourceId: string;
  idempotencyKey?: string;
  payload: {
    title?: string | null;
    content: string;
    authorId?: string | null;
    authorName?: string | null;
    authorEmail?: string | null;
    creatorId?: string | null;
    creatorName?: string | null;
    editorId?: string | null;
    editorName?: string | null;
    ownerId?: string | null;
    sourceStatus?: string;
    parentSourceId?: string | null;
    externalUrl?: string | null;
    fileFormat?: string | null;
    metadata?: Record<string, unknown>;
    sourceCreatedAt?: string;
    sourceUpdatedAt?: string;
    sourcePublishedAt?: string;
    changeSummary?: string;
    notes?: string;
  };
}): Promise<void> {
  try {
    const idempotencyKey =
      params.idempotencyKey ||
      `${params.eventType}:${params.itemType}:${params.sourceId}:${
        params.payload.sourceUpdatedAt || Date.now()
      }`;

    await callStorageService("/api/v1/archive/events", {
      method: "POST",
      body: {
        eventType: params.eventType,
        itemType: params.itemType,
        sourceId: params.sourceId,
        idempotencyKey,
        payload: params.payload,
      },
    });
  } catch (err) {
    console.warn("[WORD BRIDGE AUTO-ARCHIVE] Queued retry fallback:", err);
  }
}

/**
 * Load all existing real documents, community posts, and community comments from Prisma DB
 * to pass into first-time legacy import if needed (Phần VI.2, VI.5).
 */
export async function collectExistingWebsiteRecordsForImport() {
  const [docs, posts, comments] = await Promise.all([
    prisma.document.findMany({
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.communityPost.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.communityComment.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    documents: docs.map((d) => ({
      id: d.id,
      title: d.title,
      content: `${d.description}\n\n${d.previewContent}`.trim(),
      authorId: "SYSTEM_ADMIN",
      authorName: "Ban biên tập WORD BRIDGE",
      externalUrl: d.externalUrl,
      fileFormat: d.fileType,
      createdAt: d.createdAt.toISOString(),
      metadata: {
        slug: d.slug,
        categoryName: d.category.name,
        categorySlug: d.category.slug,
        level: d.level,
        pageCount: d.pageCount,
        fileSizeLabel: d.fileSizeLabel,
        isFree: d.isFree,
        tagsJson: d.tagsJson,
      },
    })),
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      authorId: p.userId,
      authorName: p.user.name,
      authorEmail: p.user.email,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      metadata: {
        group: p.group,
        authorBadge: p.authorBadge,
        isPinned: p.isPinned,
        pollJson: p.pollJson,
      },
    })),
    comments: comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      content: c.content,
      authorId: c.userId,
      authorName: c.user.name,
      authorEmail: c.user.email,
      createdAt: c.createdAt.toISOString(),
      metadata: {
        postId: c.postId,
      },
    })),
  };
}
