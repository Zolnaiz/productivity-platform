import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout: React.FC = () => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);

  // A page chosen from the menu is the page the person wants to see. On a
  // phone the drawer stayed over it until it was closed by hand.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Open, the drawer takes the keyboard: focus moves into it, Escape closes
  // it, and focus goes back to the button that opened it.
  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const opener = document.activeElement as HTMLElement | null;
    drawerRef.current?.querySelector<HTMLElement>('button, a[href]')?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      opener?.focus?.();
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar for mobile */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex">
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('common.menu')}
            className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-gray-800 pt-5 pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">{t('common.closeMenu')}</span>
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;