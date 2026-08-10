import React from 'react';
import Skeleton from './Skeleton';

// Mirrors the real Dashboard's layout so the page doesn't visually "jump"
// once real data loads in — same card grid, same chart/alerts split, same
// two tables at the bottom.
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-40" />

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[0, 1, 2].map(i => (
        <div key={i} className="app-card">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>

    <div>
      <Skeleton className="h-4 w-56 mb-3" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="app-card">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-5 w-14" />
          </div>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="app-card">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
      <div className="app-card">
        <Skeleton className="h-4 w-28 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    </div>

    <div className="app-card">
      <Skeleton className="h-4 w-32 mb-3" />
      <div className="space-y-2">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-9 w-full" />)}
      </div>
    </div>

    <div className="app-card">
      <Skeleton className="h-4 w-28 mb-3" />
      <div className="space-y-2">
        {[0, 1, 2].map(i => <Skeleton key={i} className="h-9 w-full" />)}
      </div>
    </div>
  </div>
);

export default DashboardSkeleton;