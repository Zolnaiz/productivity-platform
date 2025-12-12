import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  Building,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  submenu?: MenuItem[];
}

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [activeMenu, setActiveMenu] = React.useState<string>('');

  const menuItems: MenuItem[] = [
    {
      icon: <Home className="w-5 h-5" />,
      label: 'Хянах самбар',
      path: '/dashboard',
    },
    {
      icon: <Building className="w-5 h-5" />,
      label: 'Байгууллагууд',
      path: '/organizations',
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Хэрэглэгчид',
      path: '/users',
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'Судалгаа',
      path: '/questionnaires',
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      label: 'Зардал',
      path: '/expenses',
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Тайлангууд',
      path: '/reports',
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'Тохиргоо',
      path: '/settings',
    },
  ];

  return (
    <aside
      className={`bg-gray-900 text-white transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {!collapsed && (
          <h2 className="text-lg font-bold">Продактивити Платформ</h2>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-gray-800"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-800 text-gray-300'
                  } ${collapsed ? 'justify-center' : 'space-x-3'}`
                }
                onClick={() => setActiveMenu(item.path)}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="flex-1">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {!collapsed && (
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">A</span>
            </div>
            <div>
              <p className="text-sm font-medium">Админ</p>
              <p className="text-xs text-gray-400">Супер админ</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;