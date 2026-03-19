import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ClipboardList, Truck, Package, Users, Building2,
  Receipt, BarChart3, Map, LogOut, Zap, ChevronRight, TruckIcon, UserCheck
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/rfq', label: 'RFQ Indenting', icon: ClipboardList },
  { to: '/shipments', label: 'Shipments', icon: Package },
  { to: '/fleet', label: 'Fleet', icon: TruckIcon },
  { to: '/drivers', label: 'Drivers', icon: UserCheck },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
  { to: '/routes', label: 'Routes', icon: Map },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const ADMIN_ITEMS = [
  { to: '/users', label: 'Users', icon: Users },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
    ${isActive
      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`;

  return (
    <aside className="w-60 flex-shrink-0 h-screen sticky top-0 flex flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-zinc-950 fill-zinc-950" />
          </div>
          <div>
            <p className="font-display font-800 text-base text-zinc-100 leading-none">HaulSync</p>
            <p className="text-xs text-zinc-500 mt-0.5">Logistics OS</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-3 py-1 text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-2">Operations</p>
        {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
          <NavLink key={to} to={to} end={exact} className={linkClass}>
            <Icon size={16} className="flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}

        {isAdmin() && (
          <>
            <p className="px-3 py-1 text-xs font-semibold text-zinc-600 uppercase tracking-wider mt-4 mb-2">Admin</p>
            {ADMIN_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClass}>
                <Icon size={16} className="flex-shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-900">
          <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-amber-400">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">{user?.name}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button onClick={handleLogout} className="text-zinc-500 hover:text-red-400 transition-colors p-1 rounded">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
