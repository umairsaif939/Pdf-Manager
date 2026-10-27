"use client";

import React, { useState } from "react";
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
  MoreHorizontal,
  X,
} from "lucide-react";

const primaryNav = [
  { label: "Home", href: "/", icon: Home },
  { label: "Library", href: "/library", icon: BookOpen },
  { label: "Study", href: "/analytics", icon: BarChart2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

const secondaryNav = [
  { label: "Folders", href: "/folders", icon: Folder },
  { label: "Favorites", href: "/favorites", icon: Star },
  { label: "Revision & Cards", href: "/revision", icon: Layers },
  { label: "Trash (Recycle Bin)", href: "/trash", icon: Trash2 },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <>
      {/* Secondary More Menu Sheet */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex flex-col justify-end md:hidden animate-fade-in"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="bg-surface rounded-t-card p-5 border-t border-line space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <span className="font-serif text-lg font-bold text-ink">
                More Destinations
              </span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-control text-muted hover:text-ink"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {secondaryNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMoreMenu(false)}
                    className={`flex items-center gap-2.5 p-3 rounded-control text-sm font-sans font-medium transition-colors ${
                      isActive
                        ? "bg-paper text-terracotta font-semibold"
                        : "text-muted hover:text-ink hover:bg-paper/50"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-terracotta" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-md border-t border-line flex items-center justify-around py-2 px-1 transition-colors duration-200">
        {primaryNav.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-control text-xs font-sans transition-colors ${
                isActive
                  ? "text-terracotta font-semibold"
                  : "text-muted hover:text-ink"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={() => setShowMoreMenu(true)}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-control text-xs font-sans text-muted hover:text-ink transition-colors ${
            showMoreMenu ? "text-terracotta font-semibold" : ""
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
