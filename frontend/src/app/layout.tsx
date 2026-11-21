import type { Metadata, Viewport } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "katex/dist/katex.min.css";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { Analytics } from "@vercel/analytics/react";

export const viewport: Viewport = {
  themeColor: "#0B1120",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://edurag.tech"),
  title: {
    default: "EduRAG Scholar | Autonomous Academic AI Copilot & Lecture Archive",
    template: "%s | EduRAG Scholar",
  },
  description:
    "Autonomous course-isolated academic RAG copilot, verified lecture slides, past paper archives, and professor masterclass studio for university scholars.",
  keywords: [
    "EduRAG Scholar",
    "Academic AI Copilot",
    "Computer Science University",
    "Course-Isolated RAG",
    "Past Exam Papers Solved",
    "Interactive Lecture Slides",
    "Oral Masterclass Studio",
    "Spaced Repetition SM-2",
  ],
  authors: [{ name: "EduRAG Academic Intelligence", url: "https://edurag.tech" }],
  creator: "EduRAG AI",
  publisher: "EduRAG Scholar",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://edurag.tech",
    title: "EduRAG Scholar | Autonomous Academic AI Copilot & Lecture Archive",
    description:
      "Autonomous course-isolated academic RAG copilot, verified lecture slides, past paper archives, and professor masterclass studio for university scholars.",
    siteName: "EduRAG Scholar",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EduRAG Scholar - Academic AI Revision Copilot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EduRAG Scholar | Autonomous Academic AI Copilot",
    description:
      "Autonomous 7-Unit RAG Academic Copilot & Past Exam Solved Vault for University Scholars.",
    images: ["/og-image.png"],
    creator: "@makeromusa",
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
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  verification: {
    google: "0x612K42qmMrLyXRgQUb-ZMbZ3q1OgUY4MjvGrNBFWg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="0x612K42qmMrLyXRgQUb-ZMbZ3q1OgUY4MjvGrNBFWg" />
        <meta name="application-name" content="EduRAG Scholar" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="EduRAG Scholar" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
