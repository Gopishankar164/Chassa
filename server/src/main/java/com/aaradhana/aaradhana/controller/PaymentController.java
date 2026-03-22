package com.aaradhana.aaradhana.controller;

import com.aaradhana.aaradhana.config.JwtAuthenticationFilter;
import com.aaradhana.aaradhana.model.Order;
import com.aaradhana.aaradhana.model.OrderItem;
import com.aaradhana.aaradhana.repository.OrderRepository;
import com.aaradhana.aaradhana.repository.ProductRepository;
import com.aaradhana.aaradhana.service.RazorpayService;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    @Autowired
    private RazorpayService razorpayService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    // ── DEMO PAYMENT ────────────────────────────────────────────────────────────
    // Simulates a payment flow for testing. No real money movement.
    // 80% chance → "paid", 20% chance → "failed"
    @PostMapping("/demo")
    public ResponseEntity<?> demoPayment(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }

        try {
            String authenticatedUserId = getAuthenticatedUserId(authentication);

            // Extract fields from request body
            String userId        = extractString(body.get("userId"));
            String customerName  = extractString(body.get("customerName"));
            String customerEmail = extractString(body.get("customerEmail"));
            String customerPhone = extractString(body.get("customerPhone"));
            String shippingAddr  = extractString(body.get("shippingAddress"));
            String paymentMethod = extractString(body.get("paymentMethod"));
            if (paymentMethod == null || paymentMethod.isBlank()) paymentMethod = "DEMO_CARD";

            // Security: use authenticated userId, ignore client-supplied userId
            userId = authenticatedUserId;

            // Recalculate total from request items (trust only the item prices from DB in prod;
            // here we accept the client total for demo but validate it is a positive number)
            double clientTotal = extractDouble(body.get("totalAmount"));
            if (clientTotal <= 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid total amount"));
            }

            // Build order items
            List<OrderItem> orderItems = new ArrayList<>();
            Object rawItems = body.get("orderItems");
            if (rawItems instanceof List<?> itemList) {
                for (Object rawItem : itemList) {
                    if (rawItem instanceof Map<?, ?> itemMap) {
                        OrderItem oi = new OrderItem();
                        oi.setId("ITEM_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 1000));
                        oi.setProductId(extractString(itemMap.get("productId")));
                        oi.setProductName(extractString(itemMap.get("productName")));
                        oi.setQuantity(extractInteger(itemMap.get("quantity")));
                        oi.setPrice(extractDouble(itemMap.get("price")));
                        oi.setSize(extractString(itemMap.get("selectedSize")));
                        oi.setColor(extractString(itemMap.get("selectedColor")));
                        // Fetch product image
                        try {
                            String pid = oi.getProductId();
                            if (pid != null) {
                                productRepository.findById(pid).ifPresent(p ->
                                        oi.setImage(p.getImageUrl() != null ? p.getImageUrl()
                                                : "https://via.placeholder.com/120"));
                            }
                        } catch (Exception ignored) {
                            oi.setImage("https://via.placeholder.com/120");
                        }
                        orderItems.add(oi);
                    }
                }
            }

            // Simulate 80% success / 20% failure
            boolean paymentSucceeded = Math.random() < 0.80;
            String paymentStatus     = paymentSucceeded ? "paid" : "failed";

            // Build and save order regardless (admin can see both paid and failed demo orders)
            Order order = new Order();
            order.setId("DEMO" + System.currentTimeMillis());
            order.setUserId(userId);
            order.setCustomerName(customerName);
            order.setCustomerEmail(customerEmail);
            order.setCustomerPhone(customerPhone);
            order.setShippingAddress(shippingAddr);
            order.setTotalAmount(BigDecimal.valueOf(clientTotal));
            order.setPaymentMethod(Order.PaymentMethod.DEMO);
            order.setPaymentStatus(paymentSucceeded ? "PAID" : "FAILED");
            order.setStatus(paymentSucceeded ? Order.OrderStatus.CONFIRMED : Order.OrderStatus.CANCELLED);
            order.setCreatedAt(LocalDateTime.now());
            order.setUpdatedAt(LocalDateTime.now());
            if (paymentSucceeded) order.setConfirmedAt(LocalDateTime.now());
            order.setOrderItems(orderItems);

            Order savedOrder = orderRepository.save(order);

            log.info("Demo payment {} for order {} (user: {})",
                    paymentStatus, savedOrder.getId(), userId);

            return ResponseEntity.ok(Map.of(
                    "orderId",        savedOrder.getId(),
                    "paymentStatus",  paymentStatus,
                    "paymentMethod",  paymentMethod,
                    "totalAmount",    clientTotal,
                    "demo",           true,
                    "message",        paymentSucceeded
                            ? "Demo payment successful"
                            : "Demo payment declined (simulated failure)"
            ));

        } catch (Exception e) {
            log.error("Demo payment error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Demo payment processing error: " + e.getMessage()));
        }
    }

    // ── Helper: extract Integer ────────────────────────────────────────────────
    private Integer extractInteger(Object obj) {
        if (obj == null) return 1;
        if (obj instanceof Number n) return n.intValue();
        try { return Integer.parseInt(obj.toString()); } catch (Exception e) { return 1; }
    }

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }

        try {
            Object amountObj = body.get("amount");
            String internalOrderId = extractString(body.get("orderId"));
            String currency = extractString(body.get("currency"));
            if (currency == null || currency.isBlank()) currency = "INR";

            if (amountObj == null || internalOrderId == null || internalOrderId.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "amount and orderId are required"));
            }

            double amountRupees = extractDouble(amountObj);
            if (amountRupees <= 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid amount"));
            }

            String authenticatedUserId = getAuthenticatedUserId(authentication);
            Optional<Order> orderOpt = orderRepository.findById(internalOrderId);
            if (orderOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Order not found"));
            }
            Order order = orderOpt.get();
            if (!order.getUserId().equals(authenticatedUserId)) {
                log.warn("User {} tried to pay for order {} owned by {}",
                        authenticatedUserId, internalOrderId, order.getUserId());
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied"));
            }

            double storedAmount = order.getTotalAmount() != null
                    ? order.getTotalAmount().doubleValue()
                    : order.getTotal();
            if (Math.abs(storedAmount - amountRupees) > 0.01) {
                log.warn("Amount mismatch for order {}: client sent {} but DB has {}",
                        internalOrderId, amountRupees, storedAmount);
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Amount mismatch — please reload the page"));
            }

            long amountPaise = Math.round(amountRupees * 100);

            JSONObject razorpayOrder = razorpayService.createOrder(
                    amountPaise, currency, internalOrderId);

            return ResponseEntity.ok(Map.of(
                    "razorpayOrderId", razorpayOrder.getString("id"),
                    "amount",          razorpayOrder.getLong("amount"),
                    "currency",        razorpayOrder.getString("currency"),
                    "keyId",           razorpayService.getKeyId()
            ));

        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Payment gateway error. Please try again."));
        } catch (Exception e) {
            log.error("Unexpected error in createOrder: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }

        String razorpayOrderId   = body.get("razorpayOrderId");
        String razorpayPaymentId = body.get("razorpayPaymentId");
        String razorpaySignature = body.get("razorpaySignature");
        String internalOrderId   = body.get("orderId");

        if (razorpayOrderId == null || razorpayPaymentId == null
                || razorpaySignature == null || internalOrderId == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing payment verification fields"));
        }

        try {
            boolean valid = razorpayService.verifyPaymentSignature(
                    razorpayOrderId, razorpayPaymentId, razorpaySignature);

            if (!valid) {
                log.warn("Invalid Razorpay signature for order {} / payment {}",
                        razorpayOrderId, razorpayPaymentId);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false,
                                "error", "Payment verification failed — invalid signature"));
            }

            String authenticatedUserId = getAuthenticatedUserId(authentication);
            Optional<Order> orderOpt = orderRepository.findById(internalOrderId);
            if (orderOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Order not found"));
            }
            Order order = orderOpt.get();
            if (!order.getUserId().equals(authenticatedUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied"));
            }

            if ("COMPLETED".equalsIgnoreCase(order.getPaymentStatus())) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "orderId", internalOrderId,
                        "message", "Payment already verified"));
            }

            order.setPaymentStatus("COMPLETED");
            order.setPaymentMethod(Order.PaymentMethod.ONLINE);
            order.setStatus(Order.OrderStatus.CONFIRMED);
            order.setRazorpayOrderId(razorpayOrderId);
            order.setRazorpayPaymentId(razorpayPaymentId);
            order.setRazorpaySignature(razorpaySignature);
            order.setUpdatedAt(LocalDateTime.now());
            order.setConfirmedAt(LocalDateTime.now());
            orderRepository.save(order);

            log.info("Payment verified and order {} updated — paymentId: {}",
                    internalOrderId, razorpayPaymentId);

            return ResponseEntity.ok(Map.of(
                    "success",   true,
                    "orderId",   internalOrderId,
                    "message",   "Payment verified successfully"));

        } catch (Exception e) {
            log.error("Error verifying payment: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "Internal server error"));
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String webhookSignature) {

        if (webhookSignature == null || webhookSignature.isBlank()) {
            log.warn("Webhook received without signature — rejected");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            boolean validWebhook = razorpayService.verifyWebhookSignature(payload, webhookSignature);
            if (!validWebhook) {
                log.warn("Invalid webhook signature — rejected");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            JSONObject event = new JSONObject(payload);
            String eventType = event.optString("event");
            log.info("Razorpay webhook event: {}", eventType);

            switch (eventType) {
                case "payment.captured" -> handlePaymentCaptured(event);
                case "payment.failed"   -> handlePaymentFailed(event);
                case "refund.created"   -> handleRefundCreated(event);
                default -> log.info("Unhandled webhook event: {}", eventType);
            }

            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("Webhook processing error: {}", e.getMessage());
            return ResponseEntity.ok().build();
        }
    }

    private void handlePaymentCaptured(JSONObject event) {
        try {
            JSONObject paymentEntity = event
                    .getJSONObject("payload")
                    .getJSONObject("payment")
                    .getJSONObject("entity");

            String razorpayPaymentId = paymentEntity.optString("id");
            String razorpayOrderId   = paymentEntity.optString("order_id");
            String notes             = paymentEntity.optJSONObject("notes") != null
                    ? paymentEntity.getJSONObject("notes").optString("orderId")
                    : null;

            Order order = null;
            if (notes != null && !notes.isBlank()) {
                order = orderRepository.findById(notes).orElse(null);
            }
            if (order == null && razorpayOrderId != null) {
                order = orderRepository.findByRazorpayOrderId(razorpayOrderId).orElse(null);
            }

            if (order != null && !"COMPLETED".equalsIgnoreCase(order.getPaymentStatus())) {
                order.setPaymentStatus("COMPLETED");
                order.setRazorpayPaymentId(razorpayPaymentId);
                order.setRazorpayOrderId(razorpayOrderId);
                order.setStatus(Order.OrderStatus.CONFIRMED);
                order.setUpdatedAt(LocalDateTime.now());
                orderRepository.save(order);
                log.info("Webhook: payment captured for order {}", order.getId());
            }
        } catch (Exception e) {
            log.error("Error handling payment.captured webhook: {}", e.getMessage());
        }
    }

    private void handlePaymentFailed(JSONObject event) {
        try {
            JSONObject paymentEntity = event
                    .getJSONObject("payload")
                    .getJSONObject("payment")
                    .getJSONObject("entity");

            String razorpayOrderId = paymentEntity.optString("order_id");
            String notes = paymentEntity.optJSONObject("notes") != null
                    ? paymentEntity.getJSONObject("notes").optString("orderId")
                    : null;

            Order order = null;
            if (notes != null && !notes.isBlank()) {
                order = orderRepository.findById(notes).orElse(null);
            }
            if (order == null && razorpayOrderId != null) {
                order = orderRepository.findByRazorpayOrderId(razorpayOrderId).orElse(null);
            }

            if (order != null) {
                order.setPaymentStatus("FAILED");
                order.setUpdatedAt(LocalDateTime.now());
                orderRepository.save(order);
                log.info("Webhook: payment failed for order {}", order.getId());
            }
        } catch (Exception e) {
            log.error("Error handling payment.failed webhook: {}", e.getMessage());
        }
    }

    private void handleRefundCreated(JSONObject event) {
        try {
            JSONObject refundEntity = event
                    .getJSONObject("payload")
                    .getJSONObject("refund")
                    .getJSONObject("entity");
            String paymentId = refundEntity.optString("payment_id");
            log.info("Webhook: refund created for payment {}", paymentId);
        } catch (Exception e) {
            log.error("Error handling refund.created webhook: {}", e.getMessage());
        }
    }

    private String getAuthenticatedUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof JwtAuthenticationFilter.UserPrincipal up) {
            return up.getId();
        }
        return principal.toString();
    }

    private String extractString(Object obj) {
        if (obj == null) return null;
        String s = obj.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private double extractDouble(Object obj) {
        if (obj instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(obj.toString()); } catch (Exception e) { return 0; }
    }
}
