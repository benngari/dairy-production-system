import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LOGO_URL = 'https://res.cloudinary.com/dd4b2ssdy/image/upload/v1785325104/c3f881d8-9577-42c8-a9e3-6deaa4561b4b_fq4ouo.png';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const links = [
    { to: '/', label: 'Dashboard', icon: '📊' },
    { to: '/formula-builder', label: 'Formula Builder', icon: '📝' },
    { to: '/production', label: 'Production Calculator', icon: '🧮' },
    { to: '/inventory', label: 'Inventory', icon: '📦' },
    { to: '/packaging', label: 'Packaging', icon: '🧴' },
    { to: '/profit', label: 'Profit Calculator', icon: '💰' },
    { to: '/reports', label: 'Reports', icon: '📈' },
  ];
  if (user?.role === 'Administrator' || user?.role === 'Manager') {
    links.push({ to: '/settings', label: 'Settings', icon: '⚙️' });
  }
  if (user?.role === 'Administrator') {
    links.push({ to: '/users', label: 'User Management', icon: '👥' });
    links.push({ to: '/audit-log', label: 'Audit Log', icon: '📜' });
    links.push({ to: '/trash', label: 'Trash', icon: '🗑️' });
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-stone-200 h-full flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0
        `}
      >
        <div className="px-4 py-5 flex items-center justify-between border-b border-stone-100">
          <div className="flex items-center space-x-2.5">
            <img src={LOGO_URL} alt="KALRO" className="h-9 w-auto" />
            <div className="leading-tight">
              <div className="text-base font-bold text-green-800">Dairy System</div>
              <div className="text-[11px] text-stone-400">Yoghurt & Mala Production</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-stone-400 hover:text-stone-600 text-xl leading-none">
            ✕
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition border-l-[3px] ${
                  isActive
                    ? 'bg-green-50 text-green-800 font-medium border-green-600'
                    : 'text-stone-600 hover:bg-stone-50 border-transparent'
                }`
              }
            >
              <span className="text-base">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3.5 border-t border-stone-100 flex items-center space-x-2">
          <div className="w-7 h-7 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="text-xs text-stone-500 truncate">
            {user?.name} <span className="text-stone-400">· {user?.role}</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;