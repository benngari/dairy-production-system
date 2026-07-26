import React from 'react';

// Simple checkbox-list multi-select, styled to match the rest of the app's
// bordered inputs. `options` is an array of strings, `selected` is an array
// of currently-chosen strings, `onChange` receives the new array.
const MultiSelect = ({ label, options, selected, onChange, hint }) => {
  const toggle = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter(o => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <div className="border rounded p-2 max-h-40 overflow-y-auto space-y-1 bg-white">
        {options.map(option => (
          <label key={option} className="flex items-center space-x-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggle(option)}
              className="rounded"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.map(s => (
            <span key={s} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
              {s}
              <button type="button" onClick={() => toggle(s)} className="ml-1 text-green-800 hover:text-red-600">×</button>
            </span>
          ))}
        </div>
      )}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
};

export default MultiSelect;