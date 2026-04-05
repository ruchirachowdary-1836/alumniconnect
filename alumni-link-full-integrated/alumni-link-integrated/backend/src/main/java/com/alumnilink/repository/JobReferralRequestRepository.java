package com.alumnilink.repository;

import com.alumnilink.model.JobReferralRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface JobReferralRequestRepository extends JpaRepository<JobReferralRequest, UUID> {
    boolean existsByJobIdAndStudentIdAndStatusIn(UUID jobId, UUID studentId, Collection<String> statuses);
    List<JobReferralRequest> findByAlumniIdOrderByCreatedAtDesc(UUID alumniId);
    List<JobReferralRequest> findByStudentIdOrderByCreatedAtDesc(UUID studentId);
}

