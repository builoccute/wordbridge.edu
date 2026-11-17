"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// === badge.tsx ===
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "green" | "gold" | "neutral" | "blue" | "rose";
}

export function Badge({
  className,
  variant = "neutral",
  ...props
}: BadgeProps) {
  const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
    green: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/25",
    gold: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/25",
    neutral: "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]",
    blue: "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/25",
    rose: "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/25",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

// === button.tsx ===
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gold" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", loading = false, disabled, children, ...props }, ref) => {
    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      primary:
        "bg-[var(--primary)] text-[var(--primary-foreground)] hover:brightness-110 shadow-sm",
      secondary:
        "bg-[var(--muted)] text-[var(--heading)] hover:brightness-95 dark:hover:brightness-110",
      outline:
        "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--heading)] hover:bg-[var(--surface-alt)]",
      ghost:
        "bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)]",
      gold:
        "bg-[var(--gold)] text-white hover:brightness-110 shadow-sm",
      danger:
        "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
    };

    const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
      sm: "h-9 px-3.5 text-xs rounded-xl",
      md: "h-10 px-4 text-sm rounded-xl",
      lg: "h-12 px-6 text-base rounded-2xl",
      icon: "h-10 w-10 rounded-xl p-0",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? "Đang xử lý..." : children}
      </button>
    );
  }
);
Button.displayName = "Button";

// === card.tsx ===
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "card-paper rounded-2xl transition-all duration-200",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pb-3", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-heading text-lg font-bold tracking-tight text-[var(--heading)]",
        className
      )}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

// === dialog.tsx ===
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  maxWidthClass?: string;
  contentClassName?: string;
  hideCloseButton?: boolean;
  children: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  maxWidthClass = "max-w-lg",
  contentClassName,
  hideCloseButton = false,
  children,
}: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Hộp thoại"}
      onClick={onClose}
    >
      <div
        className={cn(
          "relative w-full max-h-[92vh] overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-float)]",
          maxWidthClass,
          contentClassName
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-xl text-[var(--muted-foreground)] transition hover:bg-black/5 hover:text-[var(--heading)] dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        )}

        {title && (
          <div className="mb-4 pr-8">
            <h2 className="font-heading text-xl font-bold text-[var(--heading)]">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {description}
              </p>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

// === input.tsx ===
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

// === social-icons.tsx ===
export function FacebookBrandIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.1H7.7v3h2.5V21h3.3z" />
    </svg>
  );
}

export function YoutubeBrandIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5A2.7 2.7 0 0 0 2.4 7.2 28.4 28.4 0 0 0 2 12a28.4 28.4 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28.4 28.4 0 0 0 22 12a28.4 28.4 0 0 0-.4-4.8zM10 15.2V8.8l5.2 3.2-5.2 3.2z" />
    </svg>
  );
}

// === tilt-3d.tsx ===
interface Tilt3DProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
  glare?: boolean;
}

/**
 * Spatial 3D tilt wrapper applying cursor-tracked perspective(1100px) rotateX/Y,
 * CSS preserve-3d child depth support (.depth-3d-sm / md / lg), and specular glare.
 */
export function Tilt3D({
  children,
  className,
  maxTilt = 8,
  scale = 1.018,
  glare = true,
}: Tilt3DProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = React.useState(
    "perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)"
  );
  const [glarePos, setGlarePos] = React.useState({ x: 50, y: 50, active: false });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));

    const rotY = (px - 0.5) * (maxTilt * 2);
    const rotX = (0.5 - py) * (maxTilt * 2);

    setTransform(
      `perspective(1100px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(${scale},${scale},${scale})`
    );
    setGlarePos({ x: Math.round(px * 100), y: Math.round(py * 100), active: true });
  };

  const handlePointerLeave = () => {
    setTransform("perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)");
    setGlarePos((prev) => ({ ...prev, active: false }));
  };

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ transform, transformStyle: "preserve-3d" }}
      className={cn(
        "relative will-change-transform transition-transform duration-200 ease-out",
        className
      )}
    >
      {children}
      {glare && (
        <div
          aria-hidden="true"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 42%, transparent 72%)`,
            opacity: glarePos.active ? 1 : 0,
          }}
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-200"
        />
      )}
    </div>
  );
}
