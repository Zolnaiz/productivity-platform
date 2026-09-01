import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  /** Custom cell content. Without it the row's `key` field is shown. */
  render?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  /** Stable identity per row. */
  rowKey: (item: T) => string;
  /** Shown in place of the body when there are no rows. */
  empty?: React.ReactNode;
  onRowClick?: (item: T) => void;
}

const isBlank = (value: unknown) => value === null || value === undefined || value === '';

function Table<T>({ columns, rows, rowKey, empty, onRowClick }: TableProps<T>) {
  if (!rows.length && empty) return <>{empty}</>;

  const renderCell = (item: T, column: Column<T>) => {
    if (column.render) return column.render(item);

    // Only genuinely absent values fall back to a dash — 0 is a value.
    const value = (item as Record<string, unknown>)[column.key];
    return isBlank(value) ? '-' : (value as React.ReactNode);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b text-gray-500 dark:border-gray-700">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={`py-3 font-medium ${column.headerClassName || ''}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr
              key={rowKey(item)}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              className={`border-b dark:border-gray-700 ${
                onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''
              }`}
            >
              {columns.map((column) => (
                <td key={column.key} className={`py-3 ${column.className || 'text-gray-600 dark:text-gray-300'}`}>
                  {renderCell(item, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
