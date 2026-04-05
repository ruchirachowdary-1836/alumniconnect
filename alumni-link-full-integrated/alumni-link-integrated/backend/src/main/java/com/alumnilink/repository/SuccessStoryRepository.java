package com.alumnilink.repository;

import com.alumnilink.model.SuccessStory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SuccessStoryRepository extends JpaRepository<SuccessStory, UUID> {
    List<SuccessStory> findByIsFeatured(boolean featured);
    List<SuccessStory> findByProfileId(UUID profileId);
}
