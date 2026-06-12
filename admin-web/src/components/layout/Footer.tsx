import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="px-6 py-4">
        <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {currentYear} Productivity Platform. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" href="/privacy">
              Privacy
            </a>
            <a className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" href="/terms">
              Terms
            </a>
            <a className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" href="/help">
              Help
            </a>
            <a className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" href="/contact">
              Contact
            </a>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-gray-500 md:text-left">
          Version v1.0.0 | Last updated: 2026-06-12
        </p>
      </div>
    </footer>
  );
};

export default Footer;
