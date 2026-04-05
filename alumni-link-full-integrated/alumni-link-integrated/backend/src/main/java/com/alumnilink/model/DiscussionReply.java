package com.alumnilink.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "discussion_replies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DiscussionReply {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "post_id", nullable = false)
    private UUID postId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
