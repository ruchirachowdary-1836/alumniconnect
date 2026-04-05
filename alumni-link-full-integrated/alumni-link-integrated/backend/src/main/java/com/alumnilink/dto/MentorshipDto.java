package com.alumnilink.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class MentorshipDto {
    private UUID id;
    private UUID studentId;
    private UUID alumniId;
    private String message;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Sender (student) details for alumni inbox UI
    private String studentName;
    private String studentEmail;
    private String studentRollNo;
    private String studentDepartment;
    private String studentBatch;
    private String studentAvatarUrl;
    private String studentPhoneNumber;
    private Boolean studentPhoneVerified;
    private String alumniEmail;
    private String alumniPhoneNumber;
    private Boolean alumniPhoneVerified;

    @Data
    public static class CreateRequest {
        @NotNull private UUID alumniId;
        private String message;
    }

    @Data
    public static class UpdateStatusRequest {
        @NotNull private String status; // approved | rejected
    }
}
