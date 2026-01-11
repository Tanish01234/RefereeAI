-- =====================================================
-- RefereeAI Database Views
-- =====================================================
-- Purpose: Convenient views for common query patterns
-- =====================================================

-- =====================================================
-- VIEW: session_conversations
-- =====================================================
-- Purpose: Fetch complete conversation history for a session
-- Usage: SELECT * FROM session_conversations WHERE session_id = '<uuid>';
-- =====================================================

CREATE OR REPLACE VIEW session_conversations AS
SELECT 
    s.id AS session_id,
    s.created_at AS session_started,
    s.updated_at AS session_last_activity,
    s.user_agent,
    s.ip_address,
    rc.id AS chat_id,
    rc.user_input,
    rc.ai_response,
    rc.model_used,
    rc.provider,
    rc.created_at AS query_timestamp,
    -- Extract key fields from JSONB for easy access
    rc.ai_response->>'decisionContext' AS decision_context_summary,
    jsonb_array_length(rc.ai_response->'options') AS options_count
FROM sessions s
LEFT JOIN referee_chats rc ON s.id = rc.session_id
ORDER BY s.created_at DESC, rc.created_at ASC;

COMMENT ON VIEW session_conversations IS 'Shows all chats grouped by session with extracted JSONB fields';

-- =====================================================
-- VIEW: recent_activity
-- =====================================================
-- Purpose: Dashboard view showing recent system activity
-- Usage: SELECT * FROM recent_activity LIMIT 50;
-- =====================================================

CREATE OR REPLACE VIEW recent_activity AS
SELECT 
    'chat' AS activity_type,
    rc.id AS activity_id,
    rc.session_id,
    rc.user_input AS content,
    rc.model_used,
    rc.created_at
FROM referee_chats rc
UNION ALL
SELECT 
    'feedback' AS activity_type,
    f.id AS activity_id,
    f.session_id,
    f.message AS content,
    'N/A' AS model_used,
    f.created_at
FROM feedback f
ORDER BY created_at DESC;

COMMENT ON VIEW recent_activity IS 'Unified view of recent chats and feedback for monitoring';

-- =====================================================
-- VIEW: model_usage_stats
-- =====================================================
-- Purpose: Analytics view showing model usage and performance
-- Usage: SELECT * FROM model_usage_stats;
-- =====================================================

CREATE OR REPLACE VIEW model_usage_stats AS
SELECT 
    provider,
    model_used,
    COUNT(*) AS total_queries,
    COUNT(DISTINCT session_id) AS unique_sessions,
    MIN(created_at) AS first_used,
    MAX(created_at) AS last_used,
    DATE_TRUNC('day', created_at) AS usage_date
FROM referee_chats
GROUP BY provider, model_used, DATE_TRUNC('day', created_at)
ORDER BY usage_date DESC, total_queries DESC;

COMMENT ON VIEW model_usage_stats IS 'Model usage statistics grouped by provider and date';

-- =====================================================
-- VIEW: feedback_summary
-- =====================================================
-- Purpose: Analytics view for feedback analysis
-- Usage: SELECT * FROM feedback_summary;
-- =====================================================

CREATE OR REPLACE VIEW feedback_summary AS
SELECT 
    f.id,
    f.session_id,
    f.email,
    f.message,
    f.created_at,
    -- Check if session has associated chats
    CASE 
        WHEN f.session_id IS NOT NULL THEN 
            (SELECT COUNT(*) FROM referee_chats WHERE session_id = f.session_id)
        ELSE 0 
    END AS session_chat_count,
    -- Get session age if exists
    CASE 
        WHEN f.session_id IS NOT NULL THEN 
            (SELECT created_at FROM sessions WHERE id = f.session_id)
        ELSE NULL 
    END AS session_started_at
FROM feedback f
ORDER BY f.created_at DESC;

COMMENT ON VIEW feedback_summary IS 'Feedback with session context and usage metrics';
