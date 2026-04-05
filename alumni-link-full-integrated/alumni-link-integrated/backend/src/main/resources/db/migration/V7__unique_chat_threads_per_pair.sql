-- V7__unique_chat_threads_per_pair.sql
-- Enforce at most one mentorship chat and one referral chat per student<->alumni pair.

-- If older data already contains duplicates per pair, we collapse them by:
-- 1) Keeping the earliest thread per (kind, student_id, alumni_id)
-- 2) Moving all messages onto the kept thread
-- 3) Deleting the extra threads
WITH ranked AS (
    SELECT
        id,
        kind,
        student_id,
        alumni_id,
        first_value(id) OVER (
            PARTITION BY kind, student_id, alumni_id
            ORDER BY created_at ASC, id ASC
        ) AS keep_id,
        row_number() OVER (
            PARTITION BY kind, student_id, alumni_id
            ORDER BY created_at ASC, id ASC
        ) AS rn
    FROM chat_threads
),
dupes AS (
    SELECT id, keep_id
    FROM ranked
    WHERE rn > 1
)
UPDATE chat_messages m
SET thread_id = d.keep_id
FROM dupes d
WHERE m.thread_id = d.id;

DELETE FROM chat_threads t
USING (
    SELECT id
    FROM (
        SELECT
            id,
            row_number() OVER (
                PARTITION BY kind, student_id, alumni_id
                ORDER BY created_at ASC, id ASC
            ) AS rn
        FROM chat_threads
    ) x
    WHERE x.rn > 1
) d
WHERE t.id = d.id;

-- Mentorship: max 1 thread per (student_id, alumni_id)
CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_threads_pair_mentorship
    ON chat_threads(student_id, alumni_id)
    WHERE kind = 'mentorship';

-- Referral: max 1 thread per (student_id, alumni_id)
CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_threads_pair_referral
    ON chat_threads(student_id, alumni_id)
    WHERE kind = 'referral';
