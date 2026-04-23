package com.bvrith.alumni.support;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;

@Component
public class JsonFileStore {
  private final ObjectMapper objectMapper;

  public JsonFileStore() {
    this.objectMapper = new ObjectMapper();
    this.objectMapper.registerModule(new JavaTimeModule());
    this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
  }

  public synchronized <T> List<T> readList(Path filePath, TypeReference<List<T>> typeReference) {
    try {
      ensureFile(filePath);
      String raw = Files.readString(filePath, StandardCharsets.UTF_8);
      if (raw.isBlank()) {
        return new ArrayList<>();
      }
      return objectMapper.readValue(raw, typeReference);
    } catch (IOException exception) {
      return new ArrayList<>();
    }
  }

  public synchronized <T> void writeList(Path filePath, List<T> items) {
    try {
      ensureFile(filePath);
      Files.writeString(
          filePath,
          objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(items),
          StandardCharsets.UTF_8,
          StandardOpenOption.TRUNCATE_EXISTING
      );
    } catch (IOException ignored) {
    }
  }

  public synchronized void seedIfMissing(Path filePath, String classpathResource) {
    if (Files.exists(filePath)) {
      return;
    }

    try {
      Files.createDirectories(filePath.getParent());
      try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream(classpathResource)) {
        if (inputStream == null) {
          Files.writeString(filePath, "[]", StandardCharsets.UTF_8, StandardOpenOption.CREATE_NEW);
          return;
        }
        Files.copy(inputStream, filePath);
      }
    } catch (IOException ignored) {
    }
  }

  private void ensureFile(Path filePath) throws IOException {
    Files.createDirectories(filePath.getParent());
    if (!Files.exists(filePath)) {
      Files.writeString(filePath, "[]", StandardCharsets.UTF_8, StandardOpenOption.CREATE_NEW);
    }
  }
}
