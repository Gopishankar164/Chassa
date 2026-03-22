package com.aaradhana.aaradhana.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthCheckController {

    @GetMapping("/ping")
    public ResponseEntity<Map<String, Object>> ping() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        response.put("service", "Aaradhana API");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "HEALTHY");
        response.put("uptime", "running");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("timestamp", LocalDateTime.now().toString());

        Runtime runtime = Runtime.getRuntime();
        Map<String, Object> systemInfo = new HashMap<>();
        systemInfo.put("availableProcessors", runtime.availableProcessors());
        systemInfo.put("freeMemory", runtime.freeMemory() / (1024 * 1024) + " MB");
        systemInfo.put("totalMemory", runtime.totalMemory() / (1024 * 1024) + " MB");

        response.put("system", systemInfo);
        response.put("message", "Server is running smoothly");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/alive")
    public ResponseEntity<String> alive() {
        return ResponseEntity.ok("ALIVE");
    }

    @GetMapping
    public ResponseEntity<Map<String, String>> root() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Aaradhana Backend");
        return ResponseEntity.ok(response);
    }
}
