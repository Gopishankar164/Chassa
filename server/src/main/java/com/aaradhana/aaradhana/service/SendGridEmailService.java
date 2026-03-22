package com.aaradhana.aaradhana.service;

import com.aaradhana.aaradhana.model.Order;
import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.format.DateTimeFormatter;

@Service
public class SendGridEmailService {

    @Value("${sendgrid.api.key:}")
    private String sendGridApiKey;

    @Value("${sendgrid.from.email}")
    private String fromEmail;

    @Value("${sendgrid.from.name}")
    private String fromName;

    @Value("${app.url:http://localhost:3000}")
    private String appUrl;

    public void sendOrderStatusEmail(Order order, String previousStatus) {
        // Check if SendGrid is configured
        if (sendGridApiKey == null || sendGridApiKey.trim().isEmpty()) {
            System.err.println("⚠️ SendGrid API key not configured. Skipping email.");
            return;
        }

        try {
            Email from = new Email(fromEmail, fromName);
            Email to = new Email(order.getCustomerEmail());
            String subject = getEmailSubject(order.getStatusString());
            Content content = new Content("text/html", buildEmailContent(order, previousStatus));

            Mail mail = new Mail(from, subject, to, content);

            SendGrid sg = new SendGrid(sendGridApiKey);
            Request request = new Request();

            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                System.out.println("✅ Email sent successfully via SendGrid to: " + order.getCustomerEmail());
            } else {
                System.err.println(" SendGrid returned status: " + response.getStatusCode());
                System.err.println("   Response body: " + response.getBody());
            }
        } catch (IOException e) {
            System.err.println("Failed to send email via SendGrid: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void sendVerificationCode(String toEmail, String code) {
        if (sendGridApiKey == null || sendGridApiKey.trim().isEmpty()) {
            System.err.println(" SendGrid API key not configured. Skipping email.");
            return;
        }

        try {
            Email from = new Email(fromEmail, fromName);
            Email to = new Email(toEmail);
            String subject = "Verify your email - Aaradhana";

            String html = """
                    <div style='font-family:Segoe UI,Arial,sans-serif'>
                      <h2>Verify your email</h2>
                      <p>Your 6-digit verification code is:</p>
                      <div style='font-size:28px;font-weight:700;letter-spacing:6px'>%s</div>
                      <p>This code expires in 15 minutes.</p>
                    </div>
                    """.formatted(code);

            Content content = new Content("text/html", html);
            Mail mail = new Mail(from, subject, to, content);

            SendGrid sg = new SendGrid(sendGridApiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                System.out.println("✅ Verification email sent successfully via SendGrid to: " + toEmail);
            } else {
                System.err.println("⚠️ SendGrid returned status: " + response.getStatusCode());
            }
        } catch (IOException e) {
            System.err.println("⚠️ Failed to send verification email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void sendPasswordResetLink(String toEmail, String token) {
        if (sendGridApiKey == null || sendGridApiKey.trim().isEmpty()) {
            System.err.println("⚠️ SendGrid API key not configured. Skipping email.");
            return;
        }

        try {
            Email from = new Email(fromEmail, fromName);
            Email to = new Email(toEmail);
            String subject = "Reset your password - Aaradhana";
            String resetUrl = appUrl + "/reset-password?token=" + token;

            String html = """
                    <div style='font-family:Segoe UI,Arial,sans-serif'>
                      <h2>Password reset request</h2>
                      <p>Click the button below to set a new password. This link expires in 15 minutes.</p>
                      <p><a href='%s' style='background:#667eea;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none'>Reset Password</a></p>
                      <p>If you didn't request this, you can safely ignore this email.</p>
                    </div>
                    """
                    .formatted(resetUrl);

            Content content = new Content("text/html", html);
            Mail mail = new Mail(from, subject, to, content);

            SendGrid sg = new SendGrid(sendGridApiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                System.out.println("✅ Password reset email sent successfully via SendGrid to: " + toEmail);
            } else {
                System.err.println("⚠️ SendGrid returned status: " + response.getStatusCode());
            }
        } catch (IOException e) {
            System.err.println("⚠️ Failed to send password reset email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String getEmailSubject(String status) {
        return switch (status.toUpperCase()) {
            case "PENDING" -> "📋 Order Received - Aaradhana";
            case "CONFIRMED" -> "✅ Order Confirmed - Aaradhana";
            case "PROCESSING" -> "⚙️ Order Processing - Aaradhana";
            case "SHIPPED" -> "🚚 Order Shipped - Aaradhana";
            case "OUT_FOR_DELIVERY" -> "🛵 Out for Delivery - Aaradhana";
            case "DELIVERED" -> "📦 Order Delivered - Aaradhana";
            case "CANCELLED" -> "❌ Order Cancelled - Aaradhana";
            default -> "Order Update - Aaradhana";
        };
    }

    private String buildEmailContent(Order order, String previousStatus) {
        String statusMessage = getStatusMessage(order.getStatusString());
        String statusColor = getStatusColor(order.getStatusString());
        String trackingUrl = appUrl + "/track/" + order.getId();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
        String formattedDate = order.getUpdatedAt() != null
                ? order.getUpdatedAt().format(formatter)
                : order.getCreatedAt().format(formatter);

        String htmlContent = String.format(
                """
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <style>
                                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
                                .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                                .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 30px; text-align: center; }
                                .header h1 { margin: 0; font-size: 28px; }
                                .content { padding: 30px; }
                                .status-badge { display: inline-block; background: %s; color: white; padding: 10px 20px; border-radius: 25px; font-weight: bold; margin: 20px 0; }
                                .order-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                                .order-details p { margin: 10px 0; }
                                .order-details strong { color: #667eea; }
                                .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                                .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h1>🛍️ Aaradhana</h1>
                                    <p>Order Update Notification</p>
                                </div>
                                <div class="content">
                                    <h2>Hello %s! 👋</h2>
                                    <p>%s</p>
                                    <div style="text-align: center;">
                                        <span class="status-badge">%s</span>
                                    </div>
                                    <div class="order-details">
                                        <h3>Order Details</h3>
                                        <p><strong>Order ID:</strong> #%s</p>
                                        <p><strong>Order Date:</strong> %s</p>
                                        <p><strong>Total Amount:</strong> ₹%.2f</p>
                                        <p><strong>Shipping Address:</strong><br>%s</p>
                                    </div>
                                    <div style="text-align: center;">
                                        <a href="%s" class="cta-button">Track Your Order 📦</a>
                                    </div>
                                    <p style="margin-top: 30px; color: #666;">
                                        <small>If you have any questions, please contact our support team.</small>
                                    </p>
                                </div>
                                <div class="footer">
                                    <p>Thank you for shopping with Aaradhana! 🙏</p>
                                    <p>© 2024 Aaradhana. All rights reserved.</p>
                                </div>
                            </div>
                        </body>
                        </html>
                        """,
                statusColor,
                order.getCustomerName(),
                statusMessage,
                order.getStatusString().replace("_", " "),
                order.getId(),
                formattedDate,
                order.getTotal(),
                formatShippingAddress(order.getShippingAddress()),
                trackingUrl);

        return htmlContent;
    }

    private String getStatusMessage(String status) {
        return switch (status.toUpperCase()) {
            case "PENDING" -> "We've received your order and it's being reviewed.";
            case "CONFIRMED" -> "Great news! Your order has been confirmed and will be processed soon.";
            case "PROCESSING" -> "Your order is being prepared for shipment.";
            case "SHIPPED" -> "Your order has been shipped and is on its way to you!";
            case "OUT_FOR_DELIVERY" -> "Your order is out for delivery and will arrive soon!";
            case "DELIVERED" -> "Your order has been delivered successfully! We hope you enjoy your purchase.";
            case "CANCELLED" -> "Your order has been cancelled as requested.";
            default -> "Your order status has been updated.";
        };
    }

    private String getStatusColor(String status) {
        return switch (status.toUpperCase()) {
            case "PENDING" -> "#fbbf24";
            case "CONFIRMED" -> "#3b82f6";
            case "PROCESSING" -> "#8b5cf6";
            case "SHIPPED" -> "#06b6d4";
            case "OUT_FOR_DELIVERY" -> "#f59e0b";
            case "DELIVERED" -> "#10b981";
            case "CANCELLED" -> "#ef4444";
            default -> "#6b7280";
        };
    }

    private String formatShippingAddress(String address) {
        if (address == null || address.isEmpty()) {
            return "N/A";
        }

        try {
            StringBuilder formatted = new StringBuilder();
            String fullName = extractValue(address, "fullName");
            String addressLine = extractValue(address, "address");
            String city = extractValue(address, "city");
            String state = extractValue(address, "state");
            String pincode = extractValue(address, "pincode");
            String phone = extractValue(address, "phone");

            if (fullName != null)
                formatted.append(fullName).append("<br>");
            if (addressLine != null)
                formatted.append(addressLine).append("<br>");
            if (city != null || state != null) {
                if (city != null)
                    formatted.append(city);
                if (city != null && state != null)
                    formatted.append(", ");
                if (state != null)
                    formatted.append(state);
                if (pincode != null)
                    formatted.append(" - ").append(pincode);
                formatted.append("<br>");
            }
            if (phone != null)
                formatted.append("Phone: ").append(phone);

            return formatted.length() > 0 ? formatted.toString() : address;
        } catch (Exception e) {
            return address;
        }
    }

    private String extractValue(String text, String key) {
        try {
            int keyIndex = text.indexOf(key + "=");
            if (keyIndex == -1)
                return null;

            int start = keyIndex + key.length() + 1;
            int end = text.indexOf(",", start);
            if (end == -1)
                end = text.indexOf("}", start);
            if (end == -1)
                end = text.length();

            String value = text.substring(start, end).trim();
            return value.isEmpty() ? null : value;
        } catch (Exception e) {
            return null;
        }
    }

    // ✅ Send notification to admin when new order is placed
    public void sendNewOrderNotificationToAdmin(Order order, String adminEmail) {
        if (sendGridApiKey == null || sendGridApiKey.trim().isEmpty()) {
            System.err.println("⚠️ SendGrid API key not configured. Skipping admin notification.");
            return;
        }

        try {
            Email from = new Email(fromEmail, fromName);
            Email to = new Email(adminEmail);
            String subject = "🔔 New Order Received - #" + order.getId();

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
            String formattedDate = order.getCreatedAt().format(formatter);

            String htmlContent = String.format(
                    """
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <style>
                                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
                                    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                                    .header { background: linear-gradient(135deg, #f59e0b 0%%, #ef4444 100%%); color: white; padding: 30px; text-align: center; }
                                    .header h1 { margin: 0; font-size: 28px; }
                                    .content { padding: 30px; }
                                    .alert-badge { display: inline-block; background: #ef4444; color: white; padding: 10px 20px; border-radius: 25px; font-weight: bold; margin: 20px 0; }
                                    .order-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                                    .order-details p { margin: 10px 0; }
                                    .order-details strong { color: #ef4444; }
                                    .customer-info { background: #fff7ed; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b; }
                                    .cta-button { display: inline-block; background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                                    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <div class="header">
                                        <h1>🔔 New Order Alert!</h1>
                                        <p>Admin Notification</p>
                                    </div>
                                    <div class="content">
                                        <h2>Hello Admin! 👋</h2>
                                        <p>A new order has been placed on Aaradhana.</p>
                                        <div style="text-align: center;">
                                            <span class="alert-badge">NEW ORDER</span>
                                        </div>
                                        <div class="order-details">
                                            <h3>Order Information</h3>
                                            <p><strong>Order ID:</strong> #%s</p>
                                            <p><strong>Order Date:</strong> %s</p>
                                            <p><strong>Total Amount:</strong> ₹%.2f</p>
                                            <p><strong>Payment Method:</strong> %s</p>
                                            <p><strong>Payment Status:</strong> %s</p>
                                        </div>
                                        <div class="customer-info">
                                            <h3>Customer Details</h3>
                                            <p><strong>Name:</strong> %s</p>
                                            <p><strong>Email:</strong> %s</p>
                                            <p><strong>Phone:</strong> %s</p>
                                            <p><strong>Shipping Address:</strong><br>%s</p>
                                        </div>
                                        <div style="text-align: center;">
                                            <a href="%s/admin/orders" class="cta-button">View Order in Admin Panel 📋</a>
                                        </div>
                                        <p style="margin-top: 30px; color: #666;">
                                            <small>Please process this order as soon as possible.</small>
                                        </p>
                                    </div>
                                    <div class="footer">
                                        <p>Aaradhana Admin Panel</p>
                                        <p>© 2024 Aaradhana. All rights reserved.</p>
                                    </div>
                                </div>
                            </body>
                            </html>
                            """,
                    order.getId(),
                    formattedDate,
                    order.getTotal(),
                    order.getPaymentMethod() != null ? order.getPaymentMethod() : "N/A",
                    order.getPaymentStatus() != null ? order.getPaymentStatus() : "PENDING",
                    order.getCustomerName(),
                    order.getCustomerEmail(),
                    order.getCustomerPhone() != null ? order.getCustomerPhone() : "N/A",
                    formatShippingAddress(order.getShippingAddress()),
                    appUrl);

            Content content = new Content("text/html", htmlContent);
            Mail mail = new Mail(from, subject, to, content);

            SendGrid sg = new SendGrid(sendGridApiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                System.out.println("✅ Admin notification sent successfully to: " + adminEmail);
            } else {
                System.err.println("⚠️ Failed to send admin notification. Status: " + response.getStatusCode());
            }
        } catch (IOException e) {
            System.err.println("⚠️ Failed to send admin notification: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
