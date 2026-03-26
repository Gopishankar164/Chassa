package com.aaradhana.aaradhana.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
@EnableMethodSecurity
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private RateLimitFilter rateLimitFilter;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            .authorizeHttpRequests(auth -> auth

                // ── Public endpoints ─────────────────────────────────────────
                .requestMatchers("/api/health/**").permitAll()
                .requestMatchers("/api/users/login", "/api/users/create").permitAll()
                .requestMatchers("/api/auth/google").permitAll()
                .requestMatchers("/api/auth/admin/login").permitAll()
                .requestMatchers("/api/auth/create-test-admin").permitAll()
                .requestMatchers("/api/admin/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/payment/webhook").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/complaints").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/products", "/api/products/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/products/byIds").permitAll()
                .requestMatchers("/api/reviews/**").permitAll()
                .requestMatchers("/api/dashboard/stats").permitAll()
                .requestMatchers(
                    "/api/users/verify-email",
                    "/api/users/resend-verification",
                    "/api/users/forgot-password",
                    "/api/users/reset-password"
                ).permitAll()

                // ── Admin-only endpoints ─────────────────────────────────────
                // Complaints list, user management, staff management, order admin
                .requestMatchers(HttpMethod.GET,    "/api/complaints").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET,    "/api/users").hasRole("ADMIN")
                .requestMatchers("/api/admin/staff",       "/api/admin/staff/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/orders/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/user-orders/**").hasRole("ADMIN")

                // ── Product write access: ADMIN or STAFF ─────────────────────
                // Staff are allowed to create, update and delete products.
                .requestMatchers(HttpMethod.POST,   "/api/products").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers(HttpMethod.PUT,    "/api/products/**").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers("/api/admin/products/**").hasAnyRole("ADMIN", "STAFF")

                // ── Remaining /api/admin/** routes: ADMIN only ───────────────
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // ── Everything else: any authenticated user ──────────────────
                .anyRequest().authenticated()
            )
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOrigins(List.of(
            "http://localhost:5174",
            "http://localhost:5173",
            "https://admin-chassa.vercel.app",
            "https://chassa.vercel.app"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
