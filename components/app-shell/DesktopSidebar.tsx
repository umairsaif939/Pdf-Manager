"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Folder,
  Star,
  BarChart2,
  Layers,
  Trash2,
  Settings,
  Plus,
  ShieldCheck,
  Moon,
  Sun,
  Laptop,
} from "lucide-react";
import { useTheme } from "../theme/ThemeProvider";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Library", href: "/library", icon: BookOpen },
  { label: "Folders", href: "/folders", icon: Folder },
  { label: "Favorites", href: "/favorites", icon: Star },
  { label: "Study Analytics", href: "/analytics", icon: BarChart2 },
  { label: "Revision & Cards", href: "/revision", icon: Layers },
  { label: "Trash", href: "/trash", icon: Trash2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function DesktopSidebar({ onImportClick }: { onImportClick?: () => void }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-surface border-r border-line p-5 select-none transition-colors duration-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-control bg-terracotta text-white flex items-center justify-center font-serif text-xl font-bold shadow-sm transition-transform duration-150 group-hover:scale-105">
            F
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl font-bold tracking-tight text-ink">
              PDF Flux
            </span>
            <span className="text-[11px] font-sans text-muted tracking-wide uppercase">
              Study Workspace
            </span>
          </div>
        </Link>
      </div>

      {/* Primary Action Button */}
      <button
        onClick={onImportClick}
        className="w-full mb-6 py-2.5 px-4 bg-terracotta hover:bg-terracotta-hover text-white rounded-control font-sans text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-all duration-150 active:scale-[0.98]"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        <span>Import PDF</span>
      </button>

      {/* Main Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-control text-sm font-sans font-medium transition-colors duration-150 ${
                isActive
                  ? "bg-paper text-terracotta font-semibold"
                  : "text-muted hover:text-ink hover:bg-paper/60"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? "text-terracotta" : "text-muted"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Local & Offline Status Indicator */}
      <div className="pt-4 border-t border-line space-y-3">
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success"></span>
            <span className="font-sans font-medium text-ink">Offline Ready</span>
          </div>
          <ShieldCheck className="w-3.5 h-3.5 text-muted" />
        </div>
        <p className="text-[11px] text-muted leading-tight">
          All documents and annotations stay securely on your device.
        </p>

        {/* Quick Theme Switcher */}
        <div className="flex items-center justify-between p-1 bg-paper rounded-control border border-line text-muted">
          <button
            onClick={() => setTheme("light")}
            aria-label="Light mode"
            className={`flex-1 py-1 flex items-center justify-center rounded-md transition-colors ${
              theme === "light" ? "bg-surface text-ink shadow-xs" : "hover:text-ink"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme("system")}
            aria-label="System mode"
            className={`flex-1 py-1 flex items-center justify-center rounded-md transition-colors ${
              theme === "system" ? "bg-surface text-ink shadow-xs" : "hover:text-ink"
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme("dark")}
            aria-label="Dark mode"
            className={`flex-1 py-1 flex items-center justify-center rounded-md transition-colors ${
              theme === "dark" ? "bg-surface text-ink shadow-xs" : "hover:text-ink"
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
