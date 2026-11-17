import type { Metadata } from "next";
import { Suspense } from "react";
import { PeerPairingClient, type PracticeSessionView } from "@/components/pairing/peer-pairing-client";
import { getMatchingScope } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Ghép Cặp Luyện Nói Theo Lịch Hẹn & Rubric",
  description:
    "Ghép cặp 1-1 cùng ngành, cùng trình độ và cùng nhóm tuổi trong cộng đồng kiểm soát VSVC, kèm Google Meet an toàn và phiếu nhận xét rubric.",
};

async function PeerPairingLoader({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string }>;
}) {
  const [{ scenario: preselectedScenarioSlug }, viewer, scenarios] = await Promise.all([
    searchParams,
    getCurrentUser(),
    prisma.careerScenario.findMany({
      orderBy: [{ order: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        major: true,
        level: true,
        durationMinutes: true,
      },
    }),
  ]);

  let blockedIds: string[] = [];
  if (viewer) {
    const blocks = await prisma.userBlock.findMany({
      where: { OR: [{ blockerId: viewer.id }, { blockedId: viewer.id }] },
      select: { blockerId: true, blockedId: true },
    });
    blockedIds = blocks.map((b) => (b.blockerId === viewer.id ? b.blockedId : b.blockerId));
  }

  const viewerScope = viewer ? getMatchingScope(viewer.ageGroup) : "ADULT_18_PLUS";

  const [openRows, myRows] = await Promise.all([
    prisma.practiceSession.findMany({
      where: {
        status: "OPEN",
        ageGroupScope: viewerScope,
        ...(viewer && viewerScope === "UNDER_18" ? { school: viewer.school } : {}),
        ...(blockedIds.length > 0 ? { hostId: { notIn: blockedIds } } : {}),
      },
      orderBy: [{ scheduledAt: "asc" }],
      take: 30,
      include: {
        scenario: {
          select: { id: true, slug: true, title: true, major: true, level: true, durationMinutes: true },
        },
        host: { select: { id: true, name: true, major: true, selfLevel: true, school: true } },
        partner: { select: { id: true, name: true, major: true, selfLevel: true, school: true } },
      },
    }),
    viewer
      ? prisma.practiceSession.findMany({
          where: { OR: [{ hostId: viewer.id }, { partnerId: viewer.id }] },
          orderBy: [{ scheduledAt: "desc" }],
          take: 30,
          include: {
            scenario: {
              select: { id: true, slug: true, title: true, major: true, level: true, durationMinutes: true },
            },
            host: { select: { id: true, name: true, major: true, selfLevel: true, school: true } },
            partner: { select: { id: true, name: true, major: true, selfLevel: true, school: true } },
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
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const mapOpen: PracticeSessionView[] = openRows.map((s) => ({
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
    meetingUrl: viewer && s.hostId === viewer.id ? s.meetingUrl : null,
    status: s.status,
    hostConfirmedComplete: s.hostConfirmedComplete,
    partnerConfirmedComplete: s.partnerConfirmedComplete,
    noRecordingConfirmed: s.noRecordingConfirmed,
    notes: s.notes,
    rubrics: [],
  }));

  const mapMine: PracticeSessionView[] = myRows.map((s) => ({
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
    meetingUrl: s.meetingUrl,
    status: s.status,
    hostConfirmedComplete: s.hostConfirmedComplete,
    partnerConfirmedComplete: s.partnerConfirmedComplete,
    noRecordingConfirmed: s.noRecordingConfirmed,
    notes: s.notes,
    rubrics: s.rubrics,
  }));

  return (
    <PeerPairingClient
      scenarios={scenarios}
      initialOpenSessions={mapOpen}
      initialMySessions={mapMine}
      preselectedScenarioSlug={preselectedScenarioSlug}
    />
  );
}

export default function PeerPairingPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="h-56 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface)]" />
        </div>
      }
    >
      <PeerPairingLoader searchParams={searchParams} />
    </Suspense>
  );
}
