package com.alumnilink.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class JobDto {
    private UUID id;
    private String title;
    private String company;
    private String location;
    private String type;
    private String description;
    private String[] requirements;
    private String status;
    private UUID postedBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @Data
    public static class CreateRequest {
        @NotBlank private String title;
        @NotBlank private String company;
        private String location;
        @NotBlank private String type;
        private String description;
        private String[] requirements;
    }
}
