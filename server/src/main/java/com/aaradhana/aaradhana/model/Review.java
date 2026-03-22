package com.aaradhana.aaradhana.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "reviews")
public class Review {
    @Id private String id;
    private String productId;
    private String userId;
    private String userName;
    private String userEmail;
    private Integer rating;
    private String title;
    private String comment;
    private List<String> images;
    private LocalDateTime createdAt = LocalDateTime.now();
    private Boolean verified = false;
    private Integer helpfulCount = 0;
    private List<String> helpfulUserIds = new ArrayList<>();
    private String orderNumber;
}
