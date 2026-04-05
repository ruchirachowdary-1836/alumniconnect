-- V6__chat_threads_support_referrals.sql
-- Extend chat threads to support referral-request based chats.

ALTER TABLE chat_threads
    ALTER COLUMN mentorship_request_id DROP NOT NULL;

ALTER TABLE chat_threads
    ADD COLUMN referral_request_id UUID;

ALTER TABLE chat_threads
    ADD COLUMN kind VARCHAR(20) NOT NULL DEFAULT 'mentorship'
    CHECK (kind IN ('mentorship', 'referral'));

-- One and only one source reference per thread.
ALTER TABLE chat_threads
    ADD CONSTRAINT chk_chat_thread_source
    CHECK (
        (kind = 'mentorship' AND mentorship_request_id IS NOT NULL AND referral_request_id IS NULL)
        OR
        (kind = 'referral' AND referral_request_id IS NOT NULL AND mentorship_request_id IS NULL)
    );

CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_threads_referral_request
    ON chat_threads(referral_request_id)
    WHERE kind = 'referral';

