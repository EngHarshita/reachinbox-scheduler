import React from 'react';

export const SkeletonRow: React.FC = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3">
      <div className="h-3.5 bg-zinc-800 rounded w-36"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-3.5 bg-zinc-800 rounded w-48"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-3.5 bg-zinc-800/60 rounded w-28"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-3.5 bg-zinc-800/80 rounded w-16"></div>
    </td>
    <td className="px-4 py-3 text-right">
      <div className="h-3.5 bg-zinc-800/40 rounded w-8 ml-auto"></div>
    </td>
  </tr>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden shadow-xs">
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-zinc-950 border-b border-zinc-800">
          <tr>
            <th className="px-4 py-2.5"><div className="h-3 bg-zinc-800/80 rounded w-16"></div></th>
            <th className="px-4 py-2.5"><div className="h-3 bg-zinc-800/80 rounded w-20"></div></th>
            <th className="px-4 py-2.5"><div className="h-3 bg-zinc-800/80 rounded w-24"></div></th>
            <th className="px-4 py-2.5"><div className="h-3 bg-zinc-800/80 rounded w-14"></div></th>
            <th className="px-4 py-2.5 text-right"><div className="h-3 bg-zinc-800/80 rounded w-12 ml-auto"></div></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const SkeletonCard: React.FC = () => (
  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 animate-pulse space-y-3">
    <div className="flex items-center justify-between">
      <div className="h-3.5 bg-zinc-800 rounded w-28"></div>
      <div className="h-4 bg-zinc-800/60 rounded w-4"></div>
    </div>
    <div className="h-6 bg-zinc-800/80 rounded w-16"></div>
  </div>
);
