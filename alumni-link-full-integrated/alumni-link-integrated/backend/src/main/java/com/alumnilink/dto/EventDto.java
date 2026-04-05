package com.alumnilink.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class EventDto {
    private UUID id;
    private String title;
    private String description;
    private String eventType;
    private OffsetDateTime eventDate;
    private String location;
    private String link;
    private UUID createdBy;
    private OffsetDateTime createdAt;

    @Data
    public static class CreateRequest {
        @NotBlank private String title;
        private String description;
        private String eventType;
        @NotNull private OffsetDateTime eventDate;
        private String location;
        private String link;
    }
}
