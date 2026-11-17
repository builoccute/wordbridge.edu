"use client";

import * as React from "react";
import Link from "next/link";
import {
  BookMarked,
  Bookmark,
  CheckCircle2,
  FolderPlus,
  Layers,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";

export type VocabTabKey = "decks" | "my" | "review" | "print";
type MasteryStatus = "learning" | "due" | "mastered";

export interface VocabCardItem {
  id: string;
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
  deck: string;
  status: MasteryStatus;
  reviewCount: number;
}

const DECK_CATALOG: Array<{
  slug: string;
  title: string;
  badge: string;
  description: string;
  color: string;
  words: Omit<VocabCardItem, "status" | "reviewCount">[];
}> = [
  {
    slug: "office-core",
    title: "Office & Operations",
    badge: "Part 1-7 · Cốt lõi",
    description: "Từ vựng vận hành văn phòng, thông báo nội bộ và nhân sự hay gặp nhất.",
    color: "bg-[#eaf5e3] border-[#93c96e]",
    words: [
      {
        id: "deck-1",
        word: "streamline",
        phonetic: "/ˈstriːm.laɪn/",
        pos: "verb",
        meaning: "tinh giản, tối ưu hoá quy trình",
        example: "The new software will streamline our monthly billing workflow.",
        deck: "Office & Operations",
      },
      {
        id: "deck-2",
        word: "tentative",
        phonetic: "/ˈten.tə.tɪv/",
        pos: "adj",
        meaning: "dự kiến, tạm thời (chưa chốt)",
        example: "We have scheduled a tentative meeting for Tuesday afternoon.",
        deck: "Office & Operations",
      },
      {
        id: "deck-3",
        word: "comply with",
        phonetic: "/kəmˈplaɪ wɪð/",
        pos: "phrase",
        meaning: "tuân thủ quy định, tiêu chuẩn",
        example: "All contractors must comply with the factory safety rules.",
        deck: "Office & Operations",
      },
      {
        id: "deck-4",
        word: "reimburse",
        phonetic: "/ˌriː.ɪmˈbɜːrs/",
        pos: "verb",
        meaning: "hoàn trả, thanh toán lại chi phí",
        example: "Travel expenses will be reimbursed within ten business days.",
        deck: "Office & Operations",
      },
    ],
  },
  {
    slug: "contracts-deals",
    title: "Contracts & Meetings",
    badge: "Part 5-6 · B2-C1",
    description: "Cụm từ thương lượng hợp đồng, lịch họp, thông báo đối tác trong email TOEIC.",
    color: "bg-[#eef4f8] border-[#7ab0cf]",
    words: [
      {
        id: "deck-5",
        word: "unanimously",
        phonetic: "/juːˈnæn.ɪ.məs.li/",
        pos: "adv",
        meaning: "nhất trí hoàn toàn (100% tán thành)",
        example: "The board unanimously approved the annual expansion budget.",
        deck: "Contracts & Meetings",
      },
      {
        id: "deck-6",
        word: "stipulate",
        phonetic: "/ˈstɪp.jə.leɪt/",
        pos: "verb",
        meaning: "quy định rõ trong hợp đồng",
        example: "The agreement stipulates that delivery must occur before May 1.",
        deck: "Contracts & Meetings",
      },
      {
        id: "deck-7",
        word: "contingency",
        phonetic: "/kənˈtɪn.dʒən.si/",
        pos: "noun",
        meaning: "tình huống dự phòng, bất ngờ",
        example: "Please prepare a contingency plan in case the shipment is delayed.",
        deck: "Contracts & Meetings",
      },
      {
        id: "deck-8",
        word: "adjourn",
        phonetic: "/əˈdʒɜːrn/",
        pos: "verb",
        meaning: "tạm hoãn, kết thúc phiên họp",
        example: "The chairperson adjourned the meeting promptly at noon.",
        deck: "Contracts & Meetings",
      },
    ],
  },
  {
    slug: "logistics-finance",
    title: "Finance & Supply Chain",
    badge: "Part 7 · Thực chiến",
    description: "Hoá đơn, báo giá, giao vận, tồn kho và báo cáo tài chính quý.",
    color: "bg-[#fbf1e6] border-[#d9a86c]",
    words: [
      {
        id: "deck-9",
        word: "discrepancy",
        phonetic: "/dɪˈskrep.ən.si/",
        pos: "noun",
        meaning: "sự chênh lệch, sai sót giữa 2 số liệu",
        example: "We noticed a discrepancy between the invoice and the purchase order.",
        deck: "Finance & Supply Chain",
      },
      {
        id: "deck-10",
        word: "expedite",
        phonetic: "/ˈek.spə.daɪt/",
        pos: "verb",
        meaning: "đẩy nhanh tiến độ xử lý / giao hàng",
        example: "We paid extra to expedite the delivery of replacement parts.",
        deck: "Finance & Supply Chain",
      },
      {
        id: "deck-11",
        word: "substantial",
        phonetic: "/səbˈstæn.ʃəl/",
        pos: "adj",
        meaning: "đáng kể, lớn",
        example: "Online sales recorded a substantial increase in the third quarter.",
        deck: "Finance & Supply Chain",
      },
      {
        id: "deck-12",
        word: "merchandise",
        phonetic: "/ˈmɜːr.tʃən.daɪz/",
        pos: "noun",
        meaning: "hàng hoá (danh từ không đếm được)",
        example: "Damaged merchandise may be exchanged with the original receipt.",
        deck: "Finance & Supply Chain",
      },
    ],
  },
];

const INITIAL_MY_VOCAB: VocabCardItem[] = [
  { ...DECK_CATALOG[0].words[0], status: "due", reviewCount: 1 },
  { ...DECK_CATALOG[0].words[1], status: "learning", reviewCount: 0 },
  { ...DECK_CATALOG[1].words[0], status: "mastered", reviewCount: 3 },
  { ...DECK_CATALOG[1].words[1], status: "due", reviewCount: 1 },
  { ...DECK_CATALOG[2].words[0], status: "due", reviewCount: 2 },
  { ...DECK_CATALOG[2].words[1], status: "mastered", reviewCount: 4 },
];

const STORAGE_KEY = "lingochill_vocab_notebook_v1";

function speakWord(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.92;
    window.speechSynthesis.speak(utter);
  } catch {
    // Silent fallback when browser blocks speech synthesis
  }
}

export function VocabNotebookClient({ initialTab = "decks" }: { initialTab?: VocabTabKey }) {
  const { user, notify } = useApp();
  const [prevInitialTab, setPrevInitialTab] = React.useState<VocabTabKey>(initialTab);
  const [activeTab, setActiveTab] = React.useState<VocabTabKey>(initialTab);
  const [myWords, setMyWords] = React.useState<VocabCardItem[]>(INITIAL_MY_VOCAB);
  const [hydrated, setHydrated] = React.useState(false);

  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(initialTab);
  }

  // Filters & creation modal/panel state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | MasteryStatus>("all");
  const [selectedDeckSlug, setSelectedDeckSlug] = React.useState<string>("all");
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newWord, setNewWord] = React.useState("");
  const [newPhonetic, setNewPhonetic] = React.useState("");
  const [newPos, setNewPos] = React.useState("verb");
  const [newMeaning, setNewMeaning] = React.useState("");
  const [newExample, setNewExample] = React.useState("");
  const [newDeck, setNewDeck] = React.useState("Sổ tay cá nhân");

  // SRS Flashcard Review State
  const [reviewIdx, setReviewIdx] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);

  // Printable sheet settings
  const [printLayout, setPrintLayout] = React.useState<"table" | "cards">("cards");
  const [printShowPhonetic, setPrintShowPhonetic] = React.useState(true);
  const [printShowExample, setPrintShowExample] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    async function hydrateNotebook() {
      let localList = INITIAL_MY_VOCAB;
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as VocabCardItem[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            localList = parsed;
          }
        }
      } catch {
        // Ignore malformed storage
      }

      if (!user) {
        if (active) {
          setMyWords(localList);
          setHydrated(true);
        }
        return;
      }

      try {
        const res = await fetch("/api/vocab");
        const json = (await res.json()) as {
          success: boolean;
          data?: { authenticated: boolean; words: VocabCardItem[] };
        };
        if (!active) return;
        if (json.success && json.data?.authenticated) {
          if (json.data.words.length > 0) {
            setMyWords(json.data.words);
          } else {
            // Seed starter/local notebook to DB for newly signed-in user
            const syncRes = await fetch("/api/vocab", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ words: localList }),
            });
            const syncJson = (await syncRes.json()) as {
              success: boolean;
              data?: { words: VocabCardItem[] };
            };
            if (active && syncJson.success && syncJson.data?.words) {
              setMyWords(syncJson.data.words);
            }
          }
        }
      } catch {
        if (active) setMyWords(localList);
      } finally {
        if (active) setHydrated(true);
      }
    }

    void hydrateNotebook();
    return () => {
      active = false;
    };
  }, [user]);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(myWords));
    } catch {
      // Ignore storage quota error
    }
  }, [myWords, hydrated]);

  const savedIds = React.useMemo(() => new Set(myWords.map((w) => w.id)), [myWords]);
  const dueCount = React.useMemo(
    () => myWords.filter((w) => w.status === "due" || w.status === "learning").length,
    [myWords]
  );
  const masteredCount = React.useMemo(
    () => myWords.filter((w) => w.status === "mastered").length,
    [myWords]
  );

  const filteredMyWords = React.useMemo(() => {
    return myWords.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.word.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        item.deck.toLowerCase().includes(q)
      );
    });
  }, [myWords, statusFilter, searchQuery]);

  const reviewQueue = React.useMemo(() => {
    const priority = myWords.filter((w) => w.status !== "mastered");
    return priority.length > 0 ? priority : myWords;
  }, [myWords]);

  const activeReviewCard = reviewQueue[reviewIdx % Math.max(1, reviewQueue.length)];

  const toggleSaveDeckWord = (wordObj: Omit<VocabCardItem, "status" | "reviewCount">) => {
    if (savedIds.has(wordObj.id)) {
      setMyWords((prev) => prev.filter((item) => item.id !== wordObj.id));
      if (user) {
        void fetch(`/api/vocab/${encodeURIComponent(wordObj.id)}`, { method: "DELETE" });
      }
      notify(`Đã bỏ "${wordObj.word}" khỏi kho từ cá nhân.`, "info");
    } else {
      const created: VocabCardItem = { ...wordObj, status: "due", reviewCount: 0 };
      setMyWords((prev) => [created, ...prev]);
      if (user) {
        void fetch("/api/vocab", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word: created }),
        });
      }
      notify(`Đã lưu "${wordObj.word}" vào Kho từ của tôi!`, "success");
    }
  };

  const handleSaveEntireDeck = (deck: (typeof DECK_CATALOG)[number]) => {
    const existing = new Set(myWords.map((w) => w.id));
    const toAdd = deck.words
      .filter((w) => !existing.has(w.id))
      .map((w) => ({ ...w, status: "due" as const, reviewCount: 0 }));
    if (toAdd.length > 0) {
      setMyWords((prev) => [...toAdd, ...prev]);
      if (user) {
        void fetch("/api/vocab", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ words: toAdd }),
        });
      }
    }
    notify(`Đã đồng bộ toàn bộ bộ từ "${deck.title}" vào kho của bạn.`, "success");
  };

  const handleAddCustomWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newMeaning.trim()) return;
    const item: VocabCardItem = {
      id: `custom-${Date.now()}`,
      word: newWord.trim(),
      phonetic: newPhonetic.trim() || "/.../",
      pos: newPos,
      meaning: newMeaning.trim(),
      example:
        newExample.trim() || `We apply "${newWord.trim()}" accurately in daily workplace communication.`,
      deck: newDeck.trim() || "Sổ tay cá nhân",
      status: "learning",
      reviewCount: 0,
    };
    setMyWords((prev) => [item, ...prev]);
    if (user) {
      void fetch("/api/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: item }),
      });
    }
    setNewWord("");
    setNewPhonetic("");
    setNewMeaning("");
    setNewExample("");
    setShowAddForm(false);
    setActiveTab("my");
    notify(`Đã thêm "${item.word}" vào Sổ tay từ vựng!`, "success");
  };

  const handleRateCard = (nextStatus: MasteryStatus) => {
    if (!activeReviewCard) return;
    const targetId = activeReviewCard.id;
    setMyWords((prev) =>
      prev.map((item) =>
        item.id === targetId
          ? {
              ...item,
              status: nextStatus,
              reviewCount: item.reviewCount + 1,
            }
          : item
      )
    );
    if (user) {
      void fetch(`/api/vocab/${encodeURIComponent(targetId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, incrementReview: true }),
      });
    }
    setFlipped(false);
    setReviewIdx((idx) => (idx + 1) % Math.max(1, reviewQueue.length));
  };

  const handleDeleteWord = (wordId: string) => {
    setMyWords((prev) => prev.filter((w) => w.id !== wordId));
    if (user) {
      void fetch(`/api/vocab/${encodeURIComponent(wordId)}`, { method: "DELETE" });
    }
  };

  const visibleDecks = React.useMemo(() => {
    if (selectedDeckSlug === "all") return DECK_CATALOG;
    return DECK_CATALOG.filter((d) => d.slug === selectedDeckSlug);
  }, [selectedDeckSlug]);

  return (
    <div className="min-h-screen bg-[#f6f3ea] bg-paper-grid pb-20 pt-8 text-[#1b2d1c] dark:bg-[#0e1511] dark:text-[#eef3e8]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* ===================================================================== */}
        {/* STUDYCHILL 2-COLUMN HERO: LIGHT VOCAB PAPER CARD + DARK NHIP HOC CARD */}
        {/* ===================================================================== */}
        <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr] print:hidden">
          <div className="relative overflow-hidden rounded-[26px] border-2 border-[#1b2d1c] bg-white p-6 sm:p-8 sc-shadow dark:border-[#9ee56f]/30 dark:bg-[#17211b]">
            {/* Concentric rings + giant VOCAB watermark matching StudyChill */}
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full border border-[#dce4d7] opacity-60 dark:border-white/10"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -right-4 top-2 h-40 w-40 rounded-full border border-[#dce4d7] opacity-60 dark:border-white/10"
              aria-hidden="true"
            />
            <span
              className="pointer-events-none absolute bottom-1 right-6 select-none font-display text-6xl font-black tracking-widest text-[#edf1e8] sm:text-7xl dark:text-white/5"
              aria-hidden="true"
            >
              VOCAB
            </span>

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1b2d1c] bg-[#eaf5e3] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#19462b]">
                <BookMarked className="h-3.5 w-3.5 text-[#3b7a2a]" />
                Sổ tay từ vựng SRS &amp; In ấn
              </span>

              <h1 className="mt-3 font-display text-3xl font-black tracking-tight text-[#122618] sm:text-4xl dark:text-white">
                Từ vựng{" "}
                <span className="underline decoration-[#b88c58] decoration-[3px] underline-offset-4">
                  của bạn
                </span>
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#4f6152] dark:text-slate-300">
                Lưu nhanh từ mới khi đọc báo, học theo bộ TOEIC cốt lõi, ôn flashcard ngắt quãng
                (SRS) hoặc xuất ngay bản in A4 cực đẹp để mang theo học mỗi ngày.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(true);
                    setActiveTab("my");
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#2f5834] bg-[#759472] px-5 text-sm font-bold text-white shadow-xs transition hover:bg-[#5f7d5c] cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Thêm từ đầu tiên
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("print")}
                  className="relative inline-flex h-11 items-center gap-2 rounded-xl border border-[#d6be86] bg-[#f4e5c2] px-5 text-sm font-bold text-[#614515] shadow-xs transition hover:bg-[#ebd9ad] cursor-pointer"
                >
                  <Printer className="h-4 w-4 text-[#7c581c]" />
                  In từ vựng
                  <span className="absolute -right-2 -top-2 rounded-full border border-white bg-[#e46952] px-2 py-0.5 font-mono-num text-[9px] font-black text-white shadow-xs">
                    MỚI
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Dark Forest "NHỊP HỌC HÔM NAY" card with floating 3D plush Mochi matching StudyChill step_43 */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-[26px] border-2 border-[#1b2d1c] bg-[#1e4d30] p-6 text-white sc-shadow">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9ee56f]">
                  NHỊP HỌC HÔM NAY
                </span>
                <p className="mt-1.5 font-display text-lg font-extrabold leading-snug">
                  {dueCount > 0
                    ? `Bạn còn ${dueCount} thẻ cần ôn tập hôm nay.`
                    : "Sẵn sàng mở sổ từ vựng..."}
                </p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/mascot/card-reading.png"
                alt="Mochi đọc sổ từ vựng"
                className="h-16 w-16 shrink-0 object-contain drop-shadow"
              />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl border border-white/15 bg-black/20 p-3 text-center">
                <p className="font-mono-num text-2xl font-black text-white">{myWords.length}</p>
                <p className="mt-0.5 text-[11px] font-medium text-emerald-100/80">Đã lưu</p>
              </div>
              <div className="rounded-2xl border border-[#f5b942]/30 bg-[#f5b942]/15 p-3 text-center">
                <p className="font-mono-num text-2xl font-black text-[#f5b942]">{dueCount}</p>
                <p className="mt-0.5 text-[11px] font-medium text-amber-100">Cần ôn</p>
              </div>
              <div className="rounded-2xl border border-[#9ee56f]/30 bg-[#9ee56f]/15 p-3 text-center">
                <p className="font-mono-num text-2xl font-black text-[#9ee56f]">{masteredCount}</p>
                <p className="mt-0.5 text-[11px] font-medium text-emerald-100">Đã thuộc</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("review")}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#1b2d1c] bg-[#9ee56f] py-2.5 text-xs font-black text-[#122618] shadow-[2px_2px_0px_#0e1b13] transition hover:brightness-105 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Bắt đầu phiên ôn ngay ({reviewQueue.length} thẻ)
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* NAVIGATION TABS                                                       */}
        {/* ===================================================================== */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#1b2d1c] bg-white p-2 sc-shadow-sm dark:border-white/15 dark:bg-[#17211b] print:hidden">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: "decks", label: "Bộ từ có sẵn", icon: Layers },
                { id: "my", label: `Kho từ của tôi (${myWords.length})`, icon: BookMarked },
                { id: "review", label: `Lịch ôn (${dueCount})`, icon: RefreshCw },
                { id: "print", label: "In từ vựng", icon: Printer, badge: "MỚI" },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition cursor-pointer",
                    isActive
                      ? "border border-[#1b2d1c] bg-[#19462b] text-white shadow-xs"
                      : "text-[#4f6152] hover:bg-[#f4f1e6] dark:text-slate-300 dark:hover:bg-white/5"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {"badge" in tab && tab.badge && (
                    <span className="rounded bg-[#9ee56f] px-1.5 py-0.5 text-[9px] font-black text-[#122618]">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Link
            href="/reading"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-[#19462b] hover:bg-[#eaf5e3] dark:text-[#9ee56f]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Đọc báo tra từ tức thì →
          </Link>
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: CURATED DECKS                                                  */}
        {/* ===================================================================== */}
        {activeTab === "decks" && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDeckSlug("all")}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-bold transition cursor-pointer",
                  selectedDeckSlug === "all"
                    ? "border-[#1b2d1c] bg-[#1b2d1c] text-white"
                    : "border-[#cfd6c9] bg-white text-[#4f6152] hover:border-[#1b2d1c]"
                )}
              >
                Tất cả chủ đề ({DECK_CATALOG.length})
              </button>
              {DECK_CATALOG.map((deck) => (
                <button
                  key={deck.slug}
                  type="button"
                  onClick={() => setSelectedDeckSlug(deck.slug)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-bold transition cursor-pointer",
                    selectedDeckSlug === deck.slug
                      ? "border-[#1b2d1c] bg-[#1b2d1c] text-white"
                      : "border-[#cfd6c9] bg-white text-[#4f6152] hover:border-[#1b2d1c]"
                  )}
                >
                  {deck.title}
                </button>
              ))}
            </div>

            {visibleDecks.map((deck) => (
              <section
                key={deck.slug}
                className="rounded-3xl border-2 border-[#1b2d1c] bg-white p-5 sm:p-6 sc-shadow-sm dark:border-white/15 dark:bg-[#17211b]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ece7da] pb-4 dark:border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold text-[#1b2d1c]",
                          deck.color
                        )}
                      >
                        {deck.badge}
                      </span>
                      <h2 className="font-display text-xl font-black text-[#122618] dark:text-white">
                        {deck.title}
                      </h2>
                    </div>
                    <p className="mt-1 text-xs text-[#556758] dark:text-slate-300">
                      {deck.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveEntireDeck(deck)}
                    className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#1b2d1c] bg-[#9ee56f] px-3.5 py-2 text-xs font-black text-[#122618] shadow-[2px_2px_0px_#1b2d1c] transition hover:brightness-105 cursor-pointer"
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                    Lưu cả bộ ({deck.words.length} từ)
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {deck.words.map((w) => {
                    const isSaved = savedIds.has(w.id);
                    return (
                      <div
                        key={w.id}
                        className="flex flex-col justify-between rounded-2xl border border-[#dcd7ca] bg-[#fcfaf4] p-4 transition hover:border-[#1b2d1c] dark:border-white/10 dark:bg-[#1f2c24]"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-display text-lg font-extrabold text-[#122618] dark:text-white">
                                  {w.word}
                                </span>
                                <span className="rounded bg-[#eaf5e3] px-1.5 py-0.5 font-mono-num text-[10px] font-bold text-[#19462b]">
                                  {w.pos}
                                </span>
                              </div>
                              <p className="font-mono-num text-xs text-[#5f7261] dark:text-slate-400">
                                {w.phonetic}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => speakWord(w.word)}
                                aria-label={`Phát âm ${w.word}`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#cfd6c9] bg-white text-[#19462b] hover:bg-[#eaf5e3] cursor-pointer"
                              >
                                <Volume2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleSaveDeckWord(w)}
                                aria-label={isSaved ? `Bỏ lưu ${w.word}` : `Lưu ${w.word}`}
                                className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded-lg border transition cursor-pointer",
                                  isSaved
                                    ? "border-[#1b2d1c] bg-[#19462b] text-[#9ee56f]"
                                    : "border-[#cfd6c9] bg-white text-[#5f7261] hover:border-[#1b2d1c]"
                                )}
                              >
                                <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-current")} />
                              </button>
                            </div>
                          </div>

                          <p className="mt-2.5 text-sm font-bold text-[#19462b] dark:text-[#9ee56f]">
                            {w.meaning}
                          </p>
                          <p className="mt-1 text-xs italic text-[#556758] dark:text-slate-300">
                            &ldquo;{w.example}&rdquo;
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: MY VOCAB NOTEBOOK + QUICK ADD FORM                             */}
        {/* ===================================================================== */}
        {activeTab === "my" && (
          <div className="mt-6 space-y-5">
            {showAddForm && (
              <form
                onSubmit={handleAddCustomWord}
                className="rounded-3xl border-2 border-[#1b2d1c] bg-white p-5 sm:p-6 sc-shadow-sm dark:border-white/15 dark:bg-[#17211b]"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-black text-[#122618] dark:text-white">
                    Thêm từ vựng mới vào sổ tay
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-bold">Từ / Cụm từ *</label>
                    <Input
                      required
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      placeholder="Ví dụ: allocate"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold">Phiên âm</label>
                    <Input
                      value={newPhonetic}
                      onChange={(e) => setNewPhonetic(e.target.value)}
                      placeholder="/ˈæl.ə.keɪt/"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold">Từ loại</label>
                    <select
                      value={newPos}
                      onChange={(e) => setNewPos(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium outline-none"
                    >
                      <option value="verb">verb</option>
                      <option value="noun">noun</option>
                      <option value="adj">adj</option>
                      <option value="adv">adv</option>
                      <option value="phrase">phrase</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold">Nghĩa tiếng Việt *</label>
                    <Input
                      required
                      value={newMeaning}
                      onChange={(e) => setNewMeaning(e.target.value)}
                      placeholder="phân bổ (ngân sách, nguồn lực)"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold">Chủ đề / Bộ từ</label>
                    <Input
                      value={newDeck}
                      onChange={(e) => setNewDeck(e.target.value)}
                      placeholder="Finance & Budget"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-xs font-bold">Câu ví dụ TOEIC</label>
                  <Input
                    value={newExample}
                    onChange={(e) => setNewExample(e.target.value)}
                    placeholder="Management will allocate funds to upgrade the lab."
                  />
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Đóng
                  </Button>
                  <Button type="submit" variant="primary">
                    <Plus className="h-4 w-4" />
                    Lưu vào sổ tay
                  </Button>
                </div>
              </form>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm từ vựng hoặc nghĩa tiếng Việt..."
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: "all", label: "Tất cả" },
                    { id: "learning", label: "Mới thêm" },
                    { id: "due", label: "Cần ôn" },
                    { id: "mastered", label: "Đã thuộc" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStatusFilter(item.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-bold transition cursor-pointer",
                      statusFilter === item.id
                        ? "border-[#1b2d1c] bg-[#19462b] text-white"
                        : "border-[#cfd6c9] bg-white text-[#4f6152]"
                    )}
                  >
                    {item.label}
                  </button>
                ))}

                {!showAddForm && (
                  <Button type="button" variant="primary" size="sm" onClick={() => setShowAddForm(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Thêm từ
                  </Button>
                )}
              </div>
            </div>

            {filteredMyWords.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-[#b6c0b1] bg-white/80 p-10 text-center">
                <p className="font-display text-lg font-extrabold text-[#122618]">
                  Chưa có từ nào khớp bộ lọc hiện tại
                </p>
                <p className="mt-1 text-xs text-[#556758]">
                  Hãy xoá từ khoá tìm kiếm hoặc thêm từ mới ngay nhé!
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredMyWords.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-2xl border-2 border-[#1b2d1c] bg-white p-4 sc-shadow-sm dark:border-white/15 dark:bg-[#17211b]"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-lg font-extrabold text-[#122618] dark:text-white">
                              {item.word}
                            </h3>
                            <span className="rounded bg-[#f1efe5] px-1.5 py-0.5 font-mono-num text-[10px] font-bold text-[#4f6152]">
                              {item.pos}
                            </span>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                                item.status === "mastered"
                                  ? "bg-[#eaf5e3] text-[#19462b]"
                                  : item.status === "due"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-sky-100 text-sky-800"
                              )}
                            >
                              {item.status === "mastered"
                                ? "Đã thuộc"
                                : item.status === "due"
                                ? "Cần ôn"
                                : "Mới thêm"}
                            </span>
                          </div>
                          <p className="font-mono-num text-xs text-[#5f7261] dark:text-slate-400">
                            {item.phonetic} · <span className="font-sans">{item.deck}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => speakWord(item.word)}
                            aria-label={`Nghe phát âm ${item.word}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#cfd6c9] bg-[#fdfaf2] text-[#19462b] hover:bg-[#eaf5e3] cursor-pointer"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteWord(item.id)}
                            aria-label={`Xoá ${item.word}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="mt-2.5 text-sm font-bold text-[#19462b] dark:text-[#9ee56f]">
                        {item.meaning}
                      </p>
                      <p className="mt-1 text-xs italic text-[#556758] dark:text-slate-300">
                        &ldquo;{item.example}&rdquo;
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: FLASHCARD SRS REVIEW                                           */}
        {/* ===================================================================== */}
        {activeTab === "review" && activeReviewCard && (
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="mb-3 flex items-center justify-between text-xs font-bold text-[#556758] dark:text-slate-300">
              <span>
                Thẻ {(reviewIdx % reviewQueue.length) + 1} / {reviewQueue.length}
              </span>
              <span>Đã ôn: {activeReviewCard.reviewCount} lần</span>
            </div>

            <div
              onClick={() => setFlipped((f) => !f)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  setFlipped((f) => !f);
                }
              }}
              className="perspective-1200 relative cursor-pointer select-none"
              aria-label="Lật thẻ từ vựng 3D"
            >
              {/* Stacked 3D card deck shadow layers underneath */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-4 -bottom-2.5 h-full rounded-[28px] border-2 border-[#1b2d1c]/60 bg-[#ece7d8] dark:bg-[#1f2c23]"
              />

              <div
                className={cn(
                  "preserve-3d relative min-h-[300px] w-full transition-transform duration-500 ease-out",
                  flipped && "rotate-y-180"
                )}
              >
                {/* FRONT 3D FACE */}
                <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-[28px] border-2 border-[#1b2d1c] bg-white p-8 text-center sc-shadow dark:border-white/20 dark:bg-[#17211b]">
                  <span className="rounded-full border border-[#dce4d7] bg-[#f7f4ea] px-3 py-1 text-[11px] font-extrabold text-[#4f6152]">
                    {activeReviewCard.deck} · {activeReviewCard.pos}
                  </span>
                  <h2 className="mt-4 font-display text-4xl font-black text-[#122618] sm:text-5xl dark:text-white">
                    {activeReviewCard.word}
                  </h2>
                  <p className="mt-2 font-mono-num text-sm text-[#5f7261] dark:text-slate-300">
                    {activeReviewCard.phonetic}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakWord(activeReviewCard.word);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#1b2d1c] bg-[#eaf5e3] px-3.5 py-1.5 text-xs font-bold text-[#19462b] cursor-pointer"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    Nghe phát âm (US)
                  </button>
                  <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Chạm vào thẻ hoặc bấm Space để lật 3D
                  </p>
                </div>

                {/* BACK 3D FACE */}
                <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-center rounded-[28px] border-2 border-[#1b2d1c] bg-[#fafcf7] p-8 text-center sc-shadow dark:border-[#9ee56f]/30 dark:bg-[#15241b]">
                  <span className="rounded-full bg-[#19462b] px-3 py-1 text-[11px] font-bold text-[#9ee56f]">
                    {activeReviewCard.word} ({activeReviewCard.pos})
                  </span>
                  <p className="mt-4 font-display text-2xl font-black text-[#19462b] sm:text-3xl dark:text-[#9ee56f]">
                    {activeReviewCard.meaning}
                  </p>
                  <p className="mt-3 max-w-lg rounded-2xl border border-[#ece7da] bg-white p-4 text-sm italic text-[#3a4a3c] dark:border-white/10 dark:bg-black/25 dark:text-slate-200">
                    &ldquo;{activeReviewCard.example}&rdquo;
                  </p>
                  <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Chạm lại để xoay mặt trước
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleRateCard("learning")}
                className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-[#1b2d1c] bg-rose-50 py-3 text-xs font-black text-rose-800 shadow-[2px_2px_0px_#1b2d1c] hover:bg-rose-100 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Quên rồi
              </button>
              <button
                type="button"
                onClick={() => handleRateCard("due")}
                className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-[#1b2d1c] bg-amber-50 py-3 text-xs font-black text-amber-800 shadow-[2px_2px_0px_#1b2d1c] hover:bg-amber-100 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Nhớ mang máng
              </button>
              <button
                type="button"
                onClick={() => handleRateCard("mastered")}
                className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-[#1b2d1c] bg-[#9ee56f] py-3 text-xs font-black text-[#122618] shadow-[2px_2px_0px_#1b2d1c] hover:brightness-105 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Thuộc làu
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 4: PRINTABLE A4 FLASHCARD / VOCAB SHEET STUDIO                    */}
        {/* ===================================================================== */}
        {activeTab === "print" && (
          <div className="mt-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#1b2d1c] bg-white p-4 sc-shadow-sm dark:border-white/15 dark:bg-[#17211b] print:hidden">
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPrintLayout("cards")}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 cursor-pointer",
                    printLayout === "cards"
                      ? "border-[#1b2d1c] bg-[#19462b] text-white"
                      : "border-[#cfd6c9] bg-[#f8f6ef] text-[#4f6152]"
                  )}
                >
                  Thẻ cắt Flashcard (2×N)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintLayout("table")}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 cursor-pointer",
                    printLayout === "table"
                      ? "border-[#1b2d1c] bg-[#19462b] text-white"
                      : "border-[#cfd6c9] bg-[#f8f6ef] text-[#4f6152]"
                  )}
                >
                  Bảng ghi chép 2 cột
                </button>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printShowPhonetic}
                    onChange={(e) => setPrintShowPhonetic(e.target.checked)}
                    className="accent-[#19462b]"
                  />
                  <span>Hiện phiên âm</span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printShowExample}
                    onChange={(e) => setPrintShowExample(e.target.checked)}
                    className="accent-[#19462b]"
                  />
                  <span>Hiện ví dụ</span>
                </label>
              </div>

              <Button
                type="button"
                variant="primary"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" />
                In / Lưu PDF A4 ({myWords.length} từ)
              </Button>
            </div>

            {/* A4 Preview Sheet */}
            <div className="mx-auto max-w-4xl rounded-3xl border-2 border-[#1b2d1c] bg-white p-6 sm:p-10 shadow-md print:border-0 print:p-0 print:shadow-none">
              <div className="flex items-center justify-between border-b-2 border-[#1b2d1c] pb-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#3b7a2a]">
                    LINGOCHILL STUDY SHEET · A4 PRINTABLE
                  </p>
                  <h2 className="font-display text-2xl font-black text-[#122618]">
                    Sổ tay từ vựng ({myWords.length} từ)
                  </h2>
                </div>
                <span className="rounded-lg border border-[#1b2d1c] bg-[#eaf5e3] px-3 py-1 font-mono-num text-xs font-bold text-[#19462b]">
                  Luyện nhớ mỗi ngày
                </span>
              </div>

              {printLayout === "cards" ? (
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {myWords.map((item, idx) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-dashed border-[#6b7b6c] p-4"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-display text-lg font-black text-[#122618]">
                          {idx + 1}. {item.word}
                        </span>
                        <span className="font-mono-num text-[11px] font-bold text-[#556758]">
                          ({item.pos})
                        </span>
                      </div>
                      {printShowPhonetic && (
                        <p className="font-mono-num text-xs text-[#647566]">{item.phonetic}</p>
                      )}
                      <p className="mt-1.5 text-sm font-bold text-[#19462b]">{item.meaning}</p>
                      {printShowExample && (
                        <p className="mt-1 text-xs italic text-[#4f6152]">{item.example}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <table className="mt-5 w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b-2 border-[#1b2d1c] text-[#19462b]">
                      <th className="py-2 pr-3 font-extrabold">Từ vựng</th>
                      {printShowPhonetic && <th className="py-2 pr-3 font-extrabold">Phiên âm</th>}
                      <th className="py-2 pr-3 font-extrabold">Nghĩa &amp; Ví dụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myWords.map((item) => (
                      <tr key={item.id} className="border-b border-[#e2ded3]">
                        <td className="py-2.5 pr-3 align-top font-bold text-[#122618]">
                          {item.word}{" "}
                          <span className="font-normal text-[#5f7261]">({item.pos})</span>
                        </td>
                        {printShowPhonetic && (
                          <td className="py-2.5 pr-3 align-top font-mono-num text-[#5f7261]">
                            {item.phonetic}
                          </td>
                        )}
                        <td className="py-2.5 pr-3 align-top text-[#1b2d1c]">
                          <p className="font-semibold">{item.meaning}</p>
                          {printShowExample && (
                            <p className="mt-0.5 italic text-[#556758]">{item.example}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
