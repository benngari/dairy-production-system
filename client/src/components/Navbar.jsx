import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';

// The global "jump to Reports search" bar only makes sense on pages where
// it's actually wired to something. Add more paths here as search gets
// hooked up elsewhere — for now it only does anything useful on Reports.
const SEARCH_ENABLED_PATHS = ['/reports'];

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const showSearch = SEARCH_ENABLED_PATHS.some(path => location.pathname.startsWith(path));

  return (
    <nav className="bg-white shadow px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
      <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
        <button onClick={onMenuClick} className="lg:hidden text-gray-600 hover:text-gray-900 text-xl leading-none flex-shrink-0">
          ☰
        </button>
        <h2 className="text-lg sm:text-xl font-semibold text-green-700 flex-shrink-0">Dairy Pro</h2>
        {showSearch && (
          <div className="hidden md:block">
            <SearchBar />
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
        <button
          onClick={toggleDarkMode}
          className="text-lg hover:opacity-70 transition"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
        <span className="text-sm text-gray-700 hidden md:inline truncate max-w-[120px]">Welcome, {user?.name}</span>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hidden sm:inline">{user?.role}</span>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;