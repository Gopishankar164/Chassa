package com.aaradhana.aaradhana.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.*;

@Data
@Document(collection = "users")
public class User {
    @Id private String id;
    private String name;
    private String email;
    private String password;
    private String googleId;
    private String picture;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private boolean emailVerified = false;
    private String emailVerificationCode;
    private Date emailVerificationExpiry;
    private String resetPasswordToken;
    private Date resetPasswordExpiry;
    private List<CartItem> cart = new ArrayList<>();
    private List<String> wishlist = new ArrayList<>();

    // Saved delivery coordinates
    private Double deliveryLat;
    private Double deliveryLng;
    private String deliveryLocationLabel; // human-readable label saved by user

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getGoogleId() { return googleId; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }
    public String getPicture() { return picture; }
    public void setPicture(String picture) { this.picture = picture; }
    public List<CartItem> getCart() { return cart; }
    public void setCart(List<CartItem> cart) { this.cart = cart; }
    public List<String> getWishlist() { return wishlist != null ? wishlist : new ArrayList<>(); }
    public void setWishlist(List<String> wishlist) { this.wishlist = wishlist; }
    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
    public String getEmailVerificationCode() { return emailVerificationCode; }
    public void setEmailVerificationCode(String emailVerificationCode) { this.emailVerificationCode = emailVerificationCode; }
    public Date getEmailVerificationExpiry() { return emailVerificationExpiry; }
    public void setEmailVerificationExpiry(Date emailVerificationExpiry) { this.emailVerificationExpiry = emailVerificationExpiry; }
    public String getResetPasswordToken() { return resetPasswordToken; }
    public void setResetPasswordToken(String resetPasswordToken) { this.resetPasswordToken = resetPasswordToken; }
    public Date getResetPasswordExpiry() { return resetPasswordExpiry; }
    public void setResetPasswordExpiry(Date resetPasswordExpiry) { this.resetPasswordExpiry = resetPasswordExpiry; }

    @Data
    public static class CartItem {
        private String productId;
        private int quantity = 1;
        private String selectedSize;
        private String selectedColor;

        public CartItem() {}
        public CartItem(String productId, int quantity, String selectedSize, String selectedColor) {
            this.productId = productId; this.quantity = quantity;
            this.selectedSize = selectedSize; this.selectedColor = selectedColor;
        }
        public String getProductId() { return productId; }
        public void setProductId(String productId) { this.productId = productId; }
        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
        public String getSelectedSize() { return selectedSize; }
        public void setSelectedSize(String selectedSize) { this.selectedSize = selectedSize; }
        public String getSelectedColor() { return selectedColor; }
        public void setSelectedColor(String selectedColor) { this.selectedColor = selectedColor; }
    }
}
