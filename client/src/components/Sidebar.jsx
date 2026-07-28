import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
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
  if (user?.role === 'Administrator') {
    links.push({ to: '/settings', label: 'Settings', icon: '⚙️' });
    links.push({ to: '/users', label: 'User Management', icon: '👥' });
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 text-xl font-bold text-green-700 border-b">Dairy System</div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
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
  );
};

export default Sidebar;