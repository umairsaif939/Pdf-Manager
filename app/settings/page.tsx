"use client";

import React, { useState, useEffect } from "react";
import {
  Moon,
  Sun,
  Laptop,
  Keyboard,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  X,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTheme } from "@/components/theme/ThemeProvider";
import { getActiveDocuments } from "@/lib/storage/documentService";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [inactivityTimeout, setInactivityTimeout] = useState(60);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const [storageEstimate, setStorageEstimate] = useState<string>("Calculating...");

  useEffect(() => {
    async function checkStorage() {
      try {
        const docs = await getActiveDocuments();
        setDocCount(docs.length);

        const totalBytes = docs.reduce((acc, d) => acc + (d.sizeBytes || 0), 0);
        if (totalBytes < 1024 * 1024) {
          setStorageEstimate(`${(totalBytes / 1024).toFixed(1)} KB`);
        } else {
          setStorageEstimate(`${(totalBytes / (1024 * 1024)).toFixed(1)} MB`);
        }
      } catch (e) {
        console.warn("Storage check:", e);
      }
    }
    checkStorage();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <PageHeader
        title="Settings & Preferences"
        description="Configure your study workspace, appearance, and local storage safety."
      />

      {/* Theme & Appearance */}
      <section className="p-6 bg-surface border border-line rounded-card shadow-soft space-y-5">
        <div>
          <h2 className="font-serif text-xl font-bold text-ink">
            Appearance & Theme
          </h2>
          <p className="font-sans text-xs text-muted">
            Choose your preferred reading surface aesthetic.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setTheme("light")}
            className={`p-4 rounded-control border text-left flex items-start gap-3 transition-all ${
              theme === "light"
                ? "bg-paper border-terracotta text-ink shadow-xs"
                : "bg-surface border-line text-muted hover:text-ink hover:bg-paper/50"
            }`}
          >
            <Sun className="w-5 h-5 text-terracotta shrink-0 mt-0.5" />
            <div>
              <div className="font-sans text-sm font-semibold text-ink">Light (Paper)</div>
              <p className="font-sans text-xs text-muted mt-0.5">Warm cream paper background</p>
            </div>
          </button>

          <button
            onClick={() => setTheme("dark")}
            className={`p-4 rounded-control border text-left flex items-start gap-3 transition-all ${
              theme === "dark"
                ? "bg-paper border-terracotta text-ink shadow-xs"
                : "bg-surface border-line text-muted hover:text-ink hover:bg-paper/50"
            }`}
          >
            <Moon className="w-5 h-5 text-terracotta shrink-0 mt-0.5" />
            <div>
              <div className="font-sans text-sm font-semibold text-ink">Dark (Charcoal)</div>
              <p className="font-sans text-xs text-muted mt-0.5">Calm, contrast-preserving dark tones</p>
            </div>
          </button>

          <button
            onClick={() => setTheme("system")}
            className={`p-4 rounded-control border text-left flex items-start gap-3 transition-all ${
              theme === "system"
                ? "bg-paper border-terracotta text-ink shadow-xs"
                : "bg-surface border-line text-muted hover:text-ink hover:bg-paper/50"
            }`}
          >
            <Laptop className="w-5 h-5 text-terracotta shrink-0 mt-0.5" />
            <div>
              <div className="font-sans text-sm font-semibold text-ink">System Sync</div>
              <p className="font-sans text-xs text-muted mt-0.5">Match operating system preference</p>
            </div>
          </button>
        </div>
      </section>

      {/* Local Storage & Data Safety */}
      <section className="p-6 bg-surface border border-line rounded-card shadow-soft space-y-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-ink">
            Local Storage & Data Safety
          </h2>
          <p className="font-sans text-xs text-muted">
            All original PDFs and annotations reside directly in your browser&apos;s IndexedDB.
          </p>
        </div>

        <div className="p-4 bg-paper rounded-control border border-line space-y-3">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="text-muted">Primary Storage Engine:</span>
            <span className="font-semibold text-success flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> IndexedDB (Active & Private)
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="text-muted">Saved PDF Documents:</span>
            <span className="font-medium text-ink">{docCount} documents ({storageEstimate})</span>
          </div>
          <p className="text-[11px] text-muted leading-tight">
            Your documents never leave this device. Clearing your browser cookies or site data may reset local IndexedDB storage.
          </p>
        </div>
      </section>

      {/* Screen-Time & Study Tracking */}
      <section className="p-6 bg-surface border border-line rounded-card shadow-soft space-y-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-ink">
            Screen-Time & Study Tracking
          </h2>
          <p className="font-sans text-xs text-muted">
            Track reading engagement privately on your device.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-paper rounded-control border border-line cursor-pointer">
            <div className="space-y-0.5">
              <span className="font-sans text-sm font-semibold text-ink block">
                Enable Active Reading Time Tracking
              </span>
              <span className="font-sans text-xs text-muted">
                Pauses automatically when switching tabs or window loses focus.
              </span>
            </div>
            <input
              type="checkbox"
              checked={trackingEnabled}
              onChange={(e) => setTrackingEnabled(e.target.checked)}
              className="w-4 h-4 accent-terracotta rounded-md cursor-pointer"
            />
          </label>

          <div className="flex items-center justify-between p-3 bg-paper rounded-control border border-line text-xs">
            <span className="font-sans text-muted">Inactivity Timeout:</span>
            <select
              value={inactivityTimeout}
              onChange={(e) => setInactivityTimeout(Number(e.target.value))}
              className="bg-surface text-ink px-3 py-1.5 rounded-control border border-line focus:outline-none focus:border-terracotta"
            >
              <option value={30}>30 seconds of inactivity</option>
              <option value={60}>60 seconds of inactivity (Recommended)</option>
              <option value={120}>2 minutes of inactivity</option>
            </select>
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts Reference */}
      <section className="p-6 bg-surface border border-line rounded-card shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-ink">
            Keyboard Shortcuts Reference
          </h3>
          <p className="font-sans text-xs text-muted">
            Study faster with dedicated reading and annotation hotkeys.
          </p>
        </div>

        <button
          onClick={() => setIsShortcutsOpen(true)}
          className="px-4 py-2 bg-paper hover:bg-line text-ink rounded-control font-sans text-xs font-medium border border-line flex items-center gap-2 shrink-0 transition-colors"
        >
          <Keyboard className="w-4 h-4" />
          <span>View Shortcuts Guide</span>
        </button>
      </section>

      {/* Shortcuts Modal */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="bg-surface border border-line rounded-card max-w-md w-full p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-serif text-xl font-bold text-ink">
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setIsShortcutsOpen(false)}
                className="p-1 rounded-control text-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-sans divide-y divide-line">
              <div className="flex justify-between py-1.5">
                <span className="text-muted">Next / Previous Page</span>
                <span className="font-mono bg-paper px-2 py-0.5 rounded border border-line text-ink">
                  → / ← or j / k
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted">Zoom In / Zoom Out</span>
                <span className="font-mono bg-paper px-2 py-0.5 rounded border border-line text-ink">
                  + / -
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted">Fit to Width / Page</span>
                <span className="font-mono bg-paper px-2 py-0.5 rounded border border-line text-ink">
                  0
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted">In-Document Search</span>
                <span className="font-mono bg-paper px-2 py-0.5 rounded border border-line text-ink">
                  Ctrl + F
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsShortcutsOpen(false)}
                className="px-4 py-2 bg-paper text-ink rounded-control text-xs font-medium border border-line hover:bg-line"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Metadata Footer */}
      <div className="text-center text-xs font-sans text-muted space-y-1 pt-4 pb-8">
        <div>PDF Flux • Local-First Study Workspace</div>
        <div>Offline IndexedDB Storage Active</div>
      </div>
    </div>
  );
}
