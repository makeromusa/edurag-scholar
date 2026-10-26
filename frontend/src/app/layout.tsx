import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata: Metadata = {
  title: "EduRAG Scholar | UoN Chiromo Copilot",
  description: "Autonomous 7-Unit RAG & Web-Agent Scholar for B.Sc. Computer Science",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
