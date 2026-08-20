"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Inbox,
  BarChart3,
  Settings,
  HelpCircle,
  Ticket,
} from "lucide-react";
import { useLayout } from "@/lib/layout-context";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Queues", href: "/my-queues", icon: Inbox },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Help", href: "/help", icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useLayout();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <aside
      suppressHydrationWarning
      className={`fixed left-0 top-0 z-40 flex h-screen shrink-0 flex-col bg-slate-900 ${
        isMounted ? "transition-all duration-300" : ""
      } ${sidebarCollapsed ? "w-[72px]" : "w-64"}`}
    >
      {/* Logo */}
      <div
        suppressHydrationWarning
        className={`flex h-16 items-center border-b border-slate-700 ${
          sidebarCollapsed ? "justify-center px-2" : "gap-3 px-5"
        }`}
      >
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/30"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Ticket className="h-5 w-5 text-white" />
        </button>
        {!sidebarCollapsed && (
          <span className="text-lg font-semibold text-white whitespace-nowrap">
            IT Support
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href.split("?")[0]);
          return (
            <Link
              key={item.label}
              href={item.href}
              title={sidebarCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                sidebarCollapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="border-t border-slate-700 px-5 py-4">
          <p className="text-xs text-slate-500">IT Ticketing System v1.0</p>
        </div>
      )}
    </aside>
  );
}
