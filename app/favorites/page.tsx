"use client";

import React, { useState } from "react";
import { Star, BookOpen } from "lucide-react";
import { DEMO_DOCUMENTS, DemoDocument } from "@/lib/demoData";
import { DocumentCard } from "@/components/shared/DocumentCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function FavoritesPage() {
  const [docs, setDocs] = useState<DemoDocument[]>(
    DEMO_DOCUMENTS.filter((d) => d.isFavorite)
  );

  const handleFavoriteToggle = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Starred Favorites"
        description="Quick access to your most essential research documents and active books."
      />

      {docs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {docs.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Star}
          accentNote="No favorites yet"
          title="Star your priority documents"
          description="Click the star icon on any document in your library to keep it pinned here for quick revision."
          actionText="Go to Library"
          onAction={() => (window.location.href = "/library")}
        />
      )}
    </div>
  );
}
