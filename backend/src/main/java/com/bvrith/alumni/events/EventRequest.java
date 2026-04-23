package com.bvrith.alumni.events;

import jakarta.validation.constraints.NotBlank;

public record EventRequest(
    @NotBlank String title,
    @NotBlank String description,
    String eventType,
    String location,
    String link,
    @NotBlank String eventDate,
    String createdByName
) {
}
