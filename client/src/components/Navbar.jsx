import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-semibold text-green-700">Dairy Pro</h2>
        <SearchBar />
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{user?.role}</span>
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