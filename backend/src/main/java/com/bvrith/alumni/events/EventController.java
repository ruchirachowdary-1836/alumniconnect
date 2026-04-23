package com.bvrith.alumni.events;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class EventController {
  private final EventService eventService;

  public EventController(EventService eventService) {
    this.eventService = eventService;
  }

  @GetMapping("/health")
  public Map<String, String> health() {
    return Map.of("status", "ok", "service", "spring-backend");
  }

  @GetMapping("/events")
  public Map<String, List<EventRecord>> getEvents(@RequestParam(defaultValue = "All") String type) {
    return Map.of("events", eventService.getEvents(type));
  }

  @PostMapping("/events")
  public ResponseEntity<Map<String, Object>> createEvent(@Valid @RequestBody EventRequest request) {
    String activeType = request.eventType() == null || request.eventType().isBlank() ? "Online" : request.eventType();
    return ResponseEntity.ok(Map.of(
        "events", eventService.create(request),
        "activeType", activeType
    ));
  }
}
