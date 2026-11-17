import { Suspense } from "react";
import type { Metadata } from "next";
import { Baloo_2, Be_Vietnam_Pro, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/providers/app-provider";
import { Navbar } from "@/components/layout";
import { Footer } from "@/components/layout";
import { FloatingMascot } from "@/components/layout";
import { siteConfig } from "@/lib/site-config";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jakarta",
});

const baloo2 = Baloo_2({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
  variable: "--font-baloo",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "700"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: siteConfig.brand.titleSuffix,
    template: `%s | ${siteConfig.brand.name}`,
  },
  description: siteConfig.brand.description,
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: siteConfig.brand.name,
    title: siteConfig.brand.titleSuffix,
    description: siteConfig.brand.description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${beVietnamPro.variable} ${plusJakartaSans.variable} ${baloo2.variable} ${jetbrainsMono.variable} h-full`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-grid-paper min-h-full flex flex-col">
        <AppProvider>
          <Suspense fallback={null}>
            <Navbar />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
          <Suspense fallback={null}>
            <FloatingMascot />
          </Suspense>
        </AppProvider>
      </body>
    </html>
  );
}
