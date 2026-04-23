package com.bvrith.alumni.opportunities;

import jakarta.validation.constraints.NotBlank;

public record OpportunityRequest(
    @NotBlank String title,
    @NotBlank String company,
    String type,
    String location,
    @NotBlank String description,
    String applyLink,
    String postedByName,
    String postedByEmail,
    String postedByRollNumber
) {
}
