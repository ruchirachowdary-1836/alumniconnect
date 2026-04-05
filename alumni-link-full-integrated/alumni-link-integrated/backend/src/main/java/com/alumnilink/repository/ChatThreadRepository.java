package com.alumnilink.repository;

import com.alumnilink.model.ChatThread;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatThreadRepository extends JpaRepository<ChatThread, UUID> {
    Optional<ChatThread> findByMentorshipRequestId(UUID mentorshipRequestId);
    Optional<ChatThread> findByReferralRequestId(UUID referralRequestId);
    Optional<ChatThread> findFirstByKindAndStudentIdAndAlumniIdOrderByCreatedAtAsc(String kind, UUID studentId, UUID alumniId);
    List<ChatThread> findByStudentIdOrAlumniIdOrderByCreatedAtDesc(UUID studentId, UUID alumniId);
}
