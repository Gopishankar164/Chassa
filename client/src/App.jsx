import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Landing from "./components/Landing";
import ShopPage from "./components/ShopPage";
import ProductDetail from "./components/ProductDetail";
import Cart from "./components/Cart";
import AuthPage from "./components/Auth";
import Checkout from "./components/Checkout";
import OrderDetails from "./components/OrderDetails";
import OrderTracking from "./components/OrderTracking";
import MyOrders from "./components/MyOrders";
import MyProfile from "./components/MyProfile";
import Wishlist from "./components/Wishlist";
import CustomerSupport from "./components/CustomerSupport";
import ResetPassword from "./components/ResetPassword";
import ReturnExchange from "./components/ReturnExchange";
import WhatsAppCart from "./components/WhatsAppCart";
import NotFound from "./components/NotFound";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname, message: "Please login to continue" }} replace />;
  }
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/home" element={<ShopPage />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />
      <Route path="/forgot-password" element={<AuthPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/customer-support" element={<CustomerSupport />} />
      <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/order-details/:orderId" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
      <Route path="/order/:orderId" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
      <Route path="/track/:orderId" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
      <Route path="/return-exchange/:orderId" element={<ProtectedRoute><ReturnExchange /></ProtectedRoute>} />
      <Route path="/whatsapp-cart" element={<ProtectedRoute><WhatsAppCart /></ProtectedRoute>} />
      <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
      <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
      <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
