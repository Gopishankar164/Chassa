package com.aaradhana.aaradhana.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "admins")
public class Admin {

    @Id
    private String id;

    private String email;
    private String password;
    private String name;

    /**
     * Role is persisted in MongoDB.
     * Values: "ADMIN" (default) or "STAFF"
     * Staff accounts are created by admin via /api/admin/staff endpoint.
     */
    private String role;

    /**
     * Whether this account is active (soft-disable without deletion).
     */
    private Boolean active = true;

    /**
     * Timestamp of account creation.
     */
    private LocalDateTime createdAt;

    /**
     * Returns the role, defaulting to "ADMIN" for legacy records that have no role stored.
     */
    public String getRole() {
        return (role != null && !role.isBlank()) ? role.toUpperCase() : "ADMIN";
    }

    /**
     * Convenience check — true when this is a full administrator.
     */
    public boolean isAdmin() {
        return "ADMIN".equalsIgnoreCase(getRole());
    }

    /**
     * Convenience check — true when this is a staff account.
     */
    public boolean isStaff() {
        return "STAFF".equalsIgnoreCase(getRole());
    }
}
