package com.aaradhana.aaradhana.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "complaints")
public class Complaint {
    @Id
    private String id;
    private String name;
    private String email;
    private String subject;
    private String message;
    private String orderNumber;
    private String status = "OPEN";
    private String createdAt;
}
