ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS otp_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    purpose VARCHAR(30) NOT NULL CHECK (purpose IN ('register', 'login', 'phone_update')),
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_challenges_user_purpose
    ON otp_challenges (user_id, purpose, created_at DESC);
