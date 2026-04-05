package com.alumnilink.service;

import com.alumnilink.dto.AuthDto;
import com.alumnilink.model.Profile;
import com.alumnilink.model.OtpChallenge;
import com.alumnilink.model.User;
import com.alumnilink.model.UserRole;
import com.alumnilink.model.UserRole.AppRole;
import com.alumnilink.repository.OtpChallengeRepository;
import com.alumnilink.repository.ProfileRepository;
import com.alumnilink.repository.UserRepository;
import com.alumnilink.repository.UserRoleRepository;
import com.alumnilink.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final ObjectProvider<GoogleTokenVerifierService> googleTokenVerifierServiceProvider;
    private final OtpChallengeRepository otpChallengeRepository;
    private final OtpService otpService;

    @Transactional
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest req) {
        String email = req.getEmail() == null ? "" : req.getEmail().trim().toLowerCase();
        String phoneNumber = normalizePhone(req.getPhoneNumber());
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already in use");
        }
        if (phoneNumber.isBlank()) {
            throw new IllegalArgumentException("Phone number is required");
        }

        AppRole role = AppRole.valueOf(req.getRole());

        // Bootstrap: allow the very first admin to be created, block subsequent public admin signups.
        if (role == AppRole.admin && userRoleRepository.existsByRole(AppRole.admin)) {
            throw new SecurityException("Admin accounts cannot be self-registered");
        }

        // For local app usage, approve newly created accounts immediately.
        boolean approved = true;
        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .name(req.getName())
                .phoneNumber(phoneNumber)
                .approved(approved)
                .phoneVerified(false)
                .build();
        user = userRepository.save(user);

        UserRole userRole = UserRole.builder()
                .userId(user.getId())
                .role(role)
                .build();
        userRoleRepository.save(userRole);

        Profile profile = Profile.builder()
                .userId(user.getId())
                .name(req.getName())
                .available(true)
                .build();
        profileRepository.save(profile);

        OtpChallenge challenge = otpService.createChallenge(user, phoneNumber, "register");
        return challengeResponse(user, role.name(), approved, challenge, "We sent an OTP to verify your phone number.");
    }

    public AuthDto.AuthResponse login(AuthDto.LoginRequest req) {
        String email = req.getEmail() == null ? "" : req.getEmail().trim().toLowerCase();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, req.getPassword()));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!user.isApproved()) {
            throw new SecurityException("Account pending admin approval");
        }

        String role = userRoleRepository.findByUserId(user.getId())
                .map(ur -> ur.getRole().name())
                .orElse("student");

        if (hasPhoneNumber(user)) {
            OtpChallenge challenge = otpService.createChallenge(user, user.getPhoneNumber(), "login");
            return challengeResponse(user, role, true, challenge, "We sent a login OTP to your verified phone number.");
        }

        String token = jwtUtils.generateToken(user.getId().toString(), user.getEmail(), role);
        AuthDto.AuthResponse response = authResponse(user, role, token);
        response.setPhoneVerificationRequired(true);
        response.setMessage("Add and verify your phone number from your profile to enable OTP login and direct mentorship contact.");
        return response;
    }

    public AuthDto.AuthResponse googleLogin(AuthDto.GoogleLoginRequest req) {
        GoogleTokenVerifierService googleTokenVerifierService = googleTokenVerifierServiceProvider.getIfAvailable();
        if (googleTokenVerifierService == null) {
            throw new IllegalStateException("Google Sign-In is not configured on the backend");
        }
        GoogleTokenVerifierService.GoogleProfile googleProfile = googleTokenVerifierService.verify(req.getIdToken());

        User user = userRepository.findByEmail(googleProfile.email())
                .orElseThrow(() -> new IllegalArgumentException("No account found for this Google email. Please sign up first."));

        if (!user.isApproved()) {
            throw new SecurityException("Account pending admin approval");
        }

        String role = userRoleRepository.findByUserId(user.getId())
                .map(ur -> ur.getRole().name())
                .orElse("student");

        if (hasPhoneNumber(user)) {
            OtpChallenge challenge = otpService.createChallenge(user, user.getPhoneNumber(), "login");
            return challengeResponse(user, role, true, challenge, "We sent a login OTP to your verified phone number.");
        }

        AuthDto.AuthResponse response = authResponse(user, role, jwtUtils.generateToken(user.getId().toString(), user.getEmail(), role));
        response.setPhoneVerificationRequired(true);
        response.setMessage("Add and verify your phone number from your profile to enable OTP login and direct mentorship contact.");
        return response;
    }

    @Transactional
    public AuthDto.AuthResponse verifyOtp(AuthDto.VerifyOtpRequest req) {
        OtpChallenge challenge = otpChallengeRepository.findByIdAndConsumedAtIsNull(req.getChallengeId())
                .orElseThrow(() -> new IllegalArgumentException("OTP challenge not found"));
        otpService.verifyChallenge(challenge, req.getOtp());

        User user = userRepository.findById(challenge.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setPhoneNumber(challenge.getPhoneNumber());
        user.setPhoneVerified(true);
        userRepository.save(user);

        String role = userRoleRepository.findByUserId(user.getId())
                .map(ur -> ur.getRole().name())
                .orElse("student");

        return authResponse(user, role, jwtUtils.generateToken(user.getId().toString(), user.getEmail(), role));
    }

    @Transactional
    public AuthDto.AuthResponse requestPhoneVerification(User user, AuthDto.PhoneVerificationRequest req) {
        String phoneNumber = normalizePhone(req.getPhoneNumber());
        if (phoneNumber.isBlank()) {
            throw new IllegalArgumentException("Phone number is required");
        }
        user.setPhoneNumber(phoneNumber);
        user.setPhoneVerified(false);
        userRepository.save(user);

        OtpChallenge challenge = otpService.createChallenge(user, phoneNumber, "phone_update");
        return challengeResponse(user, currentRole(user), user.isApproved(), challenge, "We sent an OTP to verify your phone number.");
    }

    private boolean hasVerifiedPhone(User user) {
        return user.isPhoneVerified() && user.getPhoneNumber() != null && !user.getPhoneNumber().isBlank();
    }

    private boolean hasPhoneNumber(User user) {
        return user.getPhoneNumber() != null && !user.getPhoneNumber().isBlank();
    }

    private String normalizePhone(String phoneNumber) {
        if (phoneNumber == null) return "";
        return phoneNumber.replaceAll("[^\\d+]", "").trim();
    }

    private String currentRole(User user) {
        return userRoleRepository.findByUserId(user.getId())
                .map(ur -> ur.getRole().name())
                .orElse("student");
    }

    private AuthDto.AuthResponse authResponse(User user, String role, String token) {
        AuthDto.AuthResponse response = new AuthDto.AuthResponse(token, user.getId().toString(), user.getEmail(), user.getName(), role, user.isApproved());
        response.setPhoneNumber(user.getPhoneNumber());
        response.setPhoneVerified(user.isPhoneVerified());
        return response;
    }

    private AuthDto.AuthResponse challengeResponse(User user, String role, boolean approved, OtpChallenge challenge, String message) {
        AuthDto.AuthResponse response = new AuthDto.AuthResponse("", user.getId().toString(), user.getEmail(), user.getName(), role, approved);
        response.setPhoneNumber(user.getPhoneNumber());
        response.setPhoneVerified(user.isPhoneVerified());
        response.setRequiresOtp(true);
        response.setChallengeId(challenge.getId());
        response.setPhoneNumberMasked(otpService.maskPhoneNumber(challenge.getPhoneNumber()));
        response.setDevOtp(otpService.maybeExposeDevCode(challenge));
        response.setMessage(message);
        return response;
    }
}
