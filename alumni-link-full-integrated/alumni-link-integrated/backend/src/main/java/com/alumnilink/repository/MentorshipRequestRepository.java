package com.alumnilink.repository;

import com.alumnilink.model.MentorshipRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface MentorshipRequestRepository extends JpaRepository<MentorshipRequest, UUID> {
    List<MentorshipRequest> findByStudentId(UUID studentId);
    List<MentorshipRequest> findByAlumniId(UUID alumniId);
    List<MentorshipRequest> findByStudentIdOrAlumniId(UUID studentId, UUID alumniId);
    boolean existsByStudentIdAndAlumniIdAndStatus(UUID studentId, UUID alumniId, String status);
    boolean existsByStudentIdAndAlumniIdAndStatusIn(UUID studentId, UUID alumniId, Collection<String> statuses);
}
