package com.alumnilink.repository;

import com.alumnilink.model.JobReferral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;
import java.util.List;
import java.util.UUID;

public interface JobReferralRepository extends JpaRepository<JobReferral, UUID> {
    List<JobReferral> findByPostedBy(UUID postedBy);
    List<JobReferral> findAll(Sort sort);
}
