package com.aaradhana.aaradhana.controller;

import com.aaradhana.aaradhana.model.Order;
import com.aaradhana.aaradhana.model.OrderItem;
import com.aaradhana.aaradhana.model.Product;
import com.aaradhana.aaradhana.repository.OrderRepository;
import com.aaradhana.aaradhana.repository.ProductRepository;
import com.aaradhana.aaradhana.repository.UserRepository;
import com.aaradhana.aaradhana.service.SendGridEmailService;
import com.aaradhana.aaradhana.service.StockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SendGridEmailService emailService;

    @Autowired
    private StockService stockService;

    @Value("${admin.email}")
    private String adminEmail;

    // Get orders for a specific user
    @GetMapping("/user/{userId}")
    public List<Order> getOrdersByUser(@PathVariable String userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @PostMapping("/create")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> orderData) {
        try {
            // Extract order data
            String userId = extractString(orderData.get("userId"));
            String customerName = extractString(orderData.get("customerName"));
            String customerEmail = extractString(orderData.get("customerEmail"));
            String customerPhone = extractString(orderData.get("customerPhone"));
            String shippingAddress = extractString(orderData.get("shippingAddress"));
            BigDecimal totalAmount = extractBigDecimal(orderData.get("totalAmount"));

            // Extract order items
            List<Map<String, Object>> orderItemsData = extractOrderItems(orderData.get("orderItems"));
            List<OrderItem> processedOrderItems = new ArrayList<>();

            if (orderItemsData != null && !orderItemsData.isEmpty()) {
                for (Map<String, Object> itemData : orderItemsData) {
                    String productId = extractString(itemData.get("productId"));
                    String productName = extractString(itemData.get("productName"));
                    Integer quantity = extractInteger(itemData.get("quantity"));
                    Double price = extractDouble(itemData.get("price"));
                    String selectedSize = extractString(itemData.get("selectedSize"));
                    String selectedColor = extractString(itemData.get("selectedColor"));

                    // Validate item data
                    if (productId != null && !productId.trim().isEmpty() && quantity != null && quantity > 0
                            && price != null && price > 0) {
                        OrderItem orderItem = new OrderItem();
                        orderItem.setId("ITEM_" + System.currentTimeMillis() + "_" + (int) (Math.random() * 1000));
                        orderItem.setProductId(productId);
                        orderItem.setProductName(productName != null ? productName : "Product " + productId);
                        orderItem.setQuantity(quantity);
                        orderItem.setPrice(price);
                        orderItem.setSize(selectedSize);
                        orderItem.setColor(selectedColor);

                        // Fetch product image
                        try {
                            Optional<Product> productOpt = productRepository.findById(productId);
                            if (productOpt.isPresent()) {
                                String imageUrl = productOpt.get().getImageUrl();
                                orderItem.setImage(imageUrl != null ? imageUrl : "https://via.placeholder.com/120");
                            } else {
                                orderItem.setImage("https://via.placeholder.com/120");
                            }
                        } catch (Exception e) {
                            orderItem.setImage("https://via.placeholder.com/120");
                        }

                        processedOrderItems.add(orderItem);
                    }
                }
            }

            // Create order
            Order order = new Order();
            order.setId("KS" + System.currentTimeMillis());
            order.setUserId(userId);
            order.setCustomerName(customerName);
            order.setCustomerEmail(customerEmail);
            order.setCustomerPhone(customerPhone);
            order.setShippingAddress(shippingAddress);
            order.setTotalAmount(totalAmount);
            order.setStatus(Order.OrderStatus.CONFIRMED);
            order.setPaymentStatus("PENDING");
            order.setCreatedAt(LocalDateTime.now());
            order.setUpdatedAt(LocalDateTime.now());
            order.setConfirmedAt(LocalDateTime.now());
            order.setOrderItems(processedOrderItems);

            // Copy customer's saved delivery coordinates if available
            if (userId != null) {
                try {
                    userRepository.findById(userId).ifPresent(u -> {
                        if (u.getDeliveryLat() != null) order.setDestinationLat(u.getDeliveryLat());
                        if (u.getDeliveryLng() != null) order.setDestinationLng(u.getDeliveryLng());
                    });
                } catch (Exception ignored) {}
            }

            // Save order
            Order savedOrder = orderRepository.save(order);

            // ✅ Deduct stock via MongoTemplate (direct field update, no mapping issues)
            stockService.deductStock(savedOrder.getOrderItems());

            // Send confirmation email
            try {
                emailService.sendOrderStatusEmail(savedOrder, "NEW");
                System.out.println("Order confirmation email sent to: " + customerEmail);
            } catch (Exception e) {
                System.err.println("Failed to send email: " + e.getMessage());
            }

            // Send admin notification
            try {
                emailService.sendNewOrderNotificationToAdmin(savedOrder, adminEmail);
                System.out.println("Admin notification sent for order: " + savedOrder.getId());
            } catch (Exception e) {
                System.err.println("Failed to send admin notification: " + e.getMessage());
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Order placed successfully!",
                    "orderId", savedOrder.getId(),
                    "itemsCount", savedOrder.getOrderItems().size()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Error placing order: " + e.getMessage()));
        }
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrderById(@PathVariable String orderId) {
        try {
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();

                if (order.getItems() != null) {
                    for (OrderItem item : order.getItems()) {
                        if (item.getProductId() != null) {
                            try {
                                Optional<Product> productOpt = productRepository.findById(item.getProductId());
                                if (productOpt.isPresent()) {
                                    Product product = productOpt.get();
                                    if (product.getImages() != null && !product.getImages().isEmpty()) {
                                        item.setImages(product.getImages());
                                    } else {
                                        item.setImage("https://placehold.co/100x100/png?text=No+Image");
                                    }
                                    if (product.getIsDiscountActive() != null && product.getIsDiscountActive()) {
                                        item.setIsDiscountActive(true);
                                        item.setDiscountedPrice(product.getDiscountedPrice());
                                        item.setDiscountPercentage(product.getDiscountPercentage());
                                    }
                                } else {
                                    item.setImage("https://placehold.co/100x100/png?text=No+Image");
                                }
                            } catch (Exception e) {
                                item.setImage("https://placehold.co/100x100/png?text=No+Image");
                            }
                        } else {
                            item.setImage("https://placehold.co/100x100/png?text=No+Image");
                        }
                    }
                }

                return ResponseEntity.ok(order);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable String orderId,
            @RequestBody Map<String, String> request) {
        try {
            String newStatus = request.get("status");

            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Order order = orderOpt.get();
            String previousStatus = order.getStatusString();

            order.setStatus(newStatus);
            order.setUpdatedAt(LocalDateTime.now());

            switch (newStatus.toUpperCase()) {
                case "CONFIRMED" -> order.setConfirmedAt(LocalDateTime.now());
                case "PROCESSING" -> order.setProcessingAt(LocalDateTime.now());
                case "SHIPPED" -> order.setShippedAt(LocalDateTime.now());
                case "OUT_FOR_DELIVERY" -> order.setOutForDeliveryAt(LocalDateTime.now());
                case "DELIVERED" -> order.setDeliveredAt(LocalDateTime.now());
                case "CANCELLED" -> order.setCancelledAt(LocalDateTime.now());
            }

            Order updatedOrder = orderRepository.save(order);

            try {
                emailService.sendOrderStatusEmail(updatedOrder, previousStatus);
            } catch (Exception e) {
                System.err.println("Failed to send email: " + e.getMessage());
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Order status updated successfully",
                    "order", updatedOrder));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to update order status: " + e.getMessage()));
        }
    }

    @PutMapping("/{orderId}/update-payment-status")
    public ResponseEntity<?> updatePaymentStatus(
            @PathVariable String orderId,
            @RequestBody Map<String, String> request) {
        try {
            String newStatus = request.get("paymentStatus");

            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Order order = orderOpt.get();
            order.setPaymentStatus(newStatus);
            order.setUpdatedAt(LocalDateTime.now());

            Order updatedOrder = orderRepository.save(order);

            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to update payment status"));
        }
    }

    @PutMapping("/{orderId}/location")
    public ResponseEntity<?> updateDeliveryLocation(
            @PathVariable String orderId,
            @RequestBody Map<String, Object> request) {
        try {
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) return ResponseEntity.notFound().build();

            Order order = orderOpt.get();
            double lat = extractDouble(request.get("lat"));
            double lng = extractDouble(request.get("lng"));

            Order.DeliveryLocation loc = new Order.DeliveryLocation();
            loc.setLat(lat);
            loc.setLng(lng);
            loc.setUpdatedAt(java.time.LocalDateTime.now());

            order.setDeliveryLocation(loc);

            if (order.getDeliveryPath() == null) order.setDeliveryPath(new java.util.ArrayList<>());
            order.getDeliveryPath().add(loc);

            orderRepository.save(order);
            return ResponseEntity.ok(Map.of("success", true, "location", loc));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable String orderId, @RequestBody Map<String, String> payload) {
        try {
            Optional<Order> orderOpt = orderRepository.findById(orderId);

            if (!orderOpt.isPresent()) {
                return ResponseEntity.status(404).body(Map.of(
                        "success", false,
                        "message", "Order not found"));
            }

            Order order = orderOpt.get();

            String currentStatus = order.getStatusString();
            List<String> cancellableStatuses = Arrays.asList("PENDING", "CONFIRMED", "PROCESSING");

            if (!cancellableStatuses.contains(currentStatus.toUpperCase())) {
                return ResponseEntity.status(400).body(Map.of(
                        "success", false,
                        "message", "Order cannot be cancelled. Current status: " + currentStatus));
            }

            String previousStatus = order.getStatusString();
            order.setStatus("CANCELLED");
            String cancellationReason = payload.getOrDefault("reason", "Customer requested cancellation");
            order.setCancellationReason(cancellationReason);
            order.setCancelledAt(LocalDateTime.now());
            order.setUpdatedAt(LocalDateTime.now());

            Order cancelledOrder = orderRepository.save(order);

            // ✅ Restore stock via StockService
            List<OrderItem> allItems = cancelledOrder.getOrderItems();
            if (allItems == null || allItems.isEmpty()) allItems = cancelledOrder.getItems();
            stockService.restoreStock(allItems);

            try {
                emailService.sendOrderStatusEmail(cancelledOrder, previousStatus);
            } catch (Exception e) {
                System.err.println("Failed to send email: " + e.getMessage());
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Order cancelled successfully",
                    "order", cancelledOrder));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Error cancelling order: " + e.getMessage()));
        }
    }

    private String extractString(Object obj) {
        if (obj == null)
            return null;
        if (obj instanceof String) {
            String str = (String) obj;
            return str.trim().isEmpty() ? null : str;
        }
        return obj.toString().trim();
    }

    private BigDecimal extractBigDecimal(Object obj) {
        if (obj == null)
            return BigDecimal.ZERO;
        if (obj instanceof BigDecimal)
            return (BigDecimal) obj;
        if (obj instanceof Number)
            return BigDecimal.valueOf(((Number) obj).doubleValue());
        if (obj instanceof String) {
            try {
                String str = ((String) obj).trim();
                return str.isEmpty() ? BigDecimal.ZERO : new BigDecimal(str);
            } catch (NumberFormatException e) {
                return BigDecimal.ZERO;
            }
        }
        return BigDecimal.ZERO;
    }

    private Integer extractInteger(Object obj) {
        if (obj == null)
            return 0;
        if (obj instanceof Integer)
            return (Integer) obj;
        if (obj instanceof Number)
            return ((Number) obj).intValue();
        if (obj instanceof String) {
            try {
                String str = ((String) obj).trim();
                return str.isEmpty() ? 0 : Integer.parseInt(str);
            } catch (NumberFormatException e) {
                return 0;
            }
        }
        return 0;
    }

    private Double extractDouble(Object obj) {
        if (obj == null)
            return 0.0;
        if (obj instanceof Double)
            return (Double) obj;
        if (obj instanceof Number)
            return ((Number) obj).doubleValue();
        if (obj instanceof String) {
            try {
                String str = ((String) obj).trim();
                return str.isEmpty() ? 0.0 : Double.parseDouble(str);
            } catch (NumberFormatException e) {
                return 0.0;
            }
        }
        return 0.0;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractOrderItems(Object obj) {
        if (obj == null) {
            return new ArrayList<>();
        }
        if (obj instanceof List) {
            try {
                return (List<Map<String, Object>>) obj;
            } catch (ClassCastException e) {
                return new ArrayList<>();
            }
        }
        return new ArrayList<>();
    }
}
