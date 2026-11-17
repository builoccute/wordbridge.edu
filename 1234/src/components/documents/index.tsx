"use client";

import * as React from "react";
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Download, Eye, FileSpreadsheet, FileText, Folder, LayoutGrid, Leaf, Lightbulb, LightbulbOff, List, Search, SlidersHorizontal } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui";
import Link from "next/link";
import { Mascot } from "@/components/brand/mascot";
import { Hero3DBackdrop } from "@/components/three";
import { cn, safeJsonParse } from "@/lib/utils";

// === document-detail-client.tsx ===
interface DocumentDetailActionsProps {
  docId: string;
  initialSaved: boolean;
}

export function DocumentDetailActions({ docId, initialSaved }: DocumentDetailActionsProps) {
  const { user, guestSavedDocIds, toggleGuestSavedDoc, openAuthModal, notify } = useApp();
  const [saved, setSaved] = React.useState(initialSaved);
  const [busy, setBusy] = React.useState(false);

  const isSaved = user ? saved : guestSavedDocIds.includes(docId);

  const handleSave = async () => {
    if (!user) {
      const added = toggleGuestSavedDoc(docId);
      notify(
        added ? "Đã lưu tạm. Đăng nhập để đồng bộ về Kho của tôi!" : "Đã bỏ lưu tài liệu.",
        "info"
      );
      if (added) {
        openAuthModal("Đăng nhập để lưu tài liệu vĩnh viễn vào hồ sơ của bạn.");
      }
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${docId}/save`, { method: "POST" });
      const json = (await res.json()) as { success: boolean; data?: { saved: boolean } };
      if (json.success && json.data) {
        setSaved(json.data.saved);
        notify(json.data.saved ? "Đã lưu vào Kho của tôi." : "Đã bỏ lưu tài liệu.", "success");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a href={`/api/documents/${docId}/download`}>
        <Button size="lg">
          <Download className="h-4 w-4" />
          Tải tài liệu Study Guide
        </Button>
      </a>

      <Button variant="outline" size="lg" disabled={busy} onClick={() => void handleSave()}>
        {isSaved ? (
          <>
            <BookmarkCheck className="h-4 w-4 text-[var(--primary)]" />
            Đã lưu vào kho
          </>
        ) : (
          <>
            <Bookmark className="h-4 w-4" />
            Lưu về kho cá nhân
          </>
        )}
      </Button>
    </div>
  );
}

// === documents-explorer.tsx ===
export interface DocumentItemView {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  fileType: string;
  pageCount: number;
  fileSizeLabel: string;
  isFree: boolean;
  tagsJson: string;
  viewCount: number;
  downloadCount: number;
  category: {
    id: string;
    slug: string;
    name: string;
  };
}

export interface CategorySummaryView {
  id: string;
  slug: string;
  name: string;
  description: string;
  count: number;
}

interface DocumentsExplorerProps {
  documents: DocumentItemView[];
  categories: CategorySummaryView[];
  initialSavedIds: string[];
  activeCategorySlug?: string;
  activeCategoryTitle?: string;
  activeCategoryDescription?: string;
}

const LEVELS = ["Tất cả trình độ", "Mọi trình độ", "250+", "450+", "650+", "800+"];
const PAGE_SIZE = 8;

function getFormatMeta(fileType: string) {
  const upper = fileType.toUpperCase();
  if (upper.includes("XLS")) {
    return {
      label: "XLS",
      badgeClass: "bg-[#234332] text-[#7ae1a5] border-[#33664b]",
      iconType: "xls" as const,
    };
  }
  if (upper.includes("DOC")) {
    return {
      label: "DOC",
      badgeClass: "bg-[#1f3152] text-[#8ab4ff] border-[#304c7d]",
      iconType: "doc" as const,
    };
  }
  if (upper.includes("FOLDER") || upper.includes("ZIP")) {
    return {
      label: "FOLDER",
      badgeClass: "bg-white/10 text-[#d4d8d4] border-white/15",
      iconType: "folder" as const,
    };
  }
  return {
    label: "PDF",
    badgeClass: "bg-[#4d2326] text-[#ff8b8b] border-[#733236]",
    iconType: "pdf" as const,
  };
}

export function DocumentsExplorer({
  documents,
  categories,
  initialSavedIds,
  activeCategorySlug = "",
  activeCategoryTitle,
  activeCategoryDescription,
}: DocumentsExplorerProps) {
  const { user, guestSavedDocIds, toggleGuestSavedDoc, openAuthModal, notify } = useApp();
  const [query, setQuery] = React.useState("");
  const [level, setLevel] = React.useState("Tất cả trình độ");
  const [showFilters, setShowFilters] = React.useState(false);
  const [lightsOn, setLightsOn] = React.useState(false);

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent("lc-docs-lights", { detail: lightsOn }));
    return () => {
      window.dispatchEvent(new CustomEvent("lc-docs-lights", { detail: false }));
    };
  }, [lightsOn]);
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [page, setPage] = React.useState(1);
  const [savedOverrides, setSavedOverrides] = React.useState<Record<string, boolean>>({});
  const [savingId, setSavingId] = React.useState<string | null>(null);

  const effectiveSaved = React.useMemo(() => {
    if (!user) return new Set(guestSavedDocIds);
    const set = new Set(initialSavedIds);
    for (const [id, isSaved] of Object.entries(savedOverrides)) {
      if (isSaved) set.add(id);
      else set.delete(id);
    }
    return set;
  }, [user, initialSavedIds, savedOverrides, guestSavedDocIds]);

  const filteredDocs = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((doc) => {
      if (level !== "Tất cả trình độ" && doc.level !== level) return false;
      if (!q) return true;
      const tags = safeJsonParse<string[]>(doc.tagsJson, []).join(" ").toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q) ||
        doc.category.name.toLowerCase().includes(q) ||
        tags.includes(q)
      );
    });
  }, [documents, level, query]);

  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedDocs = React.useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredDocs.slice(start, start + PAGE_SIZE);
  }, [filteredDocs, safePage]);

  const handleToggleSave = async (docId: string) => {
    if (!user) {
      const added = toggleGuestSavedDoc(docId);
      notify(
        added
          ? "Đã lưu tạm trên trình duyệt. Đăng nhập để đồng bộ về kho cá nhân!"
          : "Đã bỏ lưu tài liệu.",
        "info"
      );
      if (added) {
        openAuthModal("Đăng nhập 10 giây để đồng bộ tài liệu vừa lưu lên tài khoản của bạn.");
      }
      return;
    }

    setSavingId(docId);
    try {
      const res = await fetch(`/api/documents/${docId}/save`, { method: "POST" });
      if (res.status === 401) {
        openAuthModal();
        return;
      }
      const json = (await res.json()) as { success: boolean; data?: { saved: boolean } };
      if (json.success && json.data) {
        const isSaved = json.data.saved;
        setSavedOverrides((prev) => ({ ...prev, [docId]: isSaved }));
        notify(
          isSaved ? "Đã lưu tài liệu vào Kho của tôi." : "Đã xóa khỏi danh sách lưu.",
          "success"
        );
      }
    } catch {
      notify("Không thể cập nhật trạng thái lưu.", "error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen transition-colors",
        lightsOn ? "bg-[#f6f3ea] bg-grid-paper text-[#1b2d1c]" : "bg-[#121416] text-[#edf2e3]"
      )}
    >
      {/* ===================================================================== */}
      {/* MIDNIGHT NAVY / BLUE SKY 3D HERO ("STUDY LIBRARY" matching StudyChill)*/}
      {/* ===================================================================== */}
      <section
        className={cn(
          "relative overflow-hidden px-4 pt-24 pb-8 sm:px-6 sm:pt-28 transition-colors duration-300",
          lightsOn ? "hero-sky-stage text-[#162617]" : "hero-navy-stage text-white"
        )}
      >
        <Hero3DBackdrop theme={lightsOn ? "sky" : "navy"} />
        <div className="hero-floor-perspective opacity-55" aria-hidden="true" />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium",
              lightsOn
                ? "border-[#1b2d1c]/20 bg-white/75 text-[#1b2d1c]"
                : "border-white/20 bg-white/5 text-blue-100"
            )}
          >
            <Leaf className={cn("h-3.5 w-3.5", lightsOn ? "text-[#4b7d26]" : "text-[#f1d98d]")} />
            <span>Kho tài liệu cùng Mochi</span>
          </span>

          <h1 className="mt-5 font-display text-5xl font-black uppercase tracking-tight sm:text-6xl lg:text-[4.5rem] leading-[0.95]">
            <span
              className={cn(
                "block",
                lightsOn ? "sc-hero-word-brown" : "text-3d-gold text-[#f5b942]"
              )}
            >
              STUDY
            </span>
            <span
              className={cn(
                "block",
                lightsOn ? "sc-hero-word-dark" : "text-3d-white text-white"
              )}
            >
              LIBRARY
            </span>
          </h1>

          <p
            className={cn(
              "mt-4 max-w-2xl text-sm sm:text-base",
              lightsOn ? "text-[#1e2d1a]/85" : "text-blue-100/85"
            )}
          >
            {activeCategoryDescription ||
              "Tài liệu TOEIC, Ngữ pháp, Từ vựng & bộ đề luyện thi — lọc theo môn là ra, tải về học miễn phí."}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-xs",
                lightsOn
                  ? "border-[#1b2d1c]/15 bg-white/70 text-[#1b2d1c]"
                  : "border-white/15 bg-white/5 text-blue-100"
              )}
            >
              <div className="flex -space-x-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#0d1d42] bg-[#8cb84a] text-[10px] font-bold text-[#14230c]">
                  L
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#0d1d42] bg-[#f5b942] text-[10px] font-bold text-[#1d2812]">
                  C
                </span>
              </div>
              <span>
                Cùng <strong className={lightsOn ? "text-[#9d5409]" : "text-[#f5b942]"}>10.000+</strong> bạn học khám phá tài liệu mỗi ngày!
              </span>
            </div>
          </div>

          {/* Center-Right standing Mochi aligned with horizon floor matching StudyChill step_26 */}
          <div className="mt-5 flex flex-col items-center">
            <Mascot variant="standing" size={96} />
          </div>

          {/* Light-switch toggle ("BẬT ĐÈN / TẮT ĐÈN") */}
          <button
            type="button"
            onClick={() => setLightsOn((v) => !v)}
            className={cn(
              "mt-2 flex flex-col items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest cursor-pointer",
              lightsOn ? "text-[#162617]" : "text-blue-200/80 hover:text-white"
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border transition",
                lightsOn
                  ? "border-[#162617]/30 bg-white/80 hover:border-[#162617]"
                  : "border-white/25 bg-white/5 hover:border-amber-300"
              )}
            >
              {lightsOn ? (
                <LightbulbOff className="h-4 w-4 text-[#162617]" />
              ) : (
                <Lightbulb className="h-4 w-4 text-blue-100" />
              )}
            </span>
            <span>{lightsOn ? "TẮT ĐÈN" : "BẬT ĐÈN"}</span>
          </button>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* LIBRARY WORKSPACE: CATEGORY TABS + SEARCH + 4-COLUMN CARD GRID        */}
      {/* ===================================================================== */}
      <div
        className={cn(
          "border-b transition-colors",
          lightsOn ? "border-[#e5dfd1] bg-[#faf7ee]" : "border-white/10 bg-[#181a1c]"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 pt-3 sm:px-6">
          <Link
            href="/documents"
            className={cn(
              "shrink-0 border-b-2 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider transition",
              !activeCategorySlug
                ? lightsOn
                  ? "border-[#59752f] bg-[#eef4df] text-[#243218] rounded-t-lg"
                  : "border-[#8cb84a] bg-white/10 text-white rounded-t-lg"
                : lightsOn
                  ? "border-transparent text-[#6f7b64] hover:text-[#243218]"
                  : "border-transparent text-white/55 hover:text-white"
            )}
          >
            TẤT CẢ
          </Link>
          {categories.map((cat) => {
            const active = activeCategorySlug === cat.slug;
            return (
              <Link
                key={cat.id}
                href={`/documents/danh-muc/${cat.slug}`}
                className={cn(
                  "shrink-0 border-b-2 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider transition whitespace-nowrap",
                  active
                    ? lightsOn
                      ? "border-[#59752f] bg-[#eef4df] text-[#243218] rounded-t-lg"
                      : "border-[#8cb84a] bg-white/10 text-white rounded-t-lg"
                    : lightsOn
                      ? "border-transparent text-[#6f7b64] hover:text-[#243218]"
                      : "border-transparent text-white/55 hover:text-white"
                )}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Search Input + "THAO TÁC" Button Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className={cn(
                "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2",
                lightsOn ? "text-[#78836c]" : "text-white/45"
              )}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm tài liệu, chuyên đề TOEIC, giáo trình ngữ pháp..."
              aria-label="Tìm kiếm tài liệu"
              className={cn(
                "h-11 w-full rounded-xl border pl-11 pr-4 text-sm outline-none transition",
                lightsOn
                  ? "border-[#dad3c2] bg-white text-[#243218] placeholder:text-[#8d9682] focus:border-[#59752f]"
                  : "border-white/15 bg-[#1d2022] text-white placeholder:text-white/40 focus:border-[#8cb84a]"
              )}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-5 text-xs font-extrabold uppercase tracking-wider transition cursor-pointer",
              lightsOn
                ? "border-[#dad3c2] bg-white text-[#243218] hover:border-[#59752f]"
                : "border-white/15 bg-[#1d2022] text-white hover:border-[#8cb84a]"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>THAO TÁC</span>
          </button>
        </div>

        {/* Optional Level Filter Row revealed by THAO TÁC */}
        {showFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "text-xs font-semibold mr-1",
                lightsOn ? "text-[#56624a]" : "text-white/60"
              )}
            >
              Mục tiêu điểm:
            </span>
            {LEVELS.map((lv) => {
              const active = level === lv;
              return (
                <button
                  key={lv}
                  type="button"
                  onClick={() => {
                    setLevel(lv);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer",
                    active
                      ? "border-[#8cb84a] bg-[#8cb84a] text-[#17230d]"
                      : lightsOn
                        ? "border-[#dcd6c6] bg-white text-[#56624a] hover:border-[#8cb84a]"
                        : "border-white/15 bg-[#1e2124] text-white/75 hover:border-white/35"
                  )}
                >
                  {lv}
                </button>
              );
            })}
          </div>
        )}

        {/* Section Title + Centered Pagination + View Mode Switcher */}
        <div
          className={cn(
            "mt-6 flex flex-wrap items-center justify-between gap-4 border-b pb-4",
            lightsOn ? "border-[#e5dfd1]" : "border-white/10"
          )}
        >
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg font-extrabold uppercase tracking-wide sm:text-xl">
              {activeCategoryTitle || "TẤT CẢ TÀI LIỆU"}
            </h2>
            <span
              className={cn(
                "rounded-lg border px-2.5 py-0.5 font-mono-num text-[11px] font-bold uppercase",
                lightsOn
                  ? "border-[#d8d1bf] bg-[#f4efe1] text-[#56624a]"
                  : "border-white/15 bg-white/5 text-white/70"
              )}
            >
              {filteredDocs.length} TÀI LIỆU
            </span>
          </div>

          {/* Center Pagination Pill `< 1 / N >` */}
          <div
            className={cn(
              "inline-flex items-center gap-3 rounded-xl border px-2.5 py-1 text-xs font-semibold",
              lightsOn
                ? "border-[#dad3c2] bg-white text-[#243218]"
                : "border-white/15 bg-[#1e2022] text-white"
            )}
          >
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg p-1 opacity-75 hover:opacity-100 disabled:opacity-25 cursor-pointer"
              aria-label="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono-num">
              <strong>{safePage}</strong> / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg p-1 opacity-75 hover:opacity-100 disabled:opacity-25 cursor-pointer"
              aria-label="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Right Grid / List Switcher */}
          <div
            className={cn(
              "inline-flex items-center rounded-xl border p-0.5",
              lightsOn ? "border-[#dad3c2] bg-white" : "border-white/15 bg-[#1e2022]"
            )}
          >
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="Hiển thị dạng lưới"
              className={cn(
                "rounded-lg p-2 transition cursor-pointer",
                viewMode === "grid"
                  ? "bg-[#8cb84a] text-[#17230d]"
                  : lightsOn
                    ? "text-[#7a846d]"
                    : "text-white/50 hover:text-white"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-label="Hiển thị dạng danh sách"
              className={cn(
                "rounded-lg p-2 transition cursor-pointer",
                viewMode === "list"
                  ? "bg-[#8cb84a] text-[#17230d]"
                  : lightsOn
                    ? "text-[#7a846d]"
                    : "text-white/50 hover:text-white"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Document Cards */}
        {pagedDocs.length === 0 ? (
          <div
            className={cn(
              "mt-8 rounded-2xl border border-dashed p-12 text-center",
              lightsOn ? "border-[#dcd6c6] bg-white" : "border-white/15 bg-[#1b1d1f]"
            )}
          >
            <p className="font-heading text-lg font-bold">Chưa có tài liệu khớp từ khóa</p>
            <p className="mt-1 text-sm opacity-70">
              Thử từ khóa khác hoặc bấm Xóa bộ lọc để xem lại toàn bộ kho tài liệu.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setLevel("Tất cả trình độ");
                setPage(1);
              }}
              className="mt-4 rounded-xl bg-[#8cb84a] px-4 py-2 text-xs font-extrabold text-[#16220d] cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pagedDocs.map((doc) => {
              const saved = effectiveSaved.has(doc.id);
              const fmt = getFormatMeta(doc.fileType);
              return (
                <article
                  key={doc.id}
                  className={cn(
                    "group flex flex-col overflow-hidden rounded-xl border transition",
                    lightsOn
                      ? "border-[#dfd8c7] bg-white shadow-xs hover:border-[#8cb84a]"
                      : "border-white/10 bg-[#1a1c1e] hover:border-[#8cb84a]/60"
                  )}
                >
                  {/* Visual Format Thumbnail Box */}
                  <div
                    className={cn(
                      "relative flex aspect-[4/2.45] flex-col justify-between p-3.5",
                      lightsOn ? "bg-[#f3efe3]" : "bg-[#222527]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-block rounded border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider",
                          fmt.badgeClass
                        )}
                      >
                        {fmt.label}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 font-mono-num text-[10px] font-semibold",
                          lightsOn ? "bg-black/5 text-[#56624a]" : "bg-black/25 text-white/65"
                        )}
                      >
                        {doc.level}
                      </span>
                    </div>

                    <div className="flex items-center justify-center py-2">
                      {fmt.iconType === "xls" ? (
                        <FileSpreadsheet className="h-12 w-12 text-[#54b87d] opacity-85" />
                      ) : fmt.iconType === "doc" ? (
                        <FileText className="h-12 w-12 text-[#5d8ce6] opacity-85" />
                      ) : fmt.iconType === "folder" ? (
                        <Folder className="h-12 w-12 text-[#90969a] opacity-85" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#cf6161]/70 text-[#cf6161]">
                          <FileText className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <span
                      className={cn(
                        "truncate text-[10px] font-bold uppercase tracking-wider",
                        lightsOn ? "text-[#6d7960]" : "text-white/45"
                      )}
                    >
                      {doc.category.name}
                    </span>
                  </div>

                  {/* Body Title & Footer Controls */}
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <Link
                      href={`/documents/${doc.slug}`}
                      className="line-clamp-2 text-sm font-bold leading-snug hover:text-[#8cb84a] transition"
                    >
                      {doc.title}
                    </Link>

                    <div
                      className={cn(
                        "mt-4 flex items-center justify-between border-t pt-3 text-xs",
                        lightsOn
                          ? "border-[#ede7d7] text-[#6a755d]"
                          : "border-white/10 text-white/55"
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5 font-mono-num">
                        <Eye className="h-3.5 w-3.5" />
                        {doc.viewCount >= 1000
                          ? `${(doc.viewCount / 1000).toFixed(1)}k`
                          : doc.viewCount}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`/api/documents/${doc.id}/download`}
                          title="Tải nhanh PDF"
                          aria-label={`Tải tài liệu ${doc.title}`}
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-lg border transition",
                            lightsOn
                              ? "border-[#dfd8c7] text-[#56624a] hover:border-[#8cb84a] hover:text-[#243218]"
                              : "border-white/10 text-white/60 hover:border-[#8cb84a] hover:text-white"
                          )}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          disabled={savingId === doc.id}
                          onClick={() => handleToggleSave(doc.id)}
                          aria-label={saved ? "Bỏ lưu tài liệu" : "Lưu tài liệu"}
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-lg border transition cursor-pointer",
                            saved
                              ? "border-[#8cb84a] bg-[#8cb84a] text-[#17230d]"
                              : lightsOn
                                ? "border-[#dfd8c7] text-[#56624a] hover:border-[#8cb84a]"
                                : "border-white/10 text-white/60 hover:border-[#8cb84a] hover:text-white"
                          )}
                        >
                          {saved ? (
                            <BookmarkCheck className="h-3.5 w-3.5" />
                          ) : (
                            <Bookmark className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="mt-6 space-y-3">
            {pagedDocs.map((doc) => {
              const saved = effectiveSaved.has(doc.id);
              const fmt = getFormatMeta(doc.fileType);
              return (
                <div
                  key={doc.id}
                  className={cn(
                    "flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center",
                    lightsOn
                      ? "border-[#dfd8c7] bg-white"
                      : "border-white/10 bg-[#1a1c1e]"
                  )}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded border px-2 py-0.5 text-[10px] font-extrabold uppercase",
                          fmt.badgeClass
                        )}
                      >
                        {fmt.label}
                      </span>
                      <span className="text-xs font-semibold opacity-65">
                        {doc.category.name} · {doc.level}
                      </span>
                    </div>
                    <Link
                      href={`/documents/${doc.slug}`}
                      className="block truncate text-base font-bold hover:text-[#8cb84a]"
                    >
                      {doc.title}
                    </Link>
                    <p className="line-clamp-1 text-xs opacity-70">{doc.description}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/api/documents/${doc.id}/download`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#8cb84a] px-3.5 text-xs font-extrabold text-[#16220d] hover:bg-[#9ec555]"
                    >
                      <Download className="h-3.5 w-3.5" /> Tải PDF
                    </a>
                    <button
                      type="button"
                      disabled={savingId === doc.id}
                      onClick={() => handleToggleSave(doc.id)}
                      className={cn(
                        "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold cursor-pointer",
                        saved
                          ? "border-[#8cb84a] text-[#8cb84a]"
                          : lightsOn
                            ? "border-[#dad3c2] text-[#243218]"
                            : "border-white/15 text-white"
                      )}
                    >
                      {saved ? "Đã lưu" : "Lưu"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
