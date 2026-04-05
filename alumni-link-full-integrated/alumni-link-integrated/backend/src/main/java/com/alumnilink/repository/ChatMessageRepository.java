package com.alumnilink.repository;

import com.alumnilink.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findByThreadIdOrderByCreatedAtAsc(UUID threadId);
    Optional<ChatMessage> findTopByThreadIdOrderByCreatedAtDesc(UUID threadId);
}

