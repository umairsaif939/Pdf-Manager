"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Moon, Sun, ShieldCheck } from "lucide-react";
import { useTheme } from "../theme/ThemeProvider";

export function MobileTopBar({ onImportClick }: { onImportClick?: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-line sticky top-0 z-30 transition-colors duration-200">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-control bg-terracotta text-white flex items-center justify-center font-serif text-lg font-bold">
          F
        </div>
        <div className="flex flex-col">
          <span className="font-serif text-lg font-bold tracking-tight text-ink">
            PDF Flux
          </span>
          <span className="text-[10px] font-sans text-muted uppercase">
            Local-First
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="p-2 text-muted hover:text-ink rounded-control bg-paper border border-line"
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={onImportClick}
          className="py-1.5 px-3 bg-terracotta hover:bg-terracotta-hover text-white rounded-control font-sans text-xs font-medium flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Import</span>
        </button>
      </div>
    </header>
  );
}
