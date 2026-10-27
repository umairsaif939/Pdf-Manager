"use client";

import React, { use } from "react";
import Link from "next/link";
import { ArrowLeft, Folder, Plus, BookOpen, Clock } from "lucide-react";
import { DEMO_DOCUMENTS, DEMO_FOLDERS } from "@/lib/demoData";
import { DocumentCard } from "@/components/shared/DocumentCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function FolderDetailPage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const resolvedParams = use(params);
  const folderId = resolvedParams.folderId;

  const folder = DEMO_FOLDERS.find((f) => f.id === folderId) || {
    id: folderId,
    name: "Course Subject",
    docCount: 0,
    studyHours: "0 hrs",
    color: "#E76F35",
  };

  const docsInFolder = DEMO_DOCUMENTS.filter(
    (d) => d.folder.toLowerCase() === folder.name.toLowerCase()
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href="/folders"
        className="inline-flex items-center gap-1.5 text-xs font-sans text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to all folders</span>
      </Link>

      <PageHeader
        title={folder.name}
        description={`${folder.docCount} documents organized in this course • ${folder.studyHours} study time`}
        action={
          <Link
            href="/library"
            className="px-4 py-2 bg-paper hover:bg-line text-ink rounded-control font-sans text-xs font-medium border border-line transition-colors"
          >
            Move PDFs Here
          </Link>
        }
      />

      {docsInFolder.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {docsInFolder.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Folder}
          accentNote="Empty Folder"
          title={`No documents in ${folder.name}`}
          description="Assign PDFs from your library to this subject folder to keep your coursework together."
          actionText="Browse Library"
          onAction={() => (window.location.href = "/library")}
        />
      )}
    </div>
  );
}
