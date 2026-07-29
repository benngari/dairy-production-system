import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
  }

  return (
    <>
      {/* Backdrop — only shown on mobile when the drawer is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 h-full flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0
        `}
      >
        <div className="p-4 flex items-center justify-between border-b">
          <span className="text-xl font-bold text-green-700">Dairy System</span>
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700 text-xl leading-none">
            ✕
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-2 px-3 py-2 rounded-md transition ${isActive ? 'bg-green-100 text-green-800' : 'hover:bg-gray-100'}`
              }
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t text-xs text-gray-500">
          {user?.name} ({user?.role})
        </div>
      </aside>
    </>
  );
};

export default Sidebar;