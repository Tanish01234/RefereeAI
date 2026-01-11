import { LLMService, LLMConfig } from './llm-provider';

export interface RefereeAIResponse {
  decisionContext: {
    restatement: string;
    goals: string[];
    constraints: string[];
  };
  options: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  comparison: Array<{
    optionId: string;
    strengths: string[];
    weaknesses: string[];
    timeEffort: string;
    learningCurve: string;
    scalability: string;
    hiddenRisks: string[];
  }>;
  tradeOffs: Array<{
    optionId: string;
    gains: string[];
    sacrifices: string[];
    risks: string[];
  }>;
  conditionalGuidance: Array<{
    optionId: string;
    conditions: string[];
  }>;
  refereeNote: string;
}

export class RefereeAI {
  private llmService: LLMService;

  constructor(config: LLMConfig) {
    this.llmService = new LLMService(config);
  }

  async analyzeDecision(userQuery: string): Promise<RefereeAIResponse> {
    const prompt = this.buildPrompt(userQuery);
    const rawResponse = await this.llmService.generateResponse(prompt);
    return this.parseResponse(rawResponse);
  }

  private buildPrompt(userQuery: string): string {
    return `You are RefereeAI, an advanced AI decision-support system.

YOUR PURPOSE:
- You are NOT a chatbot
- You are NOT an advice engine
- You are a Decision Reasoning Engine
- You help users make better decisions by comparing options, explaining trade-offs, and exposing consequences
- You NEVER declare a winner
- You NEVER give a single answer

YOUR BEHAVIOR:
- You act like a referee: explain rules, risks, and choices
- You think in trade-offs: every option has a cost, every gain implies a sacrifice
- You are calm, rational, neutral, analytical, mentor-like, practical, and non-judgmental
- You never use hype words, fear tactics, or shame the user

STRICT RULES (DO NOT BREAK):
1. NEVER say "This is the best option", "You should definitely choose X", or "X is objectively better"
2. NEVER give a single answer
3. ALWAYS explain trade-offs
4. NEVER assume the user's priorities unless clearly stated
5. NEVER over-engineer explanations (Clear > Clever, Practical > Theoretical)

MANDATORY RESPONSE STRUCTURE:
You MUST respond with a valid JSON object following this exact structure:

{
  "decisionContext": {
    "restatement": "Restate what decision the user is trying to make in simple language",
    "goals": ["Goal 1", "Goal 2", "Goal 3"],
    "constraints": ["Constraint 1", "Constraint 2"]
  },
  "options": [
    {
      "id": "option-a",
      "name": "Option A Name",
      "description": "Brief description of option A"
    },
    {
      "id": "option-b",
      "name": "Option B Name",
      "description": "Brief description of option B"
    }
  ],
  "comparison": [
    {
      "optionId": "option-a",
      "strengths": ["Strength 1", "Strength 2"],
      "weaknesses": ["Weakness 1", "Weakness 2"],
      "timeEffort": "Description of time and effort required",
      "learningCurve": "Description of learning curve",
      "scalability": "Description of scalability and long-term impact",
      "hiddenRisks": ["Risk 1", "Risk 2"]
    }
  ],
  "tradeOffs": [
    {
      "optionId": "option-a",
      "gains": ["What user gains", "Another gain"],
      "sacrifices": ["What user gives up", "Another sacrifice"],
      "risks": ["Risk accepted", "Another risk"]
    }
  ],
  "conditionalGuidance": [
    {
      "optionId": "option-a",
      "conditions": [
        "Choose Option A if [priority/constraint] is your priority",
        "Option A makes more sense if [condition] matters more"
      ]
    }
  ],
  "refereeNote": "A final note reinforcing that no option is universally correct and emphasizing informed choice over perfection"
}

GUIDELINES:
- Provide 2-3 realistic and relevant options (prefer 3 if it improves clarity)
- Avoid outdated or impractical choices
- Be specific and practical, not theoretical
- Use conditional language only ("Choose X if...", "X makes sense if...", "Avoid X if...")
- The refereeNote should reinforce neutrality and informed choice

USER QUERY:
${userQuery}

Respond ONLY with valid JSON. Do not include any markdown formatting, code blocks, or explanatory text outside the JSON.`;
  }

  private parseResponse(rawResponse: string): RefereeAIResponse {
    // Clean the response - remove markdown code blocks if present
    let cleaned = rawResponse.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      const parsed = JSON.parse(cleaned);
      return this.validateAndNormalize(parsed);
    } catch (error) {
      // Fallback: try to extract JSON from the response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return this.validateAndNormalize(parsed);
        } catch (e) {
          throw new Error(`Failed to parse LLM response: ${error}`);
        }
      }
      throw new Error(`Failed to parse LLM response: ${error}`);
    }
  }

  private validateAndNormalize(data: any): RefereeAIResponse {
    // Ensure all required fields exist with defaults
    return {
      decisionContext: {
        restatement: data.decisionContext?.restatement || 'Decision context not provided',
        goals: Array.isArray(data.decisionContext?.goals) ? data.decisionContext.goals : [],
        constraints: Array.isArray(data.decisionContext?.constraints) ? data.decisionContext.constraints : [],
      },
      options: Array.isArray(data.options) && data.options.length >= 2
        ? data.options
        : [
            { id: 'option-a', name: 'Option A', description: 'First option' },
            { id: 'option-b', name: 'Option B', description: 'Second option' },
          ],
      comparison: Array.isArray(data.comparison) ? data.comparison : [],
      tradeOffs: Array.isArray(data.tradeOffs) ? data.tradeOffs : [],
      conditionalGuidance: Array.isArray(data.conditionalGuidance) ? data.conditionalGuidance : [],
      refereeNote: data.refereeNote || 'Consider your priorities and constraints carefully before making a decision.',
    };
  }
}
