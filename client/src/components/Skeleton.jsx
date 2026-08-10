import React from 'react';

// A single pulsing gray placeholder block. Compose these to build
// page-specific skeleton layouts that mirror the real content's shape.
const Skeleton = ({ className = '' }) => (
  <div className={`bg-stone-200 rounded animate-pulse ${className}`} />
);

export default Skeleton;