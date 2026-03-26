import React from 'react';
import { Bell } from 'lucide-react';
import '../../../styles/GlobalAdmin.css';

const notifications = [
  { id: 1, icon: '🛍️', text: 'New order received from a customer', time: '2 min ago', unread: true },
  { id: 2, icon: '💰', text: 'Payment confirmed for Order #1024', time: '15 min ago', unread: true },
  { id: 3, icon: '⚠️', text: 'Low stock alert: Product is running low', time: '1 hr ago', unread: false },
  { id: 4, icon: '↩️', text: 'New return request submitted', time: '3 hrs ago', unread: false },
];

const NotificationCenter = () => (
  <div className="page-wrap">
    <div className="page-header-bar">
      <div>
        <h2 className="page-heading">Notifications</h2>
        <p className="page-heading-sub">{notifications.filter(n => n.unread).length} unread notifications</p>
      </div>
    </div>

    <div className="data-card" style={{ padding: '8px 0' }}>
      {notifications.map(n => (
        <div key={n.id} style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px',
          borderBottom: '1px solid #f1f5f9',
          background: n.unread ? '#f8faff' : 'white',
          transition: 'background .2s',
          cursor: 'pointer',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
          onMouseLeave={e => e.currentTarget.style.background = n.unread ? '#f8faff' : 'white'}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: '#eef2ff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 20, flexShrink: 0
          }}>
            {n.icon}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: n.unread ? 600 : 400, color: '#1e293b' }}>
              {n.text}
            </p>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{n.time}</span>
          </div>
          {n.unread && (
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
          )}
        </div>
      ))}
      {notifications.length === 0 && (
        <div className="state-empty"><Bell size={40} /><p>No notifications yet</p></div>
      )}
    </div>
  </div>
);

export default NotificationCenter;