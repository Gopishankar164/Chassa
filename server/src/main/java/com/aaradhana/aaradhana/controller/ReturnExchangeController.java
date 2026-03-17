package com.aaradhana.aaradhana.controller;

import com.aaradhana.aaradhana.model.Order;
import com.aaradhana.aaradhana.model.ReturnExchangeRequest;
import com.aaradhana.aaradhana.repository.OrderRepository;
import com.aaradhana.aaradhana.repository.ReturnExchangeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class ReturnExchangeController {

    @Autowired
    private ReturnExchangeRepository returnExchangeRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${admin.email}")
    private String adminEmail;

    @PostMapping("/orders/return-exchange")
    public ResponseEntity<?> submitReturnExchangeRequest(
            @RequestParam("orderId") String orderId,
            @RequestParam("requestType") String requestType,
            @RequestParam("items") String items,
            @RequestParam("reason") String reason,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "images", required = false) List<MultipartFile> images) {
        try {
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Order not found"));

            Order order = orderOpt.get();
            ReturnExchangeRequest request = new ReturnExchangeRequest();
            request.setOrderId(orderId);
            request.setCustomerId(order.getUserId());
            request.setCustomerName(order.getCustomerName());
            request.setCustomerEmail(order.getCustomerEmail());
            request.setRequestType(requestType.toUpperCase());
            request.setReason(reason);
            request.setDescription(description);
            request.setStatus("PENDING");
            request.setCreatedAt(LocalDateTime.now());
            request.setUpdatedAt(LocalDateTime.now());

            List<String> selectedItems = new ArrayList<>();
            selectedItems.add(items);
            request.setSelectedItems(selectedItems);

            List<String> imageUrls = new ArrayList<>();
            if (images != null) {
                for (MultipartFile img : images) imageUrls.add(img.getOriginalFilename());
            }
            request.setImageUrls(imageUrls);
            returnExchangeRepository.save(request);
            sendAdminNotification(orderId, requestType, reason);

            return ResponseEntity.ok(Map.of("success", true, "message", "Return/Exchange request submitted successfully", "requestId", request.getId()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to submit request: " + e.getMessage()));
        }
    }

    @GetMapping("/admin/return-exchange")
    public ResponseEntity<?> getAllReturnExchangeRequests() {
        try {
            return ResponseEntity.ok(returnExchangeRepository.findAll());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to fetch requests: " + e.getMessage()));
        }
    }

    @PutMapping("/admin/return-exchange/{requestId}/status")
    public ResponseEntity<?> updateRequestStatus(@PathVariable String requestId, @RequestBody Map<String, String> payload) {
        try {
            Optional<ReturnExchangeRequest> reqOpt = returnExchangeRepository.findById(requestId);
            if (reqOpt.isEmpty()) return ResponseEntity.notFound().build();

            ReturnExchangeRequest request = reqOpt.get();
            request.setStatus(payload.get("status"));
            request.setAdminNotes(payload.get("adminNotes"));
            request.setUpdatedAt(LocalDateTime.now());
            returnExchangeRepository.save(request);

            return ResponseEntity.ok(Map.of("success", true, "message", "Request status updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to update status: " + e.getMessage()));
        }
    }

    private void sendAdminNotification(String orderId, String requestType, String reason) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(adminEmail);
            message.setSubject("🔄 New " + requestType.toUpperCase() + " Request - Order #" + orderId);
            message.setText(
                    "A new " + requestType + " request has been submitted.\n\n" +
                    "Order ID: #" + orderId + "\n" +
                    "Request Type: " + requestType.toUpperCase() + "\n" +
                    "Reason: " + reason + "\n\n" +
                    "Please review this request in the admin panel.\n\n" +
                    "Thank you,\n" +
                    "Aaradhana System");
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("❌ Failed to send email notification: " + e.getMessage());
        }
    }
}
