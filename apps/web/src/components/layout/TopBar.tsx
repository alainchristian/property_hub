import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

const routeTitles: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/properties':   'Properties',
  '/units':        'Units',
  '/tenants':      'Tenants',
  '/leases':       'Leases',
  '/payments':     'Payments',
  '/maintenance':  'Maintenance',
  '/vendors':      'Vendors',
  '/reports':      'Reports',
  '/portal':       'My Portal',
  '/workorders':   'Work Orders',
};

const roleLabels: Record<string, string> = {
  owner:   'Owner',
  manager: 'Manager',
  admin:   'Admin',
  tenant:  'Tenant',
  vendor:  'Vendor',
};

function getPageTitle(pathname: string): string {
  // Match the longest prefix
  const match = Object.keys(routeTitles)
    .filter((k) => pathname === k || pathname.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length)[0];
  return match ? routeTitles[match] : 'PropertyHub';
}

function initials(firstName?: string, lastName?: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export function TopBar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      {/* Page title */}
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification bell (placeholder) */}
        <button
          className="relative p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        {/* User info */}
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-white">
              {initials(user?.firstName, user?.lastName)}
            </span>
          </div>

          {/* Name + role */}
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-400">
              {roleLabels[user?.role ?? ''] ?? user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
