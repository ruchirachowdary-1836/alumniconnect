package com.bvrith.alumni.events;

public record EventRecord(
    String id,
    String title,
    String description,
    String eventType,
    String location,
    String link,
    String eventDate,
    CreatorRecord createdBy
) {
}
