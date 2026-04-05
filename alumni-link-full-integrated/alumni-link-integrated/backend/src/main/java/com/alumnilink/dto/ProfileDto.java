package com.alumnilink.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ProfileDto {
    private UUID id;
    private UUID userId;
    private String name;
    private String rollNo;
    private String department;
    private String company;
    private BigDecimal packageAmount;
    private String batch;
    private String jobRole;
    private String[] expertise;
    private String bio;
    private String avatarUrl;
    private Boolean available;
    private String role; // populated from user_roles join
    private String email;
    private String phoneNumber;
    private Boolean phoneVerified;

    @Data
    public static class UpdateRequest {
        private String name;
        private String rollNo;
        private String department;
        private String company;
        private BigDecimal packageAmount;
        private String batch;
        private String jobRole;
        private String[] expertise;
        private String bio;
        private String avatarUrl;
        private Boolean available;
    }
}
