# RefereeAI Database Schema

**Version:** 1.0  
**Database:** Supabase (PostgreSQL)  
**Design Philosophy:** Simple, scalable, anonymous-first

---

## 📋 **Schema Overview**

RefereeAI's database is designed to store decision-comparison sessions, AI-generated responses, and user feedback without requiring authentication.

### **Core Tables**

1. **`sessions`** - Group multiple queries from the same user/browser session
2. **`referee_chats`** - Store each decision query + AI response pair
3. **`feedback`** - Capture optional user feedback from the delayed modal

---

## 🗂️ **Table Details**

### **1. sessions**

Groups decision queries from the same anonymous user session.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `created_at` | TIMESTAMPTZ | Session creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last activity timestamp (auto-updated) |
| `user_agent` | TEXT | Browser user agent string |
| `ip_address` | TEXT | Client IP address (for abuse prevention) |

**Purpose:** Track user sessions without authentication  
**Cascade:** Deleting a session deletes all associated chats

---

### **2. referee_chats**

Stores each decision input and the structured AI response.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `session_id` | UUID | Foreign key → `sessions.id` |
| `user_input` | TEXT | User's comparison query |
| `ai_response` | JSONB | Structured AI output (see format below) |
| `model_used` | TEXT | LLM model (e.g., `llama-3.3-70b-versatile`) |
| `provider` | TEXT | LLM provider (`groq`, `gemini`) |
| `created_at` | TIMESTAMPTZ | Query submission timestamp |

**JSONB Structure (`ai_response`):**
```json
{
  "decisionContext": {
    "restatement": "...",
    "goals": ["..."],
    "constraints": ["..."]
  },
  "options": [
    {
      "id": "option1",
      "name": "Option Name",
      "description": "..."
    }
  ],
  "comparison": [...],
  "tradeOffs": [...],
  "conditionalGuidance": [...],
  "refereeNote": "..."
}
```

**Purpose:** Store structured comparison analysis  
**Indexed:** `session_id`, `created_at`, `model_used`, full JSONB (GIN)

---

### **3. feedback**

Captures user feedback from the 5-second delayed modal.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `session_id` | UUID | Optional FK → `sessions.id` (nullable) |
| `email` | TEXT | Optional user email (validated) |
| `message` | TEXT | Feedback text (required) |
| `user_agent` | TEXT | Browser user agent |
| `created_at` | TIMESTAMPTZ | Submission timestamp |

**Purpose:** Collect qualitative feedback without forcing login  
**Validation:** Email format checked if provided

---

## 📊 **Views**

### **session_conversations**

Fetches complete conversation history for a session with extracted JSONB fields.

```sql
SELECT * FROM session_conversations 
WHERE session_id = '<uuid>' 
ORDER BY query_timestamp;
```

### **recent_activity**

Unified view of recent chats and feedback for monitoring.

```sql
SELECT * FROM recent_activity 
LIMIT 50;
```

### **model_usage_stats**

Analytics showing model usage grouped by provider and date.

```sql
SELECT * FROM model_usage_stats 
ORDER BY usage_date DESC;
```

### **feedback_summary**

Feedback with session context and usage metrics.

```sql
SELECT * FROM feedback_summary 
WHERE email IS NOT NULL;
```

---

## 🔧 **Migrations**

All SQL files are located in `/supabase/migrations/` and should be run in order:

```bash
001_create_schema.sql   # Core tables, indexes, triggers
002_create_views.sql    # Convenience views for querying
003_test_data.sql       # Example INSERT statements (optional)
```

### **Running in Supabase**

1. Open Supabase Dashboard
2. Navigate to **SQL Editor**
3. Paste and run each migration file in order
4. Verify with: `SELECT * FROM session_conversations;`

---

## 🚀 **Usage Examples**

### **Create a new session and chat**

```sql
-- 1. Create session
INSERT INTO sessions (user_agent, ip_address) 
VALUES ('Mozilla/5.0', '192.168.1.1')
RETURNING id;

-- 2. Add chat (use returned session id)
INSERT INTO referee_chats (session_id, user_input, ai_response, model_used, provider)
VALUES (
    '<session-uuid>',
    'Should I learn React or Django first?',
    '{"decisionContext": {...}, "options": [...], ...}'::jsonb,
    'llama-3.3-70b-versatile',
    'groq'
);
```

### **Submit feedback**

```sql
INSERT INTO feedback (session_id, email, message)
VALUES (
    '<session-uuid>',
    'user@example.com',
    'This was really helpful!'
);
```

### **Fetch session history**

```sql
SELECT * FROM session_conversations 
WHERE session_id = '<session-uuid>';
```

---

## 📈 **Indexes & Performance**

### **Existing Indexes**

- `sessions.created_at` (DESC) - Fast recent sessions lookup
- `referee_chats.session_id` - Fast session → chats join
- `referee_chats.created_at` (DESC) - Chronological ordering
- `referee_chats.model_used` - Model usage analytics
- `referee_chats.ai_response` (GIN) - JSONB field queries
- `feedback.session_id` - Session → feedback join
- `feedback.created_at` (DESC) - Recent feedback

### **Query Optimization Tips**

```sql
-- ✅ GOOD: Uses index
SELECT * FROM referee_chats 
WHERE session_id = '<uuid>' 
ORDER BY created_at DESC;

-- ✅ GOOD: JSONB field extraction
SELECT ai_response->>'refereeNote' 
FROM referee_chats 
WHERE created_at > NOW() - INTERVAL '7 days';

-- ⚠️ SLOW: Full table scan
SELECT * FROM referee_chats 
WHERE user_input ILIKE '%react%';
```

---

## 🔒 **Row Level Security (RLS)**

**Status:** Not enabled initially (anonymous users)

If you want to add RLS later:

```sql
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referee_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Example policy (allow all reads for now)
CREATE POLICY "Allow public read" ON sessions
FOR SELECT USING (true);
```

---

## 🧪 **Testing**

Run the test data migration to verify schema:

```bash
psql -f supabase/migrations/003_test_data.sql
```

Then verify:

```sql
-- Should return 1 session with 2 chats
SELECT * FROM session_conversations 
WHERE session_id = '550e8400-e29b-41d4-a716-446655440000';

-- Should return 2 feedback entries
SELECT * FROM feedback_summary;
```

---

## 📝 **Notes**

- **UUIDs everywhere**: All primary keys use `uuid_generate_v4()`
- **Timezone-aware**: All timestamps use `TIMESTAMPTZ`
- **JSONB validation**: AI responses must be valid JSON
- **Cascade deletes**: Deleting a session deletes all chats
- **Trigger**: `sessions.updated_at` auto-updates on new chat
- **No auth required**: Schema supports anonymous usage

---

## 🔄 **Future Enhancements**

Potential additions as RefereeAI scales:

1. **User Authentication** - Add `users` table and FK to sessions
2. **Chat Ratings** - Add `rating` column to `referee_chats`
3. **Full-Text Search** - Add GIN index on `user_input` for search
4. **Export History** - Add view for user data export (GDPR)
5. **Analytics Tables** - Aggregate stats for dashboards

---

## 📚 **References**

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [UUID Functions](https://www.postgresql.org/docs/current/uuid-ossp.html)

---

**Schema Version:** 1.0  
**Last Updated:** 2026-01-11  
**Maintained By:** RefereeAI Team
