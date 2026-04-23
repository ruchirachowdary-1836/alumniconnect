package com.bvrith.alumni.events;

import com.bvrith.alumni.support.JsonFileStore;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class EventService {
  private static final TypeReference<List<EventRecord>> EVENT_TYPE = new TypeReference<>() {};
  private final JsonFileStore jsonFileStore;
  private final Path filePath = Path.of("data", "events.json");

  public EventService(JsonFileStore jsonFileStore) {
    this.jsonFileStore = jsonFileStore;
    this.jsonFileStore.seedIfMissing(filePath, "seed/events.json");
  }

  public List<EventRecord> getEvents(String type) {
    return jsonFileStore.readList(filePath, EVENT_TYPE).stream()
        .filter(item -> type == null || type.isBlank() || "All".equalsIgnoreCase(type) || item.eventType().equalsIgnoreCase(type))
        .sorted(Comparator.comparing(this::safeEventDate))
        .toList();
  }

  public List<EventRecord> create(EventRequest request) {
    List<EventRecord> current = jsonFileStore.readList(filePath, EVENT_TYPE);
    String normalizedType = request.eventType() == null || request.eventType().isBlank() ? "Online" : request.eventType();
    EventRecord record = new EventRecord(
        "spring-event-" + UUID.randomUUID(),
        request.title(),
        request.description(),
        normalizedType,
        normalizeNullable(request.location()),
        normalizeNullable(request.link()),
        request.eventDate(),
        new CreatorRecord(
            request.createdByName() == null || request.createdByName().isBlank() ? "Spring Boot Service" : request.createdByName()
        )
    );
    current.add(record);
    current.sort(Comparator.comparing(this::safeEventDate));
    jsonFileStore.writeList(filePath, current);
    return current;
  }

  private OffsetDateTime safeEventDate(EventRecord record) {
    try {
      return OffsetDateTime.parse(record.eventDate());
    } catch (DateTimeParseException exception) {
      return OffsetDateTime.now().plusYears(10);
    }
  }

  private String normalizeNullable(String value) {
    return value == null || value.isBlank() ? null : value;
  }
}
