import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type LLMProvider = 'groq' | 'gemini';

export interface LLMConfig {
  provider: LLMProvider;
  groqApiKey?: string;
  geminiApiKey?: string;
  groqModel?: string;
  geminiModel?: string;
}

export class LLMService {
  private config: LLMConfig;
  private groqClient?: Groq;
  private geminiClient?: GoogleGenerativeAI;

  constructor(config: LLMConfig) {
    this.config = config;

    if (config.provider === 'groq' && config.groqApiKey) {
      this.groqClient = new Groq({
        apiKey: config.groqApiKey,
      });
    }

    if (config.provider === 'gemini' && config.geminiApiKey) {
      this.geminiClient = new GoogleGenerativeAI(config.geminiApiKey);
    }
  }

  async generateResponse(prompt: string): Promise<string> {
    if (this.config.provider === 'groq' && this.groqClient) {
      return this.generateGroqResponse(prompt);
    }

    if (this.config.provider === 'gemini' && this.geminiClient) {
      return this.generateGeminiResponse(prompt);
    }

    throw new Error(`LLM provider ${this.config.provider} is not properly configured`);
  }

  private async generateGroqResponse(prompt: string): Promise<string> {
    if (!this.groqClient) {
      throw new Error('Groq client not initialized');
    }

    const model = this.config.groqModel || 'llama-3.1-70b-versatile';

    const completion = await this.groqClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are RefereeAI, a decision reasoning engine. Follow the RefereeAI framework strictly.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model,
      temperature: 0.7,
      max_tokens: 4000,
    });

    return completion.choices[0]?.message?.content || '';
  }

  private async generateGeminiResponse(prompt: string): Promise<string> {
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    const modelName = this.config.geminiModel || 'gemini-pro';
    const model = this.geminiClient.getGenerativeModel({ model: modelName });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
}
