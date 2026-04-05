-- V2__add_user_approval.sql
-- Add admin-approval gate for newly registered users

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT false;

