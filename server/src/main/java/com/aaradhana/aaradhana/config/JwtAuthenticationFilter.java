package com.aaradhana.aaradhana.config;

import com.aaradhana.aaradhana.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Override
    protected void doFilterInternal(@org.springframework.lang.NonNull HttpServletRequest request,
                                    @org.springframework.lang.NonNull HttpServletResponse response,
                                    @org.springframework.lang.NonNull FilterChain filterChain) throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        String method = request.getMethod();
        
        logger.info("Processing request: {} {}", method, requestPath);
        
        if (isPublicEndpoint(requestPath, method)) {
            logger.info("Skipping JWT for public endpoint: {} {}", method, requestPath);
            filterChain.doFilter(request, response);
            return;
        }
        
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            
            try {
                if (JwtUtil.validateToken(token)) {
                    String userId = JwtUtil.getUserId(token);
                    String role = JwtUtil.getRole(token);
                    
                    String authority = role != null ? "ROLE_" + role.toUpperCase() : "ROLE_USER";
                    
                    UsernamePasswordAuthenticationToken authToken = 
                        new UsernamePasswordAuthenticationToken(
                            new UserPrincipal(userId), 
                            null, 
                            Collections.singletonList(new SimpleGrantedAuthority(authority))
                        );
                    
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } catch (Exception e) {
                logger.warn("Invalid JWT token: " + e.getMessage());
            }
        }
        
        filterChain.doFilter(request, response);
    }
    
    private boolean isPublicEndpoint(String path, String method) {
        boolean isPublic = (path.startsWith("/api/products") && "GET".equals(method)) ||
               (path.equals("/api/products/byIds") && "POST".equals(method)) ||
               path.equals("/api/users/login") ||
               path.equals("/api/users/create") ||
               path.equals("/api/admin/login") ||
               path.equals("/api/auth/google") ||
               path.equals("/api/auth/admin/login") ||
               path.equals("/api/auth/create-test-admin") ||
               path.equals("/api/users/verify-email") ||
               path.equals("/api/users/resend-verification") ||
               path.equals("/api/users/forgot-password") ||
               path.equals("/api/users/reset-password") ||
               path.equals("/api/dashboard/stats") ||
               path.startsWith("/api/reviews") ||
               (path.equals("/api/payment/webhook") && "POST".equals(method));
        
        logger.info("Checking if {} {} is public: {}", method, path, isPublic);
        return isPublic;
    }
    
    public static class UserPrincipal {
        private final String id;
        
        public UserPrincipal(String id) {
            this.id = id;
        }
        
        public String getId() {
            return id;
        }
    }
}
