-- =====================================================
-- RefereeAI Database Schema v1.0
-- Supabase (PostgreSQL)
-- =====================================================
-- Purpose: Store decision reasoning sessions, AI responses, and user feedback
-- Design: Anonymous users, session-based grouping, JSONB for structured AI output
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: sessions
-- =====================================================
-- Purpose: Group multiple decision queries from the same user/browser session
-- Notes: No authentication required; sessions are anonymous and ephemeral
-- =====================================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent TEXT,
    ip_address TEXT,
    
    -- Metadata
    CONSTRAINT sessions_id_check CHECK (id IS NOT NULL)
);

-- Add comment to table
COMMENT ON TABLE sessions IS 'Anonymous user sessions grouping multiple decision queries';
COMMENT ON COLUMN sessions.id IS 'Unique session identifier';
COMMENT ON COLUMN sessions.created_at IS 'Session creation timestamp';
COMMENT ON COLUMN sessions.updated_at IS 'Last activity timestamp';
COMMENT ON COLUMN sessions.user_agent IS 'Browser user agent string for analytics';
COMMENT ON COLUMN sessions.ip_address IS 'Client IP address for abuse prevention';

-- =====================================================
-- TABLE: referee_chats
-- =====================================================
-- Purpose: Store each decision input + AI-generated response pair
-- Notes: JSONB stores structured RefereeAI output (options, tradeoffs, guidance)
-- =====================================================

CREATE TABLE referee_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    
    -- User input
    user_input TEXT NOT NULL,
    
    -- AI response (structured as JSONB)
    ai_response JSONB NOT NULL,
    
    -- Model metadata
    model_used TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'groq',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT referee_chats_id_check CHECK (id IS NOT NULL),
    CONSTRAINT referee_chats_user_input_not_empty CHECK (LENGTH(TRIM(user_input)) > 0),
    CONSTRAINT referee_chats_ai_response_not_empty CHECK (ai_response IS NOT NULL)
);

-- Add comments
COMMENT ON TABLE referee_chats IS 'Individual decision queries and AI-generated comparison responses';
COMMENT ON COLUMN referee_chats.id IS 'Unique chat interaction identifier';
COMMENT ON COLUMN referee_chats.session_id IS 'Foreign key to sessions table';
COMMENT ON COLUMN referee_chats.user_input IS 'User''s original decision/comparison query';
COMMENT ON COLUMN referee_chats.ai_response IS 'Structured AI response (decision_context, options, tradeoffs, guidance, referee_note)';
COMMENT ON COLUMN referee_chats.model_used IS 'LLM model used (e.g., llama-3.3-70b-versatile)';
COMMENT ON COLUMN referee_chats.provider IS 'LLM provider (groq, gemini, etc.)';
COMMENT ON COLUMN referee_chats.created_at IS 'Timestamp of query submission';

-- =====================================================
-- TABLE: feedback
-- =====================================================
-- Purpose: Store user feedback from the 5-second delayed feedback form
-- Notes: Session ID is optional (user may submit feedback without active session)
-- =====================================================

CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    
    -- Feedback content
    email TEXT,
    message TEXT NOT NULL,
    
    -- Metadata
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT feedback_id_check CHECK (id IS NOT NULL),
    CONSTRAINT feedback_message_not_empty CHECK (LENGTH(TRIM(message)) > 0),
    CONSTRAINT feedback_email_format CHECK (
        email IS NULL OR 
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

-- Add comments
COMMENT ON TABLE feedback IS 'User feedback submissions from the delayed feedback modal';
COMMENT ON COLUMN feedback.id IS 'Unique feedback submission identifier';
COMMENT ON COLUMN feedback.session_id IS 'Optional reference to user session';
COMMENT ON COLUMN feedback.email IS 'Optional user email for follow-up';
COMMENT ON COLUMN feedback.message IS 'User feedback text';
COMMENT ON COLUMN feedback.user_agent IS 'Browser user agent for context';
COMMENT ON COLUMN feedback.created_at IS 'Feedback submission timestamp';

-- =====================================================
-- INDEXES
-- =====================================================
-- Purpose: Optimize common query patterns
-- =====================================================

-- Sessions
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);

-- Referee Chats
CREATE INDEX idx_referee_chats_session_id ON referee_chats(session_id);
CREATE INDEX idx_referee_chats_created_at ON referee_chats(created_at DESC);
CREATE INDEX idx_referee_chats_model_used ON referee_chats(model_used);

-- Feedback
CREATE INDEX idx_feedback_session_id ON feedback(session_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);

-- JSONB GIN index for AI response querying (if needed for analytics)
CREATE INDEX idx_referee_chats_ai_response ON referee_chats USING GIN (ai_response);

-- =====================================================
-- TRIGGERS
-- =====================================================
-- Purpose: Auto-update session.updated_at on new chat
-- =====================================================

CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE sessions 
    SET updated_at = NOW() 
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_timestamp
AFTER INSERT ON referee_chats
FOR EACH ROW
EXECUTE FUNCTION update_session_timestamp();

COMMENT ON FUNCTION update_session_timestamp() IS 'Updates session.updated_at when a new chat is added';
