package com.aaradhana.aaradhana.controller;

import com.aaradhana.aaradhana.model.Complaint;
import com.aaradhana.aaradhana.repository.ComplaintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    @Autowired
    private ComplaintRepository complaintRepository;

    @PostMapping
    public Complaint createComplaint(@RequestBody Complaint complaint) {
        complaint.setCreatedAt(Instant.now().toString());
        return complaintRepository.save(complaint);
    }

    @GetMapping
    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }
}
