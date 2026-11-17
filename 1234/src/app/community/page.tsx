import { Suspense } from "react";
import { CommunityFeedClient } from "@/components/community/community-feed-client";
import { getCurrentUser } from "@/lib/auth";
import { loadCommunityFeed } from "@/lib/prisma";

export const metadata = {
  title: "Cộng đồng Hỏi bài & Chia sẻ TOEIC",
};

async function CommunityFeedLoader() {
  const user = await getCurrentUser();
  const initialPosts = await loadCommunityFeed(user?.id);
  return <CommunityFeedClient initialPosts={initialPosts} />;
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<CommunityFeedClient initialPosts={[]} />}>
      <CommunityFeedLoader />
    </Suspense>
  );
}
