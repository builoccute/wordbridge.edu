"use client";

import * as React from "react";
import { Check, Coffee, Copy, Heart, Server, ShieldCheck, Sparkles, BookOpen } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { siteConfig } from "@/lib/site-config";
import { cn, formatVnd } from "@/lib/utils";

interface CreatedQr {
  orderCode: string;
  amountVnd: number;
  transferContent: string;
  bankId: string;
  accountNo: string;
  accountName: string;
  qrUrl: string;
}

export default function DonatePage() {
  const { notify } = useApp();
  const [amount, setAmount] = React.useState(50000);
  const [customAmount, setCustomAmount] = React.useState("");
  const [donorName, setDonorName] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [qrData, setQrData] = React.useState<CreatedQr | null>(null);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const activeAmount = customAmount ? Number(customAmount.replace(/\D/g, "")) || 0 : amount;

  const handleGenerateQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeAmount < 5000) {
      notify("Số tiền tối thiểu là 5.000 ₫.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountVnd: activeAmount,
          donorName,
          message,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: CreatedQr;
        error?: { message: string };
      };
      if (json.success && json.data) {
        setQrData(json.data);
        notify("Đã tạo mã VietQR riêng của bạn!", "success");
      } else {
        notify(json.error?.message || "Không thể tạo mã QR.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    notify("Đã sao chép vào khay nhớ tạm.", "success");
    window.setTimeout(() => setCopiedKey(null), 2000);
  };

  const previewQr =
    qrData?.qrUrl ||
    `https://img.vietqr.io/image/${siteConfig.vietqr.bankId}-${siteConfig.vietqr.accountNo}-compact2.png?amount=${Math.max(
      10000,
      activeAmount
    )}&addInfo=${encodeURIComponent("UNHO LINGOCHILL")}&accountName=${encodeURIComponent(
      siteConfig.vietqr.accountName
    )}`;

  const [isCustomMode, setIsCustomMode] = React.useState(false);

  const bankRows = [
    { key: "bank", label: "Ngân hàng", value: qrData?.bankId || siteConfig.vietqr.bankId },
    { key: "acc", label: "Số tài khoản", value: qrData?.accountNo || siteConfig.vietqr.accountNo },
    {
      key: "owner",
      label: "Chủ tài khoản",
      value: qrData?.accountName || siteConfig.vietqr.accountName,
    },
    {
      key: "memo",
      label: "Nội dung CK",
      value: qrData?.transferContent || "UNHO LINGOCHILL",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f3ea] bg-paper-grid pb-20 pt-10 text-[#1b2d1c] dark:bg-[#0e1511] dark:text-[#eef3e8]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Top StudyChill Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#1b2d1c] bg-[#ffecec] px-3.5 py-1 text-xs font-extrabold text-[#9f1239] sc-shadow-sm">
            <Heart className="h-3.5 w-3.5 fill-current" />
            Ủng hộ
          </span>
          <h1 className="mt-3 font-display text-3xl font-black tracking-tight text-[#122618] sm:text-5xl dark:text-white">
            Mời team một ly cà phê
          </h1>
          <p className="mx-auto mt-2.5 max-w-2xl text-sm leading-relaxed text-[#4f6152] dark:text-slate-300">
            Toàn bộ kho đề, ngữ pháp và công cụ đọc báo song ngữ đều miễn phí cho mọi bạn học. Nếu{" "}
            {siteConfig.brand.name} giúp bạn tự tin hơn mỗi ngày, bạn có thể góp một chút năng
            lượng duy trì server nhé!
          </p>
        </div>

        {/* Unified White Neo-Brutalist 2-Column Card */}
        <div className="mt-8 overflow-hidden rounded-[28px] border-2 border-[#1b2d1c] bg-white sc-shadow dark:border-[#9ee56f]/30 dark:bg-[#17211b]">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            {/* Left Side: Amount Presets + Form + 4 Bank Info Rows */}
            <div className="p-6 sm:p-8">
              <form onSubmit={handleGenerateQr} className="space-y-5">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#19462b] dark:text-[#9ee56f]">
                    1. Chọn mức ủng hộ
                  </p>
                  <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {siteConfig.vietqr.presets.slice(0, 3).map((preset) => {
                      const selected = !isCustomMode && !customAmount && amount === preset.amount;
                      return (
                        <button
                          key={preset.amount}
                          type="button"
                          onClick={() => {
                            setIsCustomMode(false);
                            setCustomAmount("");
                            setAmount(preset.amount);
                          }}
                          className={cn(
                            "rounded-2xl border-2 p-3 text-left transition cursor-pointer",
                            selected
                              ? "border-[#1b2d1c] bg-[#9ee56f] text-[#122618] shadow-[2px_2px_0px_#1b2d1c]"
                              : "border-[#dcd7ca] bg-[#fcfaf4] hover:border-[#1b2d1c] dark:border-white/10 dark:bg-[#1f2c24]"
                          )}
                        >
                          <span className="block font-mono-num text-sm font-black">
                            {formatVnd(preset.amount)}
                          </span>
                          <span className="mt-0.5 block text-[11px] font-semibold opacity-75">
                            {preset.label}
                          </span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomMode(true);
                      }}
                      className={cn(
                        "rounded-2xl border-2 p-3 text-left transition cursor-pointer",
                        isCustomMode || Boolean(customAmount)
                          ? "border-[#1b2d1c] bg-[#9ee56f] text-[#122618] shadow-[2px_2px_0px_#1b2d1c]"
                          : "border-[#dcd7ca] bg-[#fcfaf4] hover:border-[#1b2d1c] dark:border-white/10 dark:bg-[#1f2c24]"
                      )}
                    >
                      <span className="block font-display text-sm font-black">Tuỳ tâm</span>
                      <span className="mt-0.5 block text-[11px] font-semibold opacity-75">
                        Tự nhập số
                      </span>
                    </button>
                  </div>
                </div>

                {(isCustomMode || Boolean(customAmount)) && (
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#122618] dark:text-white">
                      Nhập số tiền bạn muốn gửi (VNĐ)
                    </label>
                    <Input
                      inputMode="numeric"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value.replace(/\D/g, ""))}
                      placeholder="Ví dụ: 150000"
                    />
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#122618] dark:text-white">
                      Tên của bạn (tuỳ chọn)
                    </label>
                    <Input
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="Bạn học ẩn danh"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#122618] dark:text-white">
                      Lời nhắn gửi team
                    </label>
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Chúc team giữ mãi lửa!"
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" disabled={loading} className="w-full">
                  <Coffee className="h-4 w-4" />
                  {loading
                    ? "Đang tạo mã VietQR..."
                    : `Tạo mã VietQR (${formatVnd(activeAmount)})`}
                </Button>
              </form>

              {/* 4 Clean Bank Transfer Copy Rows */}
              <div className="mt-6 space-y-2 border-t border-dashed border-[#d8d3c6] pt-5 dark:border-white/10">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#556758] dark:text-slate-400">
                  Thông tin chuyển khoản nhanh
                </p>
                {bankRows.map((row) => {
                  const isCopied = copiedKey === row.key;
                  return (
                    <div
                      key={row.key}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#e3ded3] bg-[#fcfaf4] px-3.5 py-2.5 text-xs dark:border-white/10 dark:bg-[#1f2c24]"
                    >
                      <span className="font-medium text-[#556758] dark:text-slate-400">
                        {row.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num font-black text-[#122618] dark:text-white">
                          {row.value}
                        </span>
                        <button
                          type="button"
                          onClick={() => void copyText(row.key, row.value)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition cursor-pointer",
                            isCopied
                              ? "border-[#1b2d1c] bg-[#9ee56f] text-[#122618]"
                              : "border-[#cfd6c9] bg-white text-[#19462b] hover:border-[#1b2d1c]"
                          )}
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3 w-3" /> Đã chép
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Chép
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Side: Live VietQR / SePay Scan Box */}
            <div className="flex flex-col items-center justify-center border-t-2 border-[#1b2d1c] bg-[#f8f5ec] bg-dot-grid p-6 text-center lg:border-l-2 lg:border-t-0 sm:p-8 dark:border-white/15 dark:bg-[#121a15]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1b2d1c] bg-white px-3 py-1 text-[11px] font-extrabold text-[#19462b]">
                <Sparkles className="h-3.5 w-3.5 text-[#3b7a2a]" />
                {qrData ? `Mã đơn: ${qrData.orderCode}` : "SEPAY · VIETQR TỰ ĐỘNG"}
              </span>

              <div className="mt-4 w-full max-w-[260px] rounded-3xl border-2 border-[#1b2d1c] bg-white p-3.5 sc-shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewQr}
                  alt="Mã QR chuyển khoản VietQR"
                  className="aspect-square w-full rounded-xl object-contain"
                />
                <div className="mt-2 border-t border-dashed border-[#e2ded3] pt-2 text-[11px] font-bold text-[#19462b]">
                  Mở app ngân hàng bất kỳ &amp; quét mã
                </div>
              </div>

              <p className="mt-4 font-mono-num text-base font-black text-[#19462b] dark:text-[#9ee56f]">
                {formatVnd(qrData?.amountVnd || activeAmount)}
              </p>
              <p className="mt-1 max-w-xs text-xs text-[#556758] dark:text-slate-300">
                Giao dịch được đối soát tự động thông qua SePay Webhook theo nội dung chuyển khoản.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom 3 Transparency Value Cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Server,
              title: "Duy trì Server & CDN",
              desc: "Đảm bảo tốc độ tải đề thi 200 câu, audio Listening và tra cứu tài liệu mượt mà 24/7.",
              bg: "bg-[#eaf5e3]",
            },
            {
              icon: BookOpen,
              title: "Kho học liệu luôn Free",
              desc: "Mỗi đóng góp giúp team biên soạn thêm nhiều bộ đề sát format mới & mẹo giải chi tiết.",
              bg: "bg-[#eef4f8]",
            },
            {
              icon: ShieldCheck,
              title: "100% Minh bạch",
              desc: "Mọi khoản ủng hộ đều tạo mã đơn riêng qua VietQR & ghi nhận công khai đóng góp cộng đồng.",
              bg: "bg-[#fbf1e6]",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-3xl border-2 border-[#1b2d1c] bg-white p-5 sc-shadow-sm dark:border-white/15 dark:bg-[#17211b]"
              >
                <span
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#1b2d1c] text-[#19462b]",
                    item.bg
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-3 font-display text-base font-black text-[#122618] dark:text-white">
                  {item.title}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[#556758] dark:text-slate-300">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
