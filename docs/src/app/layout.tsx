import "@/app/global.css";
import { WebVitalsReporter } from "@/components/web-vitals";
import { cn } from "@/lib/utils";
import {
  PostHogPageview,
  PostHogRootProvider,
} from "@/providers/posthog-provider";
import { GenuiRootProvider } from "@/providers/genui-provider";
import { RootProvider } from "fumadocs-ui/provider";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";
import { Suspense } from "react";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://docs.genui.co";
const docsDescription =
  "Genui is an open-source generative UI toolkit for React. Register your components—the agent renders them based on user messages.";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Genui Docs",
    template: "%s | Genui Docs",
  },
  description: docsDescription,
  openGraph: {
    title: "Genui Docs",
    description: docsDescription,
    url: baseUrl,
    siteName: "Genui Docs",
    type: "website",
    images: ["/logo/opengraph-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Genui Docs",
    description: docsDescription,
    images: ["/logo/opengraph-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const inter = Inter({
  subsets: ["latin"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn(inter.className, "genui-theme")}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <GenuiRootProvider>
          <Suspense>
            <PostHogPageview />
          </Suspense>
          <Suspense>
            <WebVitalsReporter />
          </Suspense>
          <PostHogRootProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
            >
              <RootProvider>{children}</RootProvider>
            </ThemeProvider>
          </PostHogRootProvider>
        </GenuiRootProvider>
      </body>
    </html>
  );
}
