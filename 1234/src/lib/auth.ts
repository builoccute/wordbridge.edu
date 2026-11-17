import crypto from "crypto";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "lc_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

function getAuthSecretBytes(): Uint8Array {
  const configured = process.env.AUTH_SECRET;
  if (configured && configured.length >= 16) {
    return new TextEncoder().encode(configured);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET environment variable must be set (min 16 characters) in production.");
  }
  return new TextEncoder().encode("lingochill-local-dev-secret-change-in-production");
}

/** Hash an OTP code or secret token deterministically with server secret. */
export function hashOtpCode(email: string, code: string): string {
  const secret = process.env.AUTH_SECRET || "lingochill-local-dev-secret";
  return crypto
    .createHash("sha256")
    .update(`${email.trim().toLowerCase()}:${code}:${secret}`)
    .digest("hex");
}

/** Hash a user password securely with random 16-byte salt and scrypt. */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

/** Verify a user password against stored salted scrypt hash in constant time. */
export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash || !storedHash.startsWith("scrypt:")) return false;
  const parts = storedHash.split(":");
  if (parts.length !== 3) return false;
  const [, salt, hashHex] = parts;
  if (!salt || !hashHex) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hashHex, "hex");
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** Merge guest localStorage saved document IDs into the signed-in user's library. */
export async function mergeGuestSavedDocs(userId: string, rawIds: unknown): Promise<void> {
  if (!Array.isArray(rawIds) || rawIds.length === 0) return;
  const validIds = rawIds
    .filter((item): item is string => typeof item === "string" && item.length > 0)
    .slice(0, 50);
  if (validIds.length === 0) return;

  const existingDocs = await prisma.document.findMany({
    where: { id: { in: validIds } },
    select: { id: true },
  });
  for (const doc of existingDocs) {
    await prisma.userSavedDocument.upsert({
      where: { userId_documentId: { userId, documentId: doc.id } },
      update: {},
      create: { userId, documentId: doc.id },
    });
  }
}

/** Generate a cryptographically random 6-digit OTP code. */
export function generateSixDigitOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export interface SessionPayload {
  sub: string;
  email: string;
  role: string;
}

/** Sign an HTTP-only session JWT for the authenticated user. */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getAuthSecretBytes());
}

/** Verify a session JWT and return payload or null if invalid/expired. */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecretBytes());
    if (!payload.sub || typeof payload.email !== "string") return null;
    return {
      sub: payload.sub,
      email: payload.email,
      role: typeof payload.role === "string" ? payload.role : "USER",
    };
  } catch {
    return null;
  }
}

/** Persist the signed JWT inside an HTTP-only cookie. */
export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  const cookieStore = await cookies();
  const isSecure =
    process.env.COOKIE_SECURE === "true" ||
    (process.env.NEXT_PUBLIC_SITE_URL || "").startsWith("https://");

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Remove the session cookie on sign-out. */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  xp: number;
  streakDays: number;
  targetScore: number;
  dateOfBirth: Date | string | null;
  ageGroup: string;
  studentGroup: string;
  school: string;
  major: string;
  selfLevel: string;
  availableSlotsJson: string;
  inviteCodeUsed: string | null;
  approvalStatus: string;
  phoneVerified: boolean;
  parentConsentRequired: boolean;
  parentConsentStatus: string;
  guardianName: string | null;
  guardianRelation: string | null;
  guardianContact: string | null;
  parentMonitorCode: string | null;
  betaRulesAcceptedAt: Date | string | null;
};

/**
 * Safely read the currently signed-in user from cookies.
 * Returns null for guests without throwing errors.
 */
export async function getCurrentUser(): Promise<PublicUser | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!raw) return null;
    const session = await verifySessionToken(raw);
    if (!session) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        xp: true,
        streakDays: true,
        targetScore: true,
        dateOfBirth: true,
        ageGroup: true,
        studentGroup: true,
        school: true,
        major: true,
        selfLevel: true,
        availableSlotsJson: true,
        inviteCodeUsed: true,
        approvalStatus: true,
        phoneVerified: true,
        parentConsentRequired: true,
        parentConsentStatus: true,
        guardianName: true,
        guardianRelation: true,
        guardianContact: true,
        parentMonitorCode: true,
        betaRulesAcceptedAt: true,
      },
    });
    return user;
  } catch {
    return null;
  }
}

export type AuthGuardResult =
  | { ok: true; user: PublicUser }
  | { ok: false; status: 401 | 403; code: string; message: string };

/** Enforce authenticated user on API routes. */
export async function requireUser(): Promise<AuthGuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "Vui lòng đăng nhập để thực hiện thao tác này.",
    };
  }
  return { ok: true, user };
}

/** Enforce ADMIN role on protected admin API routes. */
export async function requireAdmin(): Promise<AuthGuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "Vui lòng đăng nhập tài khoản quản trị.",
    };
  }
  if (user.role !== "ADMIN") {
    return {
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "Bạn không có quyền truy cập khu vực quản trị.",
    };
  }
  return { ok: true, user };
}

/** Format calendar date string in Vietnam timezone (UTC+7) for streak comparison. */
function toVietnamDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Award XP and advance daily learning streak atomically inside a transaction. */
export async function awardXpAndStreak(
  userId: string,
  source: "GRAMMAR" | "EXAM" | "DOCUMENT" | "PRACTICE" | "RUBRIC",
  refId: string,
  points: number
): Promise<{ xp: number; streakDays: number }> {
  const safePoints = Math.max(0, Math.round(points));
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { xp: true, streakDays: true, lastActiveDate: true },
    });
    if (!user) {
      throw new Error("User not found");
    }

    const now = new Date();
    const todayKey = toVietnamDayKey(now);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayKey = toVietnamDayKey(yesterday);
    const lastKey = user.lastActiveDate ? toVietnamDayKey(user.lastActiveDate) : null;

    let nextStreak = user.streakDays;
    if (lastKey === todayKey) {
      nextStreak = Math.max(1, user.streakDays);
    } else if (lastKey === yesterdayKey) {
      nextStreak = user.streakDays + 1;
    } else {
      nextStreak = 1;
    }

    if (safePoints > 0) {
      await tx.xpLedger.create({
        data: { userId, source, refId, points: safePoints },
      });
    }

    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        xp: { increment: safePoints },
        streakDays: nextStreak,
        lastActiveDate: now,
      },
      select: { xp: true, streakDays: true },
    });

    return updated;
  });
}
