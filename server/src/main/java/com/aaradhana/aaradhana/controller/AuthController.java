package com.aaradhana.aaradhana.controller;

import com.aaradhana.aaradhana.config.JwtAuthenticationFilter;
import com.aaradhana.aaradhana.model.Admin;
import com.aaradhana.aaradhana.repository.AdminRepository;
import com.aaradhana.aaradhana.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/admin/login")
    public ResponseEntity<?> adminLogin(@RequestBody Map<String, String> loginRequest) {
        try {
            String email = loginRequest.get("email");
            String password = loginRequest.get("password");

            Admin admin = adminRepository.findByEmail(email);

            if (admin != null && admin.getPassword().equals(password)) {
                String token = JwtUtil.generateToken(admin);

                return ResponseEntity.ok(Map.of(
                        "token", token,
                        "admin", Map.of(
                                "id", admin.getId(),
                                "email", admin.getEmail(),
                                "name", admin.getName() != null ? admin.getName() : "Admin"),
                        "message", "Login successful"));
            } else {
                return ResponseEntity.status(401)
                        .body(Map.of("message", "Invalid email or password"));
            }
        } catch (Exception e) {
            System.err.println("Admin login error: " + e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Login failed: " + e.getMessage()));
        }
    }

    @PostMapping("/create-test-admin")
    public ResponseEntity<?> createTestAdmin() {
        Admin admin = new Admin();
        admin.setEmail("admin@test.com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setName("Test Admin");
        adminRepository.save(admin);
        return ResponseEntity.ok(Map.of("message", "Test admin created"));
    }

    // Helper: get Admin from JWT principal (subject = admin ID)
    private Admin getAdminFromAuth(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) return null;
        try {
            // Principal is JwtAuthenticationFilter.UserPrincipal — getId() returns the admin's MongoDB _id
            JwtAuthenticationFilter.UserPrincipal principal =
                    (JwtAuthenticationFilter.UserPrincipal) authentication.getPrincipal();
            return adminRepository.findById(principal.getId()).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    @PutMapping("/admin/change-password")
    public ResponseEntity<?> changeAdminPassword(@RequestBody Map<String, String> req, Authentication authentication) {
        try {
            String currentPassword = req.get("currentPassword");
            String newPassword = req.get("newPassword");

            if (authentication == null)
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized. Please log in as admin."));
            if (currentPassword == null || newPassword == null || newPassword.length() < 6)
                return ResponseEntity.badRequest().body(Map.of("message", "New password must be at least 6 characters."));

            Admin admin = getAdminFromAuth(authentication);
            if (admin == null)
                return ResponseEntity.status(404).body(Map.of("message", "Admin not found"));

            // Verify current password (supports both plain-text and bcrypt stored passwords)
            boolean matches = admin.getPassword().equals(currentPassword) ||
                    passwordEncoder.matches(currentPassword, admin.getPassword());
            if (!matches)
                return ResponseEntity.status(401).body(Map.of("message", "Current password is incorrect"));

            admin.setPassword(newPassword); // keep same storage format as login logic
            adminRepository.save(admin);
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error updating password: " + e.getMessage()));
        }
    }

    @PutMapping("/admin/change-email")
    public ResponseEntity<?> changeAdminEmail(@RequestBody Map<String, String> req, Authentication authentication) {
        try {
            String currentPassword = req.get("currentPassword");
            String newEmail = req.get("newEmail");

            if (authentication == null)
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized. Please log in as admin."));
            if (currentPassword == null || newEmail == null || !newEmail.contains("@"))
                return ResponseEntity.badRequest().body(Map.of("message", "Please provide a valid email address."));

            Admin admin = getAdminFromAuth(authentication);
            if (admin == null)
                return ResponseEntity.status(404).body(Map.of("message", "Admin not found"));

            // Verify current password
            boolean matches = admin.getPassword().equals(currentPassword) ||
                    passwordEncoder.matches(currentPassword, admin.getPassword());
            if (!matches)
                return ResponseEntity.status(401).body(Map.of("message", "Current password is incorrect"));

            // Check new email is not already taken by another admin
            Admin existing = adminRepository.findByEmail(newEmail);
            if (existing != null && !existing.getId().equals(admin.getId()))
                return ResponseEntity.badRequest().body(Map.of("message", "This email is already in use"));

            admin.setEmail(newEmail);
            adminRepository.save(admin);
            return ResponseEntity.ok(Map.of("message", "Email updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error updating email: " + e.getMessage()));
        }
    }
}
