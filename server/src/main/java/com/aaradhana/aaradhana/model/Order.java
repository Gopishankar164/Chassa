package com.aaradhana.aaradhana.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;

@Data
@Document(collection = "orders")
@CompoundIndexes({
        @CompoundIndex(name = "user_created_idx", def = "{'userId': 1, 'createdAt': -1}"),
        @CompoundIndex(name = "status_created_idx", def = "{'status': 1, 'createdAt': -1}"),
        @CompoundIndex(name = "payment_status_idx", def = "{'paymentStatus': 1, 'createdAt': -1}")
})
public class Order {
    @Id
    private String id;

    @Indexed
    private String userId;

    @Field("items")
    private List<OrderItem> items;

    private double total;

    @Indexed
    private OrderStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String paymentStatus;
    private String customerName;

    @Indexed
    private String customerEmail;
    private String customerPhone;
    private String shippingAddress;
    private BigDecimal totalAmount;
    private PaymentMethod paymentMethod;
    private List<OrderItem> orderItems;

    public enum OrderStatus {
        PENDING, CONFIRMED, PROCESSING, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
    }

    public enum PaymentMethod {
        COD, ONLINE, UPI
    }

    public void setOrderItems(List<OrderItem> orderItems) {
        this.orderItems = orderItems;
        this.items = orderItems;
    }

    public List<OrderItem> getOrderItems() {
        return this.orderItems != null ? this.orderItems : this.items;
    }

    public void setTotalAmount(BigDecimal amount) {
        this.totalAmount = amount;
        if (amount != null) this.total = amount.doubleValue();
    }

    public BigDecimal getTotalAmount() {
        return this.totalAmount != null ? this.totalAmount : BigDecimal.valueOf(this.total);
    }

    public void setStatus(OrderStatus status) { this.status = status; }

    public void setStatus(String statusStr) {
        if (statusStr != null) {
            try { this.status = OrderStatus.valueOf(statusStr.toUpperCase()); }
            catch (IllegalArgumentException e) { this.status = OrderStatus.PENDING; }
        }
    }

    public String getStatusString() { return this.status != null ? this.status.name() : "PENDING"; }

    public void setPaymentMethod(PaymentMethod method) { this.paymentMethod = method; }

    public void setPaymentMethod(String methodStr) {
        if (methodStr != null) {
            try { this.paymentMethod = PaymentMethod.valueOf(methodStr.toUpperCase()); }
            catch (IllegalArgumentException e) { this.paymentMethod = PaymentMethod.COD; }
        }
    }

    private String cancellationReason;
    private LocalDateTime cancelledAt;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
    private String expectedDelivery;
    private LocalDateTime confirmedAt;
    private LocalDateTime processingAt;
    private LocalDateTime shippedAt;
    private LocalDateTime outForDeliveryAt;
    private LocalDateTime deliveredAt;

    // Live delivery tracking
    private DeliveryLocation deliveryLocation;
    private java.util.List<DeliveryLocation> deliveryPath;

    // Customer's saved delivery coordinates (copied from User profile at order time)
    private Double destinationLat;
    private Double destinationLng;

    @lombok.Data
    public static class DeliveryLocation {
        private double lat;
        private double lng;
        private LocalDateTime updatedAt;
    }
}
