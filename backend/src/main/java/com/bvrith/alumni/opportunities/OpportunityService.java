package com.bvrith.alumni.opportunities;

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
public class OpportunityService {
  private static final TypeReference<List<OpportunityRecord>> OPPORTUNITY_TYPE = new TypeReference<>() {};
  private final JsonFileStore jsonFileStore;
  private final Path filePath = Path.of("data", "opportunities.json");

  public OpportunityService(JsonFileStore jsonFileStore) {
    this.jsonFileStore = jsonFileStore;
    this.jsonFileStore.seedIfMissing(filePath, "seed/opportunities.json");
  }

  public List<OpportunityRecord> getOpportunities() {
    return jsonFileStore.readList(filePath, OPPORTUNITY_TYPE).stream()
        .sorted(Comparator.comparing(this::safeCreatedAt).reversed())
        .toList();
  }

  public List<OpportunityRecord> create(OpportunityRequest request) {
    List<OpportunityRecord> current = jsonFileStore.readList(filePath, OPPORTUNITY_TYPE);
    OpportunityRecord record = new OpportunityRecord(
        "spring-opp-" + UUID.randomUUID(),
        request.title(),
        request.company(),
        request.type() == null || request.type().isBlank() ? "Job" : request.type(),
        request.location() == null || request.location().isBlank() ? "Remote" : request.location(),
        request.description(),
        request.applyLink(),
        request.postedByName() == null || request.postedByName().isBlank() ? "Spring Boot Service" : request.postedByName(),
        request.postedByEmail() == null ? "" : request.postedByEmail(),
        request.postedByRollNumber() == null || request.postedByRollNumber().isBlank() ? "SPRING-ALUMNI" : request.postedByRollNumber(),
        OffsetDateTime.now().toString(),
        "OPEN"
    );
    current.add(record);
    current.sort(Comparator.comparing(this::safeCreatedAt).reversed());
    jsonFileStore.writeList(filePath, current);
    return current;
  }

  private OffsetDateTime safeCreatedAt(OpportunityRecord record) {
    try {
      return OffsetDateTime.parse(record.createdAt());
    } catch (DateTimeParseException exception) {
      return OffsetDateTime.MIN;
    }
  }
}
