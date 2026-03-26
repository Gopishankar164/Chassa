package com.aaradhana.aaradhana.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "wishlists")
public class Wishlist {
    @Id
    private String id;
    private String userId;
    private List<WishlistItem> items = new ArrayList<>();

    @Data
    public static class WishlistItem {
        private String productId;
        private LocalDateTime addedAt;

        public WishlistItem() {}

        public WishlistItem(String productId) {
            this.productId = productId;
            this.addedAt = LocalDateTime.now();
        }
    }
}
