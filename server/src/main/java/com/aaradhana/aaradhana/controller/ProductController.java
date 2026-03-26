package com.aaradhana.aaradhana.controller;

import com.aaradhana.aaradhana.model.Product;
import com.aaradhana.aaradhana.model.Review;
import com.aaradhana.aaradhana.repository.ProductRepository;
import com.aaradhana.aaradhana.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable String id) {
        Optional<Product> product = productRepository.findById(id);
        if (product.isPresent()) {
            Product prod = product.get();
            List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(id);
            if (!reviews.isEmpty()) {
                double avgRating = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
                prod.setAverageRating(Math.round(avgRating * 10.0) / 10.0);
                prod.setTotalReviews(reviews.size());
            }
            return ResponseEntity.ok(prod);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/byIds")
    public ResponseEntity<List<Product>> getProductsByIds(@RequestBody List<String> ids) {
        if (ids == null || ids.isEmpty()) return ResponseEntity.ok(new ArrayList<>());
        return ResponseEntity.ok(productRepository.findAllById(ids));
    }

    @GetMapping
    public ResponseEntity<List<Product>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        return ResponseEntity.ok(productRepository.findAll(pageable).getContent());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> addProduct(@RequestBody Product product) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(productRepository.save(product));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> updateProduct(@PathVariable String id, @RequestBody Product product) {
        if (!productRepository.existsById(id)) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        product.setId(id);
        return ResponseEntity.ok(productRepository.save(product));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        if (!productRepository.existsById(id)) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        productRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchProducts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false, defaultValue = "name") String sortBy,
            @RequestParam(required = false, defaultValue = "asc") String sortDir,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "12") int size) {
        try {
            List<Product> allProducts = productRepository.findAll();

            List<Product> filteredProducts = allProducts.stream()
                    .filter(product -> {
                        if (query != null && !query.trim().isEmpty()) {
                            String q = query.toLowerCase();
                            return (product.getName() != null && product.getName().toLowerCase().contains(q)) ||
                                   (product.getDescription() != null && product.getDescription().toLowerCase().contains(q)) ||
                                   (product.getCategory() != null && product.getCategory().toLowerCase().contains(q)) ||
                                   (product.getBrand() != null && product.getBrand().toLowerCase().contains(q));
                        }
                        return true;
                    })
                    .filter(product -> {
                        if (category != null && !category.trim().isEmpty() && !category.equals("all")) {
                            return product.getCategory() != null && product.getCategory().equalsIgnoreCase(category);
                        }
                        return true;
                    })
                    .filter(product -> {
                        if (minPrice != null && product.getPrice() < minPrice) return false;
                        if (maxPrice != null && product.getPrice() > maxPrice) return false;
                        return true;
                    })
                    .collect(Collectors.toList());

            filteredProducts.sort((p1, p2) -> {
                int result = sortBy.equalsIgnoreCase("price")
                        ? Double.compare(p1.getPrice(), p2.getPrice())
                        : p1.getName().compareToIgnoreCase(p2.getName());
                return sortDir.equals("desc") ? -result : result;
            });

            int start = page * size;
            int end = Math.min(start + size, filteredProducts.size());
            List<Product> paginatedProducts = start < filteredProducts.size()
                    ? filteredProducts.subList(start, end)
                    : new ArrayList<>();

            Map<String, Object> response = new HashMap<>();
            response.put("products", paginatedProducts);
            response.put("currentPage", page);
            response.put("totalItems", filteredProducts.size());
            response.put("totalPages", (int) Math.ceil((double) filteredProducts.size() / size));
            response.put("pageSize", size);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Search failed: " + e.getMessage()));
        }
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getAllCategories() {
        try {
            List<String> sortedCategories = productRepository.findAll().stream()
                    .map(Product::getCategory)
                    .filter(Objects::nonNull)
                    .filter(cat -> !cat.trim().isEmpty())
                    .collect(Collectors.toSet())
                    .stream().sorted().collect(Collectors.toList());
            return ResponseEntity.ok(Map.of("categories", sortedCategories));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to fetch categories"));
        }
    }

    @GetMapping("/suggestions")
    public ResponseEntity<?> getSearchSuggestions(@RequestParam String query) {
        try {
            if (query == null || query.trim().length() < 2)
                return ResponseEntity.ok(Map.of("suggestions", Collections.emptyList()));

            String q = query.toLowerCase().trim();
            Set<String> suggestions = new HashSet<>();
            productRepository.findAll().forEach(product -> {
                if (product.getName().toLowerCase().contains(q)) suggestions.add(product.getName());
                if (product.getCategory() != null && product.getCategory().toLowerCase().contains(q)) suggestions.add(product.getCategory());
            });
            return ResponseEntity.ok(Map.of("suggestions", suggestions.stream().sorted().limit(10).collect(Collectors.toList())));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to fetch suggestions"));
        }
    }

    @GetMapping("/price-range")
    public ResponseEntity<?> getPriceRange() {
        try {
            List<Product> products = productRepository.findAll();
            if (products.isEmpty()) return ResponseEntity.ok(Map.of("minPrice", 0, "maxPrice", 0));
            return ResponseEntity.ok(Map.of(
                    "minPrice", Math.floor(products.stream().mapToDouble(Product::getPrice).min().orElse(0)),
                    "maxPrice", Math.ceil(products.stream().mapToDouble(Product::getPrice).max().orElse(0))));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to fetch price range"));
        }
    }

    @PostMapping("/products")
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(productRepository.save(product));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}
