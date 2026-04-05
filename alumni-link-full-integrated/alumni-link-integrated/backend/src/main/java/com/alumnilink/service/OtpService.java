package com.alumnilink.service;

import com.alumnilink.model.OtpChallenge;
import com.alumnilink.model.User;
import com.alumnilink.repository.OtpChallengeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpChallengeRepository otpChallengeRepository;

    @Value("${app.otp.ttl-minutes:5}")
    private long otpTtlMinutes;

    @Value("${app.otp.expose-dev-code:true}")
    private boolean exposeDevCode;

    @Transactional
    public OtpChallenge createChallenge(User user, String phoneNumber, String purpose) {
        otpChallengeRepository.deleteByExpiresAtBefore(OffsetDateTime.now());
        otpChallengeRepository.findByUserIdAndPurposeAndConsumedAtIsNull(user.getId(), purpose)
                .forEach(otpChallengeRepository::delete);

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        OtpChallenge challenge = otpChallengeRepository.save(OtpChallenge.builder()
                .userId(user.getId())
                .phoneNumber(phoneNumber)
                .purpose(purpose)
                .code(code)
                .expiresAt(OffsetDateTime.now().plusMinutes(otpTtlMinutes))
                .build());

        // Local-dev fallback until a real SMS provider is configured.
        System.out.printf("[OTP:%s] phone=%s code=%s%n", purpose, phoneNumber, code);
        return challenge;
    }

    @Transactional
    public OtpChallenge verifyChallenge(OtpChallenge challenge, String otp) {
        if (challenge.getConsumedAt() != null) {
            throw new SecurityException("OTP has already been used");
        }
        if (challenge.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new SecurityException("OTP has expired");
        }
        if (!challenge.getCode().equals(otp)) {
            throw new SecurityException("Invalid OTP");
        }
        challenge.setConsumedAt(OffsetDateTime.now());
        return otpChallengeRepository.save(challenge);
    }

    public String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isBlank()) return "";
        String digits = phoneNumber.replaceAll("\\D", "");
        if (digits.length() <= 4) return phoneNumber;
        return "******" + digits.substring(digits.length() - 4);
    }

    public String maybeExposeDevCode(OtpChallenge challenge) {
        return exposeDevCode ? challenge.getCode() : null;
    }
}
