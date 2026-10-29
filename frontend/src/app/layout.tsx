import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

export const viewport: Viewport = {
  themeColor: "#0B1120",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://learningassistant-chi.vercel.app"),
  title: {
    default: "EduRAG Scholar | UoN Chiromo Year 2 AI Revision & Past Papers",
    template: "%s | EduRAG Scholar",
  },
  description:
    "Autonomous 7-Unit RAG Academic Copilot and Past Exam Solved Vault for University of Nairobi Chiromo Campus B.Sc. Computer Science Year 2.",
  keywords: [
    "EduRAG Scholar",
    "University of Nairobi",
    "UoN Chiromo",
    "Computer Science Year 2",
    "SCS 3201 Systems Analysis and Design",
    "SCS 3209 Software Engineering",
    "SCS 3207 Human Computer Interaction",
    "SCS 3203 Network Programming",
    "SCS 3205 Distributed Systems",
    "SCS 3208 Mobile Application Development",
    "SCS 3202 Advanced Database Systems",
    "Past Exam Papers Solved",
    "Kendall and Kendall 10th Edition",
    "Sommerville Software Engineering",
    "RAG Academic Copilot",
    "Academic Vault",
  ],
  authors: [{ name: "Musa Makeri", url: "https://learningassistant-chi.vercel.app" }],
  creator: "Musa Makeri",
  publisher: "University of Nairobi Chiromo Campus",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://learningassistant-chi.vercel.app",
    title: "EduRAG Scholar | UoN Chiromo Year 2 AI Revision & Past Papers",
    description:
      "Autonomous 7-Unit RAG Academic Copilot and Past Exam Solved Vault for University of Nairobi Chiromo Campus B.Sc. Computer Science Year 2.",
    siteName: "EduRAG Scholar",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EduRAG Scholar - UoN Chiromo AI Revision Copilot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EduRAG Scholar | UoN Chiromo Year 2 AI Revision",
    description:
      "Autonomous 7-Unit RAG Academic Copilot & Past Exam Solved Vault for UoN Chiromo Computer Science.",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="application-name" content="EduRAG Scholar" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="EduRAG Scholar" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
