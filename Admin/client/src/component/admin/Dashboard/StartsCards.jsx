import React from 'react';
import { DollarSign, Package, Users, ShoppingCart, AlertTriangle } from 'lucide-react';
import '../../../styles/Dashboard.css';

const StatsCards = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Business Value */}
      <div style={{ background: 'linear-gradient(135deg,#0D1A2E,#1565C0)', border: '1px solid rgba(0,176,255,0.2)', padding: 24, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <p style={{ color:'#00B0FF', fontSize:10, fontFamily:"'Share Tech Mono',monospace", letterSpacing:'0.12em' }}>BUSINESS VALUE</p>
            <p style={{ fontSize:22, fontWeight:700, color:'#E8EDF5', fontFamily:"'Rajdhani',sans-serif" }}>${stats.totalRevenue?.toLocaleString()}</p>
          </div>
          <DollarSign style={{ color:'rgba(0,176,255,0.5)', width:32, height:32 }} />
        </div>
      </div>
      {/* Components */}
      <div style={{ background: 'linear-gradient(135deg,#0D1A2E,#00695C)', border: '1px solid rgba(0,200,83,0.2)', padding: 24, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <p style={{ color:'#00C853', fontSize:10, fontFamily:"'Share Tech Mono',monospace", letterSpacing:'0.12em' }}>COMPONENTS</p>
            <p style={{ fontSize:22, fontWeight:700, color:'#E8EDF5', fontFamily:"'Rajdhani',sans-serif" }}>{stats.totalProducts}</p>
          </div>
          <Package style={{ color:'rgba(0,200,83,0.5)', width:32, height:32 }} />
        </div>
      </div>
      {/* Clients */}
      <div style={{ background: 'linear-gradient(135deg,#0D1A2E,#4A148C)', border: '1px solid rgba(179,136,255,0.2)', padding: 24, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <p style={{ color:'#CE93D8', fontSize:10, fontFamily:"'Share Tech Mono',monospace", letterSpacing:'0.12em' }}>CLIENTS</p>
            <p style={{ fontSize:22, fontWeight:700, color:'#E8EDF5', fontFamily:"'Rajdhani',sans-serif" }}>{stats.totalUsers}</p>
          </div>
          <Users style={{ color:'rgba(206,147,216,0.5)', width:32, height:32 }} />
        </div>
      </div>
      {/* Projects */}
      <div style={{ background: 'linear-gradient(135deg,#0D1A2E,#E65100)', border: '1px solid rgba(255,183,77,0.2)', padding: 24, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <p style={{ color:'#FFB74D', fontSize:10, fontFamily:"'Share Tech Mono',monospace", letterSpacing:'0.12em' }}>PROJECTS / ORDERS</p>
            <p style={{ fontSize:22, fontWeight:700, color:'#E8EDF5', fontFamily:"'Rajdhani',sans-serif" }}>{stats.totalOrders}</p>
          </div>
          <ShoppingCart style={{ color:'rgba(255,183,77,0.5)', width:32, height:32 }} />
        </div>
      </div>
      {/* Pending */}
      <div style={{ background: 'linear-gradient(135deg,#0D1A2E,#B71C1C)', border: '1px solid rgba(255,23,68,0.2)', padding: 24, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <p style={{ color:'#FF5252', fontSize:10, fontFamily:"'Share Tech Mono',monospace", letterSpacing:'0.12em' }}>AWAITING RESPONSE</p>
            <p style={{ fontSize:22, fontWeight:700, color:'#E8EDF5', fontFamily:"'Rajdhani',sans-serif" }}>{stats.pendingOrders}</p>
          </div>
          <AlertTriangle style={{ color:'rgba(255,82,82,0.5)', width:32, height:32 }} />
        </div>
      </div>
    </div>
  );
};

export default StatsCards;