import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  accentNote?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  accentNote,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center max-w-md mx-auto my-8 bg-surface rounded-card border border-line shadow-soft animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-paper flex items-center justify-center text-terracotta border border-line mb-4">
        <Icon className="w-8 h-8 stroke-[1.75]" />
      </div>

      {accentNote && (
        <span className="font-hand text-terracotta text-base mb-1 font-semibold">
          {accentNote}
        </span>
      )}

      <h3 className="font-serif text-xl font-bold text-ink mb-2">{title}</h3>

      <p className="font-sans text-xs sm:text-sm text-muted mb-6 leading-relaxed">
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-terracotta hover:bg-terracotta-hover text-white rounded-control font-sans text-sm font-medium shadow-sm transition-all duration-150 active:scale-95"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
