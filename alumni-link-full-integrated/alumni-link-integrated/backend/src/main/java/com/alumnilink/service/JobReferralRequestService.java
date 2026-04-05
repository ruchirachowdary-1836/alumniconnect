package com.alumnilink.service;

import com.alumnilink.dto.JobReferralRequestDto;
import com.alumnilink.model.ChatThread;
import com.alumnilink.model.JobReferral;
import com.alumnilink.model.JobReferralRequest;
import com.alumnilink.model.Profile;
import com.alumnilink.model.UserRole.AppRole;
import com.alumnilink.repository.ChatThreadRepository;
import com.alumnilink.repository.JobReferralRepository;
import com.alumnilink.repository.JobReferralRequestRepository;
import com.alumnilink.repository.ProfileRepository;
import com.alumnilink.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JobReferralRequestService {

    private final JobReferralRequestRepository requestRepository;
    private final JobReferralRepository jobRepository;
    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;
    private final ChatThreadRepository chatThreadRepository;

    @Transactional
    public JobReferralRequestDto create(UUID jobId, UUID studentId, MultipartFile resume, String message) {
        if (!userRoleRepository.existsByUserIdAndRole(studentId, AppRole.student)) {
            throw new SecurityException("Only students can request referrals");
        }

        JobReferral job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));

        UUID alumniId = job.getPostedBy();
        if (studentId.equals(alumniId)) {
            throw new IllegalArgumentException("Cannot request referral for your own job post");
        }

        if (requestRepository.existsByJobIdAndStudentIdAndStatusIn(jobId, studentId, List.of("pending", "accepted"))) {
            throw new IllegalArgumentException("You have already sent a referral request for this job");
        }

        if (resume == null || resume.isEmpty()) {
            throw new IllegalArgumentException("Resume file is required");
        }

        byte[] data;
        try {
            data = resume.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to read resume file");
        }

        String fileName = resume.getOriginalFilename() != null ? resume.getOriginalFilename() : "resume";
        String contentType = resume.getContentType() != null ? resume.getContentType() : "application/octet-stream";

        JobReferralRequest r = JobReferralRequest.builder()
                .jobId(jobId)
                .studentId(studentId)
                .alumniId(alumniId)
                .message(message != null ? message : "")
                .resumeFileName(fileName)
                .resumeContentType(contentType)
                .resumeData(data)
                .status("pending")
                .build();

        return toDto(requestRepository.save(r), job, studentId);
    }

    public List<JobReferralRequestDto> listForAlumni(UUID alumniId) {
        return requestRepository.findByAlumniIdOrderByCreatedAtDesc(alumniId).stream()
                .map(r -> toDto(r, jobRepository.findById(r.getJobId()).orElse(null), r.getStudentId()))
                .toList();
    }

    public List<JobReferralRequestDto> listForStudent(UUID studentId) {
        return requestRepository.findByStudentIdOrderByCreatedAtDesc(studentId).stream()
                .map(r -> toDto(r, jobRepository.findById(r.getJobId()).orElse(null), r.getStudentId()))
                .toList();
    }

    @Transactional
    public JobReferralRequestDto updateStatus(UUID requestId, UUID alumniId, String status) {
        JobReferralRequest r = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Referral request not found"));

        if (!r.getAlumniId().equals(alumniId)) {
            throw new SecurityException("Not authorized to update this request");
        }

        String s = status == null ? "" : status.trim().toLowerCase();
        if (!s.equals("accepted") && !s.equals("rejected")) {
            throw new IllegalArgumentException("Invalid status");
        }

        r.setStatus(s);
        if (s.equals("accepted")) {
            chatThreadRepository.findByReferralRequestId(r.getId())
                    .orElseGet(() -> chatThreadRepository.save(ChatThread.builder()
                            .kind("referral")
                            .referralRequestId(r.getId())
                            .studentId(r.getStudentId())
                            .alumniId(r.getAlumniId())
                            .build()));
        }
        JobReferral job = jobRepository.findById(r.getJobId()).orElse(null);
        return toDto(requestRepository.save(r), job, r.getStudentId());
    }

    public JobReferralRequest getForResume(UUID requestId, UUID requesterId) {
        JobReferralRequest r = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Referral request not found"));

        if (!r.getStudentId().equals(requesterId) && !r.getAlumniId().equals(requesterId)) {
            throw new SecurityException("Not authorized to access this resume");
        }
        return r;
    }

    private JobReferralRequestDto toDto(JobReferralRequest r, JobReferral job, UUID studentId) {
        JobReferralRequestDto dto = new JobReferralRequestDto();
        dto.setId(r.getId());
        dto.setJobId(r.getJobId());
        dto.setStudentId(r.getStudentId());
        dto.setAlumniId(r.getAlumniId());
        dto.setMessage(r.getMessage());
        dto.setResumeFileName(r.getResumeFileName());
        dto.setResumeContentType(r.getResumeContentType());
        dto.setStatus(r.getStatus());
        dto.setCreatedAt(r.getCreatedAt());
        dto.setUpdatedAt(r.getUpdatedAt());

        if (job != null) {
            dto.setJobTitle(job.getTitle());
            dto.setJobCompany(job.getCompany());
        }

        profileRepository.findByUserId(studentId).ifPresent(p -> {
            dto.setStudentName(p.getName());
            dto.setStudentRollNo(p.getRollNo());
        });

        return dto;
    }
}
