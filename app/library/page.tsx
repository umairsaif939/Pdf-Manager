"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutGrid,
  List,
  Search,
  Plus,
  BookOpen,
  ArrowUpDown,
  Star,
} from "lucide-react";
import { DocumentCard } from "@/components/shared/DocumentCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ImportModal } from "@/components/shared/ImportModal";
import {
  getActiveDocuments,
  toggleFavorite,
  deleteDocument,
} from "@/lib/storage/documentService";
import { DbDocument } from "@/lib/storage/db";

export default function LibraryPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "lastOpened" | "size">("lastOpened");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [docs, setDocs] = useState<DbDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const active = await getActiveDocuments();
      setDocs(active);
    } catch (err) {
      console.error("Failed to load documents from IndexedDB:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();

    const handleDocsChanged = () => {
      loadDocs();
    };

    window.addEventListener("pdf-flux-documents-changed", handleDocsChanged);
    return () => {
      window.removeEventListener("pdf-flux-documents-changed", handleDocsChanged);
    };
  }, []);

  const handleFavoriteToggle = async (id: string) => {
    await toggleFavorite(id);
    loadDocs();
  };

  const handleDeleteClick = async (id: string) => {
    await deleteDocument(id, false); // soft delete to trash
    loadDocs();
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Filtered and sorted documents
  const filteredDocs = docs
    .filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFavorite = !onlyFavorites || doc.isFavorite;
      return matchesSearch && matchesFavorite;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "size") return b.sizeBytes - a.sizeBytes;
      return b.lastOpenedAt - a.lastOpenedAt;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => loadDocs()}
      />

      <PageHeader
        title="Document Library"
        description="Browse, organize, and search all your local study materials."
        action={
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-control font-sans text-sm font-medium flex items-center gap-2 shadow-sm transition-all duration-150 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Import PDF</span>
          </button>
        }
      />

      {/* Control Bar: Search + Filters + View Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-surface border border-line rounded-control shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by title..."
            className="w-full pl-9 pr-3 py-2 bg-paper text-ink rounded-control text-xs sm:text-sm border border-line placeholder:text-muted focus:outline-none focus:border-terracotta transition-colors"
          />
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Favorites Only Toggle */}
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`px-3 py-2 rounded-control text-xs font-sans font-medium flex items-center gap-1.5 border transition-colors ${
              onlyFavorites
                ? "bg-warning/10 text-warning border-warning/30 font-semibold"
                : "bg-paper text-muted border-line hover:text-ink"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyFavorites ? "fill-warning" : ""}`} />
            <span>Favorites</span>
          </button>

          {/* Sort Menu */}
          <div className="flex items-center gap-1 px-2 py-1.5 bg-paper rounded-control border border-line text-xs text-muted">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-ink focus:outline-none text-xs"
            >
              <option value="lastOpened">Recent</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
            </select>
          </div>

          {/* Grid / List View Toggle */}
          <div className="flex items-center p-1 bg-paper rounded-control border border-line">
            <button
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-surface text-ink shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              aria-label="List view"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-surface text-ink shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Document List / Grid */}
      {filteredDocs.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-2.5"
          }
        >
          {filteredDocs.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={{
                id: doc.id,
                name: doc.name,
                pageCount: doc.pageCount,
                lastReadPage: doc.lastReadPage,
                size: formatSize(doc.sizeBytes),
                lastOpened: new Date(doc.lastOpenedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                folder: "Local Storage",
                isFavorite: doc.isFavorite,
                studyMinutes: 0,
              }}
              viewMode={viewMode}
              onFavoriteToggle={handleFavoriteToggle}
              onDeleteClick={handleDeleteClick}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          accentNote={searchQuery ? "No matches found" : "Clean Library"}
          title={searchQuery ? "No documents match your search" : "Your library is empty"}
          description={
            searchQuery
              ? `We couldn't find any documents matching "${searchQuery}". Try clearing your search.`
              : "Import a PDF file from your device to begin reading and studying."
          }
          actionText={searchQuery ? "Clear Search" : "Import PDF"}
          onAction={() => {
            if (searchQuery) setSearchQuery("");
            else setIsImportModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
