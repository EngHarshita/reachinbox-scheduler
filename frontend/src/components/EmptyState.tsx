import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-12 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-6">
      {/* PASS 8: Icon (64px = w-16 h-16) */}
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center shadow-xs">
        <Icon className="w-8 h-8 text-zinc-300" />
      </div>

      {/* PASS 8: Title (24px semibold = text-2xl font-semibold) - Spacing: 16px (mt-4) */}
      <h3 className="text-2xl font-semibold text-zinc-100 mt-4 tracking-tight">
        {title}
      </h3>

      {/* PASS 8: Description (16px = text-base) - Spacing: 16px (mt-4 / mb-6) */}
      <p className="text-base text-zinc-400 mt-4 max-w-md leading-relaxed">
        {description}
      </p>

      {/* PASS 8: Primary CTA - Spacing: 24px (mt-6) */}
      {action && (
        <div className="mt-6">
          {action.href ? (
            <a
              href={action.href}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-white transition-colors shadow-xs"
            >
              {action.label}
            </a>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-white transition-colors shadow-xs"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
