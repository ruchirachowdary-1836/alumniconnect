package com.alumnilink.controller;

import com.alumnilink.dto.EventDto;
import com.alumnilink.security.SecurityUtils;
import com.alumnilink.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<List<EventDto>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventDto> getEvent(@PathVariable UUID id) {
        return ResponseEntity.ok(eventService.getEvent(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ALUMNI', 'ADMIN')")
    public ResponseEntity<EventDto> createEvent(@Valid @RequestBody EventDto.CreateRequest req) {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(eventService.createEvent(userId, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable UUID id) {
        UUID userId = securityUtils.getCurrentUserId();
        eventService.deleteEvent(id, userId);
        return ResponseEntity.noContent().build();
    }
}
