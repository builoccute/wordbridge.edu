"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  Bookmark,
  CheckCircle2,
  Compass,
  Flag,
  Flame,
  GraduationCap,
  Heart,
  Home,
  MessageCircle,
  PenSquare,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { ReportBlockModal } from "@/components/safety";
import { useApp } from "@/components/providers/app-provider";
import type { CommunityPostDTO } from "@/lib/prisma";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type CommunityGroup =
  | "all"
  | "Kinh nghiệm học tập"
  | "Hỏi bài - Giải đáp"
  | "Luyện đề - Thi cử"
  | "Luyện nghe & Dictation"
  | "Tìm bạn ghép cặp"
  | "Cơ khí"
  | "Điện - Điện tử"
  | "Tin học"
  | "Kinh tế - Du lịch";

type FeedTab = "foryou" | "following" | "liked";

interface CommunityPostUI extends CommunityPostDTO {
  followingAuthor: boolean;
}

const GROUPS: Array<{ id: CommunityGroup; label: string; desc: string }> = [
  { id: "all", label: "Tất cả bài viết", desc: "Toàn bộ dòng thời gian" },
  { id: "Tìm bạn ghép cặp", label: "Tìm bạn ghép cặp", desc: "Hẹn lịch luyện nói 1-1 theo ngành" },
  { id: "Tin học", label: "Ngành Tin học / CNTT", desc: "Daily stand-up, Helpdesk, Dev" },
  { id: "Cơ khí", label: "Ngành Cơ khí", desc: "Bản vẽ CNC, báo cáo sự cố, QC" },
  { id: "Điện - Điện tử", label: "Ngành Điện - Điện tử", desc: "Đo kiểm mạch, LOTO, Datasheet" },
  { id: "Kinh tế - Du lịch", label: "Kinh tế - Du lịch", desc: "CSKH quốc tế, báo giá, hợp đồng" },
  { id: "Kinh nghiệm học tập", label: "Kinh nghiệm học tập", desc: "Mẹo tăng band 450 -> 850+" },
  { id: "Hỏi bài - Giải đáp", label: "Hỏi bài - Giải đáp", desc: "Ngữ pháp Part 5 & từ vựng" },
  { id: "Luyện đề - Thi cử", label: "Luyện đề - Thi cử", desc: "Review độ khó ETS / Economy" },
  { id: "Luyện nghe & Dictation", label: "Luyện nghe & Dictation", desc: "Chép chính tả & nối âm" },
];

export function CommunityFeedClient({
  initialPosts = [],
}: {
  initialPosts?: CommunityPostDTO[];
}) {
  const { user, openAuthModal, openFeatureMap, notify } = useApp();
  const [posts, setPosts] = React.useState<CommunityPostUI[]>(() =>
    initialPosts.map((p) => ({ ...p, followingAuthor: Boolean(p.isPinned) }))
  );
  const [feedTab, setFeedTab] = React.useState<FeedTab>("foryou");
  const [activeGroup, setActiveGroup] = React.useState<CommunityGroup>("all");

  // User interactions synced cleanly with backend APIs
  const [likedIds, setLikedIds] = React.useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const p of initialPosts) {
      if (p.viewerLiked) map[p.id] = true;
    }
    return map;
  });
  const [bookmarkedIds, setBookmarkedIds] = React.useState<Record<string, boolean>>({});
  const [pollVotes, setPollVotes] = React.useState<Record<string, "A" | "B" | "C" | "D">>(() => {
    const map: Record<string, "A" | "B" | "C" | "D"> = {};
    for (const p of initialPosts) {
      if (p.viewerVotedKey) map[p.id] = p.viewerVotedKey;
    }
    return map;
  });
  const [openCommentsId, setOpenCommentsId] = React.useState<string | null>(
    initialPosts[0]?.id ?? null
  );
  const [commentDraft, setCommentDraft] = React.useState<Record<string, string>>({});
  const [publishing, setPublishing] = React.useState(false);
  const [reportTarget, setReportTarget] = React.useState<{
    postId: string;
    authorId: string;
    authorName: string;
  } | null>(null);

  // Composer state
  const [newTitle, setNewTitle] = React.useState("");
  const [newBody, setNewBody] = React.useState("");
  const [newGroup, setNewGroup] = React.useState<Exclude<CommunityGroup, "all">>(
    "Hỏi bài - Giải đáp"
  );
  const composerRef = React.useRef<HTMLTextAreaElement | null>(null);

  const visiblePosts = React.useMemo(() => {
    return posts.filter((post) => {
      if (activeGroup !== "all" && post.group !== activeGroup) return false;
      if (feedTab === "following" && !post.followingAuthor) return false;
      if (feedTab === "liked" && !likedIds[post.id]) return false;
      return true;
    });
  }, [posts, activeGroup, feedTab, likedIds]);

  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBody.trim()) return;
    if (!user) {
      openAuthModal("Đăng nhập 10 giây để đăng bài thảo luận cùng cộng đồng LingoChill.");
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newBody.trim(),
          group: newGroup,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { post: CommunityPostDTO };
        error?: { message: string };
      };
      if (res.status === 401) {
        openAuthModal();
        return;
      }
      if (!json.success || !json.data) {
        notify(json.error?.message || "Không thể đăng bài.", "error");
        return;
      }
      const created: CommunityPostUI = {
        ...json.data.post,
        followingAuthor: true,
      };
      setPosts((prev) => [created, ...prev]);
      setNewTitle("");
      setNewBody("");
      setFeedTab("foryou");
      notify("Đã lưu bài viết lên bảng tin Cộng đồng!", "success");
    } catch {
      notify("Không thể kết nối máy chủ để đăng bài.", "error");
    } finally {
      setPublishing(false);
    }
  };

  const handleVote = async (postId: string, key: "A" | "B" | "C" | "D") => {
    if (pollVotes[postId]) return;
    setPollVotes((prev) => ({ ...prev, [postId]: key }));
    try {
      const res = await fetch(`/api/community/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { poll: CommunityPostDTO["poll"]; votedKey: "A" | "B" | "C" | "D" };
      };
      if (json.success && json.data?.poll) {
        const nextPoll = json.data.poll;
        const votedKey = json.data.votedKey;
        setPollVotes((prev) => ({ ...prev, [postId]: votedKey }));
        setPosts((prev) =>
          prev.map((post) => (post.id === postId ? { ...post, poll: nextPoll } : post))
        );
      }
    } catch {
      // Keep local vote if transient error
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) {
      openAuthModal("Đăng nhập 10 giây để thích và lưu lại bài viết hay.");
      return;
    }
    try {
      const res = await fetch(`/api/community/posts/${postId}/like`, { method: "POST" });
      if (res.status === 401) {
        openAuthModal();
        return;
      }
      const json = (await res.json()) as {
        success: boolean;
        data?: { liked: boolean; likes: number };
      };
      if (json.success && json.data) {
        const { liked, likes } = json.data;
        setLikedIds((prev) => ({ ...prev, [postId]: liked }));
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes } : p)));
      }
    } catch {
      notify("Không thể cập nhật lượt thích.", "error");
    }
  };

  const handleToggleFollow = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, followingAuthor: !p.followingAuthor } : p))
    );
  };

  const handleAddComment = async (postId: string) => {
    const text = (commentDraft[postId] || "").trim();
    if (!text) return;
    if (!user) {
      openAuthModal("Đăng nhập để bình luận góp ý cùng bạn học.");
      return;
    }
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.status === 401) {
        openAuthModal();
        return;
      }
      const json = (await res.json()) as {
        success: boolean;
        data?: { comment: CommunityPostDTO["comments"][number] };
        error?: { message: string };
      };
      if (json.success && json.data?.comment) {
        const createdComment = json.data.comment;
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, comments: [...p.comments, createdComment] } : p
          )
        );
        setCommentDraft((prev) => ({ ...prev, [postId]: "" }));
      } else {
        notify(json.error?.message || "Không thể gửi bình luận.", "error");
      }
    } catch {
      notify("Không thể gửi bình luận.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e10] text-slate-100">
      {/* ===================================================================== */}
      {/* DEDICATED DARK CHARCOAL COMMUNITY NAVBAR                              */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#121417]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-[#19462b] text-[#9ee56f]">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <span className="block font-display text-base font-extrabold text-white">
                  {siteConfig.brand.name}
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-[#9ee56f]">
                  Cộng đồng
                </span>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              <Link
                href="/"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
              >
                Trang chủ
              </Link>
              <Link
                href="/documents"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
              >
                Kho tài liệu
              </Link>
              <Link
                href="/luyen-de"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
              >
                Luyện đề
              </Link>
              <Link
                href="/ngu-phap"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
              >
                Ngữ pháp
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={openFeatureMap}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:border-[#9ee56f]/50 hover:text-white cursor-pointer"
            >
              <Compass className="h-3.5 w-3.5 text-[#9ee56f]" />
              Bản đồ
            </button>

            <button
              type="button"
              onClick={() => composerRef.current?.focus()}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#9ee56f] px-3.5 py-1.5 text-xs font-black text-[#0d1c12] hover:brightness-105 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Hỏi bài
            </button>

            {user ? (
              <Link
                href="/tai-khoan"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#9ee56f]/40 bg-[#19462b] font-display text-xs font-black text-[#9ee56f]"
                title={user.name}
              >
                {user.name.slice(0, 2).toUpperCase()}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal()}
                className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-white/20 cursor-pointer"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 3-COLUMN DARK SOCIAL STREAM                                           */}
      {/* ===================================================================== */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[72px_minmax(0,1fr)_310px]">
        {/* Left Vertical Icon Rail */}
        <aside className="hidden flex-col items-center gap-3 lg:flex">
          <div className="sticky top-24 flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-[#15171b] p-2">
            {[
              { id: "foryou" as const, icon: Home, title: "Dành cho bạn" },
              { id: "following" as const, icon: Users, title: "Đang theo dõi" },
              { id: "liked" as const, icon: Heart, title: "Đã thích" },
            ].map((item) => {
              const Icon = item.icon;
              const active = feedTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFeedTab(item.id)}
                  title={item.title}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl transition cursor-pointer",
                    active
                      ? "bg-[#9ee56f] text-[#0d1c12]"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
            <span className="my-1 h-px w-7 bg-white/10" />
            <button
              type="button"
              onClick={() => composerRef.current?.focus()}
              title="Viết bài mới"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-[#9ee56f] cursor-pointer"
            >
              <PenSquare className="h-5 w-5" />
            </button>
            <Link
              href="/bang-xep-hang"
              title="Bảng xếp hạng"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-amber-300"
            >
              <Flame className="h-5 w-5" />
            </Link>
          </div>
        </aside>

        {/* Center Feed */}
        <main className="space-y-5">
          {/* Feed Tabs Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#15171b] p-2">
            <div className="flex items-center gap-1">
              {(
                [
                  { id: "foryou", label: "Dành cho bạn" },
                  { id: "following", label: "Đang theo dõi" },
                  { id: "liked", label: "Đã thích" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFeedTab(tab.id)}
                  className={cn(
                    "rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer",
                    feedTab === tab.id
                      ? "bg-[#9ee56f] text-[#0d1c12]"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 px-2 text-[11px] font-semibold text-slate-400">
              <Bell className="h-3.5 w-3.5 text-[#9ee56f]" />
              <span>{visiblePosts.length} bài viết</span>
            </div>
          </div>

          {/* Safety & Closed Beta Strip (Phụ lục B) */}
          <div className="flex flex-col gap-2 rounded-2xl border border-[#9ee56f]/30 bg-[#13291b] px-4 py-3 text-xs text-emerald-100 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#9ee56f]" />
              <span>
                <b>Cộng đồng Tin cậy VSVC:</b> Không nhắn tin riêng 1-1 · Không chia sẻ SĐT cá nhân
                · Bảo vệ học viên &lt;18 tuổi.
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/tinh-huong"
                className="rounded-lg border border-white/20 px-2.5 py-1 text-[11px] font-bold hover:bg-white/10"
              >
                Tình huống 3 lớp
              </Link>
              <Link
                href="/ghep-cap"
                className="rounded-lg bg-[#9ee56f] px-2.5 py-1 text-[11px] font-black text-[#0d1c12]"
              >
                Ghép cặp 1-1
              </Link>
            </div>
          </div>

          {/* Mobile Group Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveGroup(g.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold cursor-pointer",
                  activeGroup === g.id
                    ? "border-[#9ee56f] bg-[#19462b] text-[#9ee56f]"
                    : "border-white/10 bg-[#15171b] text-slate-300"
                )}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Composer Card */}
          <form
            onSubmit={handlePublishPost}
            className="rounded-3xl border border-white/10 bg-[#15171b] p-5 shadow-lg"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9ee56f]">
                <Sparkles className="h-3.5 w-3.5" />
                Chia sẻ câu hỏi hoặc kinh nghiệm ôn thi
              </span>

              <select
                value={newGroup}
                onChange={(e) =>
                  setNewGroup(e.target.value as Exclude<CommunityGroup, "all">)
                }
                className="rounded-lg border border-white/15 bg-[#0d0e10] px-2.5 py-1 text-[11px] font-semibold text-slate-200 outline-none"
              >
                {GROUPS.filter((g) => g.id !== "all").map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Tiêu đề ngắn (tuỳ chọn)..."
              className="mt-3 w-full rounded-xl border border-white/10 bg-[#0d0e10] px-3.5 py-2 text-sm font-semibold text-white placeholder:text-slate-500 outline-none focus:border-[#9ee56f]/60"
            />
            <textarea
              ref={composerRef}
              rows={3}
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Dán câu Part 5 khó, chia sẻ mẹo chép chính tả hoặc đặt mục tiêu điểm tuần này..."
              className="mt-2.5 w-full resize-none rounded-xl border border-white/10 bg-[#0d0e10] p-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-[#9ee56f]/60"
            />

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Đăng nhanh để nhận góp ý từ bạn học &amp; mentor.
              </span>
              <button
                type="submit"
                disabled={publishing || !newBody.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#9ee56f] px-4 py-2 text-xs font-black text-[#0d1c12] transition hover:brightness-105 disabled:opacity-40 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                {publishing ? "Đang đăng..." : "Đăng bài"}
              </button>
            </div>
          </form>

          {/* Feed Cards */}
          {visiblePosts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-[#15171b] p-10 text-center">
              <p className="font-display text-lg font-bold text-white">
                Chưa có bài viết nào trong mục này
              </p>
              <button
                type="button"
                onClick={() => {
                  setFeedTab("foryou");
                  setActiveGroup("all");
                }}
                className="mt-3 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-[#9ee56f] hover:bg-white/15 cursor-pointer"
              >
                Quay lại tất cả bài viết
              </button>
            </div>
          ) : (
            visiblePosts.map((post) => {
              const isLiked = Boolean(likedIds[post.id]);
              const isSaved = Boolean(bookmarkedIds[post.id]);
              const votedKey = pollVotes[post.id];
              const totalVotes = post.poll
                ? post.poll.options.reduce((sum, opt) => sum + opt.votes, 0)
                : 0;
              const isCommentsOpen = openCommentsId === post.id;

              return (
                <article
                  key={post.id}
                  className="rounded-3xl border border-white/10 bg-[#15171b] p-5 sm:p-6 transition hover:border-white/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-xs font-black",
                          post.avatarBg
                        )}
                      >
                        {post.avatarText}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-display text-sm font-bold text-white">
                            {post.author}
                          </span>
                          {post.badge && (
                            <span className="rounded-full bg-[#19462b] px-2 py-0.5 text-[10px] font-bold text-[#9ee56f]">
                              {post.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {post.handle} · {post.timeAgo}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline-block rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-300">
                        {post.group}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleFollow(post.id)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-[11px] font-bold transition cursor-pointer",
                          post.followingAuthor
                            ? "border-[#9ee56f]/30 bg-[#19462b]/60 text-[#9ee56f]"
                            : "border-white/15 bg-white/5 text-slate-300 hover:text-white"
                        )}
                      >
                        {post.followingAuthor ? "Đang theo dõi" : "+ Theo dõi"}
                      </button>
                    </div>
                  </div>

                  <h2 className="mt-4 font-display text-base font-extrabold text-white sm:text-lg">
                    {post.title}
                  </h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-300">
                    {post.content}
                  </p>

                  {/* Interactive Poll Block (Matching StudyChill Community Quiz Cards) */}
                  {post.poll && (
                    <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-[#0d0e10] p-4">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                        <span>CHỌN ĐÁP ÁN NHANH</span>
                        <span className="font-mono-num">{totalVotes} lượt bình chọn</span>
                      </div>

                      <div className="space-y-2 pt-1">
                        {post.poll.options.map((opt) => {
                          const pct =
                            totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                          const isSelected = votedKey === opt.key;
                          const isCorrect = opt.key === post.poll?.correctKey;
                          const reveal = Boolean(votedKey);

                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => handleVote(post.id, opt.key)}
                              disabled={reveal}
                              className={cn(
                                "relative flex w-full items-center justify-between overflow-hidden rounded-xl border px-3.5 py-2.5 text-left text-xs font-semibold transition",
                                reveal ? "cursor-default" : "cursor-pointer hover:border-[#9ee56f]/60",
                                reveal && isCorrect
                                  ? "border-[#9ee56f] bg-[#19462b]/45 text-white"
                                  : reveal && isSelected && !isCorrect
                                  ? "border-rose-400/70 bg-rose-500/15 text-rose-200"
                                  : "border-white/10 bg-[#15171b] text-slate-200"
                              )}
                            >
                              {reveal && (
                                <span
                                  className={cn(
                                    "absolute inset-y-0 left-0 opacity-25 transition-all",
                                    isCorrect ? "bg-[#9ee56f]" : "bg-slate-500"
                                  )}
                                  style={{ width: `${pct}%` }}
                                />
                              )}
                              <span className="relative z-10 flex items-center gap-2">
                                <span className="font-mono-num font-black text-[#9ee56f]">
                                  ({opt.key})
                                </span>
                                <span>{opt.text}</span>
                              </span>
                              {reveal && (
                                <span className="relative z-10 flex items-center gap-1.5 font-mono-num text-[11px] font-bold">
                                  {isCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-[#9ee56f]" />}
                                  {pct}%
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {votedKey && (
                        <div className="mt-2 rounded-xl border border-[#9ee56f]/25 bg-[#19462b]/35 p-3 text-xs leading-relaxed text-emerald-100">
                          <strong className="text-[#9ee56f]">Giải thích: </strong>
                          {post.poll.explanation}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void handleToggleLike(post.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer",
                          isLiked
                            ? "bg-rose-500/15 text-rose-400"
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                        <span className="font-mono-num">{post.likes}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setOpenCommentsId((cur) => (cur === post.id ? null : post.id))
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white cursor-pointer"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="font-mono-num">{post.comments.length}</span>
                        <span>Bình luận</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setReportTarget({
                            postId: post.id,
                            authorId: post.authorId,
                            authorName: post.author,
                          })
                        }
                        title="Báo cáo vi phạm hoặc chặn tài khoản"
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-400 hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer"
                      >
                        <Flag className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Báo cáo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setBookmarkedIds((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                        }
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer",
                          isSaved ? "text-[#9ee56f]" : "text-slate-400 hover:text-white"
                        )}
                      >
                        <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
                        <span>{isSaved ? "Đã lưu" : "Lưu"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Comments Drawer */}
                  {isCommentsOpen && (
                    <div className="mt-3 space-y-2.5 border-t border-white/10 pt-3">
                      {post.comments.map((cm) => (
                        <div
                          key={cm.id}
                          className="rounded-2xl border border-white/10 bg-[#0d0e10] px-3.5 py-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-[#9ee56f]">{cm.author}</span>
                            <span className="text-slate-500">{cm.timeAgo}</span>
                          </div>
                          <p className="mt-1 text-slate-200">{cm.content}</p>
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentDraft[post.id] || ""}
                          onChange={(e) =>
                            setCommentDraft((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddComment(post.id);
                            }
                          }}
                          placeholder="Viết bình luận góp ý..."
                          className="flex-1 rounded-xl border border-white/10 bg-[#0d0e10] px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#9ee56f]/60"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(post.id)}
                          className="rounded-xl bg-[#9ee56f] px-3 py-2 text-xs font-black text-[#0d1c12] hover:brightness-105 cursor-pointer"
                        >
                          Gửi
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </main>

        {/* ===================================================================== */}
        {/* RIGHT STICKY "NHÓM HỌC" FILTER SIDEBAR                                */}
        {/* ===================================================================== */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-[#15171b] p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-black uppercase tracking-wider text-white">
                  Nhóm học
                </h2>
                <Users className="h-4 w-4 text-[#9ee56f]" />
              </div>

              <div className="mt-3 space-y-1.5">
                {GROUPS.map((g) => {
                  const count =
                    g.id === "all"
                      ? posts.length
                      : posts.filter((p) => p.group === g.id).length;
                  const active = activeGroup === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setActiveGroup(g.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition cursor-pointer",
                        active
                          ? "bg-[#19462b] text-[#9ee56f]"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="truncate text-xs font-bold">{g.label}</p>
                        <p className="truncate text-[10px] text-slate-400">{g.desc}</p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-1.5 py-0.5 font-mono-num text-[10px] font-bold",
                          active ? "bg-[#9ee56f] text-[#0d1c12]" : "bg-white/10 text-slate-300"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-[#9ee56f]/25 bg-gradient-to-br from-[#19462b] to-[#112519] p-5 text-white">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9ee56f]">
                THỬ THÁCH TUẦN
              </p>
              <h3 className="mt-1 font-display text-base font-black">
                Đua top EXP phòng học
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-emerald-100/80">
                Làm mỗi bài luyện đề hoặc quiz ngữ pháp được cộng trực tiếp điểm EXP lên Bảng xếp
                hạng toàn hệ thống.
              </p>
              <Link
                href="/bang-xep-hang"
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#9ee56f] py-2 text-xs font-black text-[#0d1c12] hover:brightness-105"
              >
                <Flame className="h-3.5 w-3.5" />
                Xem Bảng xếp hạng
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {reportTarget && (
        <ReportBlockModal
          open={Boolean(reportTarget)}
          onClose={() => setReportTarget(null)}
          targetType="COMMUNITY_POST"
          targetId={reportTarget.postId}
          targetUserId={reportTarget.authorId}
          targetUserName={reportTarget.authorName}
          onBlocked={() => {
            setPosts((prev) => prev.filter((p) => p.authorId !== reportTarget.authorId));
          }}
        />
      )}
    </div>
  );
}
