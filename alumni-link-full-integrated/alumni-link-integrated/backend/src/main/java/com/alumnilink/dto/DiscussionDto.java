package com.alumnilink.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class DiscussionDto {

    @Data
    public static class PostResponse {
        private UUID id;
        private String title;
        private String content;
        private String category;
        private UUID authorId;
        private String authorName;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;
        private List<ReplyResponse> replies;
    }

    @Data
    public static class CreatePostRequest {
        @NotBlank private String title;
        @NotBlank private String content;
        private String category;
    }

    @Data
    public static class ReplyResponse {
        private UUID id;
        private UUID postId;
        private String content;
        private UUID authorId;
        private String authorName;
        private OffsetDateTime createdAt;
    }

    @Data
    public static class CreateReplyRequest {
        @NotBlank private String content;
    }
}
