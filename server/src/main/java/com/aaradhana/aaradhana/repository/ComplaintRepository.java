package com.aaradhana.aaradhana.repository;

import com.aaradhana.aaradhana.model.Complaint;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ComplaintRepository extends MongoRepository<Complaint, String> {}
