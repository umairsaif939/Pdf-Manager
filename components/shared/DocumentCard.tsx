"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  Star,
  MoreVertical,
  BookOpen,
  Folder,
  Trash2,
  Clock,
} from "lucide-react";
import { DemoDocument } from "@/lib/demoData";

interface DocumentCardProps {
  doc: DemoDocument;
  viewMode?: "grid" | "list";
  onFavoriteToggle?: (id: string) => void;
  onDeleteClick?: (id: string) => void;
}

export function DocumentCard({
  doc,
  viewMode = "grid",
  onFavoriteToggle,
  onDeleteClick,
}: DocumentCardProps) {
  const percentRead = Math.round((doc.lastReadPage / doc.pageCount) * 100);

  if (viewMode === "list") {
    return (
      <div className="flex items-center justify-between p-3.5 bg-surface hover:bg-surface/90 border border-line rounded-control transition-all duration-150 group">
        <Link
          href={`/reader/${doc.id}`}
          className="flex items-center gap-3.5 flex-1 min-w-0"
        >
          <div className="w-10 h-10 rounded-control bg-paper flex items-center justify-center text-terracotta border border-line shrink-0 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-sans text-sm font-semibold text-ink truncate group-hover:text-terracotta transition-colors">
              {doc.name}
            </h4>
            <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
              <span>{doc.folder}</span>
              <span>•</span>
              <span>{doc.size}</span>
              <span>•</span>
              <span>Page {doc.lastReadPage} of {doc.pageCount} ({percentRead}%)</span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onFavoriteToggle?.(doc.id)}
            aria-label={doc.isFavorite ? "Remove favorite" : "Add to favorites"}
            className="p-1.5 text-muted hover:text-warning rounded-control transition-colors"
          >
            <Star
              className={`w-4 h-4 ${
                doc.isFavorite ? "fill-warning text-warning" : ""
              }`}
            />
          </button>
          <Link
            href={`/reader/${doc.id}`}
            className="px-3 py-1.5 bg-paper hover:bg-line text-ink rounded-control font-sans text-xs font-medium border border-line transition-colors"
          >
            Read
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between p-4 bg-surface hover:bg-surface/90 border border-line rounded-card shadow-soft transition-all duration-150 group">
      <div>
        {/* Card Header: Icon + Favorite */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-11 h-11 rounded-control bg-paper flex items-center justify-center text-terracotta border border-line group-hover:scale-105 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <button
            onClick={() => onFavoriteToggle?.(doc.id)}
            aria-label={doc.isFavorite ? "Remove favorite" : "Add to favorites"}
            className="p-1.5 text-muted hover:text-warning rounded-control transition-colors"
          >
            <Star
              className={`w-4 h-4 ${
                doc.isFavorite ? "fill-warning text-warning" : ""
              }`}
            />
          </button>
        </div>

        {/* Title */}
        <Link href={`/reader/${doc.id}`}>
          <h4 className="font-serif text-base font-bold text-ink line-clamp-2 group-hover:text-terracotta transition-colors mb-2">
            {doc.name}
          </h4>
        </Link>

        {/* Folder Tag */}
        <div className="flex items-center gap-1.5 text-xs text-muted mb-4">
          <Folder className="w-3.5 h-3.5 text-muted" />
          <span className="font-sans font-medium">{doc.folder}</span>
        </div>
      </div>

      <div>
        {/* Progress bar */}
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-[11px] font-sans text-muted">
            <span>Pg {doc.lastReadPage} / {doc.pageCount}</span>
            <span>{percentRead}%</span>
          </div>
          <div className="w-full h-1.5 bg-paper rounded-full overflow-hidden border border-line">
            <div
              className="h-full bg-terracotta rounded-full transition-all duration-300"
              style={{ width: `${percentRead}%` }}
            />
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-2 border-t border-line flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{doc.lastOpened}</span>
          </div>
          <Link
            href={`/reader/${doc.id}`}
            className="text-terracotta hover:text-terracotta-hover font-semibold flex items-center gap-1 text-xs"
          >
            Open →
          </Link>
        </div>
      </div>
    </div>
  );
}
