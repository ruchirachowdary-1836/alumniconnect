package com.alumnilink.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class GoogleTokenVerifierService {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${app.google.client-id:}")
    private String googleClientId;

    public GoogleProfile verify(String idToken) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new IllegalStateException("Google Sign-In is not configured on the backend");
        }
        if (idToken == null || idToken.isBlank()) {
            throw new IllegalArgumentException("Missing Google ID token");
        }

        String encodedToken = URLEncoder.encode(idToken, StandardCharsets.UTF_8);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodedToken))
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new SecurityException("Invalid Google Sign-In token");
            }

            TokenInfo tokenInfo = objectMapper.readValue(response.body(), TokenInfo.class);
            if (!googleClientId.equals(tokenInfo.aud())) {
                throw new SecurityException("Google Sign-In token audience mismatch");
            }
            if (!"true".equalsIgnoreCase(tokenInfo.emailVerified())) {
                throw new SecurityException("Google account email is not verified");
            }
            if (!"accounts.google.com".equals(tokenInfo.iss()) && !"https://accounts.google.com".equals(tokenInfo.iss())) {
                throw new SecurityException("Invalid Google token issuer");
            }
            if (tokenInfo.email() == null || tokenInfo.email().isBlank()) {
                throw new SecurityException("Google account email is missing");
            }

            return new GoogleProfile(tokenInfo.sub(), tokenInfo.email().trim().toLowerCase(), tokenInfo.name());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Unable to verify Google Sign-In token");
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to verify Google Sign-In token");
        }
    }

    public record GoogleProfile(String subject, String email, String name) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TokenInfo(
            String iss,
            String aud,
            String sub,
            String email,
            String name,
            String email_verified
    ) {
        public String emailVerified() {
            return email_verified;
        }
    }
}
