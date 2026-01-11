import { NextRequest, NextResponse } from 'next/server';
import { RefereeAI } from '@/lib/refereeai-core';
import { LLMConfig } from '@/lib/llm-provider';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Get LLM configuration from environment variables
    const provider = (process.env.LLM_PROVIDER || 'groq') as 'groq' | 'gemini';
    const config: LLMConfig = {
      provider,
      groqApiKey: process.env.GROQ_API_KEY,
      geminiApiKey: process.env.GEMINI_API_KEY,
      groqModel: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
      geminiModel: process.env.GEMINI_MODEL || 'gemini-pro',
    };

    // Validate API key is present
    if (provider === 'groq' && !config.groqApiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured' },
        { status: 500 }
      );
    }

    if (provider === 'gemini' && !config.geminiApiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Initialize RefereeAI and analyze the decision
    const refereeAI = new RefereeAI(config);
    const response = await refereeAI.analyzeDecision(query);

    return NextResponse.json(response);
  } catch (error) {
    console.error('RefereeAI API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze decision',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
