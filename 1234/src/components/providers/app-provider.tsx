"use client";

import * as React from "react";
import type { PublicUser } from "@/lib/auth";
import { AuthModal } from "@/components/layout";
import { FeatureMapModal } from "@/components/layout";

export type ToastTone = "success" | "info" | "error";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface AppContextValue {
  user: PublicUser | null;
  authLoading: boolean;
  theme: "light" | "dark";
  guestSavedDocIds: string[];
  toggleTheme: () => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  openAuthModal: (reason?: string) => void;
  openFeatureMap: () => void;
  toggleGuestSavedDoc: (docId: string) => boolean;
  notify: (message: string, tone?: ToastTone) => void;
}

const AppContext = React.createContext<AppContextValue | null>(null);

const GUEST_SAVED_KEY = "lc_guest_saved_docs";
const EMPTY_DOC_IDS: string[] = [];
let cachedRawDocs: string | null = null;
let cachedParsedDocs: string[] = EMPTY_DOC_IDS;

function subscribeLocalStore(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("lc-local-store", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("lc-local-store", callback);
  };
}

function getThemeSnapshot(): "light" | "dark" {
  try {
    return window.localStorage.getItem("theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function getGuestDocsSnapshot(): string[] {
  try {
    const raw = window.localStorage.getItem(GUEST_SAVED_KEY);
    if (raw === cachedRawDocs) return cachedParsedDocs;
    cachedRawDocs = raw;
    if (!raw) {
      cachedParsedDocs = EMPTY_DOC_IDS;
      return EMPTY_DOC_IDS;
    }
    const parsed = JSON.parse(raw);
    cachedParsedDocs = Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : EMPTY_DOC_IDS;
    return cachedParsedDocs;
  } catch {
    return EMPTY_DOC_IDS;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<PublicUser | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [authReason, setAuthReason] = React.useState<string | undefined>(undefined);
  const [featureMapOpen, setFeatureMapOpen] = React.useState(false);
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const theme = React.useSyncExternalStore<"light" | "dark">(
    subscribeLocalStore,
    getThemeSnapshot,
    () => "light"
  );

  const guestSavedDocIds = React.useSyncExternalStore(
    subscribeLocalStore,
    getGuestDocsSnapshot,
    () => EMPTY_DOC_IDS
  );

  const notify = React.useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3400);
  }, []);

  const refreshUser = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as {
        success: boolean;
        data?: { authenticated: boolean; user: PublicUser | null };
      };
      if (json.success && json.data) {
        setUser(json.data.user);
      }
    } catch {
      // keep silent in offline fallback
    } finally {
      setAuthLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as {
          success: boolean;
          data?: { authenticated: boolean; user: PublicUser | null };
        };
        if (!cancelled && json.success && json.data) {
          setUser(json.data.user);
        }
      } catch {
        // keep silent in offline fallback
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = React.useCallback(() => {
    const next = getThemeSnapshot() === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("theme", next);
    window.dispatchEvent(new Event("lc-local-store"));
    notify(
      next === "dark" ? "🌙 Đã kích hoạt Giao diện Tối" : "☀️ Đã chuyển Giao diện Sáng",
      "info"
    );
  }, [notify]);

  const logout = React.useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    notify("Đã đăng xuất khỏi tài khoản.", "info");
  }, [notify]);

  const openAuthModal = React.useCallback((reason?: string) => {
    setAuthReason(reason);
    setAuthModalOpen(true);
  }, []);

  const openFeatureMap = React.useCallback(() => {
    setFeatureMapOpen(true);
  }, []);

  const toggleGuestSavedDoc = React.useCallback((docId: string) => {
    const prev = getGuestDocsSnapshot();
    const exists = prev.includes(docId);
    const next = exists ? prev.filter((id) => id !== docId) : [...prev, docId];
    window.localStorage.setItem(GUEST_SAVED_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("lc-local-store"));
    return !exists;
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        theme,
        guestSavedDocIds,
        toggleTheme,
        refreshUser,
        logout,
        openAuthModal,
        openFeatureMap,
        toggleGuestSavedDoc,
        notify,
      }}
    >
      {children}

      <AuthModal
        open={authModalOpen}
        reason={authReason}
        guestSavedDocIds={guestSavedDocIds}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={async () => {
          window.localStorage.removeItem(GUEST_SAVED_KEY);
          window.dispatchEvent(new Event("lc-local-store"));
          await refreshUser();
          setAuthModalOpen(false);
          notify("Đăng nhập thành công! Tiến độ của bạn đã được đồng bộ.", "success");
        }}
      />

      <FeatureMapModal
        open={featureMapOpen}
        onClose={() => setFeatureMapOpen(false)}
      />

      {/* Toast stack */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-28 right-5 z-50 flex flex-col gap-2 max-w-sm"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--heading)] shadow-[var(--shadow-float)]"
          >
            {t.message}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = React.useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used inside AppProvider");
  }
  return ctx;
}
