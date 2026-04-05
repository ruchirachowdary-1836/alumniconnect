package com.alumnilink.service;

import com.alumnilink.dto.SuccessStoryDto;
import com.alumnilink.model.Profile;
import com.alumnilink.model.SuccessStory;
import com.alumnilink.repository.ProfileRepository;
import com.alumnilink.repository.SuccessStoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SuccessStoryService {

    private final SuccessStoryRepository storyRepository;
    private final ProfileRepository profileRepository;

    public List<SuccessStoryDto> getAllStories() {
        return storyRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<SuccessStoryDto> getFeaturedStories() {
        return storyRepository.findByIsFeatured(true)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public SuccessStoryDto createStory(UUID userId, SuccessStoryDto.CreateRequest req) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        SuccessStory story = SuccessStory.builder()
                .profileId(profile.getId())
                .title(req.getTitle())
                .story(req.getStory())
                .achievement(req.getAchievement() != null ? req.getAchievement() : "")
                .isFeatured(false)
                .build();
        return toDto(storyRepository.save(story));
    }

    @Transactional
    public SuccessStoryDto setFeatured(UUID id, boolean featured) {
        SuccessStory story = storyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Story not found"));
        story.setIsFeatured(featured);
        return toDto(storyRepository.save(story));
    }

    private SuccessStoryDto toDto(SuccessStory s) {
        SuccessStoryDto dto = new SuccessStoryDto();
        dto.setId(s.getId());
        dto.setProfileId(s.getProfileId());
        dto.setTitle(s.getTitle());
        dto.setStory(s.getStory());
        dto.setAchievement(s.getAchievement());
        dto.setIsFeatured(s.getIsFeatured());
        dto.setCreatedAt(s.getCreatedAt());
        return dto;
    }
}
