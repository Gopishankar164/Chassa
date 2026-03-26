package com.aaradhana.aaradhana.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

import java.util.*;

@Document(collection = "products")
@CompoundIndexes({
        @CompoundIndex(name = "name_category_idx", def = "{'name': 1, 'category': 1}"),
        @CompoundIndex(name = "category_price_idx", def = "{'category': 1, 'price': 1}"),
        @CompoundIndex(name = "brand_category_idx", def = "{'brand': 1, 'category': 1}"),
        @CompoundIndex(name = "featured_price_idx", def = "{'featured': 1, 'price': 1}")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id private String id;
    @Indexed private String name;
    @Indexed private String category;
    private Integer price;

    public String getTitle() { return this.name; }
    public String getImageUrl() { return images != null && !images.isEmpty() ? images.get(0) : null; }

    @Field("size") private ArrayList<String> size = new ArrayList<>();
    @Indexed private String brand;
    @Field("images") private ArrayList<String> images;
    private String description;
    private String material;
    private String care;
    private String countryOfOrigin;
    private String manufacturer;
    @Field("colors") private ArrayList<String> colors = new ArrayList<>();
    private String fit;
    private Boolean inStock;
    @Field("stock")
    private Integer stockQuantity;
    private String sku;
    @Field("tags") private ArrayList<String> tags = new ArrayList<>();
    private String longDescription;
    private String washingInstructions;
    @Field("sizeStock") private HashMap<String, Integer> sizeStock = new HashMap<>();
    private Boolean featured;
    private String createdAt;
    private String updatedAt;
    @Field("__v") private Integer version;
    private Double averageRating = 0.0;
    private Integer totalReviews = 0;

    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }
    public Integer getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Integer totalReviews) { this.totalReviews = totalReviews; }

    private Double discountPercentage;
    private Double discountedPrice;
    private Date discountStartDate;
    private Date discountEndDate;
    private Boolean isDiscountActive;

    public Double getDiscountPercentage() { return discountPercentage; }
    public void setDiscountPercentage(Double discountPercentage) { this.discountPercentage = discountPercentage; calculateDiscountedPrice(); }
    public Double getDiscountedPrice() { return discountedPrice; }
    public void setDiscountedPrice(Double discountedPrice) { this.discountedPrice = discountedPrice; }
    public Date getDiscountStartDate() { return discountStartDate; }
    public void setDiscountStartDate(Date discountStartDate) { this.discountStartDate = discountStartDate; }
    public Date getDiscountEndDate() { return discountEndDate; }
    public void setDiscountEndDate(Date discountEndDate) { this.discountEndDate = discountEndDate; }
    public Boolean getIsDiscountActive() { return isDiscountActive; }
    public void setIsDiscountActive(Boolean isDiscountActive) { this.isDiscountActive = isDiscountActive; }

    private void calculateDiscountedPrice() {
        if (discountPercentage != null && discountPercentage > 0 && price != null)
            this.discountedPrice = price - (price * discountPercentage / 100);
        else
            this.discountedPrice = price != null ? price.doubleValue() : null;
    }

    public void setPrice(Integer price) { this.price = price; calculateDiscountedPrice(); }
}
