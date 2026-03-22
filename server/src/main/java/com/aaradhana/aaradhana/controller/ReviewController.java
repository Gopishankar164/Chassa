package com.aaradhana.aaradhana.controller;

import com.aaradhana.aaradhana.model.Review;
import com.aaradhana.aaradhana.repository.ReviewRepository;
import com.aaradhana.aaradhana.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping("/product/{productId}")
    public ResponseEntity<Map<String, Object>> getProductReviews(@PathVariable String productId) {
        try {
            List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
            double averageRating = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
            Map<Integer, Long> ratingCounts = reviews.stream().collect(Collectors.groupingBy(Review::getRating, Collectors.counting()));

            Map<String, Object> response = new HashMap<>();
            response.put("reviews", reviews);
            response.put("totalReviews", reviews.size());
            response.put("averageRating", Math.round(averageRating * 10.0) / 10.0);
            response.put("ratingCounts", ratingCounts);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch reviews: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> submitReview(@RequestBody Review review) {
        try {
            Optional<Review> existingReview = reviewRepository.findByUserIdAndProductId(review.getUserId(), review.getProductId());
            if (existingReview.isPresent()) return ResponseEntity.badRequest().body(Map.of("error", "You have already reviewed this product"));
            if (review.getRating() < 1 || review.getRating() > 5) return ResponseEntity.badRequest().body(Map.of("error", "Rating must be between 1 and 5"));

            review.setCreatedAt(LocalDateTime.now());
            review.setVerified(false);
            Review savedReview = reviewRepository.save(review);
            return ResponseEntity.ok(Map.of("message", "Review submitted successfully", "review", savedReview));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to submit review: " + e.getMessage()));
        }
    }

    @PatchMapping("/{reviewId}/helpful")
    public ResponseEntity<Map<String, Object>> markHelpful(@PathVariable String reviewId, @RequestParam String userId) {
        try {
            Optional<Review> reviewOpt = reviewRepository.findById(reviewId);
            if (reviewOpt.isEmpty()) return ResponseEntity.notFound().build();

            Review review = reviewOpt.get();
            if (review.getHelpfulUserIds().contains(userId)) return ResponseEntity.badRequest().body(Map.of("error", "You have already marked this review as helpful"));

            review.getHelpfulUserIds().add(userId);
            review.setHelpfulCount(review.getHelpfulCount() + 1);
            reviewRepository.save(review);
            return ResponseEntity.ok(Map.of("message", "Review marked as helpful", "helpfulCount", review.getHelpfulCount()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to update helpful count"));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Review>> getUserReviews(@PathVariable String userId) {
        try {
            return ResponseEntity.ok(reviewRepository.findByUserIdOrderByCreatedAtDesc(userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Map<String, Object>> deleteReview(@PathVariable String reviewId) {
        try {
            if (reviewRepository.existsById(reviewId)) {
                reviewRepository.deleteById(reviewId);
                return ResponseEntity.ok(Map.of("message", "Review deleted successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to delete review"));
        }
    }
}
