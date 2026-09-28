import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { notificationService } from "../../services/notification.service";
import { currentPage, visibleSections } from "./navigation";

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  /**
   * How many things somebody has been told and not read.
   *
   * On the navigation rather than only on the page, because a notification
   * that has to be gone looking for is not a notification — it is the list it
   * replaced. Failing to load it shows nothing rather than a zero: a count
   * that is wrong is worse than a count that is absent.
   */
  const [unread, setUnread] = React.useState(0);

  React.useEffect(() => {
    let active = true;

    notificationService
      .unreadCount()
      .then((result) => active && setUnread(result.unread))
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);
  const { t } = useTranslation();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const sections = visibleSections(user?.roles || []);
  const here = currentPage(pathname, sections)?.section.id;

  return (
    <aside
      className={`flex min-h-screen flex-col bg-gray-900 text-white transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between border-b border-gray-800 p-4">
        {!collapsed && (
          <h2 className="text-lg font-bold">Productivity Platform</h2>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? t("nav.expand") : t("nav.collapse")}
          className="rounded-lg p-2 hover:bg-gray-800"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4" aria-label={t("nav.main")}>
        <ul className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const active = section.id === here;
            return (
              <li key={section.id}>
                <Link
                  to={section.pages[0].path}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center rounded-lg p-3 transition-colors ${
                    active ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"
                  } ${collapsed ? "justify-center" : "space-x-3"}`}
                  title={collapsed ? t(section.labelKey) : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="flex-1">{t(section.labelKey)}</span>}
                  {section.id === "notifications" && unread > 0 && (
                    <span
                      className="ml-auto rounded-full bg-blue-500 px-2 py-0.5 text-xs font-semibold text-white"
                      aria-label={t("nav.unread", { count: unread })}
                    >
                      {unread}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center space-x-3">
            {/* Who is signed in. It said "Admin, Workspace owner" to everybody,
                which on a shared shift computer is the one thing it must not get wrong. */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
              <span className="text-sm font-bold">{(user?.name || user?.email || '?').charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" data-testid="sidebar-user">
                {user?.name || user?.email}
              </p>
              {user?.roles?.[0] && (
                <p className="text-xs text-gray-400">{t(`users.roles.${user.roles[0]}`)}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
