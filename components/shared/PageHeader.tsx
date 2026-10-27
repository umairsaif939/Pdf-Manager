import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-6 border-b border-line">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink">
          {title}
        </h1>
        {description && (
          <p className="font-sans text-sm text-muted mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
