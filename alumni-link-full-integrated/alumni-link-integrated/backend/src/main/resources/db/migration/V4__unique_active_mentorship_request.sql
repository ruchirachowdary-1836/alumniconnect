-- V4__unique_active_mentorship_request.sql
-- Enforce: one active request (pending/approved) per student->alumni pair.
-- If a request is rejected, the student can send again.

-- If the DB already contains duplicates, keep the "best" one and reject the rest.
-- Preference order: approved > pending, then newest by updated_at/created_at.
WITH ranked AS (
    SELECT
        id,
        row_number() OVER (
            PARTITION BY student_id, alumni_id
            ORDER BY (status = 'approved') DESC, updated_at DESC, created_at DESC
        ) AS rn
    FROM mentorship_requests
    WHERE status IN ('pending', 'approved')
)
UPDATE mentorship_requests mr
SET status = 'rejected',
    updated_at = now()
FROM ranked r
WHERE mr.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mentorship_active_pair
    ON mentorship_requests (student_id, alumni_id)
    WHERE status IN ('pending', 'approved');
