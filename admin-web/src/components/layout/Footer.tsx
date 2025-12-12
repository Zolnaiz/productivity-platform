import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} Продактивити Платформ. Бүх эрх хуулиар хамгаалагдсан.
            </p>
          </div>
          
          <div className="flex space-x-6">
            <a
              href="/privacy"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Нууцлалын бодлого
            </a>
            <a
              href="/terms"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Үйлчилгээний нөхцөл
            </a>
            <a
              href="/help"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Тусламж
            </a>
            <a
              href="/contact"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Холбоо барих
            </a>
          </div>
        </div>
        
        <div className="mt-4 text-center md:text-left">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Системийн хувилбар: v1.0.0 | Сүүлийн шинэчлэл: 2024-03-15
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;