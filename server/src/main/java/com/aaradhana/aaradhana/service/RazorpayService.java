package com.aaradhana.aaradhana.service;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

/**
 * RazorpayService — all Razorpay operations go through here.
 *
 * Security guarantees:
 *  • Key ID and Secret are injected from environment variables only.
 *  • verifyPaymentSignature() performs server-side HMAC-SHA256 validation.
 *  • verifyWebhookSignature() validates incoming webhook payloads.
 *  • The raw Razorpay secret is never exposed to the client.
 */
@Service
public class RazorpayService {

    private static final Logger log = LoggerFactory.getLogger(RazorpayService.class);

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Value("${razorpay.webhook.secret:}")
    private String webhookSecret;

    private RazorpayClient client;

    @PostConstruct
    public void init() throws RazorpayException {
        if (keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank()) {
            log.warn("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured. " +
                     "Online payments will be unavailable.");
            return;
        }
        this.client = new RazorpayClient(keyId, keySecret);
        log.info("Razorpay client initialised (key: {}...)", keyId.substring(0, Math.min(12, keyId.length())));
    }

    /**
     * Returns the public Key ID that the frontend needs to load Razorpay checkout.
     */
    public String getKeyId() {
        return keyId;
    }

    /**
     * Creates a Razorpay order.
     *
     * @param amountPaise  Amount in paise (INR smallest unit; 1 rupee = 100 paise)
     * @param currency     ISO 4217 currency code, e.g. "INR"
     * @param internalOrderId Internal order ID stored as a receipt / note
     * @return JSONObject with Razorpay order details
     */
    public JSONObject createOrder(long amountPaise, String currency, String internalOrderId)
            throws RazorpayException {

        if (client == null) {
            throw new RazorpayException("Razorpay is not configured on this server.");
        }

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount",   amountPaise);
        orderRequest.put("currency", currency);
        // receipt is visible on Razorpay dashboard; keep it short
        orderRequest.put("receipt", "rcpt_" + internalOrderId);
        // notes are passed back in webhook events — store our internal order ID
        orderRequest.put("notes", new JSONObject().put("orderId", internalOrderId));

        com.razorpay.Order razorpayOrder = client.orders.create(orderRequest);
        log.info("Razorpay order created: {} for internal order {}",
                razorpayOrder.get("id"), internalOrderId);

        return razorpayOrder.toJson();
    }

    /**
     * Verifies the Razorpay payment signature.
     *
     * Razorpay generates the signature as:
     *   HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, keySecret)
     *
     * @return true if the signature is valid
     */
    public boolean verifyPaymentSignature(String razorpayOrderId,
                                          String razorpayPaymentId,
                                          String razorpaySignature) {
        try {
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            String generated = hmacSha256(payload, keySecret);
            boolean valid = generated.equals(razorpaySignature);
            if (!valid) {
                log.warn("Signature mismatch — expected: {}, got: {}", generated, razorpaySignature);
            }
            return valid;
        } catch (Exception e) {
            log.error("Error verifying payment signature: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Verifies incoming webhook signatures from Razorpay.
     *
     * Razorpay generates the webhook signature as:
     *   HMAC-SHA256(rawPayload, webhookSecret)
     */
    public boolean verifyWebhookSignature(String rawPayload, String receivedSignature) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.warn("RAZORPAY_WEBHOOK_SECRET not configured — accepting webhook without verification");
            return true; // Allow if not configured (dev mode), set in prod!
        }
        try {
            String generated = hmacSha256(rawPayload, webhookSecret);
            return generated.equals(receivedSignature);
        } catch (Exception e) {
            log.error("Error verifying webhook signature: {}", e.getMessage());
            return false;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Private: HMAC-SHA256 computation
    // ─────────────────────────────────────────────────────────────

    private String hmacSha256(String data, String secret)
            throws NoSuchAlgorithmException, InvalidKeyException {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec =
                new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(hash);
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
