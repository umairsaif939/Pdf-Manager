"use client";

import React, { useState } from "react";
import {
  BarChart2,
  Clock,
  Calendar,
  Flame,
  CheckCircle,
  Eye,
  EyeOff,
  Folder,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { DEMO_DOCUMENTS, DEMO_FOLDERS } from "@/lib/demoData";

export default function AnalyticsPage() {
  const [range, setRange] = useState<"today" | "week" | "month">("week");
  const [showDemo, setShowDemo] = useState(true);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-surface border border-line rounded-control text-xs font-sans">
        <div className="flex items-center gap-2 text-muted">
          <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
          <span>
            {showDemo
              ? "Displaying Sample Focus Analytics (Demo Mode). Switch to see honest initial state."
              : "Displaying Honest Initial Analytics State (Tracking starts upon reading)."}
          </span>
        </div>
        <button
          onClick={() => setShowDemo(!showDemo)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper hover:bg-line text-ink rounded-control font-medium border border-line transition-colors self-start sm:self-auto"
        >
          {showDemo ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Show Clean Initial State</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Demo Chart</span>
            </>
          )}
        </button>
      </div>

      <PageHeader
        title="Study Analytics"
        description="Private screen-time and focus metrics calculated entirely on your device."
        action={
          <div className="flex items-center p-1 bg-surface rounded-control border border-line text-xs font-sans">
            <button
              onClick={() => setRange("today")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                range === "today"
                  ? "bg-terracotta text-white shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setRange("week")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                range === "week"
                  ? "bg-terracotta text-white shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setRange("month")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                range === "month"
                  ? "bg-terracotta text-white shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              This Month
            </button>
          </div>
        }
      />

      {showDemo ? (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-surface border border-line rounded-card shadow-soft space-y-2">
              <span className="text-xs font-sans text-muted">Total Focus Time</span>
              <div className="font-serif text-3xl font-bold text-ink">
                {range === "today" ? "1h 45m" : range === "week" ? "14h 20m" : "52h 10m"}
              </div>
              <span className="text-[11px] font-sans text-success flex items-center gap-1 font-medium">
                <CheckCircle className="w-3 h-3" /> Active engaged reading
              </span>
            </div>

            <div className="p-5 bg-surface border border-line rounded-card shadow-soft space-y-2">
              <span className="text-xs font-sans text-muted">Daily Average</span>
              <div className="font-serif text-3xl font-bold text-ink">
                2h 03m
              </div>
              <span className="text-[11px] font-sans text-muted">
                Based on active sessions
              </span>
            </div>

            <div className="p-5 bg-surface border border-line rounded-card shadow-soft space-y-2">
              <span className="text-xs font-sans text-muted">Study Streak</span>
              <div className="font-serif text-3xl font-bold text-terracotta flex items-center gap-2">
                <span>5 Days</span>
                <Flame className="w-6 h-6 fill-terracotta text-terracotta" />
              </div>
              <span className="text-[11px] font-sans text-muted">
                Goal: 45 min / day
              </span>
            </div>

            <div className="p-5 bg-surface border border-line rounded-card shadow-soft space-y-2">
              <span className="text-xs font-sans text-muted">Most Read Subject</span>
              <div className="font-serif text-2xl font-bold text-ink truncate">
                Computer Science
              </div>
              <span className="text-[11px] font-sans text-muted">
                38% of total study time
              </span>
            </div>
          </div>

          {/* Bar Chart Section */}
          <div className="p-6 bg-surface border border-line rounded-card shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-ink">
                  Daily Focus Distribution
                </h3>
                <p className="font-sans text-xs text-muted">
                  Hours spent reading actively across the last 7 days.
                </p>
              </div>
              <span className="text-xs font-sans text-muted bg-paper px-2.5 py-1 rounded-control border border-line">
                Active time only (pauses when idle)
              </span>
            </div>

            {/* Visual Custom SVG Bar Chart */}
            <div className="pt-4 pb-2">
              <div className="h-48 flex items-end justify-between gap-2 sm:gap-6 border-b border-line pb-2">
                {[
                  { day: "Mon", hours: 2.2, height: "55%" },
                  { day: "Tue", hours: 1.8, height: "45%" },
                  { day: "Wed", hours: 3.1, height: "78%" },
                  { day: "Thu", hours: 2.5, height: "63%" },
                  { day: "Fri", hours: 1.2, height: "30%" },
                  { day: "Sat", hours: 3.8, height: "95%" },
                  { day: "Sun", hours: 2.0, height: "50%" },
                ].map((item, i) => (
                  <div
                    key={item.day}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                  >
                    <span className="text-[11px] font-sans text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.hours}h
                    </span>
                    <div
                      className={`w-full max-w-[40px] rounded-t-control transition-all duration-300 ${
                        i === 5
                          ? "bg-terracotta hover:bg-terracotta-hover"
                          : "bg-sage hover:bg-forest/80"
                      }`}
                      style={{ height: item.height }}
                    />
                    <span className="text-xs font-sans text-muted font-medium">
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Breakdown by Subject and PDF */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject Breakdown */}
            <div className="p-6 bg-surface border border-line rounded-card shadow-soft space-y-4">
              <h3 className="font-serif text-lg font-bold text-ink">
                Time by Course / Subject
              </h3>
              <div className="space-y-3">
                {DEMO_FOLDERS.map((folder) => (
                  <div key={folder.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-sans">
                      <span className="text-ink font-medium">{folder.name}</span>
                      <span className="text-muted">{folder.studyHours}</span>
                    </div>
                    <div className="w-full h-2 bg-paper rounded-full overflow-hidden border border-line">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: folder.color,
                          width: `${Math.random() * 50 + 30}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Breakdown */}
            <div className="p-6 bg-surface border border-line rounded-card shadow-soft space-y-4">
              <h3 className="font-serif text-lg font-bold text-ink">
                Most Read Documents
              </h3>
              <div className="space-y-3">
                {DEMO_DOCUMENTS.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2.5 bg-paper rounded-control border border-line text-xs font-sans"
                  >
                    <span className="font-medium text-ink truncate max-w-[240px]">
                      {doc.name}
                    </span>
                    <span className="text-terracotta font-semibold shrink-0">
                      {doc.studyMinutes} mins
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={BarChart2}
          accentNote="No tracking data yet"
          title="Study time will appear here"
          description="PDF Flux tracks active engagement only when a document is actively read on screen. Time pauses automatically when switching tabs or becoming inactive."
          actionText="Go to Library to Read"
          onAction={() => (window.location.href = "/library")}
        />
      )}
    </div>
  );
}
