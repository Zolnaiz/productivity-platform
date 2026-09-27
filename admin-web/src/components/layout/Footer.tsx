import React from 'react';

/**
 * The product's name and the year.
 *
 * It carried links to privacy, terms, help and contact pages that do not
 * exist - four ways off every page to nowhere - and a version and date typed
 * in by hand in June that nothing kept current. They come back when there is
 * something for them to point at.
 */
const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="px-6 py-4">
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 md:text-left">
          © {currentYear} Productivity Platform
        </p>
      </div>
    </footer>
  );
};

export default Footer;
