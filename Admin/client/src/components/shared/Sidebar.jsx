import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../../styles/Sidebar.css';

export const Sidebar = ({ items, isOpen, setIsOpen, onLogout }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          style={{ display: 'block' }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? '' : 'closed'}`}>
        {/* Header / Brand */}
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <div className="sidebar-logo-circle">
              <span style={{ fontSize: 16, fontWeight: 800, color: '#34D399', fontFamily: "'Outfit',sans-serif" }}>C</span>
            </div>
            {isOpen && (
              <div className="sidebar-brand">
                <span className="sidebar-brand-name">Chassa</span>
                <span className="sidebar-brand-sub">Admin Panel</span>
              </div>
            )}
          </div>
          <button
            className="sidebar-toggle-btn"
            onClick={() => setIsOpen(!isOpen)}
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">{isOpen ? 'Navigation' : '···'}</div>
          {items.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => {
                // Close sidebar on mobile when a link is clicked
                if (window.innerWidth < 768) setIsOpen(false);
              }}
              title={!isOpen ? item.label : undefined}
            >
              <span className="nav-icon">
                {item.icon && <item.icon size={18} />}
              </span>
              {isOpen && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: isOpen ? 10 : 0,
                justifyContent: isOpen ? 'flex-start' : 'center',
                background: 'rgba(252,129,129,0.07)',
                color: '#FC8181',
                border: '1px solid rgba(252,129,129,0.18)',
                padding: '9px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.06em',
                transition: 'all 0.2s',
                marginBottom: isOpen ? 10 : 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              </svg>
              {isOpen && <span>Logout</span>}
            </button>
          )}
          {isOpen && (
            <p className="sidebar-footer-text">CHASSA ENGINEERING DRIVES</p>
          )}
        </div>
      </aside>
    </>
  );
};
