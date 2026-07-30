import React from 'react';

const EmptyState = ({ icon = '🥛', title = 'Nothing here yet', subtitle }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center text-2xl mb-3">
      {icon}
    </div>
    <p className="font-medium text-stone-700">{title}</p>
    {subtitle && <p className="text-sm text-stone-400 mt-1 max-w-xs">{subtitle}</p>}
  </div>
);

export default EmptyState;