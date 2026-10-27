"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Folder, FolderPlus, Clock, FileText, ArrowRight, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DEMO_FOLDERS } from "@/lib/demoData";

export default function FoldersPage() {
  const [folders, setFolders] = useState(DEMO_FOLDERS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setFolders((prev) => [
      ...prev,
      {
        id: `folder-${Date.now()}`,
        name: newFolderName.trim(),
        docCount: 0,
        studyHours: "0 hrs",
        color: "#E76F35",
      },
    ]);
    setNewFolderName("");
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Subject Folders"
        description="Organize your library by course, semester, or research topic."
        action={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-control font-sans text-sm font-medium flex items-center gap-2 shadow-sm transition-all duration-150 active:scale-95"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Folder</span>
          </button>
        }
      />

      {/* Folders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {folders.map((folder) => (
          <Link
            key={folder.id}
            href={`/folders/${folder.id}`}
            className="p-5 bg-surface hover:bg-surface/90 border border-line rounded-card shadow-soft transition-all duration-150 group block"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-10 h-10 rounded-control flex items-center justify-center text-white shadow-xs"
                style={{ backgroundColor: folder.color }}
              >
                <Folder className="w-5 h-5" />
              </div>
              <span className="text-xs font-sans text-muted bg-paper px-2.5 py-1 rounded-control border border-line">
                {folder.docCount} Documents
              </span>
            </div>

            <h3 className="font-serif text-xl font-bold text-ink group-hover:text-terracotta transition-colors mb-1">
              {folder.name}
            </h3>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-line text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {folder.studyHours} logged
              </span>
              <span className="text-terracotta font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                Open <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Create Folder Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateFolder}
            className="bg-surface border border-line rounded-card max-w-sm w-full p-6 shadow-soft space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-ink">
                Create Subject Folder
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-control text-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-sans font-medium text-muted mb-1.5">
                Folder Name
              </label>
              <input
                type="text"
                autoFocus
                required
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. Molecular Biology, Calculus II..."
                className="w-full px-3 py-2 bg-paper text-ink rounded-control text-sm border border-line focus:outline-none focus:border-terracotta"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-paper text-muted hover:text-ink rounded-control text-xs font-medium border border-line"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-control text-xs font-medium shadow-sm"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
