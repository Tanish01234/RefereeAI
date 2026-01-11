# RefereeAI

An advanced AI decision-support system that helps users make better decisions by comparing options, explaining trade-offs, and exposing consequences.

## Core Philosophy

RefereeAI is **NOT** a chatbot or advice engine. It's a **Decision Reasoning Engine** that:
- Explains the rules
- Explains the risks
- Explains the choices
- **NEVER** declares a winner

## Features

- Multi-option comparison (2-3 options)
- Trade-off analysis
- Constraint-aware reasoning
- Conditional guidance (never prescriptive)
- Structured, consistent output

## Tech Stack

- **Frontend**: Next.js (React)
- **Backend**: Next.js API Routes
- **LLM Provider**: GROQ API (current), Gemini API (future)
- **Language**: TypeScript

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.local.example .env.local
```

3. Add your GROQ API key to `.env.local`:
```
GROQ_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Usage

Ask RefereeAI any open-ended decision question:
- Tech stack choices
- Career or learning paths
- Product or MVP ideas
- Tools, platforms, or courses
- Strategic or architectural decisions

RefereeAI will provide structured analysis with trade-offs, never a single answer.
