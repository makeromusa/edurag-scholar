"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Cpu,
  Activity,
  Megaphone,
  Shield,
  ArrowLeft,
  LogOut,
  ChevronRight,
  Loader2,
  Lock,
  Key,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const NAV_ITEMS = [
  { href: "/admin/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Scholars & Users", icon: Users },
  { href: "/admin/units", label: "Units & Content", icon: BookOpen },
  { href: "/admin/ai", label: "AI Query Monitor", icon: Cpu, badge: "Attributed" },
  { href: "/admin/health", label: "System Health", icon: Activity },
  { href: "/admin/broadcasts", label: "Broadcasts", icon: Megaphone },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Super admin fallback check by email
  const isSuperAdminEmail = user?.email === "makeromusa17@gmail.com";
  const hasAdminAccess = isAdmin || isSuperAdminEmail;

  if (!mounted || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#040711] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Shield className="h-6 w-6 animate-pulse" />
          </div>
          <p className="text-sm font-semibold text-slate-300">Verifying Admin Credentials...</p>
          <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
        </div>
      </div>
    );
  }

  if (!user || !hasAdminAccess) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#040711] p-4 text-white">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/20 bg-[#090d19] p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Access Restricted</h2>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            The EduRAG Administrative Portal is exclusively restricted to verified administrators (
            <span className="text-amber-400 font-mono">makeromusa17@gmail.com</span>). Your current session lacks the required elevated privilege flags.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-bold text-white shadow-lg transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Student Workspace</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#040711] text-slate-100 overflow-hidden font-sans">
      {/* Dark Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#060a16] flex flex-col shrink-0">
        {/* Header / Brand */}
        <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-black shadow-md shadow-amber-500/20">
              <Shield className="h-4 w-4 fill-slate-950" />
            </div>
            <div>
              <h1 className="text-xs font-black tracking-wider text-white uppercase">EduRAG Admin</h1>
              <p className="text-[10px] text-amber-400/90 font-medium">Enterprise Central Command</p>
            </div>
          </div>
        </div>

        {/* Super Admin Badge */}
        <div className="px-4 py-3 border-b border-slate-800/60 bg-amber-950/20">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-bold text-amber-300 truncate">Super Admin Portal</span>
          </div>
          <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {[
            ...NAV_ITEMS,
            ...(isSuperAdminEmail
              ? [{ href: "/admin/api-keys", label: "Developer API Keys", icon: Key, badge: "Master" }]
              : []),
          ].map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin/overview" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition group ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-300 border border-amber-500/30 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 transition ${
                      isActive ? "text-amber-400" : "text-slate-400 group-hover:text-white"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-violet-300 bg-violet-950/80 border border-violet-500/30 px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight
                    className={`h-3 w-3 transition opacity-0 group-hover:opacity-100 ${
                      isActive ? "opacity-100 text-amber-400" : "text-slate-600"
                    }`}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <Link
            href="/"
            className="flex w-full items-center gap-2 rounded-xl border border-slate-800 bg-[#090d19] hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-blue-400" />
            <span>Student Copilot</span>
          </Link>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-rose-950/30 hover:text-rose-400 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#040711]">
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
