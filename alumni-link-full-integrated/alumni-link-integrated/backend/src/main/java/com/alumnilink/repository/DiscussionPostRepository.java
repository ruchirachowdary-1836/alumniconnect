package com.alumnilink.repository;

import com.alumnilink.model.DiscussionPost;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DiscussionPostRepository extends JpaRepository<DiscussionPost, UUID> {
    List<DiscussionPost> findByCategory(String category);
}
