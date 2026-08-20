"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LayoutContext } from "@/lib/layout-context";
import type { CurrentUser } from "@shared/index";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<CurrentUser>({
    id: "",
    name: "User",
    email: "user@email.com",
    role: "END_USER",
    departmentId: "",
    departmentName: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("sidebarCollapsed");
    if (stored === "true") {
      setSidebarCollapsed(true);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("sidebarCollapsed", String(sidebarCollapsed));
    }
  }, [sidebarCollapsed, mounted]);

  return (
    <LayoutContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed }}>
      <div className="flex w-full h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <div
          suppressHydrationWarning
          className={`flex flex-1 flex-col min-w-0 min-h-0 transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? "ml-[72px]" : "ml-64"
          }`}
        >
          <Header user={user} />
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-[15px]">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
