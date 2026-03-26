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

    // ── Admin / Staff Login ─────────────────────────────────────────────────
    // Works for both ADMIN and STAFF accounts.
    // The response now includes the `role` field so the frontend can save it
    // to localStorage and apply the correct route guards / sidebar.
    @PostMapping("/admin/login")
    public ResponseEntity<?> adminLogin(@RequestBody Map<String, String> loginRequest) {
        try {
            String email    = loginRequest.get("email");
            String password = loginRequest.get("password");

            Admin admin = adminRepository.findByEmail(email);

            if (admin == null) {
                return ResponseEntity.status(401)
                        .body(Map.of("message", "Invalid email or password"));
            }

            // Check active flag — soft-disabled staff should not be able to login
            if (Boolean.FALSE.equals(admin.getActive())) {
                return ResponseEntity.status(403)
                        .body(Map.of("message", "This account has been deactivated. Contact an administrator."));
            }

            boolean passwordOk = passwordEncoder.matches(password, admin.getPassword())
                    || admin.getPassword().equals(password); // plain-text fallback for dev

            if (!passwordOk) {
                return ResponseEntity.status(401)
                        .body(Map.of("message", "Invalid email or password"));
            }

            // Token embeds the correct role (ADMIN or STAFF)
            String token = JwtUtil.generateToken(admin);

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "admin", Map.of(
                            "id",    admin.getId(),
                            "email", admin.getEmail(),
                            "name",  admin.getName() != null ? admin.getName() : "Admin",
                            "role",  admin.getRole()   // ← "ADMIN" or "STAFF"
                    ),
                    "message", "Login successful"
            ));

        } catch (Exception e) {
            System.err.println("Admin login error: " + e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Login failed: " + e.getMessage()));
        }
    }

    // ── Helper ──────────────────────────────────────────────────────────────
    @PostMapping("/create-test-admin")
    public ResponseEntity<?> createTestAdmin() {
        Admin admin = new Admin();
        admin.setEmail("admin@test.com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setName("Test Admin");
        admin.setRole("ADMIN");
        adminRepository.save(admin);
        return ResponseEntity.ok(Map.of("message", "Test admin created"));
    }

    // ── Resolve Admin from JWT principal ────────────────────────────────────
    private Admin getAdminFromAuth(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) return null;
        try {
            JwtAuthenticationFilter.UserPrincipal principal =
                    (JwtAuthenticationFilter.UserPrincipal) authentication.getPrincipal();
            return adminRepository.findById(principal.getId()).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    // ── Change Password ──────────────────────────────────────────────────────
    @PutMapping("/admin/change-password")
    public ResponseEntity<?> changeAdminPassword(@RequestBody Map<String, String> req,
                                                  Authentication authentication) {
        try {
            String currentPassword = req.get("currentPassword");
            String newPassword     = req.get("newPassword");

            if (authentication == null)
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized. Please log in."));
            if (currentPassword == null || newPassword == null || newPassword.length() < 6)
                return ResponseEntity.badRequest().body(Map.of("message", "New password must be at least 6 characters."));

            Admin admin = getAdminFromAuth(authentication);
            if (admin == null)
                return ResponseEntity.status(404).body(Map.of("message", "Account not found"));

            boolean matches = admin.getPassword().equals(currentPassword)
                    || passwordEncoder.matches(currentPassword, admin.getPassword());
            if (!matches)
                return ResponseEntity.status(401).body(Map.of("message", "Current password is incorrect"));

            admin.setPassword(newPassword);
            adminRepository.save(admin);
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error: " + e.getMessage()));
        }
    }

    // ── Change Email ─────────────────────────────────────────────────────────
    @PutMapping("/admin/change-email")
    public ResponseEntity<?> changeAdminEmail(@RequestBody Map<String, String> req,
                                               Authentication authentication) {
        try {
            String currentPassword = req.get("currentPassword");
            String newEmail        = req.get("newEmail");

            if (authentication == null)
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized. Please log in."));
            if (currentPassword == null || newEmail == null || !newEmail.contains("@"))
                return ResponseEntity.badRequest().body(Map.of("message", "Please provide a valid email address."));

            Admin admin = getAdminFromAuth(authentication);
            if (admin == null)
                return ResponseEntity.status(404).body(Map.of("message", "Account not found"));

            boolean matches = admin.getPassword().equals(currentPassword)
                    || passwordEncoder.matches(currentPassword, admin.getPassword());
            if (!matches)
                return ResponseEntity.status(401).body(Map.of("message", "Current password is incorrect"));

            Admin existing = adminRepository.findByEmail(newEmail);
            if (existing != null && !existing.getId().equals(admin.getId()))
                return ResponseEntity.badRequest().body(Map.of("message", "This email is already in use"));

            admin.setEmail(newEmail);
            adminRepository.save(admin);
            return ResponseEntity.ok(Map.of("message", "Email updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error: " + e.getMessage()));
        }
    }
}
