import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const Table = ({ columns, data, isLoading = false, onRowClick = null }) => {
  const [sortConfig, setSortConfig] = React.useState(null);

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => 
      prev?.key === key 
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className="flex items-center gap-2">
                  {col.label}
                  {col.sortable && sortConfig?.key === col.key && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                No data available
              </td>
            </tr>
          ) : (
            sortedData.map((row, idx) => (
              <tr 
                key={idx}
                className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-6 py-4 text-sm text-gray-700">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
