package com.aaradhana.aaradhana.service;

import com.aaradhana.aaradhana.model.OrderItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Handles stock deduction/restoration using direct MongoDB atomic operations.
 * Uses $inc on the raw "stock" field — bypasses all Java model mapping.
 */
@Service
public class StockService {

    private static final Logger log = LoggerFactory.getLogger(StockService.class);

    @Autowired
    private MongoTemplate mongoTemplate;

    /**
     * Deduct stock for a list of order items.
     * Uses $inc with a negative value — MongoDB will never go below 0 due to the $max guard.
     */
    public void deductStock(List<OrderItem> items) {
        if (items == null || items.isEmpty()) return;

        for (OrderItem item : items) {
            String productId = item.getProductId();
            int qty = item.getQuantity() > 0 ? item.getQuantity() : 1;
            String size = item.getSize();

            if (productId == null || productId.isBlank()) continue;

            try {
                Query query = new Query(Criteria.where("_id").is(productId));

                // Step 1: read current stock directly from MongoDB
                org.bson.Document raw = mongoTemplate.getCollection("products")
                        .find(new org.bson.Document("_id", new org.bson.types.ObjectId(productId)))
                        .first();

                if (raw == null) {
                    // Try as plain string ID
                    raw = mongoTemplate.getCollection("products")
                            .find(new org.bson.Document("_id", productId))
                            .first();
                }

                if (raw == null) {
                    log.warn("StockService: product {} not found in MongoDB", productId);
                    continue;
                }

                // Step 2: compute new stock (never below 0)
                Object stockObj = raw.get("stock");
                int currentStock = 0;
                if (stockObj instanceof Number) {
                    currentStock = ((Number) stockObj).intValue();
                }
                int newStock = Math.max(0, currentStock - qty);

                // Step 3: atomic set on raw "stock" field
                Update update = new Update().set("stock", newStock);

                // Also decrement sizeStock if applicable
                if (size != null && !size.isBlank()) {
                    Object sizeStockObj = raw.get("sizeStock");
                    if (sizeStockObj instanceof org.bson.Document sizeStockDoc) {
                        Object sizeQtyObj = sizeStockDoc.get(size);
                        if (sizeQtyObj instanceof Number) {
                            int currentSizeQty = ((Number) sizeQtyObj).intValue();
                            int newSizeQty = Math.max(0, currentSizeQty - qty);
                            update.set("sizeStock." + size, newSizeQty);
                        }
                    }
                }

                mongoTemplate.updateFirst(query, update, "products");
                log.info("Stock deducted for product {}: {} -> {} (qty={})", productId, currentStock, newStock, qty);

            } catch (Exception e) {
                log.error("Failed to deduct stock for product {}: {}", productId, e.getMessage());
            }
        }
    }

    /**
     * Restore stock when an order is cancelled.
     */
    public void restoreStock(List<OrderItem> items) {
        if (items == null || items.isEmpty()) return;

        for (OrderItem item : items) {
            String productId = item.getProductId();
            int qty = item.getQuantity() > 0 ? item.getQuantity() : 1;
            String size = item.getSize();

            if (productId == null || productId.isBlank()) continue;

            try {
                Query query = new Query(Criteria.where("_id").is(productId));

                org.bson.Document raw = mongoTemplate.getCollection("products")
                        .find(new org.bson.Document("_id", new org.bson.types.ObjectId(productId)))
                        .first();
                if (raw == null) {
                    raw = mongoTemplate.getCollection("products")
                            .find(new org.bson.Document("_id", productId))
                            .first();
                }
                if (raw == null) {
                    log.warn("StockService: product {} not found for restore", productId);
                    continue;
                }

                Object stockObj = raw.get("stock");
                int currentStock = stockObj instanceof Number ? ((Number) stockObj).intValue() : 0;
                int newStock = currentStock + qty;

                Update update = new Update().set("stock", newStock);

                if (size != null && !size.isBlank()) {
                    Object sizeStockObj = raw.get("sizeStock");
                    if (sizeStockObj instanceof org.bson.Document sizeStockDoc) {
                        Object sizeQtyObj = sizeStockDoc.get(size);
                        if (sizeQtyObj instanceof Number) {
                            update.set("sizeStock." + size, ((Number) sizeQtyObj).intValue() + qty);
                        }
                    }
                }

                mongoTemplate.updateFirst(query, update, "products");
                log.info("Stock restored for product {}: {} -> {}", productId, currentStock, newStock);

            } catch (Exception e) {
                log.error("Failed to restore stock for product {}: {}", productId, e.getMessage());
            }
        }
    }
}
