package com.alumnilink.repository;

import com.alumnilink.model.OtpChallenge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OtpChallengeRepository extends JpaRepository<OtpChallenge, UUID> {
    Optional<OtpChallenge> findByIdAndConsumedAtIsNull(UUID id);
    List<OtpChallenge> findByUserIdAndPurposeAndConsumedAtIsNull(UUID userId, String purpose);
    void deleteByExpiresAtBefore(OffsetDateTime cutoff);
}
