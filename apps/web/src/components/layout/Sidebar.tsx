import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  FileText,
  CreditCard,
  Wrench,
  HardHat,
  BarChart3,
  Home,
  ClipboardList,
  LogOut,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { clsx } from 'clsx';

const navByRole = {
  owner: [
    { label: 'Dashboard',   icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Properties',  icon: Building2,       to: '/properties' },
    { label: 'Units',       icon: DoorOpen,        to: '/units' },
    { label: 'Tenants',     icon: Users,           to: '/tenants' },
    { label: 'Leases',      icon: FileText,        to: '/leases' },
    { label: 'Payments',    icon: CreditCard,      to: '/payments' },
    { label: 'Maintenance', icon: Wrench,          to: '/maintenance' },
    { label: 'Vendors',     icon: HardHat,         to: '/vendors' },
    { label: 'Documents',   icon: FolderOpen,      to: '/documents' },
    { label: 'Reports',     icon: BarChart3,       to: '/reports' },
  ],
  manager: [
    { label: 'Dashboard',   icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Properties',  icon: Building2,       to: '/properties' },
    { label: 'Units',       icon: DoorOpen,        to: '/units' },
    { label: 'Tenants',     icon: Users,           to: '/tenants' },
    { label: 'Leases',      icon: FileText,        to: '/leases' },
    { label: 'Payments',    icon: CreditCard,      to: '/payments' },
    { label: 'Maintenance', icon: Wrench,          to: '/maintenance' },
    { label: 'Vendors',     icon: HardHat,         to: '/vendors' },
    { label: 'Documents',   icon: FolderOpen,      to: '/documents' },
  ],
  admin: [
    { label: 'Dashboard',   icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Properties',  icon: Building2,       to: '/properties' },
    { label: 'Units',       icon: DoorOpen,        to: '/units' },
    { label: 'Tenants',     icon: Users,           to: '/tenants' },
    { label: 'Leases',      icon: FileText,        to: '/leases' },
    { label: 'Payments',    icon: CreditCard,      to: '/payments' },
    { label: 'Maintenance', icon: Wrench,          to: '/maintenance' },
    { label: 'Vendors',     icon: HardHat,         to: '/vendors' },
    { label: 'Documents',   icon: FolderOpen,      to: '/documents' },
    { label: 'Reports',     icon: BarChart3,       to: '/reports' },
  ],
  tenant: [
    { label: 'My Portal',   icon: Home,            to: '/portal' },
  ],
  vendor: [
    { label: 'Work Orders', icon: ClipboardList,   to: '/workorders' },
  ],
};

// ── Section dividers (appear before these labels) ────────────────────────────
const DIVIDER_BEFORE = new Set(['Payments', 'Reports', 'My Portal', 'Work Orders']);

export function Sidebar() {
  const { user, logout } = useAuth();
  const role      = user?.role ?? 'tenant';
  const navItems  = navByRole[role as keyof typeof navByRole] ?? [];
  const initials  = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <aside className="w-56 flex flex-col bg-sidebar h-screen sticky top-0 shrink-0">
      {/* ── Wordmark ─────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4">
        <span className="font-display text-lg font-bold tracking-tight text-white leading-none">
          Property<span className="text-brand-400">Hub</span>
        </span>
      </div>

      {/* ── Nav ──────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {navItems.map((item) => (
          <div key={item.to}>
            {DIVIDER_BEFORE.has(item.label) && (
              <div className="mx-3 my-2 h-px bg-sidebar-border" />
            )}
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-active text-sidebar-text-active'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-slate-100',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={16}
                    className={clsx(
                      'shrink-0 transition-colors',
                      isActive ? 'text-sidebar-text-active' : 'text-sidebar-text group-hover:text-slate-300',
                    )}
                    aria-hidden="true"
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          </div>
        ))}
      </nav>

      {/* ── User + Logout ─────────────────────────────── */}
      <div className="border-t border-sidebar-border px-3 py-3 flex items-center gap-2.5">
        {/* Avatar initials */}
        <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-2xs font-semibold text-white shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-200 leading-none truncate">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-2xs text-sidebar-text truncate capitalize">{role}</p>
        </div>
        <button
          onClick={logout}
          className="p-1.5 rounded-md text-sidebar-text hover:text-slate-100 hover:bg-sidebar-hover transition-colors"
          aria-label="Sign out"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
