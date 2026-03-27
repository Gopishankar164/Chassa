package com.aaradhana.aaradhana.repository;

import com.aaradhana.aaradhana.model.Admin;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminRepository extends MongoRepository<Admin, String> {

    /** Find by email — used for login. */
    Admin findByEmail(String email);

    /** Find all accounts with a specific role (e.g. "STAFF"). */
    List<Admin> findByRole(String role);

    /** Find all active accounts with a specific role. */
    List<Admin> findByRoleAndActive(String role, Boolean active);
}
