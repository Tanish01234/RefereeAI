-- =====================================================
-- RefereeAI Common Queries Reference
-- =====================================================
-- Quick reference for frequently used database operations
-- =====================================================

-- =====================================================
-- SESSION MANAGEMENT
-- =====================================================

-- Get active sessions (last 24 hours)
SELECT 
    id,
    created_at,
    updated_at,
    (SELECT COUNT(*) FROM referee_chats WHERE session_id = sessions.id) AS chat_count
FROM sessions
WHERE updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;

-- Get session with full chat history
SELECT * FROM session_conversations
WHERE session_id = '<session-uuid>'
ORDER BY query_timestamp ASC;

-- Count total sessions
SELECT COUNT(*) AS total_sessions FROM sessions;

-- =====================================================
-- CHAT QUERIES
-- =====================================================

-- Get recent chats (last 7 days)
SELECT 
    id,
    session_id,
    LEFT(user_input, 100) AS snippet,
    model_used,
    created_at
FROM referee_chats
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 50;

-- Find chats by keyword in user input
SELECT 
    id,
    session_id,
    user_input,
    created_at
FROM referee_chats
WHERE user_input ILIKE '%react%'
ORDER BY created_at DESC;

-- Get chats with specific model
SELECT 
    id,
    user_input,
    created_at
FROM referee_chats
WHERE model_used = 'llama-3.3-70b-versatile'
ORDER BY created_at DESC
LIMIT 20;

-- Extract specific JSONB field from all chats
SELECT 
    id,
    user_input,
    ai_response->>'refereeNote' AS referee_note
FROM referee_chats
ORDER BY created_at DESC
LIMIT 10;

-- Count options in each response
SELECT 
    id,
    user_input,
    jsonb_array_length(ai_response->'options') AS option_count
FROM referee_chats
WHERE ai_response->'options' IS NOT NULL
ORDER BY created_at DESC;

-- =====================================================
-- FEEDBACK QUERIES
-- =====================================================

-- Get all feedback with session context
SELECT * FROM feedback_summary
ORDER BY created_at DESC;

-- Get feedback with email provided
SELECT 
    id,
    email,
    message,
    created_at
FROM feedback
WHERE email IS NOT NULL
ORDER BY created_at DESC;

-- Get feedback from last 30 days
SELECT 
    id,
    message,
    created_at,
    CASE WHEN session_id IS NOT NULL THEN 'Has Session' ELSE 'Anonymous' END AS session_status
FROM feedback
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- =====================================================
-- ANALYTICS QUERIES
-- =====================================================

-- Daily chat volume
SELECT 
    DATE(created_at) AS date,
    COUNT(*) AS chat_count,
    COUNT(DISTINCT session_id) AS unique_sessions
FROM referee_chats
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Model usage breakdown
SELECT 
    provider,
    model_used,
    COUNT(*) AS usage_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM referee_chats), 2) AS percentage
FROM referee_chats
GROUP BY provider, model_used
ORDER BY usage_count DESC;

-- Average chats per session
SELECT 
    AVG(chat_count) AS avg_chats_per_session,
    MAX(chat_count) AS max_chats_in_session,
    MIN(chat_count) AS min_chats_in_session
FROM (
    SELECT session_id, COUNT(*) AS chat_count
    FROM referee_chats
    GROUP BY session_id
) AS session_stats;

-- Most active hours (UTC)
SELECT 
    EXTRACT(HOUR FROM created_at) AS hour,
    COUNT(*) AS chat_count
FROM referee_chats
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY chat_count DESC;

-- =====================================================
-- CLEANUP & MAINTENANCE
-- =====================================================

-- Delete old sessions (older than 90 days) and cascade to chats
DELETE FROM sessions
WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete orphaned feedback (no session, older than 180 days)
DELETE FROM feedback
WHERE session_id IS NULL 
AND created_at < NOW() - INTERVAL '180 days';

-- Vacuum and analyze (run periodically for performance)
VACUUM ANALYZE sessions;
VACUUM ANALYZE referee_chats;
VACUUM ANALYZE feedback;

-- =====================================================
-- EXPORT QUERIES
-- =====================================================

-- Export all data for a session (for user data request)
SELECT 
    s.id AS session_id,
    s.created_at AS session_started,
    rc.user_input,
    rc.ai_response,
    rc.created_at AS query_time,
    f.message AS feedback,
    f.email AS feedback_email
FROM sessions s
LEFT JOIN referee_chats rc ON s.id = rc.session_id
LEFT JOIN feedback f ON s.id = f.session_id
WHERE s.id = '<session-uuid>'
ORDER BY rc.created_at ASC;

-- Export feedback summary (CSV-friendly)
SELECT 
    id,
    session_id,
    email,
    message,
    created_at
FROM feedback
ORDER BY created_at DESC;

-- =====================================================
-- DEBUGGING QUERIES
-- =====================================================

-- Find sessions with no chats
SELECT s.id, s.created_at
FROM sessions s
LEFT JOIN referee_chats rc ON s.id = rc.session_id
WHERE rc.id IS NULL;

-- Find malformed JSONB responses
SELECT id, user_input
FROM referee_chats
WHERE NOT (ai_response ? 'decisionContext')
   OR NOT (ai_response ? 'options');

-- Check for duplicate sessions from same IP
SELECT ip_address, COUNT(*) AS session_count
FROM sessions
WHERE ip_address IS NOT NULL
GROUP BY ip_address
HAVING COUNT(*) > 5
ORDER BY session_count DESC;

-- =====================================================
-- PERFORMANCE MONITORING
-- =====================================================

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
