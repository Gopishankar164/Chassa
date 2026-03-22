package com.aaradhana.aaradhana.repository;

import com.aaradhana.aaradhana.model.ReturnExchangeRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReturnExchangeRepository extends MongoRepository<ReturnExchangeRequest, String> {
    List<ReturnExchangeRequest> findByOrderId(String orderId);
    List<ReturnExchangeRequest> findByCustomerId(String customerId);
    List<ReturnExchangeRequest> findByStatus(String status);
}
