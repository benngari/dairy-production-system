import React from 'react';

const Spinner = ({ label = 'Loading...' }) => (
  <div className="flex items-center justify-center gap-3 py-12 text-stone-500">
    <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
    <span className="text-sm">{label}</span>
  </div>
);

export default Spinner;