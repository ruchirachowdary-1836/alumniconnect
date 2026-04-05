package com.alumnilink.service;

import com.alumnilink.dto.MentorshipDto;
import com.alumnilink.model.ChatThread;
import com.alumnilink.model.MentorshipRequest;
import com.alumnilink.model.Profile;
import com.alumnilink.model.User;
import com.alumnilink.model.UserRole.AppRole;
import com.alumnilink.repository.ChatThreadRepository;
import com.alumnilink.repository.MentorshipRequestRepository;
import com.alumnilink.repository.ProfileRepository;
import com.alumnilink.repository.UserRepository;
import com.alumnilink.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MentorshipService {

    private final MentorshipRequestRepository mentorshipRepo;
    private final UserRoleRepository userRoleRepository;
    private final ChatThreadRepository chatThreadRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final MentorshipNotificationService mentorshipNotificationService;

    public List<MentorshipDto> getRequestsForUser(UUID userId) {
        List<MentorshipRequest> reqs = mentorshipRepo.findByStudentIdOrAlumniId(userId, userId);

        List<UUID> participantIds = reqs.stream()
                .flatMap(mr -> java.util.stream.Stream.of(mr.getStudentId(), mr.getAlumniId()))
                .distinct()
                .toList();
        Map<UUID, User> usersById = userRepository.findAllById(participantIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        Map<UUID, Profile> profilesByUserId = new HashMap<>();
        profileRepository.findByUserIdIn(participantIds).forEach(p -> profilesByUserId.put(p.getUserId(), p));

        return reqs.stream()
                .map(mr -> toDto(mr, usersById, profilesByUserId))
                .collect(Collectors.toList());
    }

    @Transactional
    public MentorshipDto createRequest(UUID studentId, MentorshipDto.CreateRequest req) {
        // Verify requester is a student
        boolean isStudent = userRoleRepository.existsByUserIdAndRole(studentId, AppRole.student);
        if (!isStudent) {
            throw new SecurityException("Only students can send mentorship requests");
        }
        if (studentId.equals(req.getAlumniId())) {
            throw new IllegalArgumentException("Cannot send request to yourself");
        }

        User studentUser = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));
        if (!studentUser.isPhoneVerified() || studentUser.getPhoneNumber() == null || studentUser.getPhoneNumber().isBlank()) {
            throw new IllegalArgumentException("Verify your phone number before sending mentorship requests");
        }

        // Only allow a single "active" request per (student, alumni) pair.
        // If the last request was rejected, student can send again.
        if (mentorshipRepo.existsByStudentIdAndAlumniIdAndStatusIn(studentId, req.getAlumniId(), List.of("pending", "approved"))) {
            throw new IllegalArgumentException("You already have an active mentorship request for this alumni");
        }

        MentorshipRequest mr = MentorshipRequest.builder()
                .studentId(studentId)
                .alumniId(req.getAlumniId())
                .message(req.getMessage() != null ? req.getMessage() : "")
                .status("pending")
                .build();
        MentorshipRequest saved = mentorshipRepo.save(mr);

        User alumniUser = userRepository.findById(req.getAlumniId())
                .orElseThrow(() -> new IllegalArgumentException("Alumni not found"));
        mentorshipNotificationService.notifyNewMentorshipRequest(studentUser, alumniUser, saved.getMessage());

        return toDto(saved);
    }

    @Transactional
    public MentorshipDto updateStatus(UUID id, UUID alumniId, MentorshipDto.UpdateStatusRequest req) {
        MentorshipRequest mr = mentorshipRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        if (!mr.getAlumniId().equals(alumniId)) {
            throw new SecurityException("Not authorized to update this request");
        }
        mr.setStatus(req.getStatus());
        MentorshipRequest saved = mentorshipRepo.save(mr);

        if ("approved".equalsIgnoreCase(saved.getStatus())) {
            chatThreadRepository.findByMentorshipRequestId(saved.getId())
                    .orElseGet(() -> chatThreadRepository.save(ChatThread.builder()
                            .mentorshipRequestId(saved.getId())
                            .studentId(saved.getStudentId())
                            .alumniId(saved.getAlumniId())
                            .build()));
        }

        return toDto(saved);
    }

    private MentorshipDto toDto(MentorshipRequest mr) {
        Map<UUID, User> usersById = userRepository.findAllById(List.of(mr.getStudentId(), mr.getAlumniId())).stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        Map<UUID, Profile> profilesByUserId = new HashMap<>();
        profileRepository.findByUserId(mr.getStudentId()).ifPresent(p -> profilesByUserId.put(p.getUserId(), p));
        profileRepository.findByUserId(mr.getAlumniId()).ifPresent(p -> profilesByUserId.put(p.getUserId(), p));
        return toDto(mr, usersById, profilesByUserId);
    }

    private MentorshipDto toDto(MentorshipRequest mr, Map<UUID, User> usersById, Map<UUID, Profile> profilesByUserId) {
        MentorshipDto dto = new MentorshipDto();
        dto.setId(mr.getId());
        dto.setStudentId(mr.getStudentId());
        dto.setAlumniId(mr.getAlumniId());
        dto.setMessage(mr.getMessage());
        dto.setStatus(mr.getStatus());
        dto.setCreatedAt(mr.getCreatedAt());
        dto.setUpdatedAt(mr.getUpdatedAt());

        User studentUser = usersById.get(mr.getStudentId());
        Profile studentProfile = profilesByUserId.get(mr.getStudentId());
        if (studentProfile != null) {
            dto.setStudentName(studentProfile.getName());
            dto.setStudentRollNo(studentProfile.getRollNo());
            dto.setStudentDepartment(studentProfile.getDepartment());
            dto.setStudentBatch(studentProfile.getBatch());
            dto.setStudentAvatarUrl(studentProfile.getAvatarUrl());
        } else if (studentUser != null) {
            dto.setStudentName(studentUser.getName());
        }
        if (studentUser != null) {
            dto.setStudentEmail(studentUser.getEmail());
            dto.setStudentPhoneNumber(studentUser.getPhoneNumber());
            dto.setStudentPhoneVerified(studentUser.isPhoneVerified());
        }

        User alumniUser = usersById.get(mr.getAlumniId());
        if (alumniUser != null) {
            dto.setAlumniEmail(alumniUser.getEmail());
            dto.setAlumniPhoneNumber(alumniUser.getPhoneNumber());
            dto.setAlumniPhoneVerified(alumniUser.isPhoneVerified());
        }

        return dto;
    }
}
