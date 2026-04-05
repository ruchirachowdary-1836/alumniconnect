-- V1__init_schema.sql
-- Alumni Link Database Schema

-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Role enum (using check constraint as PostgreSQL enum alternative)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'alumni', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT '',
    roll_no VARCHAR(100) DEFAULT '',
    department VARCHAR(255) DEFAULT '',
    company VARCHAR(255) DEFAULT '',
    package_amount NUMERIC DEFAULT 0,
    batch VARCHAR(20) DEFAULT '',
    job_role VARCHAR(255) DEFAULT '',
    expertise TEXT[] DEFAULT '{}',
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Job referrals table
CREATE TABLE IF NOT EXISTS job_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL DEFAULT '',
    type VARCHAR(50) NOT NULL CHECK (type IN ('Internship', 'Full-time', 'Part-time')),
    description TEXT DEFAULT '',
    requirements TEXT[] DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    posted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mentorship requests table
CREATE TABLE IF NOT EXISTS mentorship_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alumni_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    event_type VARCHAR(50) NOT NULL DEFAULT 'webinar',
    event_date TIMESTAMPTZ NOT NULL,
    location TEXT DEFAULT '',
    link TEXT DEFAULT '',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Discussion posts table
CREATE TABLE IF NOT EXISTS discussion_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Discussion replies table
CREATE TABLE IF NOT EXISTS discussion_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES discussion_posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Success stories table
CREATE TABLE IF NOT EXISTS success_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    story TEXT NOT NULL DEFAULT '',
    achievement TEXT DEFAULT '',
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
