import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/reports?search=${query}`);
    toast.info(`Searching for "${query}"`);
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search recipes, ingredients, batches..."
        className="border border-gray-300 rounded-l px-3 py-1 w-60 focus:outline-none focus:ring-1 focus:ring-green-500"
      />
      <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded-r hover:bg-green-700">
        🔍
      </button>
    </form>
  );
};

export default SearchBar;