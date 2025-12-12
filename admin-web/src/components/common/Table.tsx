import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  selectedRow?: T | null;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
}

function Table<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Мэдээлэл олдсонгүй',
  onRowClick,
  selectedRow,
  pagination,
}: TableProps<T>) {
  const renderCell = (item: T, column: Column<T>) => {
    if (column.render) {
      return column.render(item);
    }
    return item[column.key] || '-';
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination!.totalPages) return;
    pagination!.onPageChange(page);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                  column.className || ''
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
              >
                <div className="flex justify-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">📭</span>
                  </div>
                  <p className="text-lg font-medium">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={index}
                onClick={() => onRowClick?.(item)}
                className={`
                  transition-colors hover:bg-gray-50 dark:hover:bg-gray-800
                  ${onRowClick ? 'cursor-pointer' : ''}
                  ${selectedRow === item ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
              >
                {columns.map((column) => (
                  <td
                    key={`${index}-${column.key}`}
                    className={`px-6 py-4 text-sm text-gray-900 dark:text-gray-300 ${
                      column.className || ''
                    }`}
                  >
                    {renderCell(item, column)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination && data.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Нийт <span className="font-medium">{pagination.totalItems}</span> мөр
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-1">
                <span className="px-3 py-1 text-sm font-medium">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
              </div>

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            {pagination.onPageSizeChange && (
              <div className="flex items-center space-x-2">
                <select
                  value={pagination.pageSize}
                  onChange={(e) => pagination.onPageSizeChange?.(Number(e.target.value))}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700"
                >
                  {[10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size} мөр
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;