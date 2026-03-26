package com.aaradhana.aaradhana.repository;

import com.aaradhana.aaradhana.model.Order;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends MongoRepository<Order, String> {
    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Order> findByStatusOrderByCreatedAtDesc(String status);
    List<Order> findByOrderByCreatedAtDesc();
    Optional<Order> findByRazorpayOrderId(String razorpayOrderId);
}
