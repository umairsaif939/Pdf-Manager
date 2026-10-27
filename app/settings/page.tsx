"use client";

import React, { useState, useEffect } from "react";
import {
  Moon,
  Sun,
  Laptop,
  Download,
  Upload,
  Keyboard,
  ShieldCheck,
  Cloud,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  Key,
  X,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTheme } from "@/components/theme/ThemeProvider";
import { getSupabaseAuthStatus, SyncStatus } from "@/lib/supabase/syncService";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getActiveDocuments } from "@/lib/storage/documentService";
import { syncDocumentToCloud } from "@/lib/supabase/syncService";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [inactivityTimeout, setInactivityTimeout] = useState(60);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Supabase states
  const [supabaseStatus, setSupabaseStatus] = useState<SyncStatus>({
    isConfigured: false,
    isAuthenticated: false,
  });
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [syncAllLoading, setSyncAllLoading] = useState(false);
  const [syncAllResult, setSyncAllResult] = useState<string | null>(null);

  useEffect(() => {
    async function loadAuth() {
      const status = await getSupabaseAuthStatus();
      setSupabaseStatus(status);
    }
    loadAuth();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;

    setAuthLoading(true);
    setAuthMessage(null);

    const supabase = createClient();
    if (!supabase) {
      setAuthMessage("Supabase is not configured yet. Add credentials to .env.local.");
      setAuthLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });

      if (error) {
        // Attempt sign up if user not found
        const { error: signUpError } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });

        if (signUpError) {
          setAuthMessage(signUpError.message);
        } else {
          setAuthMessage("Account created! Check your email to confirm registration.");
        }
      } else {
        setAuthMessage("Successfully signed in!");
        const updated = await getSupabaseAuthStatus();
        setSupabaseStatus(updated);
      }
    } catch (err: any) {
      setAuthMessage(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
      const updated = await getSupabaseAuthStatus();
      setSupabaseStatus(updated);
      setAuthMessage("Signed out from Supabase cloud.");
    }
  };

  const handleSyncAllDocuments = async () => {
    setSyncAllLoading(true);
    setSyncAllResult(null);

    try {
      const docs = await getActiveDocuments();
      let successCount = 0;
      let failCount = 0;

      for (const doc of docs) {
        const res = await syncDocumentToCloud(doc);
        if (res.success) successCount++;
        else failCount++;
      }

      setSyncAllResult(
        `Cloud Sync Complete: ${successCount} document${successCount !== 1 ? "s" : ""} backed up${
          failCount > 0 ? `, ${failCount} failed.` : "."
        }`
      );
    } catch (err: any) {
      setSyncAllResult(`Sync error: ${err.message}`);
    } finally {
      setSyncAllLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <PageHeader
        title="Settings & Preferences"
        description="Configure your study workspace, appearance, storage, and Supabase cloud sync."
      />

      {/* Cloud Sync (Supabase) Section */}
      <section className="p-6 bg-surface border border-line rounded-card shadow-soft space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-terracotta" />
              <h2 className="font-serif text-xl font-bold text-ink">
                Supabase Cloud Sync & Backup
              </h2>
            </div>
            <p className="font-sans text-xs text-muted mt-1">
              Connect your Supabase project to back up documents, annotations, and study notes securely.
            </p>
          </div>

          <span
            className={`px-2.5 py-1 text-xs font-sans font-semibold rounded-control border ${
              supabaseStatus.isConfigured
                ? "bg-success/10 text-success border-success/30"
                : "bg-warning/10 text-warning border-warning/30"
            }`}
          >
            {supabaseStatus.isConfigured ? "Connected" : "Configuration Needed"}
          </span>
        </div>

        {supabaseStatus.isConfigured ? (
          <div className="space-y-4 pt-1">
            {supabaseStatus.isAuthenticated ? (
              <div className="p-4 bg-paper rounded-control border border-line space-y-3">
                <div className="flex items-center justify-between text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span>
                      Signed in as: <strong className="text-ink">{supabaseStatus.userEmail}</strong>
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-xs text-danger hover:underline font-medium"
                  >
                    Sign Out
                  </button>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSyncAllDocuments}
                    disabled={syncAllLoading}
                    className="px-4 py-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-control font-sans text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    {syncAllLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CloudUpload className="w-3.5 h-3.5" />
                    )}
                    <span>Sync All Local Documents to Cloud</span>
                  </button>
                </div>

                {syncAllResult && (
                  <p className="text-xs text-forest font-medium">{syncAllResult}</p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSignIn} className="p-4 bg-paper rounded-control border border-line space-y-3">
                <span className="font-sans text-xs font-semibold text-ink block">
                  Sign In or Create Account with Supabase
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="email"
                    required
                    placeholder="student@university.edu"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="px-3 py-2 bg-surface text-ink text-xs rounded-control border border-line focus:outline-none focus:border-terracotta"
                  />
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="px-3 py-2 bg-surface text-ink text-xs rounded-control border border-line focus:outline-none focus:border-terracotta"
                  />
                </div>

                {authMessage && (
                  <div className="text-xs text-terracotta font-medium">{authMessage}</div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="px-4 py-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-control font-sans text-xs font-medium flex items-center gap-1.5 shadow-sm"
                  >
                    {authLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Sign In / Register</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="p-4 bg-paper rounded-control border border-line space-y-2.5 text-xs font-sans">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <Key className="w-4 h-4 text-warning" />
              <span>Configure your Supabase Credentials in <code>.env.local</code>:</span>
            </div>
            <pre className="bg-surface p-3 rounded-control border border-line text-[11px] font-mono text-muted overflow-x-auto leading-relaxed">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here`}
            </pre>
            <p className="text-muted text-[11px]">
              Copy from <code>.env.local.example</code>. The database migrations and RLS policies are available at <code>supabase/migrations/20261027_initial_schema.sql</code>.
            </p>
          </div>
        )}
      </section>

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

      {/* Storage & Local Data Safety */}
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
              <CheckCircle2 className="w-3.5 h-3.5" /> IndexedDB (Active)
            </span>
          </div>
          <p className="text-[11px] text-muted leading-tight">
            PDFs stay local for ultra-fast, offline access. You can optionally sync with Supabase when connected.
          </p>
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
        <div>Offline IndexedDB + Supabase Cloud Backup Ready</div>
      </div>
    </div>
  );
}
