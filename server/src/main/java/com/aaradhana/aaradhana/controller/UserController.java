package com.aaradhana.aaradhana.controller;

import com.aaradhana.aaradhana.config.JwtAuthenticationFilter;
import com.aaradhana.aaradhana.model.Product;
import com.aaradhana.aaradhana.model.User;
import com.aaradhana.aaradhana.repository.ProductRepository;
import com.aaradhana.aaradhana.repository.UserRepository;
import com.aaradhana.aaradhana.service.SendGridEmailService;
import com.aaradhana.aaradhana.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Autowired
    private SendGridEmailService emailService;

    public static class ProductRequest { public String productId; }

    public static class CartItemRequest {
        public String productId;
        public int quantity = 1;
        public String selectedSize;
        public String selectedColor;
    }

    public static class CartUpdateRequest {
        public String productId;
        public int quantity;
        public String selectedSize;
        public String selectedColor;
    }

    public static class ApiResponse {
        public String message;
        public ApiResponse(String message) { this.message = message; }
    }

    private String normalizeString(String value) {
        return (value == null || value.trim().isEmpty()) ? "" : value.trim();
    }

    private String getAuthUserId(Authentication authentication) {
        return ((JwtAuthenticationFilter.UserPrincipal) authentication.getPrincipal()).getId();
    }

    @GetMapping
    public List<User> getAllUsers() { return userRepository.findAll(); }

    // Admin: get a single user by ID (used for fetching delivery coordinates)
    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserById(@PathVariable String userId) {
        return userRepository.findById(userId)
            .<ResponseEntity<?>>map(u -> ResponseEntity.ok(Map.of(
                "id", u.getId() != null ? u.getId() : "",
                "deliveryLat", u.getDeliveryLat() != null ? u.getDeliveryLat() : 0.0,
                "deliveryLng", u.getDeliveryLng() != null ? u.getDeliveryLng() : 0.0,
                "deliveryLocationLabel", u.getDeliveryLocationLabel() != null ? u.getDeliveryLocationLabel() : ""
            )))
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/test-reload")
    public ResponseEntity<String> testReload() { return ResponseEntity.ok("Code reloaded successfully - " + System.currentTimeMillis()); }

    @PostMapping("/create")
    public ResponseEntity<?> createUser(@RequestBody User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent())
            return new ResponseEntity<>(new ApiResponse("Email already exists"), HttpStatus.CONFLICT);

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setEmailVerified(false);
        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1000000));
        user.setEmailVerificationCode(code);
        user.setEmailVerificationExpiry(Date.from(Instant.now().plus(15, ChronoUnit.MINUTES)));
        User savedUser = userRepository.save(user);

        try { emailService.sendVerificationCode(savedUser.getEmail(), code); }
        catch (Exception e) { System.err.println("Failed to send verification email: " + e.getMessage()); }

        return new ResponseEntity<>(Map.of("message", "Signup successful. Please verify your email with the 6-digit code sent.", "email", savedUser.getEmail()), HttpStatus.CREATED);
    }

    public static class VerifyRequest { public String email; public String code; }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody VerifyRequest req) {
        if (req == null || req.email == null || req.code == null)
            return ResponseEntity.badRequest().body(new ApiResponse("Email and code are required"));

        Optional<User> opt = userRepository.findByEmail(req.email);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse("User not found"));

        User u = opt.get();
        if (u.isEmailVerified()) return ResponseEntity.ok(new ApiResponse("Email already verified"));

        if (u.getEmailVerificationExpiry() == null || u.getEmailVerificationExpiry().before(new Date())) {
            try { userRepository.delete(u); } catch (Exception ex) { /* ignore */ }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse("Verification code expired. Account removed. Please sign up again."));
        }

        if (!req.code.equals(u.getEmailVerificationCode()))
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse("Invalid verification code"));

        u.setEmailVerified(true);
        u.setEmailVerificationCode(null);
        u.setEmailVerificationExpiry(null);
        userRepository.save(u);
        return ResponseEntity.ok(new ApiResponse("Email verified successfully"));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null) return ResponseEntity.badRequest().body(new ApiResponse("Email is required"));
        Optional<User> opt = userRepository.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse("User not found"));
        User u = opt.get();
        if (u.isEmailVerified()) return ResponseEntity.ok(new ApiResponse("Email already verified"));

        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1000000));
        u.setEmailVerificationCode(code);
        u.setEmailVerificationExpiry(Date.from(Instant.now().plus(15, ChronoUnit.MINUTES)));
        userRepository.save(u);
        try { emailService.sendVerificationCode(u.getEmail(), code); } catch (Exception ignored) {}
        return ResponseEntity.ok(new ApiResponse("Verification code resent"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null) return ResponseEntity.badRequest().body(new ApiResponse("Email is required"));
        Optional<User> opt = userRepository.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.ok(new ApiResponse("If the email exists, a reset link has been sent"));
        User u = opt.get();
        u.setResetPasswordToken(UUID.randomUUID().toString());
        u.setResetPasswordExpiry(Date.from(Instant.now().plus(15, ChronoUnit.MINUTES)));
        userRepository.save(u);
        try { emailService.sendPasswordResetLink(u.getEmail(), u.getResetPasswordToken()); } catch (Exception ignored) {}
        return ResponseEntity.ok(new ApiResponse("If the email exists, a reset link has been sent"));
    }

    public static class ResetRequest { public String token; public String newPassword; }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetRequest req) {
        if (req == null || req.token == null || req.newPassword == null)
            return ResponseEntity.badRequest().body(new ApiResponse("Token and newPassword are required"));

        Optional<User> opt = userRepository.findAll().stream().filter(u -> req.token.equals(u.getResetPasswordToken())).findFirst();
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse("Invalid token"));
        User u = opt.get();
        if (u.getResetPasswordExpiry() == null || u.getResetPasswordExpiry().before(new Date()))
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse("Token expired"));

        u.setPassword(passwordEncoder.encode(req.newPassword));
        u.setResetPasswordToken(null);
        u.setResetPasswordExpiry(null);
        userRepository.save(u);
        return ResponseEntity.ok(new ApiResponse("Password reset successful"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        Optional<User> opt = userRepository.findByEmail(loginRequest.getEmail());
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiResponse("Invalid email or password"));
        User u = opt.get();
        if (!Boolean.TRUE.equals(u.isEmailVerified())) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse("Email not verified. Please verify your email."));
        if (!passwordEncoder.matches(loginRequest.getPassword(), u.getPassword())) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiResponse("Invalid email or password"));
        u.setPassword(null);
        return ResponseEntity.ok(Map.of("user", u, "token", JwtUtil.generateToken(u)));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(Authentication authentication) {
        try {
            Optional<User> opt = userRepository.findById(getAuthUserId(authentication));
            if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse("User not found"));
            User user = opt.get();
            user.setPassword(null);
            return ResponseEntity.ok(Map.of("user", user, "token", JwtUtil.generateToken(user)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiResponse("Invalid token"));
        }
    }

    @GetMapping("/{id}/cart")
    public ResponseEntity<?> getCartForAdmin(@PathVariable String id, Authentication authentication) {
        String authId = getAuthUserId(authentication);
        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !authId.equals(id)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        return ResponseEntity.ok(opt.get());
    }

    @PostMapping("/{id}/cart/add")
    public ResponseEntity<?> addToCart(@PathVariable String id, @RequestBody CartItemRequest request, Authentication authentication) {
        if (!getAuthUserId(authentication).equals(id)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        User user = opt.get();
        List<User.CartItem> cart = user.getCart();
        Optional<User.CartItem> existingItem = cart.stream()
                .filter(item -> item.getProductId().equals(request.productId)
                        && Objects.equals(item.getSelectedSize(), request.selectedSize)
                        && Objects.equals(item.getSelectedColor(), request.selectedColor))
                .findFirst();

        if (existingItem.isPresent()) {
            existingItem.get().setQuantity(existingItem.get().getQuantity() + request.quantity);
        } else {
            cart.add(new User.CartItem(request.productId, request.quantity, request.selectedSize, request.selectedColor));
        }
        User updated = userRepository.save(user);
        updated.setPassword(null);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/cart/add-legacy")
    public ResponseEntity<?> addToCartLegacy(@PathVariable String id, @RequestBody ProductRequest request, Authentication authentication) {
        CartItemRequest r = new CartItemRequest();
        r.productId = request.productId;
        r.quantity = 1;
        return addToCart(id, r, authentication);
    }

    @PostMapping("/{id}/cart/remove-complete")
    public ResponseEntity<?> removeFromCart(@PathVariable String id, @RequestBody CartItemRequest request, Authentication authentication) {
        if (!getAuthUserId(authentication).equals(id)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        User user = opt.get();
        boolean removed = user.getCart().removeIf(item ->
                item.getProductId().equals(request.productId)
                && normalizeString(item.getSelectedSize()).equals(normalizeString(request.selectedSize))
                && normalizeString(item.getSelectedColor()).equals(normalizeString(request.selectedColor)));

        if (removed) { User u = userRepository.save(user); u.setPassword(null); return ResponseEntity.ok(u); }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse("Item not found in cart"));
    }

    @PostMapping("/{id}/cart/decrease")
    public ResponseEntity<?> decreaseCartItemQuantity(@PathVariable String id, @RequestBody CartItemRequest request, Authentication authentication) {
        if (!getAuthUserId(authentication).equals(id)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        User user = opt.get();
        Optional<User.CartItem> itemToUpdate = user.getCart().stream()
                .filter(item -> item.getProductId().equals(request.productId)
                        && normalizeString(item.getSelectedSize()).equals(normalizeString(request.selectedSize))
                        && normalizeString(item.getSelectedColor()).equals(normalizeString(request.selectedColor)))
                .findFirst();

        if (itemToUpdate.isPresent()) {
            User.CartItem item = itemToUpdate.get();
            if (item.getQuantity() > 1) item.setQuantity(item.getQuantity() - 1);
            else user.getCart().remove(item);
            User updated = userRepository.save(user);
            updated.setPassword(null);
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse("Item not found in cart"));
    }

    @PostMapping("/{id}/cart/remove-legacy")
    public ResponseEntity<?> removeFromCartLegacy(@PathVariable String id, @RequestBody ProductRequest request, Authentication authentication) {
        CartItemRequest r = new CartItemRequest();
        r.productId = request.productId;
        return removeFromCart(id, r, authentication);
    }

    @PostMapping("/{id}/cart/update")
    public ResponseEntity<?> updateCartItemQuantity(@PathVariable String id, @RequestBody CartUpdateRequest request, Authentication authentication) {
        if (!getAuthUserId(authentication).equals(id)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        User user = opt.get();
        Optional<User.CartItem> itemToUpdate = user.getCart().stream()
                .filter(item -> item.getProductId().equals(request.productId)
                        && normalizeString(item.getSelectedSize()).equals(normalizeString(request.selectedSize))
                        && normalizeString(item.getSelectedColor()).equals(normalizeString(request.selectedColor)))
                .findFirst();

        if (itemToUpdate.isPresent()) {
            if (request.quantity <= 0) user.getCart().remove(itemToUpdate.get());
            else itemToUpdate.get().setQuantity(request.quantity);
            User updated = userRepository.save(user);
            updated.setPassword(null);
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse("Item not found in cart"));
    }

    @GetMapping("/{id}/wishlist")
    public ResponseEntity<?> getWishlist(@PathVariable String id, Authentication authentication) {
        if (!getAuthUserId(authentication).equals(id)) return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        return ResponseEntity.ok(productRepository.findAllById(opt.get().getWishlist()));
    }

    @PostMapping("/{id}/wishlist")
    public ResponseEntity<?> addToWishlist(@PathVariable String id, @RequestBody Map<String, String> request, Authentication authentication) {
        if (!getAuthUserId(authentication).equals(id)) return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "User not found"));

        String productId = request.get("productId");
        User user = opt.get();
        List<String> wishlist = user.getWishlist();
        if (wishlist.contains(productId)) return ResponseEntity.ok(Map.of("message", "Product already in wishlist"));
        wishlist.add(productId);
        user.setWishlist(wishlist);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Added to wishlist", "wishlistCount", wishlist.size()));
    }

    @DeleteMapping("/{id}/wishlist/{productId}")
    public ResponseEntity<?> removeFromWishlist(@PathVariable String id, @PathVariable String productId, Authentication authentication) {
        if (!getAuthUserId(authentication).equals(id)) return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "User not found"));

        User user = opt.get();
        List<String> wishlist = user.getWishlist();
        boolean removed = wishlist.remove(productId);
        if (removed) { user.setWishlist(wishlist); userRepository.save(user); return ResponseEntity.ok(Map.of("message", "Removed from wishlist", "wishlistCount", wishlist.size())); }
        return ResponseEntity.ok(Map.of("message", "Product not in wishlist"));
    }

    @GetMapping("/{id}/wishlist/check/{productId}")
    public ResponseEntity<?> checkWishlist(@PathVariable String id, @PathVariable String productId, Authentication authentication) {
        if (!getAuthUserId(authentication).equals(id)) return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        return ResponseEntity.ok(Map.of("inWishlist", opt.get().getWishlist().contains(productId)));
    }

    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(Authentication authentication, @RequestBody Map<String, String> updateRequest) {
        Optional<User> opt = userRepository.findById(getAuthUserId(authentication));
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));

        User user = opt.get();
        if (updateRequest.containsKey("name") && !updateRequest.get("name").trim().isEmpty()) user.setName(updateRequest.get("name"));
        if (updateRequest.containsKey("phone")) user.setPhone(updateRequest.get("phone"));
        if (updateRequest.containsKey("address")) user.setAddress(updateRequest.get("address"));
        if (updateRequest.containsKey("city")) user.setCity(updateRequest.get("city"));
        if (updateRequest.containsKey("state")) user.setState(updateRequest.get("state"));
        if (updateRequest.containsKey("pincode")) user.setPincode(updateRequest.get("pincode"));
        if (updateRequest.containsKey("deliveryLocationLabel")) user.setDeliveryLocationLabel(updateRequest.get("deliveryLocationLabel"));
        if (updateRequest.containsKey("deliveryLat") && updateRequest.get("deliveryLat") != null) {
            try { user.setDeliveryLat(Double.parseDouble(updateRequest.get("deliveryLat"))); } catch (NumberFormatException ignored) {}
        }
        if (updateRequest.containsKey("deliveryLng") && updateRequest.get("deliveryLng") != null) {
            try { user.setDeliveryLng(Double.parseDouble(updateRequest.get("deliveryLng"))); } catch (NumberFormatException ignored) {}
        }

        User savedUser = userRepository.save(user);
        savedUser.setPassword(null);
        return ResponseEntity.ok(savedUser);
    }
}
