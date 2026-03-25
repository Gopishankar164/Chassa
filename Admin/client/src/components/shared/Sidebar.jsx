import React from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export const Sidebar = ({ items, isOpen, setIsOpen }) => {
  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 hover:bg-gray-100 rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static top-0 left-0 h-screen w-64 bg-gray-900 text-white flex flex-col z-30
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo/Brand */}
        <div className="px-6 py-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold">Admin</h1>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {items.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg transition
                ${isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
              onClick={() => setIsOpen(false)}
            >
              {item.icon && <item.icon size={20} />}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout Section */}
        <div className="px-4 py-4 border-t border-gray-800">
          <button className="w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition font-medium">
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};
