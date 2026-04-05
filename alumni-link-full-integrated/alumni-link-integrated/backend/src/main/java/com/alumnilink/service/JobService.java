package com.alumnilink.service;

import com.alumnilink.dto.JobDto;
import com.alumnilink.model.JobReferral;
import com.alumnilink.repository.JobReferralRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobReferralRepository jobRepository;

    public List<JobDto> getAllJobs() {
        return jobRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public JobDto getJob(UUID id) {
        return toDto(jobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Job not found")));
    }

    @Transactional
    public JobDto createJob(UUID postedBy, JobDto.CreateRequest req) {
        JobReferral job = JobReferral.builder()
                .title(req.getTitle())
                .company(req.getCompany())
                .location(req.getLocation() != null ? req.getLocation() : "")
                .type(req.getType())
                .description(req.getDescription() != null ? req.getDescription() : "")
                .requirements(req.getRequirements() != null ? req.getRequirements() : new String[]{})
                .status("open")
                .postedBy(postedBy)
                .build();
        return toDto(jobRepository.save(job));
    }

    @Transactional
    public JobDto updateJobStatus(UUID id, UUID requesterId, String status) {
        JobReferral job = jobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));
        if (!job.getPostedBy().equals(requesterId)) {
            throw new SecurityException("Not authorized to update this job");
        }
        job.setStatus(status);
        return toDto(jobRepository.save(job));
    }

    @Transactional
    public void deleteJob(UUID id, UUID requesterId) {
        JobReferral job = jobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));
        if (!job.getPostedBy().equals(requesterId)) {
            throw new SecurityException("Not authorized to delete this job");
        }
        jobRepository.delete(job);
    }

    private JobDto toDto(JobReferral j) {
        JobDto dto = new JobDto();
        dto.setId(j.getId());
        dto.setTitle(j.getTitle());
        dto.setCompany(j.getCompany());
        dto.setLocation(j.getLocation());
        dto.setType(j.getType());
        dto.setDescription(j.getDescription());
        dto.setRequirements(j.getRequirements());
        dto.setStatus(j.getStatus());
        dto.setPostedBy(j.getPostedBy());
        dto.setCreatedAt(j.getCreatedAt());
        dto.setUpdatedAt(j.getUpdatedAt());
        return dto;
    }
}
