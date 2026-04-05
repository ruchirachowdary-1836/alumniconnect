package com.alumnilink.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

public class AuthDto {

    @Data
    public static class RegisterRequest {
        @NotBlank
        private String name;

        @NotBlank @Email
        private String email;

        @NotBlank @Size(min = 6)
        private String password;

        @NotBlank
        private String phoneNumber;

        @NotBlank
        private String role; // student | alumni | admin
    }

    @Data
    public static class LoginRequest {
        @NotBlank @Email
        private String email;

        @NotBlank
        private String password;
    }

    @Data
    public static class GoogleLoginRequest {
        @NotBlank
        private String idToken;
    }

    @Data
    public static class VerifyOtpRequest {
        private UUID challengeId;
        @NotBlank @Size(min = 6, max = 6)
        private String otp;
    }

    @Data
    public static class PhoneVerificationRequest {
        @NotBlank
        private String phoneNumber;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String userId;
        private String email;
        private String name;
        private String role;
        private boolean approved;
        private String phoneNumber;
        private boolean phoneVerified;
        private UUID challengeId;
        private String phoneNumberMasked;
        private boolean requiresOtp;
        private boolean phoneVerificationRequired;
        private String devOtp;
        private String message;

        public AuthResponse(String token, String userId, String email, String name, String role, boolean approved) {
            this.token = token;
            this.userId = userId;
            this.email = email;
            this.name = name;
            this.role = role;
            this.approved = approved;
        }
    }
}
