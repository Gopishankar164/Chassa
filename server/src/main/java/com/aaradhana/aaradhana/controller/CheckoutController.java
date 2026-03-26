package com.aaradhana.aaradhana.controller;

import com.aaradhana.aaradhana.model.Order;
import com.aaradhana.aaradhana.model.OrderItem;
import com.aaradhana.aaradhana.model.Product;
import com.aaradhana.aaradhana.repository.OrderRepository;
import com.aaradhana.aaradhana.repository.ProductRepository;
import com.aaradhana.aaradhana.service.StockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StockService stockService;

    @PostMapping("/place-order")
    public ResponseEntity<?> placeOrder(@RequestBody Map<String, Object> orderData) {
        try {
            String userId = extractString(orderData.get("userId"));
            String customerName = extractString(orderData.get("customerName"));
            String customerEmail = extractString(orderData.get("customerEmail"));
            String customerPhone = extractString(orderData.get("customerPhone"));
            String shippingAddress = extractString(orderData.get("shippingAddress"));
            String paymentMethod = extractString(orderData.get("paymentMethod"));
            BigDecimal totalAmount = extractBigDecimal(orderData.get("totalAmount"));
            List<Map<String, Object>> orderItemsData = extractOrderItems(orderData.get("orderItems"));

            Order order = new Order();
            order.setId("KS" + System.currentTimeMillis());
            order.setUserId(userId);
            order.setCustomerName(customerName);
            order.setCustomerEmail(customerEmail);
            order.setCustomerPhone(customerPhone);
            order.setShippingAddress(shippingAddress);
            order.setTotal(totalAmount.doubleValue());

            if ("COD".equalsIgnoreCase(paymentMethod) || "CASH_ON_DELIVERY".equalsIgnoreCase(paymentMethod)) {
                order.setPaymentMethod(Order.PaymentMethod.COD);
                order.setPaymentStatus("PENDING");
                order.setStatus(Order.OrderStatus.CONFIRMED);
            } else {
                order.setPaymentMethod(Order.PaymentMethod.ONLINE);
                order.setPaymentStatus("COMPLETED");
                order.setStatus(Order.OrderStatus.CONFIRMED);
            }

            order.setCreatedAt(LocalDateTime.now());
            order.setUpdatedAt(LocalDateTime.now());

            List<OrderItem> orderItems = new ArrayList<>();
            if (orderItemsData != null) {
                for (Map<String, Object> itemData : orderItemsData) {
                    String productId = extractString(itemData.get("productId"));
                    String productName = extractString(itemData.get("productName"));
                    Integer quantity = extractInteger(itemData.get("quantity"));
                    BigDecimal price = extractBigDecimal(itemData.get("price"));
                    String selectedSize = extractString(itemData.get("selectedSize"));
                    String selectedColor = extractString(itemData.get("selectedColor"));

                    if (productId != null && quantity != null && price != null) {
                        OrderItem item = new OrderItem();
                        item.setId(UUID.randomUUID().toString());
                        item.setProductId(productId);
                        item.setQuantity(quantity);
                        item.setPrice(price.doubleValue());
                        if (selectedSize != null && !selectedSize.isEmpty()) item.setSize(selectedSize);
                        if (selectedColor != null && !selectedColor.isEmpty()) item.setColor(selectedColor);

                        // Fetch product: name + discount + image
                        Optional<Product> productOpt = productRepository.findById(productId);
                        if (productOpt.isPresent()) {
                            Product product = productOpt.get();
                            item.setProductName(productName != null && !productName.isEmpty()
                                    ? productName : product.getTitle());
                            item.setDiscountedPrice(product.getDiscountedPrice());
                            item.setIsDiscountActive(product.getIsDiscountActive());
                            item.setDiscountPercentage(product.getDiscountPercentage());
                            String imgUrl = product.getImageUrl();
                            item.setImage(imgUrl != null ? imgUrl : "https://via.placeholder.com/120");
                        } else {
                            item.setProductName(productName != null ? productName : "Product " + productId);
                        }

                        orderItems.add(item);
                    }
                }
            }

            order.setItems(orderItems);
            Order savedOrder = orderRepository.save(order);

            // ✅ Deduct stock via MongoTemplate (direct, bypasses all mapping)
            stockService.deductStock(orderItems);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Order placed successfully");
            response.put("orderId", savedOrder.getId());
            response.put("totalAmount", totalAmount);
            response.put("status", savedOrder.getStatus().toString());
            response.put("paymentMethod", savedOrder.getPaymentMethod().toString());
            response.put("paymentStatus", savedOrder.getPaymentStatus());
            response.put("itemsCount", orderItems.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", "Error creating order: " + e.getMessage()));
        }
    }

    private String extractString(Object obj) {
        if (obj == null) return null;
        if (obj instanceof String) return (String) obj;
        return obj.toString();
    }

    private BigDecimal extractBigDecimal(Object obj) {
        if (obj == null) return BigDecimal.ZERO;
        if (obj instanceof BigDecimal) return (BigDecimal) obj;
        if (obj instanceof Number) return BigDecimal.valueOf(((Number) obj).doubleValue());
        if (obj instanceof String) { try { return new BigDecimal((String) obj); } catch (NumberFormatException e) { return BigDecimal.ZERO; } }
        return BigDecimal.ZERO;
    }

    private Integer extractInteger(Object obj) {
        if (obj == null) return 0;
        if (obj instanceof Integer) return (Integer) obj;
        if (obj instanceof Number) return ((Number) obj).intValue();
        if (obj instanceof String) { try { return Integer.parseInt((String) obj); } catch (NumberFormatException e) { return 0; } }
        return 0;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractOrderItems(Object obj) {
        if (obj == null) return new ArrayList<>();
        if (obj instanceof List) return (List<Map<String, Object>>) obj;
        return new ArrayList<>();
    }
}
