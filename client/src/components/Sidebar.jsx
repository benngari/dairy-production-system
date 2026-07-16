import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiBookOpen,
  FiCpu,
  FiPackage,
  FiClock,
  FiBarChart2,
  FiSettings,
  FiUsers,
  FiDroplet,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: FiGrid, roles: null },
  { to: '/recipes', label: 'Formula Builder', icon: FiBookOpen, roles: ['Administrator', 'Manager'] },
  { to: '/calculator', label: 'Production Calculator', icon: FiCpu, roles: ['Administrator', 'Manager', 'Production Operator'] },
  { to: '/inventory', label: 'Inventory', icon: FiPackage, roles: ['Administrator', 'Manager', 'Store Keeper'] },
  { to: '/production-history', label: 'Production History', icon: FiClock, roles: null },
  { to: '/reports', label: 'Reports', icon: FiBarChart2, roles: null },
  { to: '/users', label: 'Users', icon: FiUsers, roles: ['Administrator'] },
  { to: '/settings', label: 'Settings', icon: FiSettings, roles: ['Administrator', 'Manager'] },
];

const Sidebar = ({ open, setOpen }) => {
  const { hasRole } = useAuth();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />
      )}
      <aside
        className={`fixed z-40 inset-y-0 left-0 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 px-6 h-16 border-b border-slate-100">
          <div className="rounded-lg bg-primary-500 p-2 text-white">
            <FiDroplet size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-800 leading-tight">DairyFlow</p>
            <p className="text-[11px] text-slate-400 leading-tight">Formula Management</p>
          </div>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
          {navItems.map((item) => {
            if (item.roles && !hasRole(...item.roles)) return null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
