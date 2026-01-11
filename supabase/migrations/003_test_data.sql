-- =====================================================
-- RefereeAI Test Data
-- =====================================================
-- Purpose: Example INSERT statements for testing the schema
-- =====================================================

-- =====================================================
-- EXAMPLE 1: Create a session and add a chat
-- =====================================================

-- Create session
INSERT INTO sessions (id, user_agent, ip_address) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    '192.168.1.1'
);

-- Add a chat to the session
INSERT INTO referee_chats (session_id, user_input, ai_response, model_used, provider) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Should I learn React or Django first?',
    '{
        "decisionContext": {
            "restatement": "Deciding which web development framework to learn first, React or Django",
            "goals": [
                "Build a career in web development",
                "Create dynamic and interactive web applications",
                "Learn a widely used and in-demand skill"
            ],
            "constraints": [
                "Limited time for learning",
                "No prior experience with either framework"
            ]
        },
        "options": [
            {
                "id": "react",
                "name": "Learn React First",
                "description": "Start with React, a frontend JavaScript library for building user interfaces"
            },
            {
                "id": "django",
                "name": "Learn Django First",
                "description": "Start with Django, a Python-based backend web framework"
            }
        ],
        "comparison": [
            {
                "optionId": "react",
                "strengths": [
                    "Large community and ecosystem",
                    "Fast and efficient for building UI components",
                    "High demand in the job market"
                ],
                "weaknesses": [
                    "Limited to frontend development",
                    "Requires additional libraries for full-stack development"
                ],
                "timeEffort": "2-3 months to become proficient",
                "learningCurve": "Moderate (JavaScript knowledge required)",
                "scalability": "Excellent for complex UIs",
                "hiddenRisks": [
                    "Rapidly changing ecosystem",
                    "Need to learn state management separately"
                ]
            },
            {
                "optionId": "django",
                "strengths": [
                    "High-level framework for rapid web development",
                    "Strongly typed and secure",
                    "Includes ORM and admin panel out of the box"
                ],
                "weaknesses": [
                    "Steeper learning curve due to Python and ORM",
                    "Less flexible than React for frontend development"
                ],
                "timeEffort": "3-4 months to become proficient",
                "learningCurve": "Steep (Python and web concepts required)",
                "scalability": "Excellent for backend-heavy applications",
                "hiddenRisks": [
                    "Not ideal for modern frontend-heavy apps",
                    "Requires separate frontend solution"
                ]
            }
        ],
        "tradeOffs": [
            {
                "optionId": "react",
                "gains": ["Frontend mastery", "Job market advantage", "Modern UI skills"],
                "sacrifices": ["Backend knowledge", "Full-stack capability initially"],
                "risks": ["May need to learn backend later", "Limited to client-side"]
            },
            {
                "optionId": "django",
                "gains": ["Full-stack Python knowledge", "Backend expertise", "Rapid development"],
                "sacrifices": ["Modern frontend skills", "JavaScript ecosystem"],
                "risks": ["Less demand for pure Django roles", "Need frontend eventually"]
            }
        ],
        "conditionalGuidance": [
            {
                "optionId": "react",
                "conditions": [
                    "If you want to see immediate visual results and build interactive UIs",
                    "If JavaScript appeals to you more than Python",
                    "If most job postings you see require React"
                ]
            },
            {
                "optionId": "django",
                "conditions": [
                    "If you prefer backend logic and database management",
                    "If you already know Python or want to learn it",
                    "If you want to build complete web applications quickly"
                ]
            }
        ],
        "refereeNote": "Both are excellent choices. React gives you immediate visual feedback and opens frontend doors, while Django provides a solid foundation in backend development. Consider your immediate goals: if you want to build UIs and see visual progress quickly, start with React. If you prefer logic, data, and complete applications, start with Django. Many developers eventually learn both."
    }'::jsonb,
    'llama-3.3-70b-versatile',
    'groq'
);

-- =====================================================
-- EXAMPLE 2: Add feedback to the session
-- =====================================================

INSERT INTO feedback (session_id, email, message, user_agent) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'user@example.com',
    'This is really helpful! The comparison between React and Django was exactly what I needed.',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
);

-- =====================================================
-- EXAMPLE 3: Anonymous feedback (no session)
-- =====================================================

INSERT INTO feedback (email, message) VALUES
(
    NULL,
    'Love the UI! Very clean and focused. The examples helped me understand how to phrase my question.'
);

-- =====================================================
-- EXAMPLE 4: Multiple chats in same session
-- =====================================================

INSERT INTO referee_chats (session_id, user_input, ai_response, model_used, provider) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Freelancing for flexibility or full-time for stability?',
    '{
        "decisionContext": {
            "restatement": "Choosing between freelancing for work flexibility or full-time employment for job stability",
            "goals": ["Financial security", "Work-life balance", "Career growth"],
            "constraints": ["Current financial situation", "Risk tolerance", "Career stage"]
        },
        "options": [
            {
                "id": "freelancing",
                "name": "Freelancing",
                "description": "Work as an independent contractor with multiple clients"
            },
            {
                "id": "fulltime",
                "name": "Full-Time Job",
                "description": "Traditional employment with a single company"
            }
        ],
        "comparison": [],
        "tradeOffs": [],
        "conditionalGuidance": [],
        "refereeNote": "This is a deeply personal choice that depends on your risk tolerance, financial runway, and career stage. Both paths can lead to success."
    }'::jsonb,
    'llama-3.3-70b-versatile',
    'groq'
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify data was inserted correctly
-- =====================================================

-- View session with all chats
-- SELECT * FROM session_conversations WHERE session_id = '550e8400-e29b-41d4-a716-446655440000';

-- View all feedback
-- SELECT * FROM feedback_summary;

-- Check recent activity
-- SELECT * FROM recent_activity LIMIT 10;

-- View model usage stats
-- SELECT * FROM model_usage_stats;
