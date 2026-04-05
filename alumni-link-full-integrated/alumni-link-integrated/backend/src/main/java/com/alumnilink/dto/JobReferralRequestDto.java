package com.alumnilink.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class JobReferralRequestDto {
    private UUID id;
    private UUID jobId;
    private UUID studentId;
    private UUID alumniId;
    private String jobTitle;
    private String jobCompany;
    private String studentName;
    private String studentRollNo;
    private String message;
    private String resumeFileName;
    private String resumeContentType;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @Data
    public static class UpdateStatusRequest {
        @NotNull
        private String status; // accepted | rejected
    }
}

