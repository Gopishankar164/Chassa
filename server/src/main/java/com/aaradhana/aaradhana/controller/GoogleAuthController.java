package com.aaradhana.aaradhana.controller;

import com.aaradhana.aaradhana.model.User;
import com.aaradhana.aaradhana.repository.UserRepository;
import com.aaradhana.aaradhana.util.JwtUtil;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.Map;
import java.io.IOException;

@RestController
@RequestMapping("/api/auth")
public class GoogleAuthController {

    private final UserRepository userRepository;

    @Value("${google.clientId}")
    private String googleClientId;

    public GoogleAuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleSignIn(@RequestBody Map<String, String> body) {
        String credential = body.get("credential");
        if (credential == null || credential.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing credential"));
        }

        try {
            GoogleIdToken.Payload payload = verifyIdToken(credential);
            if (payload == null || payload.getEmail() == null || !Boolean.TRUE.equals(payload.getEmailVerified())) {
                return ResponseEntity.status(401).body(Map.of("message", "Invalid or unverified Google token"));
            }

            String googleId = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");

            User user = userRepository.findByEmail(email).orElseGet(User::new);
            if (user.getId() == null) user.setEmail(email);
            if (name != null && (user.getName() == null || user.getName().isBlank())) user.setName(name);
            user.setGoogleId(googleId);
            if (picture != null) user.setPicture(picture);
            if (user.getPassword() == null) user.setPassword("");
            user.setEmailVerified(true);

            User saved = userRepository.save(user);
            saved.setPassword(null);

            String token = JwtUtil.generateToken(saved);
            return ResponseEntity.ok(Map.of(
                    "user", Map.of(
                            "id", saved.getId(),
                            "email", saved.getEmail(),
                            "name", saved.getName(),
                            "picture", saved.getPicture()),
                    "token", token));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Google token verification failed"));
        }
    }

    private GoogleIdToken.Payload verifyIdToken(String idToken) throws GeneralSecurityException, IOException {
        var httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        var jsonFactory = JacksonFactory.getDefaultInstance();
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(httpTransport, jsonFactory)
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        GoogleIdToken token = verifier.verify(idToken);
        return token != null ? token.getPayload() : null;
    }
}
