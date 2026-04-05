package com.alumnilink.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_threads")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatThread {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "mentorship_request_id", unique = true)
    private UUID mentorshipRequestId;

    @Column(name = "referral_request_id")
    private UUID referralRequestId;

    @Column(nullable = false)
    private String kind; // mentorship | referral

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "alumni_id", nullable = false)
    private UUID alumniId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
