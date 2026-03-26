package com.aaradhana.aaradhana.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Field;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {
    @Field("id") private String id;
    @Field("productId") private String productId;
    @Field("productName") private String productName;
    @Field("quantity") private int quantity;
    @Field("price") private double price;
    @Field("size") private String size;
    @Field("color") private String color;
    @Field("discountedPrice") private Double discountedPrice;
    @Field("isDiscountActive") private Boolean isDiscountActive;
    @Field("discountPercentage") private Double discountPercentage;
    private transient Product product;
    @Field("image") private String image;
    @Field("images") private Object images;
}
