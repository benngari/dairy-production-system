import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiSearch, FiLogOut, FiUser, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Badge from './Badge';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (value) => {
    setQuery(value);
    clearTimeout(timeoutRef.current);
    if (!value.trim()) {
      setResults(null);
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/search', { params: { q: value } });
        setResults(data.results);
        setShowResults(true);
      } catch (err) {
        // silent fail on search
      }
    }, 300);
  };

  const flatResults = results
    ? [
        ...results.recipes.map((r) => ({ type: 'Recipe', label: r.name, to: `/recipes` })),
        ...results.ingredients.map((i) => ({ type: 'Ingredient', label: i.name, to: `/inventory` })),
        ...results.productions.map((p) => ({ type: 'Batch', label: p.batchNumber, to: `/production-history` })),
        ...results.users.map((u) => ({ type: 'User', label: u.name, to: `/users` })),
      ]
    : [];

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
      <button className="lg:hidden text-slate-500" onClick={onMenuClick}>
        <FiMenu size={22} />
      </button>

      <div ref={searchRef} className="relative flex-1 max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          className="input pl-9"
          placeholder="Search ingredients, recipes, batches..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query && setShowResults(true)}
        />
        {showResults && flatResults.length > 0 && (
          <div className="absolute mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-80 overflow-y-auto">
            {flatResults.map((r, i) => (
              <button
                key={i}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => {
                  navigate(r.to);
                  setShowResults(false);
                  setQuery('');
                }}
              >
                <span>{r.label}</span>
                <span className="text-xs text-slate-400">{r.type}</span>
              </button>
            ))}
          </div>
        )}
        {showResults && query && flatResults.length === 0 && (
          <div className="absolute mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg px-4 py-3 text-sm text-slate-400">
            No results found
          </div>
        )}
      </div>

      <div className="ml-auto relative">
        <button
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-slate-700 leading-tight">{user?.name}</p>
            <p className="text-[11px] text-slate-400 leading-tight">{user?.role}</p>
          </div>
          <FiChevronDown className="text-slate-400" size={16} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-52 rounded-lg border border-slate-200 bg-white shadow-lg py-1 z-30">
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-700">{user?.name}</p>
              <Badge>{user?.role}</Badge>
            </div>
            <button
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              onClick={() => {
                navigate('/profile');
                setMenuOpen(false);
              }}
            >
              <FiUser size={16} /> My Profile
            </button>
            <button
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50"
              onClick={logout}
            >
              <FiLogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
