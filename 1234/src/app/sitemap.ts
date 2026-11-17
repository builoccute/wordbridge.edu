import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

  const staticRoutes = [
    "",
    "/documents",
    "/ngu-phap",
    "/luyen-de",
    "/listening",
    "/reading",
    "/vocab/notebook",
    "/community",
    "/bang-xep-hang",
    "/ung-ho",
    "/tinh-huong",
    "/ghep-cap",
    "/khao-sat",
    "/de-an",
    "/goi-hoc",
    "/ung-dung-android",
    "/phu-huynh",
    ...siteConfig.policies.map((p) => `/chinh-sach/${p.slug}`),
  ];

  const [categories, documents, grammarLessons, examSets, examTests, scenarios] =
    await Promise.all([
      prisma.documentCategory.findMany({ select: { slug: true } }),
      prisma.document.findMany({ select: { slug: true, createdAt: true } }),
      prisma.grammarLesson.findMany({ select: { slug: true } }),
      prisma.examSet.findMany({ select: { slug: true } }),
      prisma.examTest.findMany({ select: { slug: true } }),
      prisma.careerScenario.findMany({ select: { slug: true, updatedAt: true } }),
    ]);

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1.0 : 0.8,
    })),
    ...categories.map((c) => ({
      url: `${baseUrl}/documents/danh-muc/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...documents.map((d) => ({
      url: `${baseUrl}/documents/${d.slug}`,
      lastModified: d.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...grammarLessons.map((l) => ({
      url: `${baseUrl}/ngu-phap/${l.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...examSets.map((s) => ({
      url: `${baseUrl}/luyen-de/${s.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...examTests.map((t) => ({
      url: `${baseUrl}/luyen-de/thi/${t.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...scenarios.map((sc) => ({
      url: `${baseUrl}/tinh-huong/${sc.slug}`,
      lastModified: sc.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  ];
}
