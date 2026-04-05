package com.alumnilink.service;

import com.alumnilink.dto.DiscussionDto;
import com.alumnilink.model.DiscussionPost;
import com.alumnilink.model.DiscussionReply;
import com.alumnilink.model.User;
import com.alumnilink.repository.DiscussionPostRepository;
import com.alumnilink.repository.DiscussionReplyRepository;
import com.alumnilink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiscussionService {

    private final DiscussionPostRepository postRepository;
    private final DiscussionReplyRepository replyRepository;
    private final UserRepository userRepository;

    public List<DiscussionDto.PostResponse> getAllPosts() {
        return postRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(this::toPostDto).collect(Collectors.toList());
    }

    public DiscussionDto.PostResponse getPost(UUID id) {
        DiscussionPost post = postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        DiscussionDto.PostResponse dto = toPostDto(post);
        List<DiscussionDto.ReplyResponse> replies = replyRepository.findByPostId(id)
                .stream().map(this::toReplyDto).collect(Collectors.toList());
        dto.setReplies(replies);
        return dto;
    }

    @Transactional
    public DiscussionDto.PostResponse createPost(UUID authorId, DiscussionDto.CreatePostRequest req) {
        DiscussionPost post = DiscussionPost.builder()
                .title(req.getTitle())
                .content(req.getContent())
                .category(req.getCategory() != null ? req.getCategory() : "general")
                .authorId(authorId)
                .build();
        return toPostDto(postRepository.save(post));
    }

    @Transactional
    public DiscussionDto.ReplyResponse createReply(UUID postId, UUID authorId, DiscussionDto.CreateReplyRequest req) {
        if (!postRepository.existsById(postId)) {
            throw new IllegalArgumentException("Post not found");
        }
        DiscussionReply reply = DiscussionReply.builder()
                .postId(postId)
                .content(req.getContent())
                .authorId(authorId)
                .build();
        return toReplyDto(replyRepository.save(reply));
    }

    @Transactional
    public void deletePost(UUID id, UUID requesterId) {
        DiscussionPost post = postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        if (!post.getAuthorId().equals(requesterId)) {
            throw new SecurityException("Not authorized to delete this post");
        }
        postRepository.delete(post);
    }

    private String getNameForUser(UUID userId) {
        return userRepository.findById(userId).map(User::getName).orElse("Unknown");
    }

    private DiscussionDto.PostResponse toPostDto(DiscussionPost p) {
        DiscussionDto.PostResponse dto = new DiscussionDto.PostResponse();
        dto.setId(p.getId());
        dto.setTitle(p.getTitle());
        dto.setContent(p.getContent());
        dto.setCategory(p.getCategory());
        dto.setAuthorId(p.getAuthorId());
        dto.setAuthorName(getNameForUser(p.getAuthorId()));
        dto.setCreatedAt(p.getCreatedAt());
        dto.setUpdatedAt(p.getUpdatedAt());
        return dto;
    }

    private DiscussionDto.ReplyResponse toReplyDto(DiscussionReply r) {
        DiscussionDto.ReplyResponse dto = new DiscussionDto.ReplyResponse();
        dto.setId(r.getId());
        dto.setPostId(r.getPostId());
        dto.setContent(r.getContent());
        dto.setAuthorId(r.getAuthorId());
        dto.setAuthorName(getNameForUser(r.getAuthorId()));
        dto.setCreatedAt(r.getCreatedAt());
        return dto;
    }
}
