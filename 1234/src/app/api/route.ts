import crypto from "crypto";
import { cookies } from "next/headers";
import { connection, NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  awardXpAndStreak,
  clearSessionCookie,
  generateSixDigitOtp,
  getCurrentUser,
  hashOtpCode,
  hashPassword,
  mergeGuestSavedDocs,
  requireAdmin,
  requireUser,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import {
  formatRelativeVi,
  getAdminOverviewData,
  getPhase0bKpis,
  getSurveyAnalytics,
  loadCommunityFeed,
  prisma,
  type CommunityPollData,
} from "@/lib/prisma";
import { DEFAULT_PRACTICE_RUBRIC, siteConfig } from "@/lib/site-config";
import {
  callStorageService,
  clearVaultSessionCookie,
  collectExistingWebsiteRecordsForImport,
  emitAutoArchiveEvent,
  getVaultSessionToken,
  setVaultSessionCookie,
} from "@/lib/storage-client";
import {
  apiError,
  apiOk,
  calculateToeicSectionScore,
  checkPairingEligibility,
  clampInt,
  computeAgeGroup,
  ENGLISH_USAGE_GOALS,
  generateParentMonitorCode,
  generateSafeMeetLink,
  getMatchingScope,
  isMinorAgeGroup,
  LEARNER_TARGET_GROUPS,
  safeJsonParse,
  slugifyVietnamese,
  SPECIALTY_CONTENT_MODULES,
  TRAINING_INSTITUTION_TYPES,
  VOCATIONAL_FIELDS_CATALOG,
} from "@/lib/utils";


// === [01] /api/documents ===
const route_01: Record<string, any> = (() => {
async function GET(request: NextRequest) {
  await connection();
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category") || "";
  const level = searchParams.get("level") || "";
  const query = (searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = 12;

  const where = {
    ...(category ? { category: { slug: category } } : {}),
    ...(level ? { level } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
          ],
        }
      : {}),
  };

  const [total, items, categories, user] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      include: { category: true },
      orderBy: [{ isFeatured: "desc" }, { downloadCount: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    savedIds = saved.map((item) => item.documentId);
  }

  return apiOk({
    items,
    categories,
    savedIds,
    meta: { page, pageSize, total },
  });
}
  return { GET };
})();

// === [02] /api/donations ===
const route_02: Record<string, any> = (() => {
async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      amountVnd?: unknown;
      donorName?: unknown;
      message?: unknown;
    };

    const amountVnd = Math.round(Number(body.amountVnd ?? 0));
    if (!Number.isFinite(amountVnd) || amountVnd < 5000 || amountVnd > 50000000) {
      return apiError("INVALID_AMOUNT", "Số tiền ủng hộ hợp lệ từ 5.000 ₫ đến 50.000.000 ₫.", 400);
    }

    const donorName =
      typeof body.donorName === "string" && body.donorName.trim().length > 0
        ? body.donorName.trim().slice(0, 80)
        : "Bạn học ẩn danh";
    const message =
      typeof body.message === "string" ? body.message.trim().slice(0, 200) : "";

    const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const orderCode = `LC${suffix}`;

    const record = await prisma.donationRecord.create({
      data: {
        orderCode,
        amountVnd,
        donorName,
        message: message || null,
        status: "PENDING",
      },
    });

    const addInfo = encodeURIComponent(`UNHO ${orderCode}`);
    const accountName = encodeURIComponent(siteConfig.vietqr.accountName);
    const qrUrl = `https://img.vietqr.io/image/${siteConfig.vietqr.bankId}-${siteConfig.vietqr.accountNo}-compact2.png?amount=${amountVnd}&addInfo=${addInfo}&accountName=${accountName}`;

    return apiOk({
      orderCode: record.orderCode,
      amountVnd: record.amountVnd,
      transferContent: `UNHO ${record.orderCode}`,
      bankId: siteConfig.vietqr.bankId,
      accountNo: siteConfig.vietqr.accountNo,
      accountName: siteConfig.vietqr.accountName,
      qrUrl,
      status: record.status,
    });
  } catch (err) {
    console.error("Create donation error:", err);
    return apiError("SERVER_ERROR", "Không thể tạo mã QR ủng hộ.", 500);
  }
}
  return { POST };
})();

// === [03] /api/parent-consent ===
const route_03: Record<string, any> = (() => {
async function GET() {
  const guard = await requireUser();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const consents = await prisma.parentConsent.findMany({
    where: { userId: guard.user.id },
    orderBy: { createdAt: "desc" },
  });

  return apiOk({
    ageGroup: guard.user.ageGroup,
    parentConsentRequired: guard.user.parentConsentRequired,
    parentConsentStatus: guard.user.parentConsentStatus,
    parentMonitorCode: guard.user.parentMonitorCode,
    consents,
  });
}

async function POST(request: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as {
      guardianName?: unknown;
      guardianRelation?: unknown;
      guardianPhone?: unknown;
      guardianEmail?: unknown;
      agreedRules?: unknown;
      agreedDataPolicy?: unknown;
      agreedUnder18Protection?: unknown;
    };

    const guardianName = typeof body.guardianName === "string" ? body.guardianName.trim() : "";
    const guardianRelation =
      typeof body.guardianRelation === "string" ? body.guardianRelation.trim() : "Phụ huynh";
    const guardianPhone = typeof body.guardianPhone === "string" ? body.guardianPhone.trim() : "";
    const guardianEmail =
      typeof body.guardianEmail === "string" ? body.guardianEmail.trim().toLowerCase() : "";

    if (guardianName.length < 2 || guardianPhone.length < 8) {
      return apiError(
        "INVALID_GUARDIAN_INFO",
        "Vui lòng nhập đầy đủ họ tên và số điện thoại liên hệ của cha/mẹ hoặc người giám hộ.",
        400
      );
    }

    if (
      body.agreedRules !== true ||
      body.agreedDataPolicy !== true ||
      body.agreedUnder18Protection !== true
    ) {
      return apiError(
        "CONSENT_CHECKBOXES_REQUIRED",
        "Phụ huynh / người giám hộ cần xác nhận đồng ý cả 3 điều khoản bảo vệ người dưới 18 tuổi.",
        400
      );
    }

    const monitorCode = guard.user.parentMonitorCode || generateParentMonitorCode();
    const isMinor = isMinorAgeGroup(guard.user.ageGroup);

    const consent = await prisma.$transaction(async (tx) => {
      const created = await tx.parentConsent.create({
        data: {
          userId: guard.user.id,
          studentName: guard.user.name,
          studentAgeGroup: guard.user.ageGroup,
          guardianName: guardianName.slice(0, 80),
          guardianRelation: guardianRelation.slice(0, 40),
          guardianPhone: guardianPhone.slice(0, 30),
          guardianEmail: guardianEmail ? guardianEmail.slice(0, 120) : null,
          agreedRules: true,
          agreedDataPolicy: true,
          agreedUnder18Protection: true,
          status: "PENDING",
        },
      });

      await tx.user.update({
        where: { id: guard.user.id },
        data: {
          parentConsentRequired: isMinor || true,
          parentConsentStatus: "PENDING",
          guardianName: guardianName.slice(0, 80),
          guardianRelation: guardianRelation.slice(0, 40),
          guardianContact: guardianEmail || guardianPhone,
          parentMonitorCode: monitorCode,
        },
      });

      return created;
    });

    return apiOk(
      {
        consent,
        parentMonitorCode: monitorCode,
        message:
          "Đã gửi phiếu đồng ý của phụ huynh. Giáo viên phụ trách / quản trị viên sẽ xác nhận duyệt trong thời gian sớm nhất.",
      },
      201
    );
  } catch (err) {
    console.error("Submit parent consent error:", err);
    return apiError("SERVER_ERROR", "Không thể lưu phiếu đồng ý phụ huynh.", 500);
  }
}
  return { GET, POST };
})();

// === [04] /api/parent-monitor ===
const route_04: Record<string, any> = (() => {
/**
 * Cổng giám sát lịch luyện cho Phụ huynh & Giáo viên phụ trách (Mục VII.2 & VIII):
 * Cho phép phụ huynh (nhập mã theo dõi VSVC-PH-...) hoặc Giáo viên/Admin xem lịch luyện của học viên dưới 18 tuổi.
 */
async function GET(request: NextRequest) {
  await connection();
  const code = (request.nextUrl.searchParams.get("code") || "").trim().toUpperCase();
  const studentIdParam = (request.nextUrl.searchParams.get("studentId") || "").trim();

  const viewer = await getCurrentUser();

  let student = null;
  if (code) {
    student = await prisma.user.findUnique({
      where: { parentMonitorCode: code },
      select: {
        id: true,
        name: true,
        school: true,
        major: true,
        selfLevel: true,
        ageGroup: true,
        parentConsentStatus: true,
        guardianName: true,
        guardianRelation: true,
        approvalStatus: true,
        parentMonitorCode: true,
      },
    });
  } else if (studentIdParam && viewer?.role === "ADMIN") {
    student = await prisma.user.findUnique({
      where: { id: studentIdParam },
      select: {
        id: true,
        name: true,
        school: true,
        major: true,
        selfLevel: true,
        ageGroup: true,
        parentConsentStatus: true,
        guardianName: true,
        guardianRelation: true,
        approvalStatus: true,
        parentMonitorCode: true,
      },
    });
  } else if (viewer?.role === "ADMIN") {
    const minors = await prisma.user.findMany({
      where: {
        OR: [{ ageGroup: "UNDER_16" }, { ageGroup: "AGE_16_17" }, { parentConsentRequired: true }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        school: true,
        major: true,
        ageGroup: true,
        parentConsentStatus: true,
        parentMonitorCode: true,
        guardianName: true,
      },
    });
    return apiOk({ mode: "teacher_directory", minors });
  } else {
    return apiError(
      "MONITOR_CODE_REQUIRED",
      "Vui lòng nhập Mã theo dõi phụ huynh (ví dụ VSVC-PH-DEMO18) để xem lịch luyện.",
      400
    );
  }

  if (!student) {
    return apiError("NOT_FOUND", "Không tìm thấy hồ sơ học viên với mã theo dõi này.", 404);
  }

  const [sessions, consents] = await Promise.all([
    prisma.practiceSession.findMany({
      where: {
        OR: [{ hostId: student.id }, { partnerId: student.id }],
      },
      orderBy: { scheduledAt: "desc" },
      take: 25,
      include: {
        scenario: { select: { title: true, slug: true, major: true, level: true } },
        host: { select: { name: true, school: true, ageGroup: true } },
        partner: { select: { name: true, school: true, ageGroup: true } },
      },
    }),
    prisma.parentConsent.findMany({
      where: { userId: student.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return apiOk({
    mode: "student_schedule",
    student,
    safetyGuarantees: [
      "Chỉ ghép cặp với học sinh/sinh viên cùng trường và cùng nhóm tuổi (< 18 tuổi).",
      "Không có tính năng nhắn tin riêng 1-1 ngoài phòng học.",
      "Không ghi âm hoặc ghi hình lưu trữ trên máy chủ.",
      "Liên hệ qua đường dẫn phòng họp hệ thống, không lộ số điện thoại cá nhân.",
    ],
    sessions: sessions.map((s) => ({
      id: s.id,
      scenarioTitle: s.scenario.title,
      scenarioSlug: s.scenario.slug,
      major: s.major,
      level: s.level,
      school: s.school,
      ageGroupScope: s.ageGroupScope,
      scheduledAt: s.scheduledAt.toISOString(),
      slotLabel: s.slotLabel,
      status: s.status,
      partnerName:
        s.hostId === student.id
          ? s.partner?.name || "Đang chờ bạn cùng nhóm tuổi ghép cặp"
          : s.host.name,
      partnerSchool: s.hostId === student.id ? s.partner?.school || s.school : s.host.school,
      noRecordingConfirmed: s.noRecordingConfirmed,
    })),
    consents,
  });
}
  return { GET };
})();

// === [05] /api/scenarios ===
const route_05: Record<string, any> = (() => {
async function GET(request: NextRequest) {
  await connection();
  const major = (request.nextUrl.searchParams.get("major") || "").trim();
  const level = (request.nextUrl.searchParams.get("level") || "").trim();
  const q = (request.nextUrl.searchParams.get("q") || "").trim();

  const scenarios = await prisma.careerScenario.findMany({
    where: {
      ...(major && major !== "Tất cả" ? { major } : {}),
      ...(level && level !== "Tất cả" ? { level } : {}),
      ...(q
        ? {
            OR: [{ title: { contains: q } }, { summary: { contains: q } }],
          }
        : {}),
    },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { sessions: true } },
    },
  });

  return apiOk({ scenarios });
}
  return { GET };
})();

// === [06] /api/sessions ===
const route_06: Record<string, any> = (() => {
async function GET(request: NextRequest) {
  await connection();
  const viewer = await getCurrentUser();
  const major = (request.nextUrl.searchParams.get("major") || "").trim();
  const mineOnly = request.nextUrl.searchParams.get("mine") === "1";

  let blockedIds: string[] = [];
  if (viewer) {
    const blocks = await prisma.userBlock.findMany({
      where: {
        OR: [{ blockerId: viewer.id }, { blockedId: viewer.id }],
      },
      select: { blockerId: true, blockedId: true },
    });
    blockedIds = blocks.map((b) => (b.blockerId === viewer.id ? b.blockedId : b.blockerId));
  }

  const viewerScope = viewer ? getMatchingScope(viewer.ageGroup) : "ADULT_18_PLUS";

  const sessions = await prisma.practiceSession.findMany({
    where: mineOnly && viewer
      ? {
          OR: [{ hostId: viewer.id }, { partnerId: viewer.id }],
        }
      : {
          status: "OPEN",
          ageGroupScope: viewerScope,
          ...(viewer && viewerScope === "UNDER_18" ? { school: viewer.school } : {}),
          ...(major && major !== "Tất cả" ? { major } : {}),
          ...(blockedIds.length > 0
            ? {
                hostId: { notIn: blockedIds },
              }
            : {}),
        },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    take: 40,
    include: {
      scenario: {
        select: { id: true, slug: true, title: true, major: true, level: true, durationMinutes: true },
      },
      host: {
        select: { id: true, name: true, major: true, selfLevel: true, school: true },
      },
      partner: {
        select: { id: true, name: true, major: true, selfLevel: true, school: true },
      },
      rubrics: {
        select: {
          id: true,
          reviewerId: true,
          targetUserId: true,
          overallScore: true,
          satisfactionRating: true,
          strengths: true,
          improvements: true,
          mentorReviewed: true,
          mentorNote: true,
          createdAt: true,
        },
      },
    },
  });

  const safeSessions = sessions.map((s) => {
    const isParticipant = Boolean(viewer && (s.hostId === viewer.id || s.partnerId === viewer.id));
    return {
      id: s.id,
      scenario: s.scenario,
      host: s.host,
      partner: s.partner,
      major: s.major,
      level: s.level,
      school: s.school,
      ageGroupScope: s.ageGroupScope,
      scheduledAt: s.scheduledAt.toISOString(),
      slotLabel: s.slotLabel,
      meetingUrl: isParticipant ? s.meetingUrl : null,
      status: s.status,
      hostConfirmedComplete: s.hostConfirmedComplete,
      partnerConfirmedComplete: s.partnerConfirmedComplete,
      noRecordingConfirmed: s.noRecordingConfirmed,
      notes: s.notes,
      rubrics: isParticipant ? s.rubrics : [],
    };
  });

  return apiOk({
    sessions: safeSessions,
    viewerScope,
  });
}

async function POST(request: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const eligibility = checkPairingEligibility(guard.user);
  if (!eligibility.allowed) {
    return apiError("PAIRING_NOT_ELIGIBLE", eligibility.reason || "Chưa đủ điều kiện ghép cặp.", 403);
  }

  try {
    const body = (await request.json()) as {
      scenarioId?: unknown;
      scheduledAt?: unknown;
      slotLabel?: unknown;
      notes?: unknown;
      noRecordingConfirmed?: unknown;
    };

    const scenarioId = typeof body.scenarioId === "string" ? body.scenarioId.trim() : "";
    const slotLabel = typeof body.slotLabel === "string" ? body.slotLabel.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 300) : null;

    if (!scenarioId || !slotLabel) {
      return apiError("INVALID_INPUT", "Vui lòng chọn tình huống và khung giờ rảnh.", 400);
    }

    if (body.noRecordingConfirmed !== true) {
      return apiError(
        "NO_RECORDING_REQUIRED",
        "Theo Phụ lục B, bạn cần xác nhận cam kết không ghi âm hoặc ghi hình khi chưa có sự đồng ý.",
        400
      );
    }

    const scenario = await prisma.careerScenario.findUnique({
      where: { id: scenarioId },
    });
    if (!scenario) {
      return apiError("SCENARIO_NOT_FOUND", "Không tìm thấy tình huống nghề nghiệp đã chọn.", 404);
    }

    const parsedDate =
      typeof body.scheduledAt === "string" && body.scheduledAt
        ? new Date(body.scheduledAt)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const scheduledAt = Number.isNaN(parsedDate.getTime())
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : parsedDate;

    const scope = getMatchingScope(guard.user.ageGroup);
    const meetingUrl = generateSafeMeetLink(
      `${guard.user.id}:${scenario.id}:${Date.now()}:${Math.random()}`
    );

    const created = await prisma.practiceSession.create({
      data: {
        scenarioId: scenario.id,
        hostId: guard.user.id,
        major: scenario.major,
        level: guard.user.selfLevel || scenario.level,
        school: guard.user.school,
        ageGroupScope: scope,
        scheduledAt,
        slotLabel: slotLabel.slice(0, 80),
        meetingUrl,
        status: "OPEN",
        noRecordingConfirmed: true,
        notes,
      },
      include: {
        scenario: {
          select: { id: true, slug: true, title: true, major: true, level: true, durationMinutes: true },
        },
        host: {
          select: { id: true, name: true, major: true, selfLevel: true, school: true },
        },
      },
    });

    return apiOk({ session: created }, 201);
  } catch (err) {
    console.error("Create practice session error:", err);
    return apiError("SERVER_ERROR", "Không thể tạo lịch hẹn ghép cặp.", 500);
  }
}
  return { GET, POST };
})();

// === [07] /api/surveys ===
const route_07: Record<string, any> = (() => {
async function GET() {
  await connection();
  const summary = await getSurveyAnalytics();
  return apiOk(summary);
}

async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      customerGroup?: unknown;
      major?: unknown;
      ageGroup?: unknown;
      under18GuardianConsent?: unknown;
      englishLevel?: unknown;
      purposes?: unknown;
      currentMethods?: unknown;
      weeklyFrequency?: unknown;
      careerRelevanceScore?: unknown;
      topDifficulties?: unknown;
      hasDroppedBefore?: unknown;
      dropReason?: unknown;
      productsTried?: unknown;
      productFeedback?: unknown;
      pairWillingnessScore?: unknown;
      preferredFormat?: unknown;
      privacyConcerns?: unknown;
      trialWilling?: unknown;
      trialEmail?: unknown;
      payWilling?: unknown;
      desiredPaidFeatures?: unknown;
      maxMonthlyPriceVnd?: unknown;
      phoneType?: unknown;
      preferPlatform?: unknown;
    };

    const customerGroup =
      body.customerGroup === "N1" || body.customerGroup === "N2" || body.customerGroup === "N3"
        ? body.customerGroup
        : "N1";
    const major = typeof body.major === "string" ? body.major.trim().slice(0, 80) : "";
    const ageGroup =
      body.ageGroup === "UNDER_16" ||
      body.ageGroup === "AGE_16_17" ||
      body.ageGroup === "ADULT_18_PLUS"
        ? body.ageGroup
        : "ADULT_18_PLUS";

    if (!major) {
      return apiError("MAJOR_REQUIRED", "Vui lòng nhập ngành học hoặc lĩnh vực công việc.", 400);
    }

    const isUnder18 = ageGroup === "UNDER_16" || ageGroup === "AGE_16_17";
    if (isUnder18 && body.under18GuardianConsent !== true) {
      return apiError(
        "CONSENT_REQUIRED",
        "Theo mục IV.3 và Phụ lục A (Câu 2), người dưới 18 tuổi cần xác nhận có sự đồng ý của phụ huynh hoặc giáo viên phụ trách.",
        400
      );
    }

    const topDifficulties = Array.isArray(body.topDifficulties)
      ? body.topDifficulties.filter((x): x is string => typeof x === "string").slice(0, 3)
      : [];
    if (topDifficulties.length === 0) {
      return apiError("DIFFICULTIES_REQUIRED", "Vui lòng chọn ít nhất 1 khó khăn ở Câu 7.", 400);
    }

    const clampScale = (v: unknown, fallback: number) =>
      Math.min(5, Math.max(1, Math.round(Number(v) || fallback)));

    const purposes = Array.isArray(body.purposes)
      ? body.purposes.filter((x): x is string => typeof x === "string").slice(0, 6)
      : [];
    const currentMethods = Array.isArray(body.currentMethods)
      ? body.currentMethods.filter((x): x is string => typeof x === "string").slice(0, 6)
      : [];
    const productsTried = Array.isArray(body.productsTried)
      ? body.productsTried.filter((x): x is string => typeof x === "string").slice(0, 8)
      : [];
    const desiredPaidFeatures = Array.isArray(body.desiredPaidFeatures)
      ? body.desiredPaidFeatures.filter((x): x is string => typeof x === "string").slice(0, 8)
      : [];

    const trialWilling = Boolean(body.trialWilling);
    const trialEmail =
      typeof body.trialEmail === "string" && body.trialEmail.trim()
        ? body.trialEmail.trim().slice(0, 120)
        : null;

    if (trialWilling && !trialEmail) {
      return apiError(
        "TRIAL_EMAIL_REQUIRED",
        "Nếu chọn dùng thử 4 tuần (Câu 13), vui lòng để lại email liên hệ.",
        400
      );
    }

    const payWilling = Boolean(body.payWilling);
    const maxMonthlyPriceVnd = payWilling
      ? Math.max(0, Math.min(2000000, Math.round(Number(body.maxMonthlyPriceVnd) || 0)))
      : 0;

    const created = await prisma.surveyResponse.create({
      data: {
        customerGroup,
        major,
        ageGroup,
        under18GuardianConsent: isUnder18 ? true : Boolean(body.under18GuardianConsent),
        englishLevel: clampScale(body.englishLevel, 2),
        purposesJson: JSON.stringify(purposes),
        currentMethodsJson: JSON.stringify(currentMethods),
        weeklyFrequency:
          typeof body.weeklyFrequency === "string"
            ? body.weeklyFrequency.trim().slice(0, 60)
            : "1-2 buổi/tuần",
        careerRelevanceScore: clampScale(body.careerRelevanceScore, 2),
        topDifficultiesJson: JSON.stringify(topDifficulties),
        hasDroppedBefore: Boolean(body.hasDroppedBefore),
        dropReason:
          typeof body.dropReason === "string" ? body.dropReason.trim().slice(0, 400) : null,
        productsTriedJson: JSON.stringify(productsTried),
        productFeedback:
          typeof body.productFeedback === "string"
            ? body.productFeedback.trim().slice(0, 500)
            : null,
        pairWillingnessScore: clampScale(body.pairWillingnessScore, 4),
        preferredFormat:
          body.preferredFormat === "voice" || body.preferredFormat === "text"
            ? body.preferredFormat
            : "video",
        privacyConcerns:
          typeof body.privacyConcerns === "string"
            ? body.privacyConcerns.trim().slice(0, 500)
            : null,
        trialWilling,
        trialEmail,
        payWilling,
        desiredPaidFeaturesJson: JSON.stringify(desiredPaidFeatures),
        maxMonthlyPriceVnd,
        phoneType:
          body.phoneType === "iPhone" || body.phoneType === "Khác" ? body.phoneType : "Android",
        preferPlatform:
          body.preferPlatform === "web" || body.preferPlatform === "both"
            ? body.preferPlatform
            : "app",
      },
    });

    const summary = await getSurveyAnalytics();
    return apiOk({ responseId: created.id, summary }, 201);
  } catch (err) {
    console.error("Submit survey error:", err);
    return apiError("SERVER_ERROR", "Không thể lưu phiếu khảo sát.", 500);
  }
}
  return { GET, POST };
})();

// === [08] /api/taxonomy ===
const route_08: Record<string, any> = (() => {
async function GET(request: NextRequest) {
  const res = await callStorageService<{
    learnerGroups: unknown[];
    institutionTypes: unknown[];
    fields: unknown[];
    totalFields: number;
    totalSpecialties: number;
  }>("/api/v1/taxonomy", {
    method: "GET",
    request,
  });

  if (res.ok && res.data) {
    return apiOk({
      ...res.data,
      contentModules: SPECIALTY_CONTENT_MODULES,
      englishGoals: ENGLISH_USAGE_GOALS,
    });
  }

  // Fallback to static initialized catalog if storage daemon is warming up
  const totalSpecialties = VOCATIONAL_FIELDS_CATALOG.reduce(
    (acc, f) => acc + f.specialties.length,
    0
  );
  return apiOk({
    learnerGroups: LEARNER_TARGET_GROUPS,
    institutionTypes: TRAINING_INSTITUTION_TYPES,
    fields: VOCATIONAL_FIELDS_CATALOG.map((f, idx) => ({
      id: `field-${f.code.toLowerCase()}`,
      code: f.code,
      name: f.name,
      group_name: f.groupName,
      display_order: idx + 1,
      specialties: f.specialties.map((s, sIdx) => ({
        id: `spec-${f.code.toLowerCase()}-${sIdx + 1}`,
        field_code: f.code,
        name: s,
        major_name: f.name,
        is_reviewed: 1,
      })),
    })),
    totalFields: VOCATIONAL_FIELDS_CATALOG.length,
    totalSpecialties,
    contentModules: SPECIALTY_CONTENT_MODULES,
    englishGoals: ENGLISH_USAGE_GOALS,
  });
}

async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const res = await callStorageService("/api/v1/taxonomy/manage", {
      method: "POST",
      user: guard.user,
      request,
      body,
    });

    if (!res.ok) {
      return apiError(
        res.error?.code || "TAXONOMY_UPDATE_ERROR",
        res.error?.message || "Không thể cập nhật danh mục lĩnh vực và chuyên ngành.",
        res.status
      );
    }
    return apiOk(res.data, 201);
  } catch (err) {
    console.error("Taxonomy manage error:", err);
    return apiError("SERVER_ERROR", "Lỗi cập nhật danh mục ngành nghề.", 500);
  }
}
  return { GET, POST };
})();

// === [09] /api/vocab ===
const route_09: Record<string, any> = (() => {
interface VocabInputItem {
  id?: unknown;
  word?: unknown;
  phonetic?: unknown;
  pos?: unknown;
  meaning?: unknown;
  example?: unknown;
  deck?: unknown;
  status?: unknown;
  reviewCount?: unknown;
}

function normalizeStatus(raw: unknown): "learning" | "due" | "mastered" {
  if (raw === "learning" || raw === "due" || raw === "mastered") return raw;
  return "due";
}

function serializeWord(row: {
  sourceKey: string;
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
  deck: string;
  status: string;
  reviewCount: number;
}) {
  return {
    id: row.sourceKey,
    word: row.word,
    phonetic: row.phonetic,
    pos: row.pos,
    meaning: row.meaning,
    example: row.example,
    deck: row.deck,
    status: normalizeStatus(row.status),
    reviewCount: row.reviewCount,
  };
}

async function GET() {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    return apiOk({ authenticated: false, words: [] });
  }

  const rows = await prisma.userVocabWord.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return apiOk({
    authenticated: true,
    words: rows.map(serializeWord),
  });
}

async function POST(request: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as {
      words?: VocabInputItem[];
      word?: VocabInputItem;
    };

    const rawList = Array.isArray(body.words)
      ? body.words
      : body.word
      ? [body.word]
      : [];

    if (rawList.length === 0) {
      return apiError("INVALID_INPUT", "Không có từ vựng nào để lưu.", 400);
    }

    for (const raw of rawList.slice(0, 60)) {
      const word = typeof raw.word === "string" ? raw.word.trim().slice(0, 120) : "";
      const meaning = typeof raw.meaning === "string" ? raw.meaning.trim().slice(0, 300) : "";
      if (!word || !meaning) continue;

      const sourceKey =
        typeof raw.id === "string" && raw.id.trim()
          ? raw.id.trim().slice(0, 100)
          : `custom-${word.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

      await prisma.userVocabWord.upsert({
        where: {
          userId_sourceKey: { userId: guard.user.id, sourceKey },
        },
        update: {
          word,
          phonetic:
            typeof raw.phonetic === "string" && raw.phonetic.trim()
              ? raw.phonetic.trim().slice(0, 100)
              : "/.../",
          pos:
            typeof raw.pos === "string" && raw.pos.trim() ? raw.pos.trim().slice(0, 30) : "noun",
          meaning,
          example:
            typeof raw.example === "string" ? raw.example.trim().slice(0, 400) : "",
          deck:
            typeof raw.deck === "string" && raw.deck.trim()
              ? raw.deck.trim().slice(0, 80)
              : "Sổ tay cá nhân",
        },
        create: {
          userId: guard.user.id,
          sourceKey,
          word,
          phonetic:
            typeof raw.phonetic === "string" && raw.phonetic.trim()
              ? raw.phonetic.trim().slice(0, 100)
              : "/.../",
          pos:
            typeof raw.pos === "string" && raw.pos.trim() ? raw.pos.trim().slice(0, 30) : "noun",
          meaning,
          example:
            typeof raw.example === "string" ? raw.example.trim().slice(0, 400) : "",
          deck:
            typeof raw.deck === "string" && raw.deck.trim()
              ? raw.deck.trim().slice(0, 80)
              : "Sổ tay cá nhân",
          status: normalizeStatus(raw.status),
          reviewCount: Math.max(0, Math.round(Number(raw.reviewCount ?? 0) || 0)),
        },
      });
    }

    const updated = await prisma.userVocabWord.findMany({
      where: { userId: guard.user.id },
      orderBy: { createdAt: "desc" },
    });

    return apiOk({ words: updated.map(serializeWord) });
  } catch (err) {
    console.error("Save vocab error:", err);
    return apiError("SERVER_ERROR", "Không thể lưu từ vựng.", 500);
  }
}
  return { GET, POST };
})();

// === [10] /api/admin/approvals ===
const route_10: Record<string, any> = (() => {
async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const [pendingUsers, allBetaUsers, parentConsents, inviteCodes] = await Promise.all([
    prisma.user.findMany({
      where: { approvalStatus: { in: ["PENDING", "SUSPENDED"] } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        school: true,
        major: true,
        ageGroup: true,
        studentGroup: true,
        approvalStatus: true,
        parentConsentStatus: true,
        inviteCodeUsed: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        school: true,
        major: true,
        ageGroup: true,
        studentGroup: true,
        approvalStatus: true,
        parentConsentStatus: true,
        parentMonitorCode: true,
        inviteCodeUsed: true,
      },
    }),
    prisma.parentConsent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, email: true, school: true, major: true, parentMonitorCode: true } },
      },
    }),
    prisma.inviteCode.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return apiOk({ pendingUsers, allBetaUsers, parentConsents, inviteCodes });
}

async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as {
      code?: unknown;
      major?: unknown;
      teacherName?: unknown;
      maxUses?: unknown;
    };

    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    const major = typeof body.major === "string" ? body.major.trim() : "Tất cả ngành";
    const teacherName =
      typeof body.teacherName === "string" ? body.teacherName.trim() : guard.user.name;
    const maxUses = Math.min(1000, Math.max(1, Math.round(Number(body.maxUses) || 100)));

    if (code.length < 4) {
      return apiError("INVALID_CODE", "Mã mời giáo viên cần tối thiểu 4 ký tự.", 400);
    }

    const exists = await prisma.inviteCode.findUnique({ where: { code } });
    if (exists) {
      return apiError("ALREADY_EXISTS", "Mã mời này đã tồn tại.", 409);
    }

    const created = await prisma.inviteCode.create({
      data: {
        code,
        major,
        teacherName,
        maxUses,
      },
    });

    return apiOk({ inviteCode: created }, 201);
  } catch (err) {
    console.error("Create invite code error:", err);
    return apiError("SERVER_ERROR", "Không thể tạo mã mời.", 500);
  }
}

async function PATCH(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as {
      type?: unknown;
      id?: unknown;
      status?: unknown;
    };

    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return apiError("INVALID_ID", "Thiếu ID bản ghi.", 400);

    if (body.type === "USER_APPROVAL") {
      const status =
        body.status === "APPROVED" || body.status === "SUSPENDED" || body.status === "PENDING"
          ? body.status
          : "APPROVED";
      const updated = await prisma.user.update({
        where: { id },
        data: { approvalStatus: status },
        select: { id: true, approvalStatus: true },
      });
      return apiOk({ user: updated });
    }

    if (body.type === "PARENT_CONSENT") {
      const status =
        body.status === "APPROVED" || body.status === "REVOKED" || body.status === "PENDING"
          ? body.status
          : "APPROVED";
      const consent = await prisma.parentConsent.update({
        where: { id },
        data: {
          status,
          reviewedBy: guard.user.name,
          reviewedAt: new Date(),
        },
      });
      await prisma.user.update({
        where: { id: consent.userId },
        data: { parentConsentStatus: status },
      });
      return apiOk({ consent });
    }

    if (body.type === "INVITE_TOGGLE") {
      const current = await prisma.inviteCode.findUnique({ where: { id } });
      if (!current) return apiError("NOT_FOUND", "Không tìm thấy mã mời.", 404);
      const updated = await prisma.inviteCode.update({
        where: { id },
        data: { isActive: !current.isActive },
      });
      return apiOk({ inviteCode: updated });
    }

    return apiError("INVALID_TYPE", "Loại thao tác không hợp lệ.", 400);
  } catch (err) {
    console.error("Admin approval update error:", err);
    return apiError("SERVER_ERROR", "Không thể cập nhật trạng thái duyệt.", 500);
  }
}
  return { GET, POST, PATCH };
})();

// === [11] /api/admin/community ===
const route_11: Record<string, any> = (() => {
const ALLOWED_GROUPS = new Set([
  "Kinh nghiệm học tập",
  "Hỏi bài - Giải đáp",
  "Luyện đề - Thi cử",
  "Luyện nghe & Dictation",
]);

async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const posts = await prisma.communityPost.findMany({
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: {
      user: { select: { name: true, email: true, role: true } },
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      _count: { select: { likes: true, comments: true, votes: true } },
    },
  });

  return apiOk({ posts });
}

async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as {
      title?: unknown;
      content?: unknown;
      group?: unknown;
      authorBadge?: unknown;
      isPinned?: unknown;
    };

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!title || content.length < 4) {
      return apiError("INVALID_INPUT", "Vui lòng nhập tiêu đề và nội dung tối thiểu 4 ký tự.", 400);
    }

    const rawGroup = typeof body.group === "string" ? body.group.trim() : "Hỏi bài - Giải đáp";
    const group = ALLOWED_GROUPS.has(rawGroup) ? rawGroup : "Hỏi bài - Giải đáp";
    const authorBadge =
      typeof body.authorBadge === "string" && body.authorBadge.trim()
        ? body.authorBadge.trim().slice(0, 32)
        : "Admin";

    const post = await prisma.communityPost.create({
      data: {
        userId: guard.user.id,
        group,
        title: title.slice(0, 140),
        content: content.slice(0, 2000),
        authorBadge,
        isPinned: Boolean(body.isPinned),
      },
      include: {
        user: { select: { name: true, email: true, role: true } },
        comments: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true, email: true } } },
        },
        _count: { select: { likes: true, comments: true, votes: true } },
      },
    });

    // Tự động lưu bài đăng cộng đồng từ Admin (Phần V.2)
    void emitAutoArchiveEvent({
      eventType: "POST_CREATED",
      itemType: "COMMUNITY_POST",
      sourceId: post.id,
      payload: {
        title: post.title,
        content: post.content,
        authorId: guard.user.id,
        authorName: guard.user.name,
        authorEmail: guard.user.email,
        creatorId: guard.user.id,
        creatorName: guard.user.name,
        ownerId: guard.user.id,
        sourceCreatedAt: post.createdAt.toISOString(),
        metadata: {
          group: post.group,
          authorBadge: post.authorBadge,
          isPinned: post.isPinned,
        },
        changeSummary: "Tự động lưu khi Admin tạo bài đăng cộng đồng",
      },
    });

    return apiOk({ post }, 201);
  } catch (err) {
    console.error("Admin create community post error:", err);
    return apiError("SERVER_ERROR", "Không thể đăng bài viết quản trị.", 500);
  }
}
  return { GET, POST };
})();

// === [12] /api/admin/documents ===
const route_12: Record<string, any> = (() => {
async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const [documents, categories] = await Promise.all([
    prisma.document.findMany({
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.documentCategory.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { documents: true } } },
    }),
  ]);

  return apiOk({ documents, categories });
}

async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as {
      kind?: "document" | "category";
      name?: unknown;
      icon?: unknown;
      title?: unknown;
      slug?: unknown;
      description?: unknown;
      categoryId?: unknown;
      level?: unknown;
      fileType?: unknown;
      pageCount?: unknown;
      fileSizeLabel?: unknown;
      isFree?: unknown;
      priceVnd?: unknown;
      externalUrl?: unknown;
      previewContent?: unknown;
      tags?: unknown;
      isFeatured?: unknown;
    };

    if (body.kind === "category") {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const description = typeof body.description === "string" ? body.description.trim() : "";
      const icon = typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : "FileText";
      if (!name || !description) {
        return apiError("INVALID_INPUT", "Vui lòng nhập tên và mô tả danh mục.", 400);
      }
      const baseSlug = slugifyVietnamese(name);
      const exists = await prisma.documentCategory.findUnique({ where: { slug: baseSlug } });
      const slug = exists ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;
      const order = (await prisma.documentCategory.count()) + 1;
      const category = await prisma.documentCategory.create({
        data: { name, slug, description, icon, order },
        include: { _count: { select: { documents: true } } },
      });
      return apiOk({ category }, 201);
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const categoryId = typeof body.categoryId === "string" ? body.categoryId.trim() : "";

    if (!title || !description || !categoryId) {
      return apiError("INVALID_INPUT", "Vui lòng nhập tiêu đề, mô tả và chọn danh mục.", 400);
    }

    const catExists = await prisma.documentCategory.findUnique({ where: { id: categoryId } });
    if (!catExists) {
      return apiError("CATEGORY_NOT_FOUND", "Danh mục tài liệu không tồn tại.", 404);
    }

    const baseSlug = slugifyVietnamese(
      typeof body.slug === "string" && body.slug.trim() ? body.slug : title
    );
    const existingSlug = await prisma.document.findUnique({ where: { slug: baseSlug } });
    const slug = existingSlug ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const tags = Array.isArray(body.tags)
      ? body.tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
      : typeof body.tags === "string"
      ? body.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const isFree = body.isFree !== false;
    const priceVnd = isFree ? 0 : clampInt(body.priceVnd, 0, 10000000, 0);

    const created = await prisma.document.create({
      data: {
        title,
        slug,
        description,
        categoryId,
        level:
          typeof body.level === "string" && body.level.trim()
            ? body.level.trim()
            : "Mọi trình độ",
        fileType:
          typeof body.fileType === "string" && body.fileType.trim()
            ? body.fileType.trim().toUpperCase()
            : "PDF",
        pageCount: clampInt(body.pageCount, 1, 2000, 24),
        fileSizeLabel:
          typeof body.fileSizeLabel === "string" && body.fileSizeLabel.trim()
            ? body.fileSizeLabel.trim()
            : "2.4 MB",
        isFree,
        priceVnd,
        externalUrl:
          typeof body.externalUrl === "string" && body.externalUrl.trim()
            ? body.externalUrl.trim()
            : null,
        previewContent:
          typeof body.previewContent === "string" && body.previewContent.trim()
            ? body.previewContent.trim()
            : description,
        tagsJson: JSON.stringify(tags),
        isFeatured: Boolean(body.isFeatured),
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    // Tự động lưu vào Kho lưu trữ mã nguồn (Phần V.1 & V.4)
    void emitAutoArchiveEvent({
      eventType: "DOCUMENT_CREATED",
      itemType: "DOCUMENT",
      sourceId: created.id,
      payload: {
        title: created.title,
        content: `${created.description}\n\n${created.previewContent}`.trim(),
        authorId: guard.user.id,
        authorName: guard.user.name,
        authorEmail: guard.user.email,
        creatorId: guard.user.id,
        creatorName: guard.user.name,
        ownerId: guard.user.id,
        sourceStatus: "ACTIVE",
        externalUrl: created.externalUrl,
        fileFormat: created.fileType,
        sourceCreatedAt: created.createdAt.toISOString(),
        metadata: {
          slug: created.slug,
          categoryName: created.category.name,
          level: created.level,
          pageCount: created.pageCount,
          fileSizeLabel: created.fileSizeLabel,
          isFree: created.isFree,
          tagsJson: created.tagsJson,
        },
        changeSummary: "Tự động lưu khi đăng tài liệu mới",
      },
    });

    return apiOk({ document: created }, 201);
  } catch (err) {
    console.error("Admin create document error:", err);
    return apiError("SERVER_ERROR", "Không thể tạo tài liệu mới.", 500);
  }
}
  return { GET, POST };
})();

// === [13] /api/admin/donations ===
const route_13: Record<string, any> = (() => {
async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const donations = await prisma.donationRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  return apiOk({ donations });
}

async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as {
      donorName?: unknown;
      amountVnd?: unknown;
      message?: unknown;
      status?: unknown;
    };

    const amountVnd = clampInt(body.amountVnd, 1000, 500000000, 50000);
    const donorName =
      typeof body.donorName === "string" && body.donorName.trim()
        ? body.donorName.trim().slice(0, 80)
        : "Bạn học ủng hộ trực tiếp";
    const message =
      typeof body.message === "string" && body.message.trim()
        ? body.message.trim().slice(0, 200)
        : null;
    const status =
      body.status === "PAID" || body.status === "CANCELLED" ? body.status : "PENDING";

    const orderCode = `LC${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const donation = await prisma.donationRecord.create({
      data: {
        orderCode,
        amountVnd,
        donorName,
        message,
        status,
        paidAt: status === "PAID" ? new Date() : null,
      },
    });

    return apiOk({ donation }, 201);
  } catch (err) {
    console.error("Admin create donation error:", err);
    return apiError("SERVER_ERROR", "Không thể tạo bản ghi ủng hộ.", 500);
  }
}
  return { GET, POST };
})();

// === [14] /api/admin/exams ===
const route_14: Record<string, any> = (() => {
async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const sets = await prisma.examSet.findMany({
    orderBy: { order: "asc" },
    include: {
      tests: {
        orderBy: { order: "asc" },
        include: {
          _count: { select: { questions: true, attempts: true } },
        },
      },
    },
  });

  return apiOk({ sets });
}

async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as {
      kind?: "set" | "test" | "question";
      title?: unknown;
      badge?: unknown;
      description?: unknown;
      examSetId?: unknown;
      durationMinutes?: unknown;
      difficulty?: unknown;
      isHot?: unknown;
      examTestId?: unknown;
      part?: unknown;
      promptText?: unknown;
      options?: unknown;
      correctIndex?: unknown;
      explanation?: unknown;
      audioScript?: unknown;
    };

    if (body.kind === "set") {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const description = typeof body.description === "string" ? body.description.trim() : "";
      if (!title || !description) {
        return apiError("INVALID_INPUT", "Vui lòng nhập tên bộ đề và mô tả.", 400);
      }

      const baseSlug = slugifyVietnamese(title);
      const exists = await prisma.examSet.findUnique({ where: { slug: baseSlug } });
      const slug = exists ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;
      const order = (await prisma.examSet.count()) + 1;

      const set = await prisma.examSet.create({
        data: {
          title,
          slug,
          badge: typeof body.badge === "string" && body.badge.trim() ? body.badge.trim() : null,
          description,
          order,
        },
        include: { tests: true },
      });
      return apiOk({ set }, 201);
    }

    if (body.kind === "question") {
      const examTestId = typeof body.examTestId === "string" ? body.examTestId.trim() : "";
      const promptText = typeof body.promptText === "string" ? body.promptText.trim() : "";
      const options = Array.isArray(body.options)
        ? body.options.map((o) => String(o).trim()).filter(Boolean)
        : [];
      if (!examTestId || !promptText || options.length < 3) {
        return apiError(
          "INVALID_INPUT",
          "Vui lòng chọn đề thi, nhập câu hỏi và tối thiểu 3 phương án trả lời.",
          400
        );
      }

      const test = await prisma.examTest.findUnique({ where: { id: examTestId } });
      if (!test) return apiError("NOT_FOUND", "Không tìm thấy đề thi.", 404);

      const part = clampInt(body.part, 1, 7, 5);
      const correctIndex = clampInt(body.correctIndex, 0, options.length - 1, 0);
      const explanation =
        typeof body.explanation === "string" && body.explanation.trim()
          ? body.explanation.trim()
          : "Chọn đáp án phù hợp theo ngữ cảnh và cấu trúc TOEIC.";

      const createdQuestion = await prisma.$transaction(async (tx) => {
        const currentMax = await tx.examQuestion.aggregate({
          where: { examTestId },
          _max: { number: true },
        });
        const nextNumber = (currentMax._max.number ?? 0) + 1;

        const q = await tx.examQuestion.create({
          data: {
            examTestId,
            number: nextNumber,
            part,
            promptText,
            audioScript:
              typeof body.audioScript === "string" && body.audioScript.trim()
                ? body.audioScript.trim()
                : null,
            optionsJson: JSON.stringify(options),
            correctIndex,
            explanation,
          },
        });

        await tx.examTest.update({
          where: { id: examTestId },
          data: {
            totalQuestions: { increment: 1 },
            ...(part <= 4 ? { listeningCount: { increment: 1 } } : { readingCount: { increment: 1 } }),
          },
        });

        return q;
      });

      return apiOk({ question: createdQuestion }, 201);
    }

    // Default: create ExamTest inside an ExamSet
    const examSetId = typeof body.examSetId === "string" ? body.examSetId.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : "Đề luyện tập TOEIC chuẩn ETS có đáp án giải thích chi tiết.";

    if (!examSetId || !title) {
      return apiError("INVALID_INPUT", "Vui lòng chọn bộ đề và nhập tên đề thi.", 400);
    }

    const setExists = await prisma.examSet.findUnique({ where: { id: examSetId } });
    if (!setExists) return apiError("NOT_FOUND", "Bộ đề không tồn tại.", 404);

    const baseSlug = slugifyVietnamese(title);
    const exists = await prisma.examTest.findUnique({ where: { slug: baseSlug } });
    const slug = exists ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;
    const order = (await prisma.examTest.count({ where: { examSetId } })) + 1;

    const test = await prisma.examTest.create({
      data: {
        examSetId,
        title,
        slug,
        description,
        durationMinutes: clampInt(body.durationMinutes, 5, 120, 25),
        totalQuestions: 0,
        listeningCount: 0,
        readingCount: 0,
        difficulty:
          typeof body.difficulty === "string" && body.difficulty.trim()
            ? body.difficulty.trim()
            : "Trung cấp 600+",
        isHot: Boolean(body.isHot),
        order,
      },
      include: { _count: { select: { questions: true, attempts: true } } },
    });

    return apiOk({ test }, 201);
  } catch (err) {
    console.error("Admin exam create error:", err);
    return apiError("SERVER_ERROR", "Không thể tạo nội dung đề thi.", 500);
  }
}
  return { GET, POST };
})();

// === [15] /api/admin/grammar ===
const route_15: Record<string, any> = (() => {
async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const topics = await prisma.grammarTopic.findMany({
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          topicId: true,
          slug: true,
          title: true,
          order: true,
          _count: { select: { progress: true } },
        },
      },
    },
  });

  return apiOk({ topics });
}

async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as {
      kind?: "topic" | "lesson";
      title?: unknown;
      description?: unknown;
      targetLevel?: unknown;
      estimatedMinutes?: unknown;
      topicId?: unknown;
      summaryNote?: unknown;
      formula?: unknown;
      example?: unknown;
      exampleVi?: unknown;
      trapTip?: unknown;
    };

    if (body.kind === "topic") {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const description = typeof body.description === "string" ? body.description.trim() : "";
      if (!title || !description) {
        return apiError("INVALID_INPUT", "Vui lòng nhập tiêu đề và mô tả chặng ngữ pháp.", 400);
      }

      const baseSlug = slugifyVietnamese(title);
      const exists = await prisma.grammarTopic.findUnique({ where: { slug: baseSlug } });
      const slug = exists ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;
      const maxOrder = await prisma.grammarTopic.count();

      const topic = await prisma.grammarTopic.create({
        data: {
          title,
          slug,
          description,
          targetLevel:
            typeof body.targetLevel === "string" && body.targetLevel.trim()
              ? body.targetLevel.trim()
              : "450+",
          estimatedMinutes: clampInt(body.estimatedMinutes, 5, 180, 20),
          order: maxOrder + 1,
        },
        include: { lessons: true },
      });

      return apiOk({ topic }, 201);
    }

    const topicId = typeof body.topicId === "string" ? body.topicId.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!topicId || !title) {
      return apiError("INVALID_INPUT", "Vui lòng chọn chặng và nhập tiêu đề bài học.", 400);
    }

    const topicExists = await prisma.grammarTopic.findUnique({ where: { id: topicId } });
    if (!topicExists) {
      return apiError("NOT_FOUND", "Chặng ngữ pháp không tồn tại.", 404);
    }

    const baseSlug = slugifyVietnamese(title);
    const exists = await prisma.grammarLesson.findUnique({ where: { slug: baseSlug } });
    const slug = exists ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;
    const order = (await prisma.grammarLesson.count({ where: { topicId } })) + 1;

    const formula =
      typeof body.formula === "string" && body.formula.trim()
        ? body.formula.trim()
        : "S + V + O (áp dụng nhận diện vị trí từ loại trong 3 giây)";
    const summaryNote =
      typeof body.summaryNote === "string" && body.summaryNote.trim()
        ? body.summaryNote.trim()
        : `Trọng tâm ghi nhớ cho bài: ${title}`;
    const exampleEn =
      typeof body.example === "string" && body.example.trim()
        ? body.example.trim()
        : "The team completed the quarterly report ahead of schedule.";
    const exampleVi =
      typeof body.exampleVi === "string" && body.exampleVi.trim()
        ? body.exampleVi.trim()
        : "Nhóm đã hoàn thành báo cáo quý sớm hơn lịch trình.";
    const trapTip =
      typeof body.trapTip === "string" && body.trapTip.trim()
        ? body.trapTip.trim()
        : `Kiểm tra kỹ từ đứng ngay trước và sau chỗ trống theo công thức ${formula}.`;

    const lesson = await prisma.grammarLesson.create({
      data: {
        topicId,
        title,
        slug,
        order,
        knowledgeJson: JSON.stringify([
          {
            heading: `1. Trọng tâm ${title}`,
            summary: summaryNote,
            formula,
            examples: [{ en: exampleEn, vi: exampleVi }],
            trapTip,
          },
        ]),
        vocabJson: JSON.stringify([
          {
            word: "schedule",
            ipa: "/ˈskedʒ.uːl/",
            pos: "n./v.",
            meaning: "lịch trình, lên lịch",
            example: exampleEn,
          },
        ]),
        testsJson: JSON.stringify([
          {
            id: `q-${Date.now()}`,
            prompt: "The supervisor will review the final ______ before Friday afternoon.",
            options: ["submit", "submission", "submitted", "submitting"],
            correctIndex: 1,
            explanation: "Sau tính từ 'final' cần một danh từ làm tân ngữ -> 'submission'.",
          },
        ]),
        summaryJson: JSON.stringify({
          takeaways: [summaryNote, `Công thức nhanh: ${formula}`],
          commonTraps: [trapTip],
        }),
      },
      select: {
        id: true,
        topicId: true,
        slug: true,
        title: true,
        order: true,
        _count: { select: { progress: true } },
      },
    });

    return apiOk({ lesson }, 201);
  } catch (err) {
    console.error("Admin grammar create error:", err);
    return apiError("SERVER_ERROR", "Không thể tạo nội dung ngữ pháp.", 500);
  }
}
  return { GET, POST };
})();

// === [16] /api/admin/overview ===
const route_16: Record<string, any> = (() => {
async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const overview = await getAdminOverviewData();
  return apiOk(overview);
}
  return { GET };
})();

// === [17] /api/admin/safety ===
const route_17: Record<string, any> = (() => {
async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const [reports, sessions, rubrics, deletionRequests, kpis] = await Promise.all([
    prisma.safetyReport.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 50,
      include: {
        reporter: { select: { name: true, email: true } },
        reportedUser: { select: { id: true, name: true, email: true, approvalStatus: true } },
      },
    }),
    prisma.practiceSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        scenario: { select: { title: true, major: true } },
        host: { select: { name: true, ageGroup: true, school: true } },
        partner: { select: { name: true, ageGroup: true, school: true } },
      },
    }),
    prisma.peerRubricReview.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        reviewer: { select: { name: true } },
        targetUser: { select: { name: true } },
        session: { select: { major: true, slotLabel: true } },
      },
    }),
    prisma.dataDeletionRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    getPhase0bKpis(),
  ]);

  return apiOk({ reports, sessions, rubrics, deletionRequests, kpis });
}

async function PATCH(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as {
      type?: unknown;
      id?: unknown;
      status?: unknown;
      resolutionNote?: unknown;
      suspendReportedUser?: unknown;
      mentorNote?: unknown;
    };

    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return apiError("INVALID_ID", "Thiếu ID bản ghi.", 400);

    if (body.type === "REPORT") {
      const status =
        body.status === "REVIEWED" ||
        body.status === "ACTION_TAKEN" ||
        body.status === "DISMISSED"
          ? body.status
          : "REVIEWED";
      const resolutionNote =
        typeof body.resolutionNote === "string" ? body.resolutionNote.trim().slice(0, 400) : null;

      const updated = await prisma.safetyReport.update({
        where: { id },
        data: {
          status,
          resolutionNote,
          handledBy: guard.user.name,
        },
      });

      if (body.suspendReportedUser === true && updated.reportedUserId) {
        await prisma.user.update({
          where: { id: updated.reportedUserId },
          data: { approvalStatus: "SUSPENDED" },
        });
      }

      return apiOk({ report: updated });
    }

    if (body.type === "MENTOR_RUBRIC") {
      const mentorNote =
        typeof body.mentorNote === "string" ? body.mentorNote.trim().slice(0, 400) : null;
      const updated = await prisma.peerRubricReview.update({
        where: { id },
        data: {
          mentorReviewed: true,
          mentorNote: mentorNote || `Mentor ${guard.user.name} đã rà soát mẫu.`,
        },
      });
      return apiOk({ rubric: updated });
    }

    return apiError("INVALID_TYPE", "Thao tác không hợp lệ.", 400);
  } catch (err) {
    console.error("Admin safety update error:", err);
    return apiError("SERVER_ERROR", "Không thể xử lý yêu cầu kiểm duyệt.", 500);
  }
}
  return { GET, PATCH };
})();

// === [18] /api/admin/scenarios ===
const route_18: Record<string, any> = (() => {
async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const scenarios = await prisma.careerScenario.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { sessions: true } } },
  });

  return apiOk({ scenarios });
}

async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as {
      title?: unknown;
      major?: unknown;
      level?: unknown;
      summary?: unknown;
      authorName?: unknown;
      reviewedByTeacher?: unknown;
      sourceAttribution?: unknown;
      isFree?: unknown;
      vocabWord?: unknown;
      vocabMeaning?: unknown;
      phraseEn?: unknown;
      phraseVi?: unknown;
      roleATitle?: unknown;
      roleBTitle?: unknown;
    };

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const major = typeof body.major === "string" ? body.major.trim() : "Tin học";
    const level = typeof body.level === "string" ? body.level.trim() : "Cơ bản (A2)";
    const summary = typeof body.summary === "string" ? body.summary.trim() : "";

    if (title.length < 5 || summary.length < 10) {
      return apiError("INVALID_INPUT", "Vui lòng nhập tiêu đề và mô tả tình huống chi tiết.", 400);
    }

    const baseSlug = slugifyVietnamese(title) || `tinh-huong-${Date.now()}`;
    const existing = await prisma.careerScenario.findUnique({ where: { slug: baseSlug } });
    const slug = existing ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const vocab = [
      {
        word: typeof body.vocabWord === "string" && body.vocabWord.trim() ? body.vocabWord.trim() : "checklist",
        phonetic: "/ˈtʃek.lɪst/",
        pos: "noun",
        meaning:
          typeof body.vocabMeaning === "string" && body.vocabMeaning.trim()
            ? body.vocabMeaning.trim()
            : "bảng kiểm tra quy trình",
        example: "Please review the safety checklist before starting the task.",
      },
    ];

    const phrases = [
      {
        en:
          typeof body.phraseEn === "string" && body.phraseEn.trim()
            ? body.phraseEn.trim()
            : "Could you confirm the specifications before we proceed?",
        vi:
          typeof body.phraseVi === "string" && body.phraseVi.trim()
            ? body.phraseVi.trim()
            : "Bạn xác nhận giúp thông số trước khi chúng ta tiếp tục nhé?",
        context: "Xác nhận thông tin công việc rõ ràng.",
      },
    ];

    const dialogue = [
      {
        role: "A",
        speakerName: "Thành viên A",
        en: phrases[0].en,
        vi: phrases[0].vi,
      },
      {
        role: "B",
        speakerName: "Thành viên B",
        en: "Yes, everything matches our plan. Let's proceed carefully.",
        vi: "Vâng, mọi thứ khớp với kế hoạch rồi. Hãy tiến hành cẩn thận nhé.",
      },
    ];

    const roleA = {
      title:
        typeof body.roleATitle === "string" && body.roleATitle.trim()
          ? body.roleATitle.trim()
          : "Vai A · Người trình bày / Kỹ thuật viên",
      goal: "Trình bày vấn đề rõ ràng và sử dụng đúng thuật ngữ chuyên ngành.",
      tasks: ["Mở đầu đúng ngữ cảnh nghề", "Nêu tối thiểu 2 thuật ngữ của tình huống", "Xác nhận lại bước tiếp theo"],
    };

    const roleB = {
      title:
        typeof body.roleBTitle === "string" && body.roleBTitle.trim()
          ? body.roleBTitle.trim()
          : "Vai B · Quản lý / Khách hàng",
      goal: "Đặt câu hỏi làm rõ thông số và chốt phương án xử lý.",
      tasks: ["Hỏi làm rõ chi tiết kỹ thuật", "Kiểm tra thời hạn hoặc tiêu chuẩn an toàn"],
    };

    const count = await prisma.careerScenario.count();
    const created = await prisma.careerScenario.create({
      data: {
        slug,
        title,
        major,
        level,
        summary,
        durationMinutes: 15,
        isFree: body.isFree !== false,
        isClosedBeta: true,
        vocabJson: JSON.stringify(vocab),
        phrasesJson: JSON.stringify(phrases),
        dialogueJson: JSON.stringify(dialogue),
        roleAJson: JSON.stringify(roleA),
        roleBJson: JSON.stringify(roleB),
        rubricJson: JSON.stringify(DEFAULT_PRACTICE_RUBRIC),
        authorName:
          typeof body.authorName === "string" && body.authorName.trim()
            ? body.authorName.trim()
            : guard.user.name,
        reviewedByTeacher:
          typeof body.reviewedByTeacher === "string" && body.reviewedByTeacher.trim()
            ? body.reviewedByTeacher.trim()
            : "GV chuyên môn VSVC (Đã rà soát)",
        sourceAttribution:
          typeof body.sourceAttribution === "string" && body.sourceAttribution.trim()
            ? body.sourceAttribution.trim()
            : "Biên soạn nội bộ nhóm dự án VSVC.",
        order: count + 1,
      },
    });

    return apiOk({ scenario: created }, 201);
  } catch (err) {
    console.error("Create scenario error:", err);
    return apiError("SERVER_ERROR", "Không thể tạo tình huống nghề mới.", 500);
  }
}

async function DELETE(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const id = (request.nextUrl.searchParams.get("id") || "").trim();
  if (!id) return apiError("INVALID_ID", "Thiếu ID tình huống.", 400);

  await prisma.careerScenario.delete({ where: { id } });
  return apiOk({ deleted: true });
}
  return { GET, POST, DELETE };
})();

// === [19] /api/admin/storage ===
const route_19: Record<string, any> = (() => {
async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const res = await callStorageService<{
    stats: Record<string, unknown>;
    systemStatus: {
      initialImportState?: { hasCompletedInitialImport?: boolean; status?: string };
      [key: string]: unknown;
    };
    backups: unknown[];
  }>("/api/v1/overview", {
    method: "GET",
    user: guard.user,
    request,
  });

  if (!res.ok || !res.data) {
    return apiError(
      res.error?.code || "STORAGE_OVERVIEW_ERROR",
      res.error?.message || "Không thể tải tổng quan Kho lưu trữ mã nguồn.",
      res.status
    );
  }

  // If initial import has not been run yet or had 0 records because storage service didn't have direct path, run it now
  const impState = res.data.systemStatus?.initialImportState;
  const totalItems = Number(res.data.stats?.totalItems || 0);
  if (!impState?.hasCompletedInitialImport || totalItems === 0) {
    const sourceRecords = await collectExistingWebsiteRecordsForImport();
    await callStorageService("/api/v1/import/run", {
      method: "POST",
      user: guard.user,
      request,
      body: { sourceRecords },
    });
    const refreshed = await callStorageService("/api/v1/overview", {
      method: "GET",
      user: guard.user,
      request,
    });
    if (refreshed.ok && refreshed.data) {
      return apiOk(refreshed.data);
    }
  }

  return apiOk(res.data);
}
  return { GET };
})();

// === [20] /api/admin/surveys ===
const route_20: Record<string, any> = (() => {
async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const [analytics, responses] = await Promise.all([
    getSurveyAnalytics(),
    prisma.surveyResponse.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return apiOk({ analytics, responses });
}
  return { GET };
})();

// === [21] /api/admin/users ===
const route_21: Record<string, any> = (() => {
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const q = (request.nextUrl.searchParams.get("q") || "").trim();
  const roleParam = request.nextUrl.searchParams.get("role") || "";

  const users = await prisma.user.findMany({
    where: {
      ...(roleParam === "ADMIN" || roleParam === "USER" ? { role: roleParam } : {}),
      ...(q
        ? {
            OR: [{ name: { contains: q } }, { email: { contains: q } }],
          }
        : {}),
    },
    orderBy: [{ role: "asc" }, { xp: "desc" }],
    take: 100,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      xp: true,
      streakDays: true,
      targetScore: true,
      createdAt: true,
      _count: {
        select: {
          examAttempts: true,
          savedDocuments: true,
          vocabWords: true,
        },
      },
    },
  });

  return apiOk({ users });
}

async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as {
      email?: unknown;
      name?: unknown;
      role?: unknown;
      xp?: unknown;
      streakDays?: unknown;
      targetScore?: unknown;
    };

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!EMAIL_RE.test(email) || name.length < 2) {
      return apiError("INVALID_INPUT", "Vui lòng nhập email hợp lệ và họ tên (tối thiểu 2 ký tự).", 400);
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return apiError("ALREADY_EXISTS", "Email này đã tồn tại trong hệ thống.", 409);
    }

    const role = body.role === "ADMIN" ? "ADMIN" : "USER";
    const user = await prisma.user.create({
      data: {
        email,
        name: name.slice(0, 60),
        role,
        xp: clampInt(body.xp, 0, 1000000, 0),
        streakDays: clampInt(body.streakDays, 0, 3650, 1),
        targetScore: clampInt(body.targetScore, 300, 990, 650),
        lastActiveDate: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        xp: true,
        streakDays: true,
        targetScore: true,
        createdAt: true,
        _count: {
          select: {
            examAttempts: true,
            savedDocuments: true,
            vocabWords: true,
          },
        },
      },
    });

    return apiOk({ user }, 201);
  } catch (err) {
    console.error("Admin create user error:", err);
    return apiError("SERVER_ERROR", "Không thể tạo tài khoản mới.", 500);
  }
}
  return { GET, POST };
})();

// === [22] /api/auth/google ===
const route_22: Record<string, any> = (() => {
async function GET(request: NextRequest) {
  await connection();
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

  if (!clientId) {
    return NextResponse.redirect(new URL("/login?oauth=unconfigured", siteUrl));
  }

  const state = crypto.randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("lc_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  const redirectUri = `${siteUrl.replace(/\/$/, "")}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
  return { GET };
})();

// === [23] /api/auth/login ===
const route_23: Record<string, any> = (() => {
async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
      guestSavedDocIds?: unknown;
    };

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return apiError("INVALID_INPUT", "Vui lòng nhập đầy đủ email và mật khẩu.", 400);
    }

    const userRecord = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
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

    if (!userRecord) {
      return apiError("INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng.", 401);
    }

    if (!userRecord.passwordHash) {
      return apiError(
        "PASSWORD_NOT_SET",
        "Tài khoản này được tạo bằng Google hoặc Email OTP nên chưa có mật khẩu. Vui lòng đăng nhập bằng OTP 6 số rồi đặt mật khẩu trong Kho cá nhân.",
        401
      );
    }

    if (!verifyPassword(password, userRecord.passwordHash)) {
      return apiError("INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng.", 401);
    }

    if (userRecord.approvalStatus === "SUSPENDED") {
      return apiError(
        "ACCOUNT_SUSPENDED",
        "Tài khoản đang bị tạm khóa do vi phạm nội quy thử nghiệm kín.",
        403
      );
    }

    await mergeGuestSavedDocs(userRecord.id, body.guestSavedDocIds);

    await setSessionCookie({
      sub: userRecord.id,
      email: userRecord.email,
      role: userRecord.role,
    });

    const { passwordHash: _omitted, ...publicUser } = userRecord;
    void _omitted;
    return apiOk({ user: publicUser });
  } catch (err) {
    console.error("Password login error:", err);
    return apiError("SERVER_ERROR", "Đăng nhập thất bại. Vui lòng thử lại.", 500);
  }
}
  return { POST };
})();

// === [24] /api/auth/logout ===
const route_24: Record<string, any> = (() => {
async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const vaultToken = await getVaultSessionToken();

  if (user && vaultToken) {
    await callStorageService("/api/v1/access/logout", {
      method: "POST",
      user,
      vaultToken,
      request,
    }).catch(() => {});
  }

  await clearVaultSessionCookie();
  await clearSessionCookie();
  return apiOk({ loggedOut: true });
}
  return { POST };
})();

// === [25] /api/auth/me ===
const route_25: Record<string, any> = (() => {
async function GET() {
  const user = await getCurrentUser();
  return apiOk({
    authenticated: Boolean(user),
    user,
  });
}

async function PATCH(request: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) {
    return apiError(guard.code, guard.message, guard.status);
  }

  try {
    const body = (await request.json()) as {
      name?: unknown;
      targetScore?: unknown;
      dateOfBirth?: unknown;
      school?: unknown;
      major?: unknown;
      studentGroup?: unknown;
      selfLevel?: unknown;
      availableSlots?: unknown;
      inviteCode?: unknown;
      guardianName?: unknown;
      guardianRelation?: unknown;
      guardianContact?: unknown;
      acceptBetaRules?: unknown;
      acceptDataPolicy?: unknown;
      currentPassword?: unknown;
      newPassword?: unknown;
    };

    const nextName =
      typeof body.name === "string" && body.name.trim().length >= 2
        ? body.name.trim().slice(0, 80)
        : undefined;

    let nextTarget: number | undefined;
    if (body.targetScore !== undefined) {
      const parsed = Math.round(Number(body.targetScore) / 5) * 5;
      if (!Number.isFinite(parsed) || parsed < 300 || parsed > 990) {
        return apiError("INVALID_TARGET", "Mục tiêu điểm TOEIC hợp lệ từ 300 đến 990.", 400);
      }
      nextTarget = parsed;
    }

    let nextDob: Date | undefined;
    let nextAgeGroup: string | undefined;
    let nextParentConsentRequired: boolean | undefined;
    let nextParentConsentStatus: string | undefined;
    let nextParentMonitorCode: string | undefined;

    if (typeof body.dateOfBirth === "string" && body.dateOfBirth.trim()) {
      const parsedDob = new Date(`${body.dateOfBirth.trim()}T00:00:00.000Z`);
      if (Number.isNaN(parsedDob.getTime()) || parsedDob > new Date()) {
        return apiError("INVALID_DOB", "Ngày sinh không hợp lệ.", 400);
      }
      nextDob = parsedDob;
      nextAgeGroup = computeAgeGroup(parsedDob);
      const minor = isMinorAgeGroup(nextAgeGroup);
      nextParentConsentRequired = minor;
      if (minor) {
        if (guard.user.parentConsentStatus === "NOT_REQUIRED") {
          nextParentConsentStatus = "PENDING";
        }
        if (!guard.user.parentMonitorCode) {
          nextParentMonitorCode = generateParentMonitorCode();
        }
      } else {
        nextParentConsentStatus = "NOT_REQUIRED";
      }
    }

    const effectiveAgeGroup = nextAgeGroup ?? guard.user.ageGroup;
    const guardianName =
      typeof body.guardianName === "string" ? body.guardianName.trim().slice(0, 80) : undefined;
    const guardianRelation =
      typeof body.guardianRelation === "string"
        ? body.guardianRelation.trim().slice(0, 40)
        : undefined;
    const guardianContact =
      typeof body.guardianContact === "string"
        ? body.guardianContact.trim().slice(0, 80)
        : undefined;

    if (
      effectiveAgeGroup === "UNDER_16" &&
      !(guardianName ?? guard.user.guardianName) &&
      !(guardianContact ?? guard.user.guardianContact)
    ) {
      return apiError(
        "GUARDIAN_REQUIRED_UNDER_16",
        "Theo Nghị định 147/2024/NĐ-CP, học viên dưới 16 tuổi phải khai họ tên và liên hệ của cha/mẹ/người giám hộ.",
        400
      );
    }

    const nextSchool =
      typeof body.school === "string" && body.school.trim().length >= 3
        ? body.school.trim().slice(0, 120)
        : undefined;
    const nextMajor =
      typeof body.major === "string" && body.major.trim().length >= 2
        ? body.major.trim().slice(0, 60)
        : undefined;
    const VALID_GROUPS = new Set(["GROUP_A", "GROUP_B", "GROUP_C", "GROUP_D", "GROUP_E", "N1", "N2", "N3"]);
    const nextStudentGroup =
      typeof body.studentGroup === "string" && VALID_GROUPS.has(body.studentGroup.trim())
        ? body.studentGroup.trim()
        : undefined;
    const nextSelfLevel =
      typeof body.selfLevel === "string" && body.selfLevel.trim().length >= 2
        ? body.selfLevel.trim().slice(0, 40)
        : undefined;

    let nextSlotsJson: string | undefined;
    if (Array.isArray(body.availableSlots)) {
      const cleanSlots = body.availableSlots
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        .map((s) => s.trim().slice(0, 60))
        .slice(0, 12);
      nextSlotsJson = JSON.stringify(cleanSlots);
    }

    let nextInviteCode: string | undefined;
    let nextApprovalStatus: string | undefined;
    if (typeof body.inviteCode === "string" && body.inviteCode.trim().length > 0) {
      const codeUpper = body.inviteCode.trim().toUpperCase();
      const inv = await prisma.inviteCode.findUnique({ where: { code: codeUpper } });
      if (!inv || !inv.isActive || inv.usedCount >= inv.maxUses) {
        return apiError(
          "INVALID_INVITE_CODE",
          "Mã mời giáo viên không tồn tại hoặc đã hết lượt sử dụng.",
          400
        );
      }
      nextInviteCode = inv.code;
      nextApprovalStatus = "APPROVED";
      if (guard.user.inviteCodeUsed !== inv.code) {
        await prisma.inviteCode.update({
          where: { id: inv.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    let nextPasswordHash: string | undefined;
    if (typeof body.newPassword === "string" && body.newPassword.length > 0) {
      if (body.newPassword.length < 6 || body.newPassword.length > 100) {
        return apiError("INVALID_PASSWORD", "Mật khẩu mới cần dài từ 6 đến 100 ký tự.", 400);
      }
      const existingCred = await prisma.user.findUnique({
        where: { id: guard.user.id },
        select: { passwordHash: true },
      });
      if (existingCred?.passwordHash) {
        const cur = typeof body.currentPassword === "string" ? body.currentPassword : "";
        if (!cur || !verifyPassword(cur, existingCred.passwordHash)) {
          return apiError("WRONG_CURRENT_PASSWORD", "Mật khẩu hiện tại không đúng.", 401);
        }
      }
      nextPasswordHash = hashPassword(body.newPassword);
    }

    const updateData = {
      ...(nextName ? { name: nextName } : {}),
      ...(nextPasswordHash ? { passwordHash: nextPasswordHash } : {}),
      ...(nextTarget !== undefined ? { targetScore: nextTarget } : {}),
      ...(nextDob ? { dateOfBirth: nextDob } : {}),
      ...(nextAgeGroup ? { ageGroup: nextAgeGroup } : {}),
      ...(nextParentConsentRequired !== undefined
        ? { parentConsentRequired: nextParentConsentRequired }
        : {}),
      ...(nextParentConsentStatus ? { parentConsentStatus: nextParentConsentStatus } : {}),
      ...(nextParentMonitorCode ? { parentMonitorCode: nextParentMonitorCode } : {}),
      ...(nextSchool ? { school: nextSchool } : {}),
      ...(nextMajor ? { major: nextMajor } : {}),
      ...(nextStudentGroup ? { studentGroup: nextStudentGroup } : {}),
      ...(nextSelfLevel ? { selfLevel: nextSelfLevel } : {}),
      ...(nextSlotsJson ? { availableSlotsJson: nextSlotsJson } : {}),
      ...(nextInviteCode ? { inviteCodeUsed: nextInviteCode } : {}),
      ...(nextApprovalStatus ? { approvalStatus: nextApprovalStatus } : {}),
      ...(guardianName !== undefined ? { guardianName: guardianName || null } : {}),
      ...(guardianRelation !== undefined ? { guardianRelation: guardianRelation || null } : {}),
      ...(guardianContact !== undefined ? { guardianContact: guardianContact || null } : {}),
      ...(body.acceptBetaRules === true ? { betaRulesAcceptedAt: new Date() } : {}),
      ...(body.acceptDataPolicy === true ? { dataConsentAcceptedAt: new Date() } : {}),
    };

    if (Object.keys(updateData).length === 0) {
      return apiError("NO_CHANGES", "Không có thông tin cần cập nhật.", 400);
    }

    const updated = await prisma.user.update({
      where: { id: guard.user.id },
      data: updateData,
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

    return apiOk({ user: updated });
  } catch (err) {
    console.error("Update profile error:", err);
    return apiError("SERVER_ERROR", "Không thể cập nhật hồ sơ.", 500);
  }
}

async function DELETE(request: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) {
    return apiError(guard.code, guard.message, guard.status);
  }

  try {
    let reason = "Người dùng yêu cầu rút khỏi thử nghiệm và xóa toàn bộ dữ liệu cá nhân.";
    let requestedBy = "USER";
    try {
      const body = (await request.json()) as { reason?: unknown; requestedBy?: unknown };
      if (typeof body.reason === "string" && body.reason.trim()) {
        reason = body.reason.trim().slice(0, 300);
      }
      if (body.requestedBy === "GUARDIAN") {
        requestedBy = "GUARDIAN";
      }
    } catch {
      // optional JSON body
    }

    if (guard.user.role === "ADMIN") {
      return apiError(
        "ADMIN_PROTECTED",
        "Tài khoản quản trị viên không thể tự xóa trực tiếp để đảm bảo vận hành hệ thống.",
        400
      );
    }

    const emailHash = crypto
      .createHash("sha256")
      .update(guard.user.email.toLowerCase())
      .digest("hex");

    await prisma.$transaction(async (tx) => {
      await tx.dataDeletionRequest.create({
        data: {
          userId: guard.user.id,
          emailHash,
          reason,
          requestedBy,
          status: "COMPLETED",
        },
      });
      await tx.user.delete({ where: { id: guard.user.id } });
    });

    await callStorageService("/api/v1/accounts/handle-deletion", {
      method: "POST",
      user: guard.user,
      body: {
        deletedAccountId: guard.user.id,
        deletedAccountEmail: guard.user.email,
        permanentPurgePrivate: false,
      },
    }).catch(() => {});
    await clearVaultSessionCookie();
    await clearSessionCookie();
    return apiOk({
      deleted: true,
      message: "Đã xóa toàn bộ dữ liệu cá nhân và rút khỏi thử nghiệm kín.",
    });
  } catch (err) {
    console.error("Delete account data error:", err);
    return apiError("SERVER_ERROR", "Không thể xóa dữ liệu tài khoản.", 500);
  }
}
  return { GET, PATCH, DELETE };
})();

// === [26] /api/auth/my-data ===
const route_26: Record<string, any> = (() => {
/**
 * Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 & Phụ lục B:
 * Cho phép thành viên (hoặc phụ huynh của học viên dưới 18 tuổi) xem & tải toàn bộ dữ liệu cá nhân.
 */
async function GET() {
  const guard = await requireUser();
  if (!guard.ok) {
    return apiError(guard.code, guard.message, guard.status);
  }

  const [
    profile,
    savedDocs,
    grammarProgress,
    examAttempts,
    vocabWords,
    parentConsents,
    hostedSessions,
    joinedSessions,
    rubricsGiven,
    communityPosts,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: guard.user.id },
      select: {
        id: true,
        email: true,
        name: true,
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
        parentConsentRequired: true,
        parentConsentStatus: true,
        guardianName: true,
        guardianRelation: true,
        guardianContact: true,
        parentMonitorCode: true,
        betaRulesAcceptedAt: true,
        dataConsentAcceptedAt: true,
        createdAt: true,
      },
    }),
    prisma.userSavedDocument.findMany({
      where: { userId: guard.user.id },
      include: { document: { select: { title: true, slug: true } } },
    }),
    prisma.userGrammarProgress.findMany({
      where: { userId: guard.user.id },
      include: { lesson: { select: { title: true, slug: true } } },
    }),
    prisma.examAttempt.findMany({
      where: { userId: guard.user.id },
      select: {
        id: true,
        totalScore: true,
        listeningScore: true,
        readingScore: true,
        completedAt: true,
      },
    }),
    prisma.userVocabWord.findMany({
      where: { userId: guard.user.id },
      select: { word: true, meaning: true, deck: true, status: true },
    }),
    prisma.parentConsent.findMany({
      where: { userId: guard.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.practiceSession.findMany({
      where: { hostId: guard.user.id },
      select: { id: true, major: true, level: true, slotLabel: true, status: true, scheduledAt: true },
    }),
    prisma.practiceSession.findMany({
      where: { partnerId: guard.user.id },
      select: { id: true, major: true, level: true, slotLabel: true, status: true, scheduledAt: true },
    }),
    prisma.peerRubricReview.findMany({
      where: { reviewerId: guard.user.id },
      select: { id: true, overallScore: true, satisfactionRating: true, strengths: true, createdAt: true },
    }),
    prisma.communityPost.findMany({
      where: { userId: guard.user.id },
      select: { id: true, title: true, group: true, createdAt: true },
    }),
  ]);

  return apiOk({
    exportedAt: new Date().toISOString(),
    dataController: "Nhóm dự án LV04 - Trường CĐ nghề Việt Nam - Singapore (Phụ trách dữ liệu: Bùi Tấn Lộc)",
    policyNote:
      "Hệ thống không thu ảnh/video giấy tờ tùy thân (CCCD/CMND) và không lưu bản ghi âm/ghi hình buổi luyện theo Luật BVDLCN 91/2025/QH15.",
    profile,
    savedDocs,
    grammarProgress,
    examAttempts,
    vocabWords,
    parentConsents,
    practiceSessions: { hosted: hostedSessions, joined: joinedSessions },
    rubricsGiven,
    communityPosts,
  });
}
  return { GET };
})();

// === [27] /api/auth/register ===
const route_27: Record<string, any> = (() => {
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
      confirmPassword?: unknown;
      name?: unknown;
      dateOfBirth?: unknown;
      school?: unknown;
      major?: unknown;
      studentGroup?: unknown;
      institutionType?: unknown;
      faculty?: unknown;
      specialty?: unknown;
      targetCareerRole?: unknown;
      studyYear?: unknown;
      englishGoal?: unknown;
      selfLevel?: unknown;
      inviteCode?: unknown;
      guardianName?: unknown;
      guardianRelation?: unknown;
      guardianContact?: unknown;
      acceptBetaRules?: unknown;
      guestSavedDocIds?: unknown;
    };

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword =
      typeof body.confirmPassword === "string" ? body.confirmPassword : undefined;
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!EMAIL_RE.test(email)) {
      return apiError("INVALID_EMAIL", "Vui lòng nhập địa chỉ email hợp lệ.", 400);
    }
    if (name.length < 2 || name.length > 80) {
      return apiError("INVALID_NAME", "Họ tên hiển thị cần dài từ 2 đến 80 ký tự.", 400);
    }
    if (password.length < 6 || password.length > 100) {
      return apiError("INVALID_PASSWORD", "Mật khẩu cần dài từ 6 đến 100 ký tự.", 400);
    }
    if (confirmPassword !== undefined && confirmPassword !== password) {
      return apiError("PASSWORD_MISMATCH", "Mật khẩu xác nhận không khớp.", 400);
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return apiError(
        "EMAIL_EXISTS",
        "Email này đã có tài khoản. Vui lòng chuyển sang Đăng nhập.",
        409
      );
    }

    let parsedDob: Date | null = null;
    let ageGroup = "ADULT_18_PLUS";
    if (typeof body.dateOfBirth === "string" && body.dateOfBirth.trim()) {
      const candidate = new Date(`${body.dateOfBirth.trim()}T00:00:00.000Z`);
      if (Number.isNaN(candidate.getTime()) || candidate > new Date()) {
        return apiError("INVALID_DOB", "Ngày sinh không hợp lệ.", 400);
      }
      parsedDob = candidate;
      ageGroup = computeAgeGroup(candidate);
    }

    const isMinor = isMinorAgeGroup(ageGroup);
    const guardianName =
      typeof body.guardianName === "string" ? body.guardianName.trim().slice(0, 80) : null;
    const guardianRelation =
      typeof body.guardianRelation === "string"
        ? body.guardianRelation.trim().slice(0, 40)
        : null;
    const guardianContact =
      typeof body.guardianContact === "string" ? body.guardianContact.trim().slice(0, 80) : null;

    if (ageGroup === "UNDER_16" && !guardianName && !guardianContact) {
      return apiError(
        "GUARDIAN_REQUIRED_UNDER_16",
        "Theo Nghị định 147/2024/NĐ-CP, người dưới 16 tuổi cần nhập họ tên hoặc liên hệ của cha/mẹ/người giám hộ.",
        400
      );
    }

    const inviteCodeRaw =
      typeof body.inviteCode === "string" ? body.inviteCode.trim().toUpperCase() : "";
    let matchedInvite: { id: string; code: string; school: string; major: string } | null = null;
    if (inviteCodeRaw) {
      const inv = await prisma.inviteCode.findUnique({ where: { code: inviteCodeRaw } });
      if (!inv || !inv.isActive || inv.usedCount >= inv.maxUses) {
        return apiError(
          "INVALID_INVITE_CODE",
          "Mã mời giáo viên không hợp lệ hoặc đã hết lượt sử dụng.",
          400
        );
      }
      matchedInvite = { id: inv.id, code: inv.code, school: inv.school, major: inv.major };
    }

    const isSchoolEmail = email.endsWith("@vsvc.edu.vn");
    const approvalStatus = isSchoolEmail || Boolean(matchedInvite) ? "APPROVED" : "PENDING";

    const school =
      typeof body.school === "string" && body.school.trim().length >= 3
        ? body.school.trim().slice(0, 120)
        : matchedInvite?.school || "Trường Cao đẳng nghề Việt Nam - Singapore";
    const major =
      typeof body.major === "string" && body.major.trim().length >= 2
        ? body.major.trim().slice(0, 60)
        : matchedInvite && matchedInvite.major !== "Tất cả ngành"
        ? matchedInvite.major
        : "Tin học";
    const VALID_GROUPS = new Set(["GROUP_A", "GROUP_B", "GROUP_C", "GROUP_D", "GROUP_E", "N1", "N2", "N3"]);
    const studentGroup =
      typeof body.studentGroup === "string" && VALID_GROUPS.has(body.studentGroup.trim())
        ? body.studentGroup.trim()
        : "GROUP_C";
    const institutionType =
      typeof body.institutionType === "string" && body.institutionType.trim()
        ? body.institutionType.trim().slice(0, 120)
        : "Trường Cao đẳng nghề";
    const faculty =
      typeof body.faculty === "string" && body.faculty.trim()
        ? body.faculty.trim().slice(0, 120)
        : "Khoa chuyên môn";
    const specialty =
      typeof body.specialty === "string" && body.specialty.trim()
        ? body.specialty.trim().slice(0, 120)
        : major;
    const targetCareerRole =
      typeof body.targetCareerRole === "string" && body.targetCareerRole.trim()
        ? body.targetCareerRole.trim().slice(0, 120)
        : "Kỹ thuật viên / Nhân sự chuyên môn";
    const studyYear =
      typeof body.studyYear === "string" && body.studyYear.trim()
        ? body.studyYear.trim().slice(0, 60)
        : "Năm 1";
    const englishGoal =
      typeof body.englishGoal === "string" && body.englishGoal.trim()
        ? body.englishGoal.trim().slice(0, 200)
        : "Giao tiếp thực hành nghề, đọc tài liệu kỹ thuật và chuẩn bị thực tập";
    const selfLevel =
      typeof body.selfLevel === "string" && body.selfLevel.trim().length >= 2
        ? body.selfLevel.trim().slice(0, 40)
        : "Cơ bản (A2)";

    const passwordHash = hashPassword(password);
    const parentMonitorCode = isMinor ? generateParentMonitorCode() : null;

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        xp: 20,
        streakDays: 1,
        lastActiveDate: new Date(),
        dateOfBirth: parsedDob,
        ageGroup,
        studentGroup,
        institutionType,
        school,
        faculty,
        major,
        specialty,
        targetCareerRole,
        studyYear,
        englishGoal,
        selfLevel,
        inviteCodeUsed: matchedInvite?.code ?? null,
        approvalStatus,
        parentConsentRequired: isMinor,
        parentConsentStatus: isMinor ? "PENDING" : "NOT_REQUIRED",
        guardianName,
        guardianRelation,
        guardianContact,
        parentMonitorCode,
        betaRulesAcceptedAt: body.acceptBetaRules === true ? new Date() : null,
        dataConsentAcceptedAt: new Date(),
      },
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

    if (matchedInvite) {
      await prisma.inviteCode.update({
        where: { id: matchedInvite.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    await mergeGuestSavedDocs(user.id, body.guestSavedDocIds);

    await setSessionCookie({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return apiOk({ user }, 201);
  } catch (err) {
    console.error("Register error:", err);
    return apiError("SERVER_ERROR", "Không thể tạo tài khoản lúc này. Vui lòng thử lại.", 500);
  }
}
  return { POST };
})();

// === [28] /api/community/posts ===
const route_28: Record<string, any> = (() => {
const ALLOWED_GROUPS = new Set([
  "Kinh nghiệm học tập",
  "Hỏi bài - Giải đáp",
  "Luyện đề - Thi cử",
  "Luyện nghe & Dictation",
  "Điện - Điện tử",
  "Cơ khí",
  "Tin học",
  "Kinh tế - Du lịch",
  "Tìm bạn ghép cặp",
]);

async function GET() {
  await connection();
  const user = await getCurrentUser();
  const posts = await loadCommunityFeed(user?.id);
  return apiOk({ posts });
}

async function POST(request: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as {
      title?: unknown;
      content?: unknown;
      group?: unknown;
      poll?: {
        options?: unknown[];
        correctKey?: unknown;
        explanation?: unknown;
      } | null;
    };

    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (content.length < 4 || content.length > 2000) {
      return apiError(
        "INVALID_CONTENT",
        "Nội dung bài viết cần dài từ 4 đến 2000 ký tự.",
        400
      );
    }

    const rawGroup = typeof body.group === "string" ? body.group.trim() : "Hỏi bài - Giải đáp";
    const group = ALLOWED_GROUPS.has(rawGroup) ? rawGroup : "Hỏi bài - Giải đáp";
    const title =
      typeof body.title === "string" && body.title.trim().length > 0
        ? body.title.trim().slice(0, 140)
        : "Chia sẻ từ thành viên WORD BRIDGE";

    let pollJson: string | null = null;
    if (body.poll && Array.isArray(body.poll.options) && body.poll.options.length === 4) {
      const keys = ["A", "B", "C", "D"] as const;
      const options = keys.map((key, idx) => ({
        key,
        text: String(body.poll?.options?.[idx] ?? "").trim().slice(0, 120),
        votes: 0,
      }));
      if (options.every((o) => o.text.length > 0)) {
        const ck =
          body.poll.correctKey === "A" ||
          body.poll.correctKey === "B" ||
          body.poll.correctKey === "C" ||
          body.poll.correctKey === "D"
            ? body.poll.correctKey
            : "A";
        pollJson = JSON.stringify({
          options,
          correctKey: ck,
          explanation:
            typeof body.poll.explanation === "string" && body.poll.explanation.trim()
              ? body.poll.explanation.trim().slice(0, 400)
              : "Đáp án do tác giả câu hỏi cung cấp.",
        });
      }
    }

    const created = await prisma.communityPost.create({
      data: {
        userId: guard.user.id,
        group,
        title,
        content,
        authorBadge: guard.user.role === "ADMIN" ? "Admin" : null,
        pollJson,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, streakDays: true } },
      },
    });

    // Tự động lưu bài đăng cộng đồng vào Kho lưu trữ mã nguồn (Phần V.2 & V.4)
    void emitAutoArchiveEvent({
      eventType: "POST_CREATED",
      itemType: "COMMUNITY_POST",
      sourceId: created.id,
      payload: {
        title: created.title,
        content: created.content,
        authorId: created.user.id,
        authorName: created.user.name,
        authorEmail: created.user.email,
        creatorId: created.user.id,
        creatorName: created.user.name,
        ownerId: created.user.id,
        sourceCreatedAt: created.createdAt.toISOString(),
        metadata: {
          group: created.group,
          authorBadge: created.authorBadge,
          isPinned: created.isPinned,
          pollJson: created.pollJson,
        },
        changeSummary: "Tự động lưu khi thành viên đăng bài cộng đồng",
      },
    });

    return apiOk(
      {
        post: {
          id: created.id,
          authorId: created.user.id,
          author: created.user.name,
          handle: `@${created.user.email.split("@")[0]}`,
          avatarText: created.user.name.slice(0, 2).toUpperCase(),
          avatarBg: "bg-[#9ee56f] text-[#102216]",
          badge: created.authorBadge,
          timeAgo: formatRelativeVi(created.createdAt),
          group: created.group,
          title: created.title,
          content: created.content,
          isPinned: created.isPinned,
          likes: 0,
          viewerLiked: false,
          viewerVotedKey: null,
          poll: pollJson ? JSON.parse(pollJson) : null,
          comments: [],
        },
      },
      201
    );
  } catch (err) {
    console.error("Create community post error:", err);
    return apiError("SERVER_ERROR", "Không thể đăng bài viết.", 500);
  }
}
  return { GET, POST };
})();

// === [29] /api/donations/sepay-webhook ===
const route_29: Record<string, any> = (() => {
interface SepayWebhookPayload {
  id?: string | number;
  content?: string;
  transferAmount?: number;
  transferType?: string;
}

async function POST(request: NextRequest) {
  const configuredKey = process.env.SEPAY_WEBHOOK_API_KEY;
  if (!configuredKey) {
    return apiError("WEBHOOK_DISABLED", "SEPAY_WEBHOOK_API_KEY chưa được cấu hình.", 503);
  }

  const authHeader = request.headers.get("authorization") || "";
  if (authHeader !== `Apikey ${configuredKey}`) {
    return apiError("UNAUTHORIZED", "API key không hợp lệ.", 401);
  }

  try {
    const payload = (await request.json()) as SepayWebhookPayload;
    if (payload.transferType && payload.transferType !== "in") {
      return apiOk({ ignored: true });
    }

    const content = (payload.content || "").toUpperCase();
    const match = content.match(/\b(LC[A-F0-9]{6})\b/);
    if (!match) {
      return apiOk({ matched: false });
    }

    const orderCode = match[1];
    const sepayTxId = payload.id ? String(payload.id) : null;
    const record = await prisma.donationRecord.findUnique({ where: { orderCode } });

    if (!record) {
      return apiOk({ matched: false });
    }

    if (record.status !== "PAID" && (payload.transferAmount ?? 0) >= record.amountVnd) {
      await prisma.donationRecord.update({
        where: { id: record.id },
        data: {
          status: "PAID",
          sepayTxId,
          paidAt: new Date(),
        },
      });
    }

    return apiOk({ matched: true, orderCode });
  } catch (err) {
    console.error("SePay webhook error:", err);
    return apiError("SERVER_ERROR", "Lỗi xử lý webhook.", 500);
  }
}
  return { POST };
})();

// === [30] /api/kpis/phase0b ===
const route_30: Record<string, any> = (() => {
async function GET() {
  await connection();
  const kpis = await getPhase0bKpis();
  return apiOk(kpis);
}
  return { GET };
})();

// === [31] /api/safety/block ===
const route_31: Record<string, any> = (() => {
async function GET() {
  const guard = await requireUser();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const blocks = await prisma.userBlock.findMany({
    where: { blockerId: guard.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      blocked: { select: { id: true, name: true, major: true, school: true } },
    },
  });

  return apiOk({ blocks });
}

async function POST(request: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as { blockedUserId?: unknown; reason?: unknown };
    const blockedUserId =
      typeof body.blockedUserId === "string" ? body.blockedUserId.trim() : "";
    const reason =
      typeof body.reason === "string" ? body.reason.trim().slice(0, 200) : null;

    if (!blockedUserId || blockedUserId === guard.user.id) {
      return apiError("INVALID_USER", "Không thể chặn người dùng này.", 400);
    }

    const block = await prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: guard.user.id,
          blockedId: blockedUserId,
        },
      },
      update: { reason },
      create: {
        blockerId: guard.user.id,
        blockedId: blockedUserId,
        reason,
      },
    });

    return apiOk({ block }, 201);
  } catch (err) {
    console.error("Block user error:", err);
    return apiError("SERVER_ERROR", "Không thể thực hiện chặn tài khoản.", 500);
  }
}

async function DELETE(request: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const blockedUserId = (request.nextUrl.searchParams.get("blockedUserId") || "").trim();
  if (!blockedUserId) {
    return apiError("INVALID_USER", "Thiếu mã người dùng cần bỏ chặn.", 400);
  }

  await prisma.userBlock.deleteMany({
    where: {
      blockerId: guard.user.id,
      blockedId: blockedUserId,
    },
  });

  return apiOk({ unblocked: true });
}
  return { GET, POST, DELETE };
})();

// === [32] /api/safety/report ===
const route_32: Record<string, any> = (() => {
const VALID_CATEGORIES = new Set([
  "HARASSMENT",
  "PERSONAL_CONTACT_LEAK",
  "UNAPPROVED_RECORDING",
  "SPAM_INAPPROPRIATE",
  "UNDER_18_SAFETY",
  "OTHER",
]);

async function GET() {
  const guard = await requireUser();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const reports = await prisma.safetyReport.findMany({
    where: { reporterId: guard.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return apiOk({ reports });
}

async function POST(request: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as {
      reportedUserId?: unknown;
      targetType?: unknown;
      targetId?: unknown;
      category?: unknown;
      description?: unknown;
    };

    const targetType =
      body.targetType === "SESSION" ||
      body.targetType === "COMMUNITY_POST" ||
      body.targetType === "USER"
        ? body.targetType
        : "USER";
    const targetId = typeof body.targetId === "string" ? body.targetId.trim() : "";
    const reportedUserId =
      typeof body.reportedUserId === "string" && body.reportedUserId.trim()
        ? body.reportedUserId.trim()
        : null;
    const rawCat = typeof body.category === "string" ? body.category.trim() : "OTHER";
    const category = VALID_CATEGORIES.has(rawCat) ? rawCat : "OTHER";
    const description =
      typeof body.description === "string" ? body.description.trim().slice(0, 1000) : "";

    if (!targetId || description.length < 6) {
      return apiError(
        "INVALID_REPORT",
        "Vui lòng mô tả chi tiết dấu hiệu vi phạm (tối thiểu 6 ký tự).",
        400
      );
    }

    const report = await prisma.safetyReport.create({
      data: {
        reporterId: guard.user.id,
        reportedUserId,
        targetType,
        targetId,
        category,
        description,
        status: "OPEN",
      },
    });

    return apiOk(
      {
        report,
        message:
          "Đã ghi nhận báo cáo vi phạm. Giáo viên phụ trách và mentor sẽ kiểm tra và xử lý kịp thời.",
      },
      201
    );
  } catch (err) {
    console.error("Create safety report error:", err);
    return apiError("SERVER_ERROR", "Không thể gửi báo cáo vi phạm.", 500);
  }
}
  return { GET, POST };
})();

// === [33] /api/scenarios/[slug] ===
const route_33: Record<string, any> = (() => {
async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  await connection();
  const { slug } = await context.params;
  const user = await getCurrentUser();

  const scenario = await prisma.careerScenario.findUnique({
    where: { slug },
  });

  if (!scenario) {
    return apiError("NOT_FOUND", "Không tìm thấy tình huống nghề nghiệp này.", 404);
  }

  const scope = user ? getMatchingScope(user.ageGroup) : undefined;
  const openSessions = await prisma.practiceSession.findMany({
    where: {
      scenarioId: scenario.id,
      status: "OPEN",
      ...(scope ? { ageGroupScope: scope } : {}),
      ...(user && scope === "UNDER_18" ? { school: user.school } : {}),
    },
    orderBy: { scheduledAt: "asc" },
    take: 10,
    include: {
      host: { select: { id: true, name: true, major: true, selfLevel: true, school: true } },
    },
  });

  return apiOk({ scenario, openSessions });
}
  return { GET };
})();

// === [34] /api/sessions/[id] ===
const route_34: Record<string, any> = (() => {
async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireUser();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { id } = await context.params;
  const session = await prisma.practiceSession.findUnique({ where: { id } });
  if (!session) {
    return apiError("NOT_FOUND", "Không tìm thấy buổi luyện nói này.", 404);
  }

  try {
    const body = (await request.json()) as { action?: unknown };
    const action = body.action;

    if (action === "join") {
      const eligibility = checkPairingEligibility(guard.user);
      if (!eligibility.allowed) {
        return apiError(
          "PAIRING_NOT_ELIGIBLE",
          eligibility.reason || "Tài khoản chưa đủ điều kiện ghép cặp.",
          403
        );
      }

      if (session.hostId === guard.user.id) {
        return apiError("SELF_JOIN", "Bạn là người tạo lịch hẹn này.", 400);
      }

      const viewerScope = getMatchingScope(guard.user.ageGroup);
      if (session.ageGroupScope !== viewerScope) {
        return apiError(
          "AGE_GROUP_ISOLATION",
          "Để bảo vệ học viên dưới 18 tuổi, hệ thống chỉ ghép cặp trong cùng nhóm tuổi.",
          403
        );
      }

      if (viewerScope === "UNDER_18" && session.school !== guard.user.school) {
        return apiError(
          "SCHOOL_ISOLATION",
          "Học viên dưới 18 tuổi chỉ được ghép cặp với bạn học cùng trường.",
          403
        );
      }

      const blocked = await prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: guard.user.id, blockedId: session.hostId },
            { blockerId: session.hostId, blockedId: guard.user.id },
          ],
        },
      });
      if (blocked) {
        return apiError("BLOCKED_USER", "Không thể ghép cặp vì có thiết lập chặn giữa hai tài khoản.", 403);
      }

      const claimed = await prisma.practiceSession.updateMany({
        where: {
          id: session.id,
          status: "OPEN",
          partnerId: null,
        },
        data: {
          partnerId: guard.user.id,
          status: "MATCHED",
        },
      });

      if (claimed.count === 0) {
        return apiError("ALREADY_MATCHED", "Lịch hẹn này đã có bạn khác nhận ghép cặp rồi.", 409);
      }

      const updated = await prisma.practiceSession.findUnique({
        where: { id: session.id },
        include: {
          scenario: { select: { title: true, slug: true } },
          host: { select: { id: true, name: true } },
          partner: { select: { id: true, name: true } },
        },
      });

      return apiOk({ session: updated });
    }

    const isHost = session.hostId === guard.user.id;
    const isPartner = session.partnerId === guard.user.id;
    if (!isHost && !isPartner && guard.user.role !== "ADMIN") {
      return apiError("FORBIDDEN", "Bạn không thuộc buổi luyện này.", 403);
    }

    if (action === "cancel") {
      if (session.status === "COMPLETED") {
        return apiError("ALREADY_COMPLETED", "Buổi luyện đã hoàn tất, không thể hủy.", 400);
      }
      const updated = await prisma.practiceSession.update({
        where: { id: session.id },
        data: { status: "CANCELLED" },
      });
      return apiOk({ session: updated });
    }

    if (action === "complete") {
      if (session.status === "OPEN" || !session.partnerId) {
        return apiError("NEED_PARTNER", "Cần có đủ 2 người ghép cặp trước khi xác nhận hoàn thành.", 400);
      }
      const updated = await prisma.practiceSession.update({
        where: { id: session.id },
        data: {
          ...(isHost ? { hostConfirmedComplete: true } : {}),
          ...(isPartner ? { partnerConfirmedComplete: true } : {}),
          status: "COMPLETED",
        },
      });

      const xpRes = await awardXpAndStreak(guard.user.id, "PRACTICE", session.id, 35);
      return apiOk({ session: updated, xp: xpRes.xp, streakDays: xpRes.streakDays });
    }

    return apiError("INVALID_ACTION", "Thao tác không hợp lệ.", 400);
  } catch (err) {
    console.error("Update session error:", err);
    return apiError("SERVER_ERROR", "Không thể cập nhật trạng thái buổi luyện.", 500);
  }
}
  return { PATCH };
})();

// === [35] /api/vocab/[sourceKey] ===
const route_35: Record<string, any> = (() => {
async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ sourceKey: string }> }
) {
  const guard = await requireUser();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { sourceKey } = await context.params;
  const decodedKey = decodeURIComponent(sourceKey);

  const existing = await prisma.userVocabWord.findUnique({
    where: { userId_sourceKey: { userId: guard.user.id, sourceKey: decodedKey } },
  });
  if (!existing) {
    return apiError("NOT_FOUND", "Không tìm thấy từ trong sổ tay.", 404);
  }

  const body = (await request.json()) as {
    status?: unknown;
    incrementReview?: unknown;
  };

  const nextStatus =
    body.status === "learning" || body.status === "due" || body.status === "mastered"
      ? body.status
      : existing.status;

  const updated = await prisma.userVocabWord.update({
    where: { id: existing.id },
    data: {
      status: nextStatus,
      ...(body.incrementReview ? { reviewCount: { increment: 1 }, lastReviewedAt: new Date() } : {}),
    },
  });

  return apiOk({
    word: {
      id: updated.sourceKey,
      word: updated.word,
      phonetic: updated.phonetic,
      pos: updated.pos,
      meaning: updated.meaning,
      example: updated.example,
      deck: updated.deck,
      status: updated.status,
      reviewCount: updated.reviewCount,
    },
  });
}

async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ sourceKey: string }> }
) {
  const guard = await requireUser();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { sourceKey } = await context.params;
  const decodedKey = decodeURIComponent(sourceKey);

  const existing = await prisma.userVocabWord.findUnique({
    where: { userId_sourceKey: { userId: guard.user.id, sourceKey: decodedKey } },
  });
  if (!existing) {
    return apiError("NOT_FOUND", "Không tìm thấy từ trong sổ tay.", 404);
  }

  await prisma.userVocabWord.delete({ where: { id: existing.id } });
  return apiOk({ deletedKey: decodedKey });
}
  return { PATCH, DELETE };
})();

// === [36] /api/admin/storage/access ===
const route_36: Record<string, any> = (() => {
async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const res = await callStorageService("/api/v1/access/status", {
    method: "GET",
    user: guard.user,
    request,
  });

  if (!res.ok) {
    return apiError(
      res.error?.code || "STORAGE_ERROR",
      res.error?.message || "Không thể kiểm tra trạng thái kho lưu trữ.",
      res.status
    );
  }

  return apiOk(res.data);
}

async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as {
      action?: string;
      pin?: string;
      currentPin?: string;
      newPin?: string;
      confirmPin?: string;
      accountPassword?: string;
      otp?: string;
      lock?: boolean;
      reason?: string;
      targetAccountId?: string;
      targetEmail?: string;
      targetName?: string;
      permissionAction?: string;
    };

    const action = (body.action || "").trim().toUpperCase();

    if (action === "SETUP_PIN") {
      const res = await callStorageService("/api/v1/access/setup-pin", {
        method: "POST",
        user: guard.user,
        request,
        body: {
          pin: body.pin,
          confirmPin: body.confirmPin,
        },
      });
      if (!res.ok) {
        return apiError(res.error?.code || "PIN_SETUP_ERROR", res.error?.message || "Lỗi thiết lập PIN.", res.status);
      }
      return apiOk(res.data);
    }

    if (action === "VERIFY_PIN") {
      const res = await callStorageService<{
        vaultToken: string;
        sessionId: string;
        expiresAt: string;
        ttlSeconds: number;
      }>("/api/v1/access/verify-pin", {
        method: "POST",
        user: guard.user,
        request,
        body: {
          pin: body.pin,
        },
      });

      if (!res.ok || !res.data?.vaultToken) {
        return apiError(
          res.error?.code || "PIN_VERIFY_ERROR",
          res.error?.message || "Mã PIN không hợp lệ.",
          res.status
        );
      }

      await setVaultSessionCookie(res.data.vaultToken);

      // Ensure first-time legacy import is triggered with complete existing records if not yet imported
      const impStatus = await callStorageService<{
        initialImportState?: { hasCompletedInitialImport?: boolean; status?: string };
      }>("/api/v1/import/status", {
        method: "GET",
        user: guard.user,
        vaultToken: res.data.vaultToken,
        request,
      });

      let importJob = null;
      if (
        impStatus.ok &&
        !impStatus.data?.initialImportState?.hasCompletedInitialImport &&
        impStatus.data?.initialImportState?.status === "NOT_RUN"
      ) {
        const sourceRecords = await collectExistingWebsiteRecordsForImport();
        const impRun = await callStorageService("/api/v1/import/run", {
          method: "POST",
          user: guard.user,
          vaultToken: res.data.vaultToken,
          request,
          body: { sourceRecords },
        });
        if (impRun.ok) {
          importJob = impRun.data;
        }
      }

      return apiOk({
        verified: true,
        sessionId: res.data.sessionId,
        expiresAt: res.data.expiresAt,
        ttlSeconds: res.data.ttlSeconds,
        initialImportJob: importJob,
      });
    }

    if (action === "CHANGE_PIN") {
      const res = await callStorageService("/api/v1/access/change-pin", {
        method: "POST",
        user: guard.user,
        request,
        body: {
          currentPin: body.currentPin,
          newPin: body.newPin,
          confirmPin: body.confirmPin,
        },
      });
      if (!res.ok) {
        return apiError(res.error?.code || "PIN_CHANGE_ERROR", res.error?.message || "Không thể đổi PIN.", res.status);
      }
      await clearVaultSessionCookie();
      return apiOk(res.data);
    }

    if (action === "LOGOUT_VAULT") {
      await callStorageService("/api/v1/access/logout", {
        method: "POST",
        user: guard.user,
        request,
      });
      await clearVaultSessionCookie();
      return apiOk({ loggedOut: true });
    }

    if (action === "FORGOT_PIN_REQUEST") {
      // Step 2 of Forgot PIN (Phần IV.7): Verify primary Admin account password if account has passwordHash
      const dbUser = await prisma.user.findUnique({
        where: { id: guard.user.id },
        select: { passwordHash: true, email: true, name: true },
      });
      if (dbUser?.passwordHash && body.accountPassword !== undefined) {
        if (!verifyPassword(String(body.accountPassword || ""), dbUser.passwordHash)) {
          return apiError("WRONG_ACCOUNT_PASSWORD", "Mật khẩu tài khoản Admin chính không đúng.", 401);
        }
      }

      const res = await callStorageService<{
        recoveryRequestId: string;
        email: string;
        expiresAt: string;
        ttlSeconds: number;
        otpForEmailDelivery?: string;
      }>("/api/v1/access/forgot-pin/request", {
        method: "POST",
        user: guard.user,
        request,
      });

      if (!res.ok || !res.data) {
        return apiError(res.error?.code || "OTP_ERROR", res.error?.message || "Không thể tạo OTP khôi phục PIN.", res.status);
      }

      const otpCode = res.data.otpForEmailDelivery;
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey && otpCode) {
        const fromEmail = process.env.SMTP_FROM || "WORD BRIDGE Security <noreply@wordbridge.io.vn>";
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [guard.user.email],
            subject: "[WORD BRIDGE] Mã OTP khôi phục PIN Kho lưu trữ mã nguồn",
            html: `<p>Xin chào Quản trị viên <b>${guard.user.name}</b>,</p><p>Mã OTP một lần để khôi phục PIN 6 chữ số của Kho lưu trữ mã nguồn là: <strong>${otpCode}</strong> (Hiệu lực: 5 phút).</p><p>Lưu ý bảo mật: Hệ thống không bao giờ gửi mã PIN qua email.</p>`,
          }),
        }).catch(() => {});
      }

      const allowDevHint =
        !resendKey &&
        (process.env.NODE_ENV !== "production" ||
          (process.env.NEXT_PUBLIC_SITE_URL || "").includes("localhost"));

      return apiOk({
        recoveryRequestId: res.data.recoveryRequestId,
        email: res.data.email,
        expiresAt: res.data.expiresAt,
        ttlSeconds: res.data.ttlSeconds,
        ...(allowDevHint ? { devOtpHint: otpCode } : {}),
      });
    }

    if (action === "FORGOT_PIN_RESET") {
      const res = await callStorageService("/api/v1/access/forgot-pin/reset", {
        method: "POST",
        user: guard.user,
        request,
        body: {
          otp: body.otp,
          newPin: body.newPin,
          confirmPin: body.confirmPin,
        },
      });
      if (!res.ok) {
        return apiError(res.error?.code || "OTP_RESET_ERROR", res.error?.message || "Không thể đặt lại PIN.", res.status);
      }
      await clearVaultSessionCookie();
      return apiOk(res.data);
    }

    if (action === "SYSTEM_LOCK") {
      const res = await callStorageService("/api/v1/access/system-lock", {
        method: "POST",
        user: guard.user,
        request,
        body: {
          lock: body.lock,
          reason: body.reason,
          pin: body.pin,
        },
      });
      if (!res.ok) {
        return apiError(res.error?.code || "SYSTEM_LOCK_ERROR", res.error?.message || "Không thể thay đổi trạng thái khóa kho.", res.status);
      }
      if (body.lock) {
        await clearVaultSessionCookie();
      }
      return apiOk(res.data);
    }

    if (action === "ADMIN_PERMISSION") {
      const res = await callStorageService("/api/v1/access/admin-permissions", {
        method: "POST",
        user: guard.user,
        request,
        body: {
          targetAccountId: body.targetAccountId,
          targetEmail: body.targetEmail,
          targetName: body.targetName,
          action: body.permissionAction,
        },
      });
      if (!res.ok) {
        return apiError(res.error?.code || "PERMISSION_ERROR", res.error?.message || "Không thể cập nhật quyền kho.", res.status);
      }
      return apiOk(res.data);
    }

    return apiError("UNKNOWN_ACTION", "Thao tác bảo mật kho không hợp lệ.", 400);
  } catch (err) {
    console.error("Storage access route error:", err);
    return apiError("SERVER_ERROR", "Lỗi xử lý xác thực kho lưu trữ.", 500);
  }
}
  return { GET, POST };
})();

// === [37] /api/admin/storage/audit ===
const route_37: Record<string, any> = (() => {
async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const qs = request.nextUrl.searchParams.toString();
  const res = await callStorageService(`/api/v1/audit-logs${qs ? `?${qs}` : ""}`, {
    method: "GET",
    user: guard.user,
    request,
  });

  if (!res.ok) {
    return apiError(res.error?.code || "AUDIT_ERROR", res.error?.message || "Không thể truy vấn nhật ký hoạt động.", res.status);
  }
  return apiOk(res.data);
}
  return { GET };
})();

// === [38] /api/admin/storage/backup ===
const route_38: Record<string, any> = (() => {
async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as {
      action?: "CREATE_BACKUP" | "RESTORE_BACKUP";
      label?: string;
      backupId?: string;
    };

    const action = (body.action || "CREATE_BACKUP").trim().toUpperCase();

    if (action === "RESTORE_BACKUP") {
      const res = await callStorageService("/api/v1/backup/restore", {
        method: "POST",
        user: guard.user,
        request,
        body: { backupId: body.backupId },
      });
      if (!res.ok) return apiError(res.error?.code || "BACKUP_RESTORE_ERROR", res.error?.message || "Không thể khôi phục bản sao lưu.", res.status);
      return apiOk(res.data);
    }

    const res = await callStorageService("/api/v1/backup/create", {
      method: "POST",
      user: guard.user,
      request,
      body: { label: body.label },
    });

    if (!res.ok) {
      return apiError(res.error?.code || "BACKUP_CREATE_ERROR", res.error?.message || "Không thể tạo bản sao lưu.", res.status);
    }
    return apiOk(res.data, 201);
  } catch (err) {
    console.error("Storage backup route error:", err);
    return apiError("SERVER_ERROR", "Lỗi sao lưu/khôi phục cơ sở dữ liệu kho.", 500);
  }
}
  return { POST };
})();

// === [39] /api/admin/storage/files ===
const route_39: Record<string, any> = (() => {
const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB

async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const sp = request.nextUrl.searchParams;
  const itemId = (sp.get("itemId") || "").trim();
  const version = (sp.get("version") || "").trim();
  const rawDownload = sp.get("raw") === "1";

  if (!itemId) {
    return apiError("MISSING_ITEM_ID", "Thiếu mã mục cần tải xuống.", 400);
  }

  const qs = version ? `?version=${encodeURIComponent(version)}` : "";
  const res = await callStorageService<{
    itemId: string;
    versionNumber: number;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    checksumSha256: string;
    base64Content: string;
  }>(`/api/v1/download/${encodeURIComponent(itemId)}${qs}`, {
    method: "GET",
    user: guard.user,
    request,
  });

  if (!res.ok || !res.data) {
    return apiError(
      res.error?.code || "DOWNLOAD_ERROR",
      res.error?.message || "Không thể tải xuống dữ liệu từ kho.",
      res.status
    );
  }

  if (rawDownload) {
    const buffer = Buffer.from(res.data.base64Content, "base64");
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": res.data.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(res.data.fileName)}"`,
        "Content-Length": String(buffer.length),
        "X-Checksum-Sha256": res.data.checksumSha256,
      },
    });
  }

  return apiOk(res.data);
}

async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const contentType = request.headers.get("content-type") || "";

    // Support both multipart/form-data and JSON base64 upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const logicalPath = (formData.get("logicalPath") as string | null) || undefined;
      const notes = (formData.get("notes") as string | null) || undefined;

      if (!file) {
        return apiError("MISSING_FILE", "Vui lòng chọn tệp cần tải lên kho.", 400);
      }

      const arrayBuf = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      if (buffer.length === 0) {
        return apiError("EMPTY_FILE", "Không thể tải lên tệp rỗng (0 byte).", 400);
      }
      if (buffer.length > MAX_FILE_BYTES) {
        return apiError(
          "FILE_EXCEEDS_15MB_LIMIT",
          `Tệp '${file.name}' (${buffer.length} bytes) vượt quá giới hạn tối đa 15 MB (${MAX_FILE_BYTES} bytes).`,
          413
        );
      }

      const res = await callStorageService("/api/v1/files/upload", {
        method: "POST",
        user: guard.user,
        request,
        body: {
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          base64Data: buffer.toString("base64"),
          logicalPath,
          notes,
        },
      });

      if (!res.ok) {
        return apiError(
          res.error?.code || "UPLOAD_ERROR",
          res.error?.message || "Tải tệp lên kho lưu trữ thất bại.",
          res.status
        );
      }
      return apiOk(res.data, 201);
    }

    const body = (await request.json()) as {
      action?: string;
      sessionId?: string;
      fileName?: string;
      expectedSizeBytes?: number;
      expectedChecksum?: string;
      base64Data?: string;
      mimeType?: string;
      logicalPath?: string;
      notes?: string;
      uploadSessionId?: string;
    };

    if (body.action === "CREATE_SESSION" || body.action === "CANCEL_SESSION") {
      const res = await callStorageService("/api/v1/files/upload-session", {
        method: "POST",
        user: guard.user,
        request,
        body: {
          operation: body.action === "CANCEL_SESSION" ? "CANCEL" : "CREATE",
          sessionId: body.sessionId,
          fileName: body.fileName,
          expectedSizeBytes: body.expectedSizeBytes,
          expectedChecksum: body.expectedChecksum,
        },
      });
      if (!res.ok) {
        return apiError(res.error?.code || "SESSION_ERROR", res.error?.message || "Lỗi phiên tải lên.", res.status);
      }
      return apiOk(res.data);
    }

    const b64 = String(body.base64Data || "");
    const rawBuf = Buffer.from(b64, "base64");
    if (rawBuf.length > MAX_FILE_BYTES) {
      return apiError(
        "FILE_EXCEEDS_15MB_LIMIT",
        `Kích thước thực tế của tệp (${rawBuf.length} bytes) vượt quá giới hạn 15 MB (${MAX_FILE_BYTES} bytes).`,
        413
      );
    }

    const res = await callStorageService("/api/v1/files/upload", {
      method: "POST",
      user: guard.user,
      request,
      body: {
        fileName: body.fileName,
        mimeType: body.mimeType || "application/octet-stream",
        base64Data: b64,
        logicalPath: body.logicalPath,
        notes: body.notes,
        uploadSessionId: body.uploadSessionId,
      },
    });

    if (!res.ok) {
      return apiError(res.error?.code || "UPLOAD_ERROR", res.error?.message || "Không thể lưu BLOB.", res.status);
    }
    return apiOk(res.data, 201);
  } catch (err) {
    console.error("Storage file upload route error:", err);
    return apiError("SERVER_ERROR", "Lỗi xử lý tải tệp lên kho lưu trữ.", 500);
  }
}
  return { GET, POST };
})();

// === [40] /api/admin/storage/import ===
const route_40: Record<string, any> = (() => {
async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const res = await callStorageService("/api/v1/import/status", {
    method: "GET",
    user: guard.user,
    request,
  });

  if (!res.ok) {
    return apiError(res.error?.code || "IMPORT_STATUS_ERROR", res.error?.message || "Không thể tải trạng thái đồng bộ dữ liệu.", res.status);
  }
  return apiOk(res.data);
}

async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: "RUN_IMPORT" | "RESUME_IMPORT" | "RETRY_ARCHIVE_EVENTS";
      resumeJobId?: string;
    };

    const action = (body.action || "RUN_IMPORT").trim().toUpperCase();

    if (action === "RETRY_ARCHIVE_EVENTS") {
      const res = await callStorageService("/api/v1/archive/retry-failed", {
        method: "POST",
        user: guard.user,
        request,
      });
      if (!res.ok) return apiError(res.error?.code || "RETRY_ERROR", res.error?.message || "Không thể thử lại sự kiện.", res.status);
      return apiOk(res.data);
    }

    const sourceRecords = await collectExistingWebsiteRecordsForImport();
    const res = await callStorageService("/api/v1/import/run", {
      method: "POST",
      user: guard.user,
      request,
      body: {
        sourceRecords,
        resumeJobId: body.resumeJobId,
      },
    });

    if (!res.ok) {
      return apiError(res.error?.code || "IMPORT_RUN_ERROR", res.error?.message || "Không thể chạy tác vụ nhập dữ liệu cũ.", res.status);
    }
    return apiOk(res.data);
  } catch (err) {
    console.error("Storage import route error:", err);
    return apiError("SERVER_ERROR", "Lỗi xử lý đồng bộ dữ liệu cũ.", 500);
  }
}
  return { GET, POST };
})();

// === [41] /api/admin/storage/items ===
const route_41: Record<string, any> = (() => {
async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const sp = request.nextUrl.searchParams;
  const itemId = (sp.get("itemId") || "").trim();
  const mode = (sp.get("mode") || "").trim().toLowerCase();
  const version = (sp.get("version") || "").trim();

  if (itemId) {
    if (mode === "preview") {
      const qs = version ? `?version=${encodeURIComponent(version)}` : "";
      const res = await callStorageService(`/api/v1/items/${encodeURIComponent(itemId)}/preview${qs}`, {
        method: "GET",
        user: guard.user,
        request,
      });
      if (!res.ok) {
        return apiError(res.error?.code || "PREVIEW_ERROR", res.error?.message || "Không thể xem trước mục này.", res.status);
      }
      return apiOk(res.data);
    }

    const res = await callStorageService(`/api/v1/items/${encodeURIComponent(itemId)}`, {
      method: "GET",
      user: guard.user,
      request,
    });
    if (!res.ok) {
      return apiError(res.error?.code || "DETAIL_ERROR", res.error?.message || "Không thể tải chi tiết mục lưu trữ.", res.status);
    }
    return apiOk(res.data);
  }

  const queryString = sp.toString();
  const res = await callStorageService(`/api/v1/items${queryString ? `?${queryString}` : ""}`, {
    method: "GET",
    user: guard.user,
    request,
  });

  if (!res.ok) {
    return apiError(res.error?.code || "LIST_ITEMS_ERROR", res.error?.message || "Không thể tải danh sách dữ liệu kho.", res.status);
  }

  return apiOk(res.data);
}
  return { GET };
})();

// === [42] /api/admin/storage/trash ===
const route_42: Record<string, any> = (() => {
async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const res = await callStorageService("/api/v1/trash", {
    method: "GET",
    user: guard.user,
    request,
  });

  if (!res.ok) {
    return apiError(res.error?.code || "TRASH_ERROR", res.error?.message || "Không thể tải thùng rác.", res.status);
  }
  return apiOk(res.data);
}

async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as {
      action?: "MOVE_TO_TRASH" | "RESTORE_FROM_TRASH" | "PERMANENT_DELETE";
      itemIds?: string[];
      itemId?: string;
      reason?: string;
      confirmationPhrase?: string;
    };

    const action = (body.action || "").trim().toUpperCase();
    const itemIds = body.itemIds || (body.itemId ? [body.itemId] : []);

    if (itemIds.length === 0) {
      return apiError("EMPTY_SELECTION", "Vui lòng chọn ít nhất một mục dữ liệu.", 400);
    }

    if (action === "MOVE_TO_TRASH") {
      const res = await callStorageService("/api/v1/trash/move", {
        method: "POST",
        user: guard.user,
        request,
        body: { itemIds, reason: body.reason },
      });
      if (!res.ok) return apiError(res.error?.code || "TRASH_MOVE_ERROR", res.error?.message || "Không thể đưa vào thùng rác.", res.status);
      return apiOk(res.data);
    }

    if (action === "RESTORE_FROM_TRASH") {
      const res = await callStorageService("/api/v1/trash/restore", {
        method: "POST",
        user: guard.user,
        request,
        body: { itemIds },
      });
      if (!res.ok) return apiError(res.error?.code || "TRASH_RESTORE_ERROR", res.error?.message || "Không thể khôi phục từ thùng rác.", res.status);
      return apiOk(res.data);
    }

    if (action === "PERMANENT_DELETE") {
      const res = await callStorageService("/api/v1/trash/permanent-delete", {
        method: "POST",
        user: guard.user,
        request,
        body: { itemIds, confirmationPhrase: body.confirmationPhrase },
      });
      if (!res.ok) return apiError(res.error?.code || "PERMANENT_DELETE_ERROR", res.error?.message || "Không thể xóa vĩnh viễn.", res.status);
      return apiOk(res.data);
    }

    return apiError("UNKNOWN_ACTION", "Thao tác thùng rác không hợp lệ.", 400);
  } catch (err) {
    console.error("Storage trash route error:", err);
    return apiError("SERVER_ERROR", "Lỗi xử lý thùng rác.", 500);
  }
}
  return { GET, POST };
})();

// === [43] /api/admin/storage/versions ===
const route_43: Record<string, any> = (() => {
async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  try {
    const body = (await request.json()) as {
      action?: "RESTORE_IN_VAULT" | "APPLY_TO_LIVE_WEBSITE";
      itemId?: string;
      versionNumber?: number;
      notes?: string;
      confirmApplyToLive?: boolean;
    };

    const itemId = (body.itemId || "").trim();
    const versionNumber = Number(body.versionNumber || 0);

    if (!itemId || versionNumber <= 0) {
      return apiError("INVALID_INPUT", "Thiếu mã mục hoặc số phiên bản.", 400);
    }

    // Separate action to sync restored vault record back to live website DB (Phần VIII.3)
    if (body.action === "APPLY_TO_LIVE_WEBSITE") {
      if (!body.confirmApplyToLive) {
        return apiError(
          "CONFIRMATION_REQUIRED",
          "Cần xác nhận bổ sung trước khi cập nhật dữ liệu từ kho về hệ thống gốc trên website.",
          400
        );
      }

      const detailRes = await callStorageService<{
        item: {
          id: string;
          item_type: string;
          source_id: string;
          title: string;
          content: string;
        };
        versions: Array<{
          version_number: number;
          title: string;
          content: string;
        }>;
      }>(`/api/v1/items/${encodeURIComponent(itemId)}`, {
        method: "GET",
        user: guard.user,
        request,
      });

      if (!detailRes.ok || !detailRes.data) {
        return apiError(
          detailRes.error?.code || "NOT_FOUND",
          detailRes.error?.message || "Không tìm thấy mục trong kho.",
          detailRes.status
        );
      }

      const item = detailRes.data.item;
      const targetVer =
        detailRes.data.versions.find((v) => v.version_number === versionNumber) ||
        detailRes.data.versions[0];

      if (!targetVer) {
        return apiError("VERSION_NOT_FOUND", "Không tìm thấy phiên bản cần đồng bộ.", 404);
      }

      if (item.item_type === "DOCUMENT" && item.source_id) {
        const docExists = await prisma.document.findUnique({ where: { id: item.source_id } });
        if (docExists) {
          await prisma.document.update({
            where: { id: item.source_id },
            data: {
              title: targetVer.title || docExists.title,
              previewContent: targetVer.content || docExists.previewContent,
            },
          });
        }
      } else if (item.item_type === "COMMUNITY_POST" && item.source_id) {
        const postExists = await prisma.communityPost.findUnique({ where: { id: item.source_id } });
        if (postExists) {
          await prisma.communityPost.update({
            where: { id: item.source_id },
            data: {
              title: targetVer.title || postExists.title,
              content: targetVer.content || postExists.content,
            },
          });
        }
      }

      return apiOk({
        appliedToLiveWebsite: true,
        itemId,
        sourceId: item.source_id,
        itemType: item.item_type,
        versionNumber,
      });
    }

    // Default: Restore inside the Vault only (never automatically overwrites live website DB)
    const res = await callStorageService("/api/v1/versions/restore", {
      method: "POST",
      user: guard.user,
      request,
      body: {
        itemId,
        versionNumber,
        notes: body.notes,
      },
    });

    if (!res.ok) {
      return apiError(res.error?.code || "RESTORE_ERROR", res.error?.message || "Không thể khôi phục phiên bản.", res.status);
    }

    return apiOk(res.data);
  } catch (err) {
    console.error("Storage version restore error:", err);
    return apiError("SERVER_ERROR", "Lỗi khôi phục phiên bản.", 500);
  }
}
  return { POST };
})();

// === [44] /api/auth/google/callback ===
const route_44: Record<string, any> = (() => {
async function GET(request: NextRequest) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).replace(/\/$/, "");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const cookieStore = await cookies();
  const savedState = cookieStore.get("lc_oauth_state")?.value;
  cookieStore.delete("lc_oauth_state");

  if (!clientId || !clientSecret || !code || !state || state !== savedState) {
    return NextResponse.redirect(`${siteUrl}/login?oauth=failed`);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${siteUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenJson = (await tokenRes.json()) as { access_token?: string };
    if (!tokenJson.access_token) {
      return NextResponse.redirect(`${siteUrl}/login?oauth=failed`);
    }

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const profile = (await userRes.json()) as {
      email?: string;
      name?: string;
      picture?: string;
    };

    if (!profile.email) {
      return NextResponse.redirect(`${siteUrl}/login?oauth=failed`);
    }

    const email = profile.email.toLowerCase();
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: profile.name || undefined,
        avatarUrl: profile.picture || undefined,
      },
      create: {
        email,
        name: profile.name || email.split("@")[0] || "Học viên",
        avatarUrl: profile.picture ?? null,
        xp: 20,
        streakDays: 1,
        lastActiveDate: new Date(),
      },
      select: { id: true, email: true, role: true },
    });

    await setSessionCookie({ sub: user.id, email: user.email, role: user.role });
    return NextResponse.redirect(`${siteUrl}/my-library`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${siteUrl}/login?oauth=failed`);
  }
}
  return { GET };
})();

// === [45] /api/auth/otp/request ===
const route_45: Record<string, any> = (() => {
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!EMAIL_RE.test(email)) {
      return apiError("INVALID_EMAIL", "Vui lòng nhập địa chỉ email hợp lệ.", 400);
    }

    // Simple 30s rate limit per email to prevent OTP spam
    const recent = await prisma.otpToken.findFirst({
      where: {
        email,
        createdAt: { gt: new Date(Date.now() - 30 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recent) {
      return apiError(
        "RATE_LIMITED",
        "Vui lòng chờ 30 giây trước khi yêu cầu mã OTP mới.",
        429
      );
    }

    const code = generateSixDigitOtp();
    const codeHash = hashOtpCode(email, code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpToken.create({
      data: { email, codeHash, expiresAt },
    });

    const resendKey = process.env.RESEND_API_KEY;
    const hasSmtp = Boolean(
      resendKey || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
    );

    if (resendKey) {
      const fromEmail = process.env.SMTP_FROM || "LingoChill <no-reply@lingochill.local>";
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: `[LingoChill] Mã xác thực đăng nhập: ${code}`,
          html: `<p>Mã OTP 6 chữ số của bạn là: <strong>${code}</strong> (hiệu lực 10 phút).</p>`,
        }),
      }).catch((mailErr) => {
        console.error("Resend OTP delivery failed:", mailErr);
      });
    }

    const isLocalOrigin = (process.env.NEXT_PUBLIC_SITE_URL || "").includes("localhost");
    const allowHint =
      !hasSmtp &&
      (process.env.NODE_ENV !== "production" ||
        isLocalOrigin ||
        process.env.ALLOW_DEV_OTP_HINT === "true");

    if (allowHint) {
      console.log(`[LingoChill LOCAL OTP] ${email} -> ${code}`);
    }

    return apiOk({
      sent: true,
      expiresInSeconds: 600,
      ...(allowHint ? { devOtpHint: code } : {}),
    });
  } catch (err) {
    console.error("OTP request error:", err);
    return apiError("SERVER_ERROR", "Không thể tạo mã xác thực. Vui lòng thử lại.", 500);
  }
}
  return { POST };
})();

// === [46] /api/auth/otp/verify ===
const route_46: Record<string, any> = (() => {
async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      code?: unknown;
      name?: unknown;
      inviteCode?: unknown;
      guestSavedDocIds?: unknown;
    };

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const providedName = typeof body.name === "string" ? body.name.trim() : "";
    const inviteCodeRaw =
      typeof body.inviteCode === "string" ? body.inviteCode.trim().toUpperCase() : "";

    if (!email || !/^\d{6}$/.test(code)) {
      return apiError("INVALID_INPUT", "Email hoặc mã OTP 6 chữ số không hợp lệ.", 400);
    }

    const codeHash = hashOtpCode(email, code);
    const token = await prisma.otpToken.findFirst({
      where: {
        email,
        codeHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!token) {
      return apiError("OTP_INVALID", "Mã OTP không đúng hoặc đã hết hạn.", 401);
    }

    await prisma.otpToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    });

    const defaultName = providedName || email.split("@")[0] || "Học viên";

    let matchedInvite: { id: string; code: string; school: string; major: string } | null = null;
    if (inviteCodeRaw) {
      const inv = await prisma.inviteCode.findUnique({ where: { code: inviteCodeRaw } });
      if (inv && inv.isActive && inv.usedCount < inv.maxUses) {
        matchedInvite = { id: inv.id, code: inv.code, school: inv.school, major: inv.major };
      } else {
        return apiError(
          "INVALID_INVITE_CODE",
          "Mã mời giáo viên không hợp lệ hoặc đã hết lượt sử dụng.",
          400
        );
      }
    }

    const isSchoolEmail = email.endsWith("@vsvc.edu.vn");
    const existingUser = await prisma.user.findUnique({ where: { email } });

    const approvalStatus =
      existingUser?.approvalStatus === "APPROVED" || isSchoolEmail || Boolean(matchedInvite)
        ? "APPROVED"
        : "PENDING";

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        ...(providedName ? { name: providedName } : {}),
        ...(matchedInvite
          ? {
              inviteCodeUsed: matchedInvite.code,
              school: matchedInvite.school,
              approvalStatus: "APPROVED",
              ...(matchedInvite.major !== "Tất cả ngành" ? { major: matchedInvite.major } : {}),
            }
          : isSchoolEmail
          ? { approvalStatus: "APPROVED" }
          : {}),
      },
      create: {
        email,
        name: defaultName,
        xp: 20,
        streakDays: 1,
        lastActiveDate: new Date(),
        approvalStatus,
        ...(matchedInvite
          ? {
              inviteCodeUsed: matchedInvite.code,
              school: matchedInvite.school,
              ...(matchedInvite.major !== "Tất cả ngành" ? { major: matchedInvite.major } : {}),
            }
          : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        xp: true,
        streakDays: true,
        targetScore: true,
        ageGroup: true,
        approvalStatus: true,
        parentConsentStatus: true,
      },
    });

    if (matchedInvite) {
      await prisma.inviteCode.update({
        where: { id: matchedInvite.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    await mergeGuestSavedDocs(user.id, body.guestSavedDocIds);

    await setSessionCookie({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return apiOk({ user });
  } catch (err) {
    console.error("OTP verify error:", err);
    return apiError("SERVER_ERROR", "Xác thực OTP thất bại.", 500);
  }
}
  return { POST };
})();

// === [47] /api/admin/community/[id] ===
const route_47: Record<string, any> = (() => {
async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { id } = await context.params;
  const existing = await prisma.communityPost.findUnique({ where: { id } });
  if (!existing) return apiError("NOT_FOUND", "Không tìm thấy bài viết.", 404);

  const body = (await request.json()) as {
    isPinned?: unknown;
    title?: unknown;
    content?: unknown;
    group?: unknown;
    authorBadge?: unknown;
  };

  const updated = await prisma.communityPost.update({
    where: { id },
    data: {
      ...(typeof body.isPinned === "boolean" ? { isPinned: body.isPinned } : {}),
      ...(typeof body.title === "string" && body.title.trim()
        ? { title: body.title.trim().slice(0, 140) }
        : {}),
      ...(typeof body.content === "string" && body.content.trim()
        ? { content: body.content.trim().slice(0, 2000) }
        : {}),
      ...(typeof body.group === "string" && body.group.trim()
        ? { group: body.group.trim() }
        : {}),
      ...(body.authorBadge !== undefined
        ? {
            authorBadge:
              typeof body.authorBadge === "string" && body.authorBadge.trim()
                ? body.authorBadge.trim().slice(0, 32)
                : null,
          }
        : {}),
    },
    include: {
      user: { select: { name: true, email: true, role: true } },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      },
      _count: { select: { likes: true, comments: true, votes: true } },
    },
  });

  // Tự động tạo phiên bản mới khi chỉnh sửa bài đăng cộng đồng (Phần V.2 & V.5)
  void emitAutoArchiveEvent({
    eventType: "POST_UPDATED",
    itemType: "COMMUNITY_POST",
    sourceId: updated.id,
    payload: {
      title: updated.title,
      content: updated.content,
      authorId: updated.userId,
      authorName: updated.user.name,
      authorEmail: updated.user.email,
      editorId: guard.user.id,
      editorName: guard.user.name,
      ownerId: updated.userId,
      sourceUpdatedAt: updated.updatedAt.toISOString(),
      metadata: {
        group: updated.group,
        authorBadge: updated.authorBadge,
        isPinned: updated.isPinned,
      },
      changeSummary: `Cập nhật bài đăng cộng đồng bởi ${guard.user.name}`,
    },
  });

  return apiOk({ post: updated });
}

async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { id } = await context.params;
  const existing = await prisma.communityPost.findUnique({ where: { id } });
  if (!existing) return apiError("NOT_FOUND", "Không tìm thấy bài viết.", 404);

  await prisma.communityPost.delete({ where: { id } });
  return apiOk({ deletedId: id });
}
  return { PATCH, DELETE };
})();

// === [48] /api/admin/documents/[id] ===
const route_48: Record<string, any> = (() => {
async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { id } = await context.params;
  const existing = await prisma.document.findUnique({ where: { id } });
  if (!existing) return apiError("NOT_FOUND", "Không tìm thấy tài liệu.", 404);

  try {
    const body = (await request.json()) as {
      title?: unknown;
      description?: unknown;
      categoryId?: unknown;
      level?: unknown;
      fileType?: unknown;
      pageCount?: unknown;
      fileSizeLabel?: unknown;
      isFree?: unknown;
      priceVnd?: unknown;
      externalUrl?: unknown;
      previewContent?: unknown;
      tags?: unknown;
      isFeatured?: unknown;
    };

    const nextFree = typeof body.isFree === "boolean" ? body.isFree : existing.isFree;
    const nextTags =
      body.tags === undefined
        ? undefined
        : Array.isArray(body.tags)
        ? JSON.stringify(body.tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0))
        : typeof body.tags === "string"
        ? JSON.stringify(
            body.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          )
        : undefined;

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(typeof body.title === "string" && body.title.trim()
          ? { title: body.title.trim() }
          : {}),
        ...(typeof body.description === "string" && body.description.trim()
          ? { description: body.description.trim() }
          : {}),
        ...(typeof body.categoryId === "string" && body.categoryId.trim()
          ? { categoryId: body.categoryId.trim() }
          : {}),
        ...(typeof body.level === "string" && body.level.trim()
          ? { level: body.level.trim() }
          : {}),
        ...(typeof body.fileType === "string" && body.fileType.trim()
          ? { fileType: body.fileType.trim().toUpperCase() }
          : {}),
        ...(body.pageCount !== undefined
          ? { pageCount: clampInt(body.pageCount, 1, 2000, existing.pageCount) }
          : {}),
        ...(typeof body.fileSizeLabel === "string" && body.fileSizeLabel.trim()
          ? { fileSizeLabel: body.fileSizeLabel.trim() }
          : {}),
        isFree: nextFree,
        priceVnd: nextFree
          ? 0
          : body.priceVnd !== undefined
          ? clampInt(body.priceVnd, 0, 10000000, existing.priceVnd)
          : existing.priceVnd,
        ...(body.externalUrl !== undefined
          ? {
              externalUrl:
                typeof body.externalUrl === "string" && body.externalUrl.trim()
                  ? body.externalUrl.trim()
                  : null,
            }
          : {}),
        ...(typeof body.previewContent === "string" && body.previewContent.trim()
          ? { previewContent: body.previewContent.trim() }
          : {}),
        ...(nextTags !== undefined ? { tagsJson: nextTags } : {}),
        ...(typeof body.isFeatured === "boolean" ? { isFeatured: body.isFeatured } : {}),
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    // Tự động tạo phiên bản mới trong Kho lưu trữ mã nguồn (Phần V.1 & V.5)
    void emitAutoArchiveEvent({
      eventType: "DOCUMENT_UPDATED",
      itemType: "DOCUMENT",
      sourceId: updated.id,
      payload: {
        title: updated.title,
        content: `${updated.description}\n\n${updated.previewContent}`.trim(),
        editorId: guard.user.id,
        editorName: guard.user.name,
        authorEmail: guard.user.email,
        sourceStatus: "ACTIVE",
        externalUrl: updated.externalUrl,
        fileFormat: updated.fileType,
        sourceUpdatedAt: new Date().toISOString(),
        metadata: {
          slug: updated.slug,
          categoryName: updated.category.name,
          level: updated.level,
          pageCount: updated.pageCount,
          fileSizeLabel: updated.fileSizeLabel,
          isFree: updated.isFree,
          tagsJson: updated.tagsJson,
        },
        changeSummary: `Cập nhật tài liệu bởi ${guard.user.name}`,
      },
    });

    return apiOk({ document: updated });
  } catch (err) {
    console.error("Admin update document error:", err);
    return apiError("SERVER_ERROR", "Không thể cập nhật tài liệu.", 500);
  }
}

async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { id } = await context.params;
  const existing = await prisma.document.findUnique({ where: { id } });
  if (!existing) return apiError("NOT_FOUND", "Không tìm thấy tài liệu.", 404);

  await prisma.document.delete({ where: { id } });
  return apiOk({ deletedId: id });
}
  return { PATCH, DELETE };
})();

// === [49] /api/admin/donations/[id] ===
const route_49: Record<string, any> = (() => {
async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { id } = await context.params;
  const existing = await prisma.donationRecord.findUnique({ where: { id } });
  if (!existing) return apiError("NOT_FOUND", "Không tìm thấy đơn ủng hộ.", 404);

  const body = (await request.json()) as { status?: unknown };
  if (body.status !== "PENDING" && body.status !== "PAID" && body.status !== "CANCELLED") {
    return apiError("INVALID_STATUS", "Trạng thái không hợp lệ.", 400);
  }

  const updated = await prisma.donationRecord.update({
    where: { id },
    data: {
      status: body.status,
      paidAt: body.status === "PAID" ? existing.paidAt ?? new Date() : null,
    },
  });

  return apiOk({ donation: updated });
}

async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { id } = await context.params;
  const existing = await prisma.donationRecord.findUnique({ where: { id } });
  if (!existing) return apiError("NOT_FOUND", "Không tìm thấy đơn ủng hộ.", 404);

  await prisma.donationRecord.delete({ where: { id } });
  return apiOk({ deletedId: id });
}
  return { PATCH, DELETE };
})();

// === [50] /api/admin/exams/[id] ===
const route_50: Record<string, any> = (() => {
async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { id } = await context.params;
  const body = (await request.json()) as {
    title?: unknown;
    description?: unknown;
    durationMinutes?: unknown;
    difficulty?: unknown;
    isHot?: unknown;
  };

  const existing = await prisma.examTest.findUnique({ where: { id } });
  if (!existing) return apiError("NOT_FOUND", "Không tìm thấy đề thi.", 404);

  const updated = await prisma.examTest.update({
    where: { id },
    data: {
      ...(typeof body.title === "string" && body.title.trim()
        ? { title: body.title.trim() }
        : {}),
      ...(typeof body.description === "string" && body.description.trim()
        ? { description: body.description.trim() }
        : {}),
      ...(body.durationMinutes !== undefined
        ? { durationMinutes: clampInt(body.durationMinutes, 5, 120, existing.durationMinutes) }
        : {}),
      ...(typeof body.difficulty === "string" && body.difficulty.trim()
        ? { difficulty: body.difficulty.trim() }
        : {}),
      ...(typeof body.isHot === "boolean" ? { isHot: body.isHot } : {}),
    },
    include: { _count: { select: { questions: true, attempts: true } } },
  });

  return apiOk({ test: updated });
}

async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { id } = await context.params;
  const kind = request.nextUrl.searchParams.get("kind");

  if (kind === "set") {
    const existing = await prisma.examSet.findUnique({ where: { id } });
    if (!existing) return apiError("NOT_FOUND", "Không tìm thấy bộ đề.", 404);
    await prisma.examSet.delete({ where: { id } });
    return apiOk({ deletedId: id, kind: "set" });
  }

  const existing = await prisma.examTest.findUnique({ where: { id } });
  if (!existing) return apiError("NOT_FOUND", "Không tìm thấy đề thi.", 404);
  await prisma.examTest.delete({ where: { id } });
  return apiOk({ deletedId: id, kind: "test" });
}
  return { PATCH, DELETE };
})();

// === [51] /api/admin/grammar/[id] ===
const route_51: Record<string, any> = (() => {
async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { id } = await context.params;
  const body = (await request.json()) as {
    kind?: "topic" | "lesson";
    title?: unknown;
    description?: unknown;
    targetLevel?: unknown;
    estimatedMinutes?: unknown;
    order?: unknown;
  };

  if (body.kind === "topic") {
    const existing = await prisma.grammarTopic.findUnique({ where: { id } });
    if (!existing) return apiError("NOT_FOUND", "Không tìm thấy chặng ngữ pháp.", 404);
    const estMins = Number(body.estimatedMinutes);
    const topic = await prisma.grammarTopic.update({
      where: { id },
      data: {
        ...(typeof body.title === "string" && body.title.trim()
          ? { title: body.title.trim() }
          : {}),
        ...(typeof body.description === "string" && body.description.trim()
          ? { description: body.description.trim() }
          : {}),
        ...(typeof body.targetLevel === "string" && body.targetLevel.trim()
          ? { targetLevel: body.targetLevel.trim() }
          : {}),
        ...(Number.isFinite(estMins) && estMins >= 5 && estMins <= 180
          ? { estimatedMinutes: Math.round(estMins) }
          : {}),
      },
    });
    return apiOk({ topic });
  }

  const existingLesson = await prisma.grammarLesson.findUnique({ where: { id } });
  if (!existingLesson) return apiError("NOT_FOUND", "Không tìm thấy bài học.", 404);
  const nextOrder = Number(body.order);
  const lesson = await prisma.grammarLesson.update({
    where: { id },
    data: {
      ...(typeof body.title === "string" && body.title.trim()
        ? { title: body.title.trim() }
        : {}),
      ...(Number.isFinite(nextOrder) && nextOrder >= 1 ? { order: Math.round(nextOrder) } : {}),
    },
  });
  return apiOk({ lesson });
}

async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { id } = await context.params;
  const kind = request.nextUrl.searchParams.get("kind");

  if (kind === "topic") {
    const existing = await prisma.grammarTopic.findUnique({ where: { id } });
    if (!existing) return apiError("NOT_FOUND", "Không tìm thấy chặng ngữ pháp.", 404);
    await prisma.grammarTopic.delete({ where: { id } });
    return apiOk({ deletedId: id, kind: "topic" });
  }

  const existing = await prisma.grammarLesson.findUnique({ where: { id } });
  if (!existing) return apiError("NOT_FOUND", "Không tìm thấy bài học.", 404);
  await prisma.grammarLesson.delete({ where: { id } });
  return apiOk({ deletedId: id, kind: "lesson" });
}
  return { PATCH, DELETE };
})();

// === [52] /api/admin/users/[id] ===
const route_52: Record<string, any> = (() => {
async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { id } = await context.params;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return apiError("NOT_FOUND", "Không tìm thấy người dùng.", 404);

  const body = (await request.json()) as {
    role?: unknown;
    xp?: unknown;
    streakDays?: unknown;
    targetScore?: unknown;
    name?: unknown;
  };

  let nextRole: string | undefined;
  if (body.role === "ADMIN" || body.role === "USER") {
    if (existing.id === guard.user.id && body.role === "USER") {
      return apiError(
        "CANNOT_DEMOTE_SELF",
        "Không thể tự hạ quyền tài khoản Admin đang đăng nhập.",
        400
      );
    }
    if (existing.role === "ADMIN" && body.role === "USER") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return apiError("LAST_ADMIN", "Phải giữ lại ít nhất 1 tài khoản ADMIN.", 400);
      }
    }
    nextRole = body.role;
  }

  const nextXp =
    body.xp !== undefined ? clampInt(body.xp, 0, 1000000, existing.xp) : existing.xp;
  const xpDelta = nextXp - existing.xp;

  const updated = await prisma.$transaction(async (tx) => {
    if (xpDelta !== 0) {
      await tx.xpLedger.create({
        data: {
          userId: existing.id,
          source: "ADMIN_ADJUST",
          refId: guard.user.id,
          points: xpDelta,
        },
      });
    }

    return tx.user.update({
      where: { id },
      data: {
        ...(nextRole ? { role: nextRole } : {}),
        ...(body.xp !== undefined ? { xp: nextXp } : {}),
        ...(body.streakDays !== undefined
          ? { streakDays: clampInt(body.streakDays, 0, 3650, existing.streakDays) }
          : {}),
        ...(body.targetScore !== undefined
          ? { targetScore: clampInt(body.targetScore, 300, 990, existing.targetScore) }
          : {}),
        ...(typeof body.name === "string" && body.name.trim().length >= 2
          ? { name: body.name.trim().slice(0, 60) }
          : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        xp: true,
        streakDays: true,
        targetScore: true,
        createdAt: true,
        _count: {
          select: {
            examAttempts: true,
            savedDocuments: true,
            vocabWords: true,
          },
        },
      },
    });
  });

  return apiOk({ user: updated });
}

async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { id } = await context.params;
  if (id === guard.user.id) {
    return apiError("CANNOT_DELETE_SELF", "Không thể tự xóa tài khoản Admin đang đăng nhập.", 400);
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return apiError("NOT_FOUND", "Không tìm thấy người dùng.", 404);

  if (existing.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return apiError("LAST_ADMIN", "Không thể xóa tài khoản Admin duy nhất.", 400);
    }
  }

  await prisma.user.delete({ where: { id } });
  await callStorageService("/api/v1/accounts/handle-deletion", {
    method: "POST",
    user: guard.user,
    body: {
      deletedAccountId: existing.id,
      deletedAccountEmail: existing.email,
      permanentPurgePrivate: false,
    },
  }).catch(() => {});
  return apiOk({ deletedId: id });
}
  return { PATCH, DELETE };
})();

// === [53] /api/documents/[id]/download ===
const route_53: Record<string, any> = (() => {
async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!doc) {
    return apiError("NOT_FOUND", "Không tìm thấy tài liệu.", 404);
  }

  await prisma.document.update({
    where: { id: doc.id },
    data: { downloadCount: { increment: 1 } },
  });

  if (doc.externalUrl) {
    return NextResponse.redirect(doc.externalUrl);
  }

  const body = [
    `# ${doc.title}`,
    `Danh mục: ${doc.category.name} | Trình độ: ${doc.level} | Định dạng: ${doc.fileType}`,
    "",
    doc.description,
    "",
    "---",
    "",
    doc.previewContent,
    "",
    "---",
    `Xuất từ LingoChill Study Library`,
  ].join("\n");

  const filename = `${doc.slug}-study-guide.md`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
  return { GET };
})();

// === [54] /api/documents/[id]/save ===
const route_54: Record<string, any> = (() => {
async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Vui lòng đăng nhập để lưu tài liệu vào kho cá nhân.", 401);
  }

  const { id } = await context.params;
  const doc = await prisma.document.findUnique({ where: { id }, select: { id: true } });
  if (!doc) {
    return apiError("NOT_FOUND", "Không tìm thấy tài liệu.", 404);
  }

  const existing = await prisma.userSavedDocument.findUnique({
    where: { userId_documentId: { userId: user.id, documentId: id } },
  });

  if (existing) {
    await prisma.userSavedDocument.delete({ where: { id: existing.id } });
    return apiOk({ saved: false, documentId: id });
  }

  await prisma.userSavedDocument.create({
    data: { userId: user.id, documentId: id },
  });
  return apiOk({ saved: true, documentId: id });
}
  return { POST };
})();

// === [55] /api/exams/[id]/submit ===
const route_55: Record<string, any> = (() => {
async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const examTest = await prisma.examTest.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { number: "asc" },
      },
    },
  });

  if (!examTest) {
    return apiError("NOT_FOUND", "Không tìm thấy đề thi.", 404);
  }

  const body = (await request.json()) as {
    answers?: Record<string, number>;
    durationSeconds?: number;
    mode?: string;
  };

  const answers = body.answers ?? {};
  const durationSeconds = Math.max(0, Math.round(Number(body.durationSeconds ?? 0)));
  const mode = body.mode === "PRACTICE" ? "PRACTICE" : "FULL";

  let listeningTotal = 0;
  let listeningCorrect = 0;
  let readingTotal = 0;
  let readingCorrect = 0;

  const breakdown = examTest.questions.map((q) => {
    const selected = typeof answers[String(q.number)] === "number" ? answers[String(q.number)] : -1;
    const isCorrect = selected === q.correctIndex;
    if (q.part <= 4) {
      listeningTotal += 1;
      if (isCorrect) listeningCorrect += 1;
    } else {
      readingTotal += 1;
      if (isCorrect) readingCorrect += 1;
    }
    return {
      number: q.number,
      part: q.part,
      selectedIndex: selected,
      correctIndex: q.correctIndex,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const listeningScore = listeningTotal > 0 ? calculateToeicSectionScore(listeningCorrect, listeningTotal) : 5;
  const readingScore = readingTotal > 0 ? calculateToeicSectionScore(readingCorrect, readingTotal) : 5;
  const totalScore =
    (listeningTotal > 0 ? listeningScore : 0) + (readingTotal > 0 ? readingScore : 0);

  const user = await getCurrentUser();
  if (!user) {
    return apiOk({
      saved: false,
      listeningCorrect,
      listeningTotal,
      readingCorrect,
      readingTotal,
      listeningScore,
      readingScore,
      totalScore,
      durationSeconds,
      breakdown,
      xpAwarded: 0,
    });
  }

  const attempt = await prisma.examAttempt.create({
    data: {
      userId: user.id,
      examTestId: examTest.id,
      mode,
      answersJson: JSON.stringify(answers),
      listeningCorrect,
      readingCorrect,
      listeningScore,
      readingScore,
      totalScore,
      durationSeconds,
    },
  });

  const totalCorrect = listeningCorrect + readingCorrect;
  const xpAwarded = Math.max(20, totalCorrect * 5);
  const userStats = await awardXpAndStreak(user.id, "EXAM", attempt.id, xpAwarded);

  return apiOk({
    saved: true,
    attemptId: attempt.id,
    listeningCorrect,
    listeningTotal,
    readingCorrect,
    readingTotal,
    listeningScore,
    readingScore,
    totalScore,
    durationSeconds,
    breakdown,
    xpAwarded,
    userStats,
  });
}
  return { POST };
})();

// === [56] /api/sessions/[id]/rubric ===
const route_56: Record<string, any> = (() => {
async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireUser();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { id } = await context.params;
  const session = await prisma.practiceSession.findUnique({ where: { id } });
  if (!session) {
    return apiError("NOT_FOUND", "Không tìm thấy buổi luyện.", 404);
  }

  const isHost = session.hostId === guard.user.id;
  const isPartner = session.partnerId === guard.user.id;
  if (!isHost && !isPartner) {
    return apiError("FORBIDDEN", "Chỉ thành viên tham gia buổi luyện mới có thể gửi phiếu rubric.", 403);
  }

  const targetUserId = isHost ? session.partnerId : session.hostId;
  if (!targetUserId) {
    return apiError("NO_PARTNER", "Buổi luyện chưa có bạn ghép cặp để nhận xét.", 400);
  }

  try {
    const body = (await request.json()) as {
      scores?: Record<string, unknown>;
      satisfactionRating?: unknown;
      strengths?: unknown;
      improvements?: unknown;
    };

    const rawScores = body.scores && typeof body.scores === "object" ? body.scores : {};
    const scoreKeys = [
      "terminology",
      "clarity",
      "task_completion",
      "interaction",
      "professionalism",
    ];
    const cleanScores: Record<string, number> = {};
    let total = 0;

    for (const key of scoreKeys) {
      const val = Math.min(5, Math.max(1, Math.round(Number(rawScores[key]) || 4)));
      cleanScores[key] = val;
      total += val;
    }

    const overallScore = Math.round((total / scoreKeys.length) * 10) / 10;
    const satisfactionRating = Math.min(
      5,
      Math.max(1, Math.round(Number(body.satisfactionRating) || 5))
    );
    const strengths =
      typeof body.strengths === "string" ? body.strengths.trim().slice(0, 600) : "";
    const improvements =
      typeof body.improvements === "string" ? body.improvements.trim().slice(0, 600) : "";

    if (strengths.length < 4 || improvements.length < 4) {
      return apiError(
        "INVALID_FEEDBACK",
        "Vui lòng viết nhận xét ngắn về điểm mạnh và điểm cần cải thiện (tối thiểu 4 ký tự).",
        400
      );
    }

    const review = await prisma.peerRubricReview.upsert({
      where: {
        sessionId_reviewerId: {
          sessionId: session.id,
          reviewerId: guard.user.id,
        },
      },
      update: {
        scoresJson: JSON.stringify(cleanScores),
        overallScore,
        satisfactionRating,
        strengths,
        improvements,
      },
      create: {
        sessionId: session.id,
        reviewerId: guard.user.id,
        targetUserId,
        scoresJson: JSON.stringify(cleanScores),
        overallScore,
        satisfactionRating,
        strengths,
        improvements,
      },
    });

    const xpRes = await awardXpAndStreak(guard.user.id, "RUBRIC", review.id, 15);
    return apiOk({ review, xp: xpRes.xp, streakDays: xpRes.streakDays }, 201);
  } catch (err) {
    console.error("Submit rubric error:", err);
    return apiError("SERVER_ERROR", "Không thể lưu phiếu nhận xét rubric.", 500);
  }
}
  return { POST };
})();

// === [57] /api/admin/community/comments/[commentId] ===
const route_57: Record<string, any> = (() => {
async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ commentId: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { commentId } = await context.params;
  const existing = await prisma.communityComment.findUnique({ where: { id: commentId } });
  if (!existing) return apiError("NOT_FOUND", "Không tìm thấy bình luận.", 404);

  await prisma.communityComment.delete({ where: { id: commentId } });
  return apiOk({ deletedId: commentId });
}
  return { DELETE };
})();

// === [58] /api/admin/exams/[id]/questions ===
const route_58: Record<string, any> = (() => {
async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { id } = await context.params;
  const test = await prisma.examTest.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { number: "asc" },
      },
    },
  });

  if (!test) {
    return apiError("NOT_FOUND", "Không tìm thấy đề thi.", 404);
  }

  return apiOk({ test });
}
  return { GET };
})();

// === [59] /api/admin/exams/questions/[questionId] ===
const route_59: Record<string, any> = (() => {
async function syncExamTestCounts(tx: Prisma.TransactionClient, examTestId: string) {
  const [totalQuestions, listeningCount, readingCount] = await Promise.all([
    tx.examQuestion.count({ where: { examTestId } }),
    tx.examQuestion.count({ where: { examTestId, part: { lte: 4 } } }),
    tx.examQuestion.count({ where: { examTestId, part: { gte: 5 } } }),
  ]);

  await tx.examTest.update({
    where: { id: examTestId },
    data: { totalQuestions, listeningCount, readingCount },
  });
}

async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ questionId: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { questionId } = await context.params;
  const existing = await prisma.examQuestion.findUnique({ where: { id: questionId } });
  if (!existing) return apiError("NOT_FOUND", "Không tìm thấy câu hỏi.", 404);

  const body = (await request.json()) as {
    part?: unknown;
    promptText?: unknown;
    options?: unknown;
    correctIndex?: unknown;
    explanation?: unknown;
    audioScript?: unknown;
    passageTitle?: unknown;
    passageHtml?: unknown;
  };

  const options = Array.isArray(body.options)
    ? body.options.map((o) => String(o).trim()).filter(Boolean)
    : null;
  if (options && options.length < 3) {
    return apiError("INVALID_OPTIONS", "Cần tối thiểu 3 phương án trả lời.", 400);
  }

  const nextPart =
    body.part !== undefined ? clampInt(body.part, 1, 7, existing.part) : existing.part;
  const optionLen = options ? options.length : 4;
  const nextCorrectIndex =
    body.correctIndex !== undefined
      ? clampInt(body.correctIndex, 0, Math.max(0, optionLen - 1), existing.correctIndex)
      : existing.correctIndex;

  const updated = await prisma.$transaction(async (tx) => {
    const q = await tx.examQuestion.update({
      where: { id: questionId },
      data: {
        part: nextPart,
        ...(typeof body.promptText === "string" && body.promptText.trim()
          ? { promptText: body.promptText.trim() }
          : {}),
        ...(options ? { optionsJson: JSON.stringify(options) } : {}),
        correctIndex: nextCorrectIndex,
        ...(typeof body.explanation === "string" && body.explanation.trim()
          ? { explanation: body.explanation.trim() }
          : {}),
        ...(body.audioScript !== undefined
          ? {
              audioScript:
                typeof body.audioScript === "string" && body.audioScript.trim()
                  ? body.audioScript.trim()
                  : null,
            }
          : {}),
        ...(body.passageTitle !== undefined
          ? {
              passageTitle:
                typeof body.passageTitle === "string" && body.passageTitle.trim()
                  ? body.passageTitle.trim()
                  : null,
            }
          : {}),
        ...(body.passageHtml !== undefined
          ? {
              passageHtml:
                typeof body.passageHtml === "string" && body.passageHtml.trim()
                  ? body.passageHtml.trim()
                  : null,
            }
          : {}),
      },
    });

    await syncExamTestCounts(tx, existing.examTestId);
    return q;
  });

  return apiOk({ question: updated });
}

async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ questionId: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { questionId } = await context.params;
  const existing = await prisma.examQuestion.findUnique({ where: { id: questionId } });
  if (!existing) return apiError("NOT_FOUND", "Không tìm thấy câu hỏi.", 404);

  await prisma.$transaction(async (tx) => {
    await tx.examQuestion.delete({ where: { id: questionId } });
    await syncExamTestCounts(tx, existing.examTestId);
  });

  return apiOk({ deletedId: questionId, examTestId: existing.examTestId });
}
  return { PATCH, DELETE };
})();

// === [60] /api/community/posts/[id]/comments ===
const route_60: Record<string, any> = (() => {
async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireUser();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { id } = await context.params;
  const post = await prisma.communityPost.findUnique({ where: { id }, select: { id: true, title: true } });
  if (!post) return apiError("NOT_FOUND", "Không tìm thấy bài viết.", 404);

  const body = (await request.json()) as { content?: unknown };
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content || content.length > 500) {
    return apiError("INVALID_COMMENT", "Bình luận hợp lệ từ 1 đến 500 ký tự.", 400);
  }

  const created = await prisma.communityComment.create({
    data: {
      postId: id,
      userId: guard.user.id,
      content,
    },
    include: { user: { select: { name: true, email: true } } },
  });

  // Tự động lưu bình luận cộng đồng vào Kho lưu trữ mã nguồn (Phần V.3 & V.4)
  void emitAutoArchiveEvent({
    eventType: "COMMENT_CREATED",
    itemType: "COMMUNITY_COMMENT",
    sourceId: created.id,
    payload: {
      title: `Bình luận trên bài: ${post.title}`,
      content: created.content,
      authorId: guard.user.id,
      authorName: created.user.name,
      authorEmail: created.user.email,
      creatorId: guard.user.id,
      creatorName: created.user.name,
      ownerId: guard.user.id,
      parentSourceId: id,
      sourceCreatedAt: created.createdAt.toISOString(),
      metadata: {
        postId: id,
        postTitle: post.title,
      },
      changeSummary: "Tự động lưu khi đăng bình luận cộng đồng",
    },
  });

  return apiOk(
    {
      comment: {
        id: created.id,
        author: created.user.name,
        content: created.content,
        timeAgo: formatRelativeVi(created.createdAt),
      },
    },
    201
  );
}
  return { POST };
})();

// === [61] /api/community/posts/[id]/like ===
const route_61: Record<string, any> = (() => {
async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireUser();
  if (!guard.ok) return apiError(guard.code, guard.message, guard.status);

  const { id } = await context.params;
  const post = await prisma.communityPost.findUnique({ where: { id }, select: { id: true } });
  if (!post) return apiError("NOT_FOUND", "Không tìm thấy bài viết.", 404);

  const existing = await prisma.communityPostLike.findUnique({
    where: { postId_userId: { postId: id, userId: guard.user.id } },
  });

  if (existing) {
    await prisma.communityPostLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.communityPostLike.create({
      data: { postId: id, userId: guard.user.id },
    });
  }

  const likesCount = await prisma.communityPostLike.count({ where: { postId: id } });
  return apiOk({ liked: !existing, likes: likesCount });
}
  return { POST };
})();

// === [62] /api/community/posts/[id]/vote ===
const route_62: Record<string, any> = (() => {
async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = (await request.json()) as { key?: unknown };
  const key = body.key;
  if (key !== "A" && key !== "B" && key !== "C" && key !== "D") {
    return apiError("INVALID_OPTION", "Lựa chọn không hợp lệ.", 400);
  }

  const post = await prisma.communityPost.findUnique({ where: { id } });
  if (!post || !post.pollJson) {
    return apiError("NOT_FOUND", "Bài viết không có câu hỏi bình chọn.", 404);
  }

  const poll = safeJsonParse<CommunityPollData | null>(post.pollJson, null);
  if (!poll) return apiError("INVALID_POLL", "Dữ liệu bình chọn không hợp lệ.", 500);

  const user = await getCurrentUser();
  if (user) {
    const alreadyVoted = await prisma.communityPollVote.findUnique({
      where: { postId_userId: { postId: id, userId: user.id } },
    });
    if (alreadyVoted) {
      return apiOk({ poll, votedKey: alreadyVoted.optionKey, alreadyVoted: true });
    }
    await prisma.communityPollVote.create({
      data: { postId: id, userId: user.id, optionKey: key },
    });
  }

  const updatedPoll: CommunityPollData = {
    ...poll,
    options: poll.options.map((opt) =>
      opt.key === key ? { ...opt, votes: opt.votes + 1 } : opt
    ),
  };

  await prisma.communityPost.update({
    where: { id },
    data: { pollJson: JSON.stringify(updatedPoll) },
  });

  return apiOk({ poll: updatedPoll, votedKey: key });
}
  return { POST };
})();

// === [63] /api/grammar/lessons/[id]/progress ===
const route_63: Record<string, any> = (() => {
interface QuizQuestion {
  id: string;
  correctIndex: number;
  explanation: string;
}

async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const lesson = await prisma.grammarLesson.findUnique({ where: { id } });
  if (!lesson) {
    return apiError("NOT_FOUND", "Không tìm thấy bài học ngữ pháp.", 404);
  }

  const body = (await request.json()) as {
    answers?: Record<string, number>;
    markCompleted?: boolean;
  };

  const questions = safeJsonParse<QuizQuestion[]>(lesson.testsJson, []);
  const answers = body.answers ?? {};

  let correctCount = 0;
  const results = questions.map((q) => {
    const selected = typeof answers[q.id] === "number" ? answers[q.id] : -1;
    const isCorrect = selected === q.correctIndex;
    if (isCorrect) correctCount += 1;
    return {
      questionId: q.id,
      selectedIndex: selected,
      correctIndex: q.correctIndex,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const user = await getCurrentUser();
  if (!user) {
    return apiOk({
      saved: false,
      correctCount,
      totalQuestions: questions.length,
      results,
      xpAwarded: 0,
    });
  }

  const existing = await prisma.userGrammarProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
  });

  const nextCompleted = Boolean(existing?.completed || body.markCompleted || correctCount > 0);
  const nextBest = Math.max(existing?.bestScore ?? 0, correctCount);

  await prisma.userGrammarProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    update: {
      completed: nextCompleted,
      bestScore: nextBest,
      totalQuestions: questions.length,
    },
    create: {
      userId: user.id,
      lessonId: lesson.id,
      completed: nextCompleted,
      bestScore: nextBest,
      totalQuestions: questions.length,
    },
  });

  const xpAwarded = existing?.completed ? 5 : 25;
  const stats = await awardXpAndStreak(user.id, "GRAMMAR", lesson.id, xpAwarded);

  return apiOk({
    saved: true,
    correctCount,
    totalQuestions: questions.length,
    bestScore: nextBest,
    results,
    xpAwarded,
    userStats: stats,
  });
}
  return { POST };
})();


type SegmentSpec = { lit?: string; dyn?: string };
interface RouteEntry {
  pattern: SegmentSpec[];
  handlers: Record<string, (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>>;
}

const API_ROUTE_TABLE: RouteEntry[] = [
  { pattern: [{ lit: "documents" }], handlers: route_01 },
  { pattern: [{ lit: "donations" }], handlers: route_02 },
  { pattern: [{ lit: "parent-consent" }], handlers: route_03 },
  { pattern: [{ lit: "parent-monitor" }], handlers: route_04 },
  { pattern: [{ lit: "scenarios" }], handlers: route_05 },
  { pattern: [{ lit: "sessions" }], handlers: route_06 },
  { pattern: [{ lit: "surveys" }], handlers: route_07 },
  { pattern: [{ lit: "taxonomy" }], handlers: route_08 },
  { pattern: [{ lit: "vocab" }], handlers: route_09 },
  { pattern: [{ lit: "admin" }, { lit: "approvals" }], handlers: route_10 },
  { pattern: [{ lit: "admin" }, { lit: "community" }], handlers: route_11 },
  { pattern: [{ lit: "admin" }, { lit: "documents" }], handlers: route_12 },
  { pattern: [{ lit: "admin" }, { lit: "donations" }], handlers: route_13 },
  { pattern: [{ lit: "admin" }, { lit: "exams" }], handlers: route_14 },
  { pattern: [{ lit: "admin" }, { lit: "grammar" }], handlers: route_15 },
  { pattern: [{ lit: "admin" }, { lit: "overview" }], handlers: route_16 },
  { pattern: [{ lit: "admin" }, { lit: "safety" }], handlers: route_17 },
  { pattern: [{ lit: "admin" }, { lit: "scenarios" }], handlers: route_18 },
  { pattern: [{ lit: "admin" }, { lit: "storage" }], handlers: route_19 },
  { pattern: [{ lit: "admin" }, { lit: "surveys" }], handlers: route_20 },
  { pattern: [{ lit: "admin" }, { lit: "users" }], handlers: route_21 },
  { pattern: [{ lit: "auth" }, { lit: "google" }], handlers: route_22 },
  { pattern: [{ lit: "auth" }, { lit: "login" }], handlers: route_23 },
  { pattern: [{ lit: "auth" }, { lit: "logout" }], handlers: route_24 },
  { pattern: [{ lit: "auth" }, { lit: "me" }], handlers: route_25 },
  { pattern: [{ lit: "auth" }, { lit: "my-data" }], handlers: route_26 },
  { pattern: [{ lit: "auth" }, { lit: "register" }], handlers: route_27 },
  { pattern: [{ lit: "community" }, { lit: "posts" }], handlers: route_28 },
  { pattern: [{ lit: "donations" }, { lit: "sepay-webhook" }], handlers: route_29 },
  { pattern: [{ lit: "kpis" }, { lit: "phase0b" }], handlers: route_30 },
  { pattern: [{ lit: "safety" }, { lit: "block" }], handlers: route_31 },
  { pattern: [{ lit: "safety" }, { lit: "report" }], handlers: route_32 },
  { pattern: [{ lit: "scenarios" }, { dyn: "slug" }], handlers: route_33 },
  { pattern: [{ lit: "sessions" }, { dyn: "id" }], handlers: route_34 },
  { pattern: [{ lit: "vocab" }, { dyn: "sourceKey" }], handlers: route_35 },
  { pattern: [{ lit: "admin" }, { lit: "storage" }, { lit: "access" }], handlers: route_36 },
  { pattern: [{ lit: "admin" }, { lit: "storage" }, { lit: "audit" }], handlers: route_37 },
  { pattern: [{ lit: "admin" }, { lit: "storage" }, { lit: "backup" }], handlers: route_38 },
  { pattern: [{ lit: "admin" }, { lit: "storage" }, { lit: "files" }], handlers: route_39 },
  { pattern: [{ lit: "admin" }, { lit: "storage" }, { lit: "import" }], handlers: route_40 },
  { pattern: [{ lit: "admin" }, { lit: "storage" }, { lit: "items" }], handlers: route_41 },
  { pattern: [{ lit: "admin" }, { lit: "storage" }, { lit: "trash" }], handlers: route_42 },
  { pattern: [{ lit: "admin" }, { lit: "storage" }, { lit: "versions" }], handlers: route_43 },
  { pattern: [{ lit: "auth" }, { lit: "google" }, { lit: "callback" }], handlers: route_44 },
  { pattern: [{ lit: "auth" }, { lit: "otp" }, { lit: "request" }], handlers: route_45 },
  { pattern: [{ lit: "auth" }, { lit: "otp" }, { lit: "verify" }], handlers: route_46 },
  { pattern: [{ lit: "admin" }, { lit: "community" }, { dyn: "id" }], handlers: route_47 },
  { pattern: [{ lit: "admin" }, { lit: "documents" }, { dyn: "id" }], handlers: route_48 },
  { pattern: [{ lit: "admin" }, { lit: "donations" }, { dyn: "id" }], handlers: route_49 },
  { pattern: [{ lit: "admin" }, { lit: "exams" }, { dyn: "id" }], handlers: route_50 },
  { pattern: [{ lit: "admin" }, { lit: "grammar" }, { dyn: "id" }], handlers: route_51 },
  { pattern: [{ lit: "admin" }, { lit: "users" }, { dyn: "id" }], handlers: route_52 },
  { pattern: [{ lit: "documents" }, { dyn: "id" }, { lit: "download" }], handlers: route_53 },
  { pattern: [{ lit: "documents" }, { dyn: "id" }, { lit: "save" }], handlers: route_54 },
  { pattern: [{ lit: "exams" }, { dyn: "id" }, { lit: "submit" }], handlers: route_55 },
  { pattern: [{ lit: "sessions" }, { dyn: "id" }, { lit: "rubric" }], handlers: route_56 },
  { pattern: [{ lit: "admin" }, { lit: "community" }, { lit: "comments" }, { dyn: "commentId" }], handlers: route_57 },
  { pattern: [{ lit: "admin" }, { lit: "exams" }, { dyn: "id" }, { lit: "questions" }], handlers: route_58 },
  { pattern: [{ lit: "admin" }, { lit: "exams" }, { lit: "questions" }, { dyn: "questionId" }], handlers: route_59 },
  { pattern: [{ lit: "community" }, { lit: "posts" }, { dyn: "id" }, { lit: "comments" }], handlers: route_60 },
  { pattern: [{ lit: "community" }, { lit: "posts" }, { dyn: "id" }, { lit: "like" }], handlers: route_61 },
  { pattern: [{ lit: "community" }, { lit: "posts" }, { dyn: "id" }, { lit: "vote" }], handlers: route_62 },
  { pattern: [{ lit: "grammar" }, { lit: "lessons" }, { dyn: "id" }, { lit: "progress" }], handlers: route_63 }
];

async function dispatchApi(
  method: string,
  request: NextRequest
): Promise<Response> {
  const rawPath =
    request.headers.get("x-wb-api-path") ||
    request.nextUrl.searchParams.get("__wb_api_path") ||
    request.nextUrl.pathname.replace(/^\/api\/?/, "");
  const slug = rawPath.split("/").filter(Boolean);

  for (const entry of API_ROUTE_TABLE) {
    if (entry.pattern.length !== slug.length) continue;
    const extractedParams: Record<string, string> = {};
    let matched = true;
    for (let i = 0; i < entry.pattern.length; i++) {
      const spec = entry.pattern[i];
      const actual = slug[i];
      if (spec.lit !== undefined) {
        if (spec.lit !== actual) {
          matched = false;
          break;
        }
      } else if (spec.dyn !== undefined) {
        extractedParams[spec.dyn] = actual;
      }
    }
    if (matched) {
      const fn = entry.handlers[method];
      if (!fn) {
        return apiError("METHOD_NOT_ALLOWED", `Phương thức ${method} không được hỗ trợ tại đường dẫn này.`, 405);
      }
      return fn(request, { params: Promise.resolve(extractedParams) });
    }
  }

  return apiError("NOT_FOUND", `Không tìm thấy API endpoint: /api/${slug.join("/")}`, 404);
}

export async function GET(request: NextRequest) {
  return dispatchApi("GET", request);
}

export async function POST(request: NextRequest) {
  return dispatchApi("POST", request);
}

export async function PATCH(request: NextRequest) {
  return dispatchApi("PATCH", request);
}

export async function DELETE(request: NextRequest) {
  return dispatchApi("DELETE", request);
}
