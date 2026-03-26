import React from 'react';

export const PageHeader = ({ 
  title, 
  subtitle = null, 
  actions = null,
  breadcrumbs = null 
}) => {
  return (
    <div className="mb-8">
      {breadcrumbs && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          {breadcrumbs}
        </div>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-gray-600">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-3">{actions}</div>}
      </div>
    </div>
  );
};

export const Breadcrumb = ({ items }) => {
  return (
    <div className="flex items-center gap-2 text-sm">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span className="text-gray-400">/</span>}
          {item.link ? (
            <a href={item.link} className="text-blue-600 hover:underline">
              {item.label}
            </a>
          ) : (
            <span className={idx === items.length - 1 ? 'text-gray-600 font-medium' : 'text-gray-600'}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
