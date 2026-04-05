package com.alumnilink.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "job_referral_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobReferralRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "job_id", nullable = false)
    private UUID jobId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "alumni_id", nullable = false)
    private UUID alumniId;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "resume_file_name", nullable = false)
    private String resumeFileName;

    @Column(name = "resume_content_type", nullable = false)
    private String resumeContentType;

    // Store raw bytes in Postgres `bytea` (not a large object/oid).
    @Column(name = "resume_data", nullable = false, columnDefinition = "bytea")
    private byte[] resumeData;

    @Column(nullable = false)
    private String status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
