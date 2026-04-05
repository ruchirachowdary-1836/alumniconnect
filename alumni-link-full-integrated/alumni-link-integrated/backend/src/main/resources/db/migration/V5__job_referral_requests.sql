-- V5__job_referral_requests.sql
-- Students can request referral for a posted job with a resume + optional message.

CREATE TABLE IF NOT EXISTS job_referral_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES job_referrals(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alumni_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT DEFAULT '',
    resume_file_name TEXT NOT NULL DEFAULT '',
    resume_content_type TEXT NOT NULL DEFAULT '',
    resume_data BYTEA NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_referral_requests_alumni_created
    ON job_referral_requests(alumni_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_referral_requests_student_created
    ON job_referral_requests(student_id, created_at DESC);

-- Enforce only one active request per (job, student). If rejected, student can send again.
CREATE UNIQUE INDEX IF NOT EXISTS uq_job_referral_request_active
    ON job_referral_requests(job_id, student_id)
    WHERE status IN ('pending', 'accepted');

