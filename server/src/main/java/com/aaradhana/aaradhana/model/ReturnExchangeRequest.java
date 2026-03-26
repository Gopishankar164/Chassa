package com.aaradhana.aaradhana.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "return_exchange_requests")
public class ReturnExchangeRequest {
    @Id private String id;
    private String orderId;
    private String customerId;
    private String customerName;
    private String customerEmail;
    private String requestType;
    private List<String> selectedItems;
    private String reason;
    private String description;
    private List<String> imageUrls;
    private String status;
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
