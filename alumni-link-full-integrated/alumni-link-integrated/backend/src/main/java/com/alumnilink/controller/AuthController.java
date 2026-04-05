package com.alumnilink.controller;

import com.alumnilink.dto.AuthDto;
import com.alumnilink.security.SecurityUtils;
import com.alumnilink.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final SecurityUtils securityUtils;

    @PostMapping("/register")
    public ResponseEntity<AuthDto.AuthResponse> register(@Valid @RequestBody AuthDto.RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDto.AuthResponse> login(@Valid @RequestBody AuthDto.LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthDto.AuthResponse> googleLogin(@Valid @RequestBody AuthDto.GoogleLoginRequest req) {
        return ResponseEntity.ok(authService.googleLogin(req));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthDto.AuthResponse> verifyOtp(@Valid @RequestBody AuthDto.VerifyOtpRequest req) {
        return ResponseEntity.ok(authService.verifyOtp(req));
    }

    @PostMapping("/phone/request-verification")
    public ResponseEntity<AuthDto.AuthResponse> requestPhoneVerification(@Valid @RequestBody AuthDto.PhoneVerificationRequest req) {
        return ResponseEntity.ok(authService.requestPhoneVerification(securityUtils.getCurrentUser(), req));
    }
}
