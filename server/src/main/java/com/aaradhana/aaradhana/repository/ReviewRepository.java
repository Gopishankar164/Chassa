package com.aaradhana.aaradhana.repository;

import com.aaradhana.aaradhana.model.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends MongoRepository<Review, String> {
    List<Review> findByProductIdOrderByCreatedAtDesc(String productId);
    List<Review> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<Review> findByUserIdAndProductId(String userId, String productId);
    long countByProductId(String productId);
    List<Review> findByProductIdAndRating(String productId, Integer rating);

    @Query("{'productId': ?0}")
    List<Review> findReviewsForAverageRating(String productId);
}
