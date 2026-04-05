package com.alumnilink.service;

import com.alumnilink.dto.EventDto;
import com.alumnilink.model.Event;
import com.alumnilink.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;

    public List<EventDto> getAllEvents() {
        return eventRepository.findAll(Sort.by(Sort.Direction.ASC, "eventDate"))
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public EventDto getEvent(UUID id) {
        return toDto(eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event not found")));
    }

    @Transactional
    public EventDto createEvent(UUID createdBy, EventDto.CreateRequest req) {
        Event event = Event.builder()
                .title(req.getTitle())
                .description(req.getDescription() != null ? req.getDescription() : "")
                .eventType(req.getEventType() != null ? req.getEventType() : "webinar")
                .eventDate(req.getEventDate())
                .location(req.getLocation() != null ? req.getLocation() : "")
                .link(req.getLink() != null ? req.getLink() : "")
                .createdBy(createdBy)
                .build();
        return toDto(eventRepository.save(event));
    }

    @Transactional
    public void deleteEvent(UUID id, UUID requesterId) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        if (!event.getCreatedBy().equals(requesterId)) {
            throw new SecurityException("Not authorized to delete this event");
        }
        eventRepository.delete(event);
    }

    private EventDto toDto(Event e) {
        EventDto dto = new EventDto();
        dto.setId(e.getId());
        dto.setTitle(e.getTitle());
        dto.setDescription(e.getDescription());
        dto.setEventType(e.getEventType());
        dto.setEventDate(e.getEventDate());
        dto.setLocation(e.getLocation());
        dto.setLink(e.getLink());
        dto.setCreatedBy(e.getCreatedBy());
        dto.setCreatedAt(e.getCreatedAt());
        return dto;
    }
}
