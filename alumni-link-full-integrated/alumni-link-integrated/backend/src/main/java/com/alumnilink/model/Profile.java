package com.alumnilink.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(nullable = false)
    private String name;

    @Column(name = "roll_no")
    private String rollNo;

    private String department;
    private String company;

    @Column(name = "package_amount", precision = 15, scale = 2)
    private BigDecimal packageAmount;

    private String batch;

    @Column(name = "job_role")
    private String jobRole;

    @Column(columnDefinition = "TEXT[]")
    private String[] expertise;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "avatar_url")
    private String avatarUrl;

    private Boolean available;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
