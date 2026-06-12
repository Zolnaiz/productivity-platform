import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  Briefcase,
  Building,
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Columns3,
  Download,
  FileCheck2,
  FileText,
  Home,
  Landmark,
  LayoutDashboard,
  LineChart,
  Settings,
  ShieldCheck,
  StickyNote,
  Target,
  Trophy,
  Users,
} from 'lucide-react';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  group: 'Work' | 'Quality' | 'People' | 'Reports' | 'Personal' | 'Admin';
}

const menuItems: MenuItem[] = [
  { icon: <Home className="h-5 w-5" />, label: 'Dashboard', path: '/dashboard', group: 'Work' },
  { icon: <Briefcase className="h-5 w-5" />, label: 'Projects', path: '/projects', group: 'Work' },
  { icon: <CheckSquare className="h-5 w-5" />, label: 'Tasks', path: '/tasks', group: 'Work' },
  { icon: <Columns3 className="h-5 w-5" />, label: 'Kanban', path: '/kanban', group: 'Work' },
  { icon: <CalendarDays className="h-5 w-5" />, label: 'Calendar', path: '/calendar', group: 'Work' },
  { icon: <Clock className="h-5 w-5" />, label: 'Work Logs', path: '/work-logs', group: 'Work' },
  { icon: <ClipboardCheck className="h-5 w-5" />, label: '5S / Audits', path: '/fives', group: 'Quality' },
  { icon: <FileText className="h-5 w-5" />, label: 'Questionnaires', path: '/questionnaires', group: 'Quality' },
  { icon: <FileCheck2 className="h-5 w-5" />, label: 'Responses', path: '/responses', group: 'Quality' },
  { icon: <Users className="h-5 w-5" />, label: 'Users', path: '/users', group: 'People' },
  { icon: <Building className="h-5 w-5" />, label: 'Departments', path: '/departments', group: 'People' },
  { icon: <BarChart3 className="h-5 w-5" />, label: 'Reports', path: '/reports', group: 'Reports' },
  { icon: <LineChart className="h-5 w-5" />, label: 'Analytics', path: '/analytics', group: 'Reports' },
  { icon: <Landmark className="h-5 w-5" />, label: 'Expenses', path: '/expenses', group: 'Reports' },
  { icon: <Bell className="h-5 w-5" />, label: 'Notifications', path: '/notifications', group: 'Reports' },
  { icon: <Download className="h-5 w-5" />, label: 'Export', path: '/export', group: 'Reports' },
  { icon: <Target className="h-5 w-5" />, label: 'Goals', path: '/goals', group: 'Personal' },
  { icon: <StickyNote className="h-5 w-5" />, label: 'Notes', path: '/notes', group: 'Personal' },
  { icon: <Trophy className="h-5 w-5" />, label: 'Badges', path: '/badges', group: 'Personal' },
  { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Admin', path: '/admin', group: 'Admin' },
  { icon: <Building className="h-5 w-5" />, label: 'Organizations', path: '/organizations', group: 'Admin' },
  { icon: <ShieldCheck className="h-5 w-5" />, label: 'Audit Log', path: '/audit', group: 'Admin' },
  { icon: <Settings className="h-5 w-5" />, label: 'Settings', path: '/settings', group: 'Admin' },
];

const groups: MenuItem['group'][] = ['Work', 'Quality', 'People', 'Reports', 'Personal', 'Admin'];

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={`flex min-h-screen flex-col bg-gray-900 text-white transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between border-b border-gray-800 p-4">
        {!collapsed && <h2 className="text-lg font-bold">Productivity Platform</h2>}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-2 hover:bg-gray-800"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group}>
              {!collapsed && (
                <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  {group}
                </div>
              )}
              <ul className="space-y-1">
                {menuItems
                  .filter((item) => item.group === group)
                  .map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center rounded-lg p-3 transition-colors ${
                            isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                          } ${collapsed ? 'justify-center' : 'space-x-3'}`
                        }
                        title={collapsed ? item.label : undefined}
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        {!collapsed && <span className="flex-1">{item.label}</span>}
                      </NavLink>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {!collapsed && (
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
              <span className="text-sm font-bold">A</span>
            </div>
            <div>
              <p className="text-sm font-medium">Admin</p>
              <p className="text-xs text-gray-400">Workspace owner</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
