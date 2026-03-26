import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { isTokenExpired, isTokenExpiringSoon } from "../utils/tokenUtils";
import API_BASE_URL from '../config/api';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

const refreshToken = async () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/refresh-token`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
    });
    if (res.ok) {
      const { user, token: newToken } = await res.json();
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(user));
      return newToken;
    }
    return null;
  } catch { return null; }
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);

  const fetchProductDetails = async (ids, token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/byIds`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(ids),
      });
      if (!res.ok) throw new Error("Failed to fetch product details");
      return await res.json();
    } catch { return []; }
  };

  const fetchCart = useCallback(async () => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    let token = localStorage.getItem("token");
    if (!storedUser?.id || !token) { setCart([]); return; }
    if (isTokenExpired(token)) {
      const newToken = await refreshToken();
      if (!newToken) {
        localStorage.removeItem("user"); localStorage.removeItem("token"); localStorage.removeItem("cart");
        setUser(null); setCart([]); return;
      }
      token = newToken;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${storedUser.id}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        localStorage.removeItem("user"); localStorage.removeItem("token"); localStorage.removeItem("cart");
        setUser(null); setCart([]); return;
      }
      if (!res.ok) throw new Error("Failed to fetch cart");
      const dbUser = await res.json();
      const cartItems = dbUser.cart || [];
      let finalCart = [];
      if (cartItems.length > 0 && typeof cartItems[0] === 'object') {
        const uniqueProductIds = [...new Set(cartItems.map(item => item.productId))];
        const products = await fetchProductDetails(uniqueProductIds, token);
        finalCart = cartItems.map(cartItem => {
          const product = products.find(p => p.id === cartItem.productId);
          if (!product) return null;
          return { ...product, quantity: cartItem.quantity || 1, selectedSize: cartItem.selectedSize || '', selectedColor: cartItem.selectedColor || '' };
        }).filter(Boolean);
      } else {
        const productQuantities = {};
        cartItems.forEach(id => { productQuantities[id] = (productQuantities[id] || 0) + 1; });
        const uniqueProductIds = [...new Set(cartItems)];
        const products = await fetchProductDetails(uniqueProductIds, token);
        finalCart = products.map(product => ({
          ...product, quantity: productQuantities[product.id] || 1, selectedSize: '', selectedColor: ''
        }));
      }
      setCart(finalCart);
      localStorage.setItem("cart", JSON.stringify(finalCart));
    } catch { setCart([]); }
  }, []);

  useEffect(() => {
    const checkAndRefreshToken = async () => {
      const token = localStorage.getItem("token");
      if (token && isTokenExpiringSoon(token) && !isTokenExpired(token)) {
        await refreshToken();
      }
    };
    const interval = setInterval(checkAndRefreshToken, 30 * 60 * 1000);
    checkAndRefreshToken();
    return () => clearInterval(interval);
  }, []);

  const addToCart = async (product) => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    let token = localStorage.getItem("token");
    if (!storedUser?.id || !token) return false;
    if (isTokenExpired(token)) {
      const newToken = await refreshToken();
      if (!newToken) return false;
      token = newToken;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${storedUser.id}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, quantity: product.quantity || 1, selectedSize: product.selectedSize || null, selectedColor: product.selectedColor || null }),
      });
      if (!res.ok) return false;
      fetchCart().catch(() => {});
      return true;
    } catch { return false; }
  };

  const removeFromCart = async (productId, selectedSize = null, selectedColor = null) => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    let token = localStorage.getItem("token");
    if (!storedUser?.id || !token) return;
    if (isTokenExpired(token)) {
      const newToken = await refreshToken();
      if (!newToken) return;
      token = newToken;
    }
    try {
      await fetch(`${API_BASE_URL}/api/users/${storedUser.id}/cart/remove-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, selectedSize, selectedColor }),
      });
      await fetchCart();
    } catch {}
  };

  const updateQuantity = async (productId, newQuantity, selectedSize = null, selectedColor = null) => {
    if (newQuantity < 1) return;
    const storedUser = JSON.parse(localStorage.getItem("user"));
    let token = localStorage.getItem("token");
    if (!storedUser?.id || !token) return;
    if (isTokenExpired(token)) {
      const newToken = await refreshToken();
      if (!newToken) return;
      token = newToken;
    }
    try {
      await fetch(`${API_BASE_URL}/api/users/${storedUser.id}/cart/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, quantity: newQuantity, selectedSize, selectedColor }),
      });
      await fetchCart();
    } catch {}
  };

  const decreaseQuantity = async (productId, selectedSize = null, selectedColor = null) => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    let token = localStorage.getItem("token");
    if (!storedUser?.id || !token) return;
    if (isTokenExpired(token)) {
      const newToken = await refreshToken();
      if (!newToken) return;
      token = newToken;
    }
    try {
      await fetch(`${API_BASE_URL}/api/users/${storedUser.id}/cart/decrease`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, selectedSize, selectedColor }),
      });
      await fetchCart();
    } catch {}
  };

  return (
    <CartContext.Provider value={{ user, setUser, cart, addToCart, removeFromCart, fetchCart, updateQuantity, decreaseQuantity }}>
      {children}
    </CartContext.Provider>
  );
};
