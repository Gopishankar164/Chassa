package com.aaradhana.aaradhana.util;

import com.aaradhana.aaradhana.model.Admin;
import com.aaradhana.aaradhana.model.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secretKeyConfig;

    private static Key key;

    // Token validity — 7 days
    private static final long EXPIRATION_TIME = 1000L * 60 * 60 * 24 * 7;

    @PostConstruct
    public void init() {
        byte[] keyBytes = secretKeyConfig.getBytes();
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                "JWT secret must be at least 256 bits (32 characters). " +
                "Set a strong JWT_SECRET environment variable.");
        }
        key = Keys.hmacShaKeyFor(keyBytes);
    }

    // Generate token from User object
    public static String generateToken(User user) {
        return Jwts.builder()
                .setSubject(user.getId())
                .claim("email", user.getEmail())
                .claim("role", "USER")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key)
                .compact();
    }

    // Generate token from Admin object
    public static String generateToken(Admin admin) {
        return Jwts.builder()
                .setSubject(admin.getId())
                .claim("email", admin.getEmail())
                .claim("role", "ADMIN")
                .claim("name", admin.getName())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key)
                .compact();
    }

    public static String getUserId(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public static String getRole(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .get("role", String.class);
        } catch (Exception e) {
            return "USER";
        }
    }

    public static String getEmail(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .get("email", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    public static boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
