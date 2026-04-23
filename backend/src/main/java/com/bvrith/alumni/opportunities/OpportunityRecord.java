package com.bvrith.alumni.opportunities;

public record OpportunityRecord(
    String id,
    String title,
    String company,
    String type,
    String location,
    String description,
    String applyLink,
    String postedByName,
    String postedByEmail,
    String postedByRollNumber,
    String createdAt,
    String status
) {
}
