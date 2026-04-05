package com.alumnilink.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class SuccessStoryDto {
    private UUID id;
    private UUID profileId;
    private String title;
    private String story;
    private String achievement;
    private Boolean isFeatured;
    private OffsetDateTime createdAt;

    @Data
    public static class CreateRequest {
        @NotBlank private String title;
        @NotBlank private String story;
        private String achievement;
    }
}
