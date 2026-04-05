package com.alumnilink.repository;

import com.alumnilink.model.DiscussionReply;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DiscussionReplyRepository extends JpaRepository<DiscussionReply, UUID> {
    List<DiscussionReply> findByPostId(UUID postId);
}
