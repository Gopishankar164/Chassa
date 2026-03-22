package com.aaradhana.aaradhana.controller;

import com.aaradhana.aaradhana.model.Admin;
import com.aaradhana.aaradhana.model.Order;
import com.aaradhana.aaradhana.model.Product;
import com.aaradhana.aaradhana.repository.AdminRepository;
import com.aaradhana.aaradhana.repository.OrderRepository;
import com.aaradhana.aaradhana.repository.ProductRepository;
import com.aaradhana.aaradhana.util.JwtUtil;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping("/orders/list")
    public ResponseEntity<List<Order>> getAllOrdersForAdmin() {
        try {
            List<Order> orders = orderRepository.findAll();
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/orders/pending-payments")
    public ResponseEntity<List<Order>> getPendingPaymentOrders() {
        try {
            List<Order> orders = orderRepository.findAll().stream()
                    .filter(o -> "PENDING".equalsIgnoreCase(o.getPaymentStatus()))
                    .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.ok(new java.util.ArrayList<>());
        }
    }

    @GetMapping("/orders/payment-summary")
    public ResponseEntity<Map<String, Object>> getPaymentSummary() {
        try {
            List<Order> orders = orderRepository.findAll();
            double totalRevenue = orders.stream().mapToDouble(Order::getTotal).sum();
            long completedPayments = orders.stream().filter(o -> "COMPLETED".equalsIgnoreCase(o.getPaymentStatus())).count();
            long pendingPayments = orders.stream().filter(o -> "PENDING".equalsIgnoreCase(o.getPaymentStatus())).count();
            double pendingAmount = orders.stream().filter(o -> "PENDING".equalsIgnoreCase(o.getPaymentStatus())).mapToDouble(Order::getTotal).sum();
            return ResponseEntity.ok(Map.of(
                "totalRevenue", totalRevenue,
                "completedPayments", completedPayments,
                "pendingPayments", pendingPayments,
                "pendingAmount", pendingAmount
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("totalRevenue", 0, "completedPayments", 0, "pendingPayments", 0, "pendingAmount", 0));
        }
    }

    @GetMapping("/orders/statistics")
    public ResponseEntity<Map<String, Object>> getOrderStatistics() {
        try {
            List<Order> allOrders = orderRepository.findAll();

            long totalOrders = allOrders.size();
            long pendingOrders = allOrders.stream()
                    .filter(order -> "PENDING".equals(order.getStatus()))
                    .count();
            long confirmedOrders = allOrders.stream()
                    .filter(order -> "CONFIRMED".equals(order.getStatus()))
                    .count();

            double totalRevenue = allOrders.stream()
                    .mapToDouble(Order::getTotal)
                    .sum();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalOrders", totalOrders);
            stats.put("pendingOrders", pendingOrders);
            stats.put("confirmedOrders", confirmedOrders);
            stats.put("totalRevenue", totalRevenue);

            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Error fetching stats: " + e.getMessage()));
        }
    }

    @PutMapping("/orders/{orderId}/update-payment-status")
    public ResponseEntity<?> updatePaymentStatus(
            @PathVariable String orderId,
            @RequestBody Map<String, String> paymentData) {
        try {
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Order order = orderOpt.get();
            String newPaymentStatus = paymentData.get("paymentStatus");

            if (!Arrays.asList("PENDING", "COMPLETED", "FAILED").contains(newPaymentStatus)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Invalid payment status. Use: PENDING, COMPLETED, or FAILED"));
            }

            order.setPaymentStatus(newPaymentStatus);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            return ResponseEntity.ok(Map.of(
                    "message", "Payment status updated successfully",
                    "orderId", orderId,
                    "paymentStatus", newPaymentStatus
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Error updating payment status: " + e.getMessage()));
        }
    }

    @PutMapping("/orders/{orderId}/update-status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable String orderId,
            @RequestBody Map<String, String> statusData) {
        try {
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();
                String newStatus = statusData.get("status");

                order.setStatus(Order.OrderStatus.valueOf(newStatus));
                order.setUpdatedAt(LocalDateTime.now());
                orderRepository.save(order);

                return ResponseEntity.ok(Map.of(
                        "message", "Order status updated successfully",
                        "orderId", orderId,
                        "newStatus", newStatus
                ));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Error updating order: " + e.getMessage()));
        }
    }

    @GetMapping("/user-orders/test")
    public ResponseEntity<Map<String, Object>> testAuth() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Admin authentication successful");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getAllOrders() {
        try {
            List<Order> orders = orderRepository.findAll();
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @GetMapping("/user-orders/users-summary")
    public ResponseEntity<List<Map<String, Object>>> getUsersOrderSummary() {
        try {
            List<Order> allOrders = orderRepository.findAll();

            Map<String, List<Order>> ordersByCustomer = new HashMap<>();
            for (Order order : allOrders) {
                String customerEmail = order.getCustomerEmail();
                if (customerEmail != null && !customerEmail.isEmpty()) {
                    ordersByCustomer.computeIfAbsent(customerEmail, k -> new ArrayList<>()).add(order);
                }
            }

            List<Map<String, Object>> usersSummary = new ArrayList<>();
            for (Map.Entry<String, List<Order>> entry : ordersByCustomer.entrySet()) {
                String customerEmail = entry.getKey();
                List<Order> customerOrders = entry.getValue();

                int totalOrders = customerOrders.size();
                double totalAmount = customerOrders.stream().mapToDouble(Order::getTotal).sum();
                long pendingOrders = customerOrders.stream()
                        .filter(order -> "PENDING".equals(order.getPaymentStatus()))
                        .count();

                Order latestOrder = customerOrders.stream()
                        .max((o1, o2) -> {
                            if (o1.getCreatedAt() == null) return -1;
                            if (o2.getCreatedAt() == null) return 1;
                            return o1.getCreatedAt().compareTo(o2.getCreatedAt());
                        })
                        .orElse(customerOrders.get(0));

                LocalDateTime lastOrderDate = customerOrders.stream()
                        .map(Order::getCreatedAt)
                        .filter(Objects::nonNull)
                        .max(LocalDateTime::compareTo)
                        .orElse(null);

                Map<String, Object> summary = new HashMap<>();
                summary.put("customerEmail", customerEmail);
                summary.put("customerName", latestOrder.getCustomerName() != null ? latestOrder.getCustomerName() : "N/A");
                summary.put("customerPhone", latestOrder.getCustomerPhone() != null ? latestOrder.getCustomerPhone() : "N/A");
                summary.put("shippingAddress", latestOrder.getShippingAddress() != null ? latestOrder.getShippingAddress() : "N/A");
                summary.put("totalOrders", totalOrders);
                summary.put("totalAmount", totalAmount);
                summary.put("pendingOrders", pendingOrders);
                summary.put("pendingPayments", pendingOrders);
                summary.put("lastOrderDate", lastOrderDate);
                usersSummary.add(summary);
            }

            return ResponseEntity.ok(usersSummary);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @GetMapping("/user-orders/email/{email}")
    public ResponseEntity<Map<String, Object>> getUserOrdersByEmail(@PathVariable String email) {
        try {
            List<Order> allOrders = orderRepository.findAll();
            List<Order> userOrders = allOrders.stream()
                    .filter(order -> email.equals(order.getCustomerEmail()))
                    .sorted((o1, o2) -> {
                        if (o1.getCreatedAt() == null) return 1;
                        if (o2.getCreatedAt() == null) return -1;
                        return o2.getCreatedAt().compareTo(o1.getCreatedAt());
                    })
                    .collect(Collectors.toList());

            double totalAmount = userOrders.stream()
                    .mapToDouble(Order::getTotal)
                    .sum();

            Map<String, Object> response = new HashMap<>();
            response.put("orders", userOrders);
            response.put("totalOrders", userOrders.size());
            response.put("totalAmount", totalAmount);
            response.put("customerEmail", email);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to fetch user orders: " + e.getMessage()));
        }
    }

    @PutMapping("/user-orders/{orderId}/payment-status")
    public ResponseEntity<?> updateUserOrderPaymentStatus(
            @PathVariable String orderId,
            @RequestBody Map<String, String> request) {
        try {
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) return ResponseEntity.notFound().build();

            Order order = orderOpt.get();
            order.setPaymentStatus(request.get("paymentStatus"));
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            return ResponseEntity.ok(Map.of(
                    "message", "Payment status updated successfully",
                    "orderId", orderId,
                    "newStatus", request.get("paymentStatus")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to update payment status"));
        }
    }

    @PutMapping("/user-orders/{orderId}/order-status")
    public ResponseEntity<?> updateUserOrderStatus(
            @PathVariable String orderId,
            @RequestBody Map<String, String> request) {
        try {
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) return ResponseEntity.notFound().build();

            Order order = orderOpt.get();
            order.setStatus(Order.OrderStatus.valueOf(request.get("orderStatus")));
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            return ResponseEntity.ok(Map.of(
                    "message", "Order status updated successfully",
                    "orderId", orderId,
                    "newStatus", request.get("orderStatus")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to update order status"));
        }
    }

    public static class DiscountRequest {
        public Double discountPercentage;
        public java.util.Date discountStartDate;
        public java.util.Date discountEndDate;
        public Boolean isDiscountActive;
    }

    @PutMapping("/products/{id}/discount")
    public ResponseEntity<?> applyDiscount(@PathVariable String id,
                                           @RequestBody DiscountRequest request) {
        try {
            Optional<Product> opt = productRepository.findById(id);
            if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Product not found"));

            Product product = opt.get();
            product.setDiscountPercentage(request.discountPercentage);
            product.setDiscountStartDate(request.discountStartDate);
            product.setDiscountEndDate(request.discountEndDate);
            product.setIsDiscountActive(request.isDiscountActive != null ? request.isDiscountActive : true);

            return ResponseEntity.ok(Map.of("message", "Discount applied successfully", "product", productRepository.save(product)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Error applying discount: " + e.getMessage()));
        }
    }

    @DeleteMapping("/products/{id}/discount")
    public ResponseEntity<?> removeDiscount(@PathVariable String id) {
        try {
            Optional<Product> opt = productRepository.findById(id);
            if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Product not found"));

            Product product = opt.get();
            product.setDiscountPercentage(null);
            product.setDiscountedPrice(product.getPrice() != null ? product.getPrice().doubleValue() : null);
            product.setDiscountStartDate(null);
            product.setDiscountEndDate(null);
            product.setIsDiscountActive(false);

            return ResponseEntity.ok(Map.of("message", "Discount removed successfully", "product", productRepository.save(product)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Error removing discount: " + e.getMessage()));
        }
    }

    @GetMapping("/products/discounts")
    public ResponseEntity<?> getDiscountedProducts() {
        try {
            List<Product> discountedProducts = productRepository.findAll().stream()
                    .filter(p -> p.getIsDiscountActive() != null && p.getIsDiscountActive())
                    .collect(Collectors.toList());
            return ResponseEntity.ok(discountedProducts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Error fetching discounted products: " + e.getMessage()));
        }
    }

    @PostMapping("/create-admin")
    public ResponseEntity<?> createAdmin(@RequestBody Admin admin) {
        try {
            Admin existing = adminRepository.findByEmail(admin.getEmail());
            if (existing != null) {
                return ResponseEntity.ok(Map.of("message", "Admin already exists", "admin", existing));
            }
            Admin savedAdmin = adminRepository.save(admin);
            return ResponseEntity.ok(Map.of("message", "Admin created successfully", "admin", savedAdmin));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error: " + e.getMessage()));
        }
    }
}
