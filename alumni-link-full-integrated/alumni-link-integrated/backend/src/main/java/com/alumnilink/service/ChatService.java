package com.alumnilink.service;

import com.alumnilink.dto.ChatDto;
import com.alumnilink.model.ChatMessage;
import com.alumnilink.model.ChatThread;
import com.alumnilink.model.MentorshipRequest;
import com.alumnilink.model.User;
import com.alumnilink.model.JobReferral;
import com.alumnilink.model.JobReferralRequest;
import com.alumnilink.repository.ChatMessageRepository;
import com.alumnilink.repository.ChatThreadRepository;
import com.alumnilink.repository.JobReferralRepository;
import com.alumnilink.repository.JobReferralRequestRepository;
import com.alumnilink.repository.MentorshipRequestRepository;
import com.alumnilink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatThreadRepository threadRepository;
    private final ChatMessageRepository messageRepository;
    private final MentorshipRequestRepository mentorshipRepository;
    private final JobReferralRequestRepository referralRequestRepository;
    private final JobReferralRepository jobRepository;
    private final UserRepository userRepository;

    public List<ChatDto.ThreadDto> listMyThreads(UUID userId) {
        List<ChatThread> threads = threadRepository.findByStudentIdOrAlumniIdOrderByCreatedAtDesc(userId, userId);

        Set<UUID> userIds = new HashSet<>();
        for (ChatThread t : threads) {
            userIds.add(t.getStudentId());
            userIds.add(t.getAlumniId());
        }

        Map<UUID, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return threads.stream().map(t -> toThreadDto(t, usersById)).toList();
    }

    @Transactional
    public ChatDto.ThreadDto getOrCreateThreadFromMentorship(UUID mentorshipRequestId, UUID userId) {
        MentorshipRequest mr = mentorshipRepository.findById(mentorshipRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Mentorship request not found"));

        if (!"approved".equalsIgnoreCase(mr.getStatus())) {
            throw new SecurityException("Chat is only available after mentorship approval");
        }

        if (!mr.getStudentId().equals(userId) && !mr.getAlumniId().equals(userId)) {
            throw new SecurityException("Not authorized to access this chat");
        }

        ChatThread thread = threadRepository.findByMentorshipRequestId(mentorshipRequestId)
                .or(() -> threadRepository.findFirstByKindAndStudentIdAndAlumniIdOrderByCreatedAtAsc(
                        "mentorship",
                        mr.getStudentId(),
                        mr.getAlumniId()
                ))
                .orElseGet(() -> {
                    try {
                        return threadRepository.save(ChatThread.builder()
                                .kind("mentorship")
                                .mentorshipRequestId(mentorshipRequestId)
                                .studentId(mr.getStudentId())
                                .alumniId(mr.getAlumniId())
                                .build());
                    } catch (DataIntegrityViolationException ex) {
                        // Another request created the thread concurrently, or a unique-per-pair constraint fired.
                        return threadRepository.findFirstByKindAndStudentIdAndAlumniIdOrderByCreatedAtAsc(
                                        "mentorship",
                                        mr.getStudentId(),
                                        mr.getAlumniId()
                                )
                                .orElseThrow(() -> ex);
                    }
                });

        Map<UUID, User> usersById = userRepository.findAllById(List.of(thread.getStudentId(), thread.getAlumniId()))
                .stream().collect(Collectors.toMap(User::getId, u -> u));

        return toThreadDto(thread, usersById);
    }

    @Transactional
    public ChatDto.ThreadDto getOrCreateThreadFromReferral(UUID referralRequestId, UUID userId) {
        JobReferralRequest rr = referralRequestRepository.findById(referralRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Referral request not found"));

        if (!"accepted".equalsIgnoreCase(rr.getStatus())) {
            throw new SecurityException("Chat is only available after the referral request is accepted");
        }

        if (!rr.getStudentId().equals(userId) && !rr.getAlumniId().equals(userId)) {
            throw new SecurityException("Not authorized to access this chat");
        }

        ChatThread thread = threadRepository.findByReferralRequestId(referralRequestId)
                .or(() -> threadRepository.findFirstByKindAndStudentIdAndAlumniIdOrderByCreatedAtAsc(
                        "referral",
                        rr.getStudentId(),
                        rr.getAlumniId()
                ))
                .orElseGet(() -> {
                    try {
                        return threadRepository.save(ChatThread.builder()
                                .kind("referral")
                                .referralRequestId(referralRequestId)
                                .studentId(rr.getStudentId())
                                .alumniId(rr.getAlumniId())
                                .build());
                    } catch (DataIntegrityViolationException ex) {
                        return threadRepository.findFirstByKindAndStudentIdAndAlumniIdOrderByCreatedAtAsc(
                                        "referral",
                                        rr.getStudentId(),
                                        rr.getAlumniId()
                                )
                                .orElseThrow(() -> ex);
                    }
                });

        Map<UUID, User> usersById = userRepository.findAllById(List.of(thread.getStudentId(), thread.getAlumniId()))
                .stream().collect(Collectors.toMap(User::getId, u -> u));

        return toThreadDto(thread, usersById);
    }

    public List<ChatDto.MessageDto> getMessages(UUID threadId, UUID userId) {
        ChatThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new IllegalArgumentException("Chat thread not found"));

        ensureParticipant(thread, userId);
        ensureThreadSourceAllowed(thread);

        return messageRepository.findByThreadIdOrderByCreatedAtAsc(threadId).stream()
                .map(this::toMessageDto)
                .toList();
    }

    @Transactional
    public ChatDto.MessageDto sendMessage(UUID threadId, UUID userId, String content) {
        ChatThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new IllegalArgumentException("Chat thread not found"));

        ensureParticipant(thread, userId);
        ensureThreadSourceAllowed(thread);

        String trimmed = content == null ? "" : content.trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("Message cannot be empty");
        }

        ChatMessage msg = ChatMessage.builder()
                .threadId(threadId)
                .senderId(userId)
                .content(trimmed)
                .build();
        return toMessageDto(messageRepository.save(msg));
    }

    private void ensureParticipant(ChatThread thread, UUID userId) {
        if (!thread.getStudentId().equals(userId) && !thread.getAlumniId().equals(userId)) {
            throw new SecurityException("Not authorized to access this chat");
        }
    }

    private void ensureThreadSourceAllowed(ChatThread thread) {
        String kind = thread.getKind() == null ? "" : thread.getKind().trim().toLowerCase();
        if (kind.equals("mentorship")) {
            ensureMentorshipApproved(thread.getMentorshipRequestId());
            return;
        }
        if (kind.equals("referral")) {
            ensureReferralAccepted(thread.getReferralRequestId());
            return;
        }
        throw new SecurityException("Unknown chat type");
    }

    private void ensureMentorshipApproved(UUID mentorshipRequestId) {
        if (mentorshipRequestId == null) throw new IllegalArgumentException("Mentorship request not found");
        MentorshipRequest mr = mentorshipRepository.findById(mentorshipRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Mentorship request not found"));
        if (!"approved".equalsIgnoreCase(mr.getStatus())) {
            throw new SecurityException("Chat is only available after mentorship approval");
        }
    }

    private void ensureReferralAccepted(UUID referralRequestId) {
        if (referralRequestId == null) throw new IllegalArgumentException("Referral request not found");
        JobReferralRequest rr = referralRequestRepository.findById(referralRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Referral request not found"));
        if (!"accepted".equalsIgnoreCase(rr.getStatus())) {
            throw new SecurityException("Chat is only available after the referral request is accepted");
        }
    }

    private ChatDto.ThreadDto toThreadDto(ChatThread t, Map<UUID, User> usersById) {
        ChatDto.ThreadDto dto = new ChatDto.ThreadDto();
        dto.setId(t.getId());
        dto.setMentorshipRequestId(t.getMentorshipRequestId());
        dto.setKind(t.getKind());
        dto.setStudentId(t.getStudentId());
        dto.setAlumniId(t.getAlumniId());
        dto.setStudentName(Optional.ofNullable(usersById.get(t.getStudentId())).map(User::getName).orElse("Student"));
        dto.setAlumniName(Optional.ofNullable(usersById.get(t.getAlumniId())).map(User::getName).orElse("Alumni"));
        dto.setCreatedAt(t.getCreatedAt());

        if ("referral".equalsIgnoreCase(t.getKind()) && t.getReferralRequestId() != null) {
            referralRequestRepository.findById(t.getReferralRequestId()).ifPresent(rr -> {
                dto.setReferralRequestId(rr.getId());
                JobReferral job = jobRepository.findById(rr.getJobId()).orElse(null);
                if (job != null) {
                    dto.setContextTitle("Referral: " + job.getTitle());
                } else {
                    dto.setContextTitle("Referral Chat");
                }
            });
        } else if ("mentorship".equalsIgnoreCase(t.getKind())) {
            dto.setContextTitle("Mentorship Chat");
        }

        messageRepository.findTopByThreadIdOrderByCreatedAtDesc(t.getId()).ifPresent(last -> {
            dto.setLastMessageAt(last.getCreatedAt());
            dto.setLastMessage(last.getContent());
        });

        return dto;
    }

    private ChatDto.MessageDto toMessageDto(ChatMessage m) {
        ChatDto.MessageDto dto = new ChatDto.MessageDto();
        dto.setId(m.getId());
        dto.setThreadId(m.getThreadId());
        dto.setSenderId(m.getSenderId());
        dto.setContent(m.getContent());
        dto.setCreatedAt(m.getCreatedAt());
        return dto;
    }
}
