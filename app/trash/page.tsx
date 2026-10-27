"use client";

import React, { useState } from "react";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  FileText,
  Folder,
  ShieldAlert,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

interface TrashedItem {
  id: string;
  name: string;
  type: "document" | "folder";
  deletedAt: string;
  size: string;
}

export default function TrashPage() {
  const [trashedItems, setTrashedItems] = useState<TrashedItem[]>([
    {
      id: "del-1",
      name: "Old Draft - Introduction to Microeconomics.pdf",
      type: "document",
      deletedAt: "Yesterday at 4:15 PM",
      size: "6.2 MB",
    },
    {
      id: "del-2",
      name: "Archived Notes 2025",
      type: "folder",
      deletedAt: "3 days ago",
      size: "14.1 MB",
    },
  ]);

  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const handleRestore = (id: string) => {
    setTrashedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePermanentDelete = (id: string) => {
    setTrashedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEmptyTrash = () => {
    setTrashedItems([]);
    setConfirmEmpty(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Recycle Bin"
        description="Documents and folders moved to Trash. Restore them anytime or permanently delete to free storage."
        action={
          trashedItems.length > 0 ? (
            <button
              onClick={() => setConfirmEmpty(true)}
              className="px-4 py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-control font-sans text-xs font-semibold border border-danger/30 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Trash</span>
            </button>
          ) : null
        }
      />

      {/* Safety Notice Banner */}
      <div className="p-4 bg-surface border border-line rounded-control flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div className="text-xs font-sans text-muted leading-relaxed">
          <strong className="text-ink font-semibold">Storage Safety:</strong>{" "}
          Items in the Recycle Bin retain their full annotations and notes. Once permanently deleted, their local IndexedDB storage space is reclaimed and cannot be recovered.
        </div>
      </div>

      {trashedItems.length > 0 ? (
        <div className="space-y-3">
          {trashedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 bg-surface border border-line rounded-control shadow-xs"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-control bg-paper flex items-center justify-center text-muted border border-line shrink-0">
                  {item.type === "document" ? (
                    <FileText className="w-5 h-5" />
                  ) : (
                    <Folder className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-sans text-sm font-semibold text-ink truncate">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                    <span>Deleted {item.deletedAt}</span>
                    <span>•</span>
                    <span>{item.size}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleRestore(item.id)}
                  className="px-3 py-1.5 bg-paper hover:bg-line text-ink rounded-control font-sans text-xs font-medium border border-line flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-success" />
                  <span>Restore</span>
                </button>
                <button
                  onClick={() => handlePermanentDelete(item.id)}
                  className="px-3 py-1.5 bg-danger/10 hover:bg-danger/20 text-danger rounded-control font-sans text-xs font-medium border border-danger/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Trash2}
          accentNote="Nothing in the bin"
          title="Recycle bin is empty"
          description="Deleted documents and folders will appear here before being permanently removed from your device storage."
        />
      )}

      {/* Confirmation Modal for Empty Trash */}
      {confirmEmpty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="bg-surface border border-line rounded-card max-w-sm w-full p-6 shadow-soft space-y-4">
            <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center border border-danger/20">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-serif text-xl font-bold text-ink">
                Empty Recycle Bin?
              </h3>
              <p className="font-sans text-xs text-muted mt-1 leading-relaxed">
                This will permanently delete all {trashedItems.length} items from your browser storage. This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmEmpty(false)}
                className="px-4 py-2 bg-paper text-muted hover:text-ink rounded-control text-xs font-medium border border-line"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                className="px-4 py-2 bg-danger hover:bg-danger/90 text-white rounded-control text-xs font-medium shadow-sm"
              >
                Permanently Empty
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
