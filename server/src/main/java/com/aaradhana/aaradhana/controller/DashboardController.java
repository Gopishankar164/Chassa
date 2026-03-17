package com.aaradhana.aaradhana.controller;

import com.aaradhana.aaradhana.repository.OrderRepository;
import com.aaradhana.aaradhana.repository.ProductRepository;
import com.aaradhana.aaradhana.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private OrderRepository orderRepository;

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        long userCount = userRepository.count();
        long productCount = productRepository.count();
        long orderCount = orderRepository.count();
        double totalRevenue = orderRepository.findAll().stream()
                .mapToDouble(order -> order.getTotal())
                .sum();

        return Map.of(
                "users", userCount,
                "products", productCount,
                "orders", orderCount,
                "revenue", totalRevenue
        );
    }
}
