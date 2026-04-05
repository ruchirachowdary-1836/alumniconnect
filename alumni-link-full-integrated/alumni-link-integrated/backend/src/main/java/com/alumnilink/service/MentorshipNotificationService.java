package com.alumnilink.service;

import com.alumnilink.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class MentorshipNotificationService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.notifications.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.notifications.email.from:no-reply@alumnilink.local}")
    private String emailFrom;

    @Value("${app.notifications.sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${app.notifications.sms.api-url:}")
    private String smsApiUrl;

    @Value("${app.notifications.sms.auth-type:none}")
    private String smsAuthType;

    @Value("${app.notifications.sms.auth-username:}")
    private String smsAuthUsername;

    @Value("${app.notifications.sms.auth-password:}")
    private String smsAuthPassword;

    @Value("${app.notifications.sms.bearer-token:}")
    private String smsBearerToken;

    @Value("${app.notifications.sms.from:}")
    private String smsFrom;

    public void notifyNewMentorshipRequest(User student, User alumni, String message) {
        String subject = "New Mentorship Request on Alumni Connect";
        String body = """
                Hello %s,

                You have received a new mentorship request on Alumni Connect.

                Student: %s
                Student email: %s
                Student phone: %s

                Message:
                %s

                Please log in to Alumni Connect to review and respond.
                """
                .formatted(
                        safeName(alumni.getName()),
                        safeName(student.getName()),
                        safe(student.getEmail()),
                        safe(student.getPhoneNumber()),
                        safe(message)
                );

        sendEmail(alumni.getEmail(), subject, body);
        sendSms(alumni.getPhoneNumber(), """
                New mentorship request from %s. Email: %s. Phone: %s. Message: %s
                """
                .formatted(
                        safeName(student.getName()),
                        safe(student.getEmail()),
                        safe(student.getPhoneNumber()),
                        truncate(safe(message), 120)
                ));
    }

    private void sendEmail(String to, String subject, String body) {
        if (to == null || to.isBlank()) {
            log.warn("Skipping mentorship email notification because recipient email is missing");
            return;
        }
        if (!emailEnabled) {
            log.info("Mentorship email notification skipped because email is disabled. to={} subject={}", to, subject);
            return;
        }
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("Mentorship email notification skipped because JavaMailSender is not configured");
            return;
        }
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(to);
            mail.setFrom(resolveEmailFrom());
            mail.setSubject(subject);
            mail.setText(body);
            mailSender.send(mail);
        } catch (Exception ex) {
            log.error("Failed to send mentorship email to {}", to, ex);
        }
    }

    private void sendSms(String to, String body) {
        if (to == null || to.isBlank()) {
            log.warn("Skipping mentorship SMS notification because recipient phone number is missing");
            return;
        }
        if (!smsEnabled || smsApiUrl == null || smsApiUrl.isBlank()) {
            log.info("Mentorship SMS notification skipped because SMS is not configured. phone={} message={}", to, body);
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            applySmsAuth(headers);

            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("to", to);
            form.add("message", body);
            if (smsFrom != null && !smsFrom.isBlank()) {
                form.add("from", smsFrom);
            }

            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(form, headers);
            restTemplate.exchange(smsApiUrl, HttpMethod.POST, entity, String.class);
        } catch (Exception ex) {
            log.error("Failed to send mentorship SMS to {}", to, ex);
        }
    }

    private void applySmsAuth(HttpHeaders headers) {
        if ("basic".equalsIgnoreCase(smsAuthType)) {
            String raw = safe(smsAuthUsername) + ":" + safe(smsAuthPassword);
            String encoded = Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
            headers.set(HttpHeaders.AUTHORIZATION, "Basic " + encoded);
        } else if ("bearer".equalsIgnoreCase(smsAuthType) && smsBearerToken != null && !smsBearerToken.isBlank()) {
            headers.setBearerAuth(smsBearerToken);
        }
    }

    private String resolveEmailFrom() {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            return emailFrom;
        }
        if (mailSender instanceof JavaMailSenderImpl impl && impl.getUsername() != null && !impl.getUsername().isBlank()) {
            return impl.getUsername();
        }
        return emailFrom;
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "Not provided" : value;
    }

    private String safeName(String value) {
        return value == null || value.isBlank() ? "User" : value;
    }

    private String truncate(String value, int max) {
        if (value.length() <= max) {
            return value;
        }
        return value.substring(0, max - 3) + "...";
    }
}
