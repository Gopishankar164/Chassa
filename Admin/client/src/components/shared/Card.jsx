import React from 'react';

export const Card = ({ 
  title, 
  subtitle, 
  children, 
  footer = null, 
  className = '',
  headerAction = null 
}) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {(title || headerAction) && (
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {headerAction}
        </div>
      )}
      
      <div className="p-6">
        {children}
      </div>

      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};

export const StatCard = ({ icon: Icon, label, value, trend = null, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50',
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`mt-2 text-sm font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? '+' : '-'}{Math.abs(trend.percentage)}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </Card>
  );
};
