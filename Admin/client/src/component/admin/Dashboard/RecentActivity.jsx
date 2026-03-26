import React from 'react';
import { TrendingUp, Package } from 'lucide-react';
import '../../../styles/Dashboard.css';

const RecentActivity = ({ products, orders }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
          Recent Orders
        </h3>
        <div className="space-y-3">
          {orders.slice(0, 5).map(order => (
            <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Order #{order.id}</p>
                <p className="text-sm text-gray-600">{order.customer}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${order.total}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                  order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2 text-green-500" />
          Low Stock Alert
        </h3>
        <div className="space-y-3">
          {products.filter(p => p.stock < 20).map(product => (
            <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-gray-600">{product.category}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-600">{product.stock} left</p>
                <p className="text-sm text-gray-500">${product.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;