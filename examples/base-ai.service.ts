// examples/base-ai.service.ts
import { Injectable } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, generateObject, streamObject } from 'ai';
import { z } from 'zod';

/**
 * Base AI Service
 * 
 * Provides common functionality for all AI pattern services including:
 * - Google Gemini model initialization
 * - Logging utilities
 * - Error handling
 * - Model selection strategies
 */
@Injectable()
export abstract class BaseAIService {
  protected readonly google = createGoogleGenerativeAI();
  
  // Model selection based on complexity and use case
  protected readonly models = {
    // Complex reasoning, multi-step tasks, high quality outputs
    complex: this.google('models/gemini-2.5-pro-preview-06-05'),
    // Fast responses, simple tasks, classification
    fast: this.google('models/gemini-2.5-flash-preview-05-20'),
  };

  /**
   * Enhanced logging wrapper for AI operations
   * Tracks timing, token usage, and errors
   */
  protected async generateWithLogging<T>(
    operation: () => Promise<T>,
    context: string,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    const logPrefix = `[${context}]`;
    
    console.log(`${logPrefix} Starting AI operation`, metadata);
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      console.log(`${logPrefix} Completed successfully in ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error(`${logPrefix} Failed after ${duration}ms:`, {
        error: error.message,
        metadata,
      });
      
      throw error;
    }
  }

  /**
   * Select appropriate model based on task complexity and priority
   */
  protected selectModel(
    complexity: 'simple' | 'moderate' | 'complex',
    priority: 'speed' | 'quality' = 'quality'
  ) {
    if (priority === 'speed' && complexity !== 'complex') {
      return this.models.fast;
    }
    
    if (complexity === 'complex' || priority === 'quality') {
      return this.models.complex;
    }
    
    return this.models.fast;
  }

  /**
   * Create a standardized prompt with consistent formatting
   */
  protected createPrompt(
    instruction: string,
    context?: string,
    examples?: string[],
    constraints?: string[]
  ): string {
    let prompt = instruction;
    
    if (context) {
      prompt += `\n\nContext:\n${context}`;
    }
    
    if (examples && examples.length > 0) {
      prompt += `\n\nExamples:\n${examples.join('\n')}`;
    }
    
    if (constraints && constraints.length > 0) {
      prompt += `\n\nConstraints:\n${constraints.map(c => `- ${c}`).join('\n')}`;
    }
    
    return prompt;
  }

  /**
   * Validate input before sending to AI
   */
  protected validateInput(input: string, maxLength: number = 10000): void {
    if (!input || input.trim().length === 0) {
      throw new Error('Input cannot be empty');
    }
    
    if (input.length > maxLength) {
      throw new Error(`Input too long. Maximum ${maxLength} characters allowed.`);
    }
    
    // Check for potential prompt injection
    const suspiciousPatterns = [
      /ignore\s+(previous|above|all)\s+instructions/i,
      /you\s+are\s+now\s+a/i,
      /pretend\s+to\s+be/i,
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input)) {
        console.warn('Potentially suspicious input detected:', input.substring(0, 100));
      }
    }
  }

  /**
   * Handle AI generation errors with appropriate retry logic
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          console.warn(`AI operation failed, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2; // Exponential backoff
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Create a standard evaluation schema for quality assessment
   */
  protected createEvaluationSchema() {
    return z.object({
      score: z.number().min(1).max(10).describe('Quality score from 1-10'),
      feedback: z.string().describe('Detailed feedback on quality'),
      strengths: z.array(z.string()).describe('Identified strengths'),
      improvements: z.array(z.string()).describe('Suggested improvements'),
      confidence: z.number().min(0).max(1).describe('Confidence in evaluation'),
    });
  }

  /**
   * Standard streaming response pattern
   */
  protected async createStreamingResponse<T>(
    schema: z.ZodSchema<T>,
    prompt: string,
    model?: any,
    tools?: Record<string, any>
  ) {
    const selectedModel = model || this.models.complex;
    
    return streamObject({
      model: selectedModel,
      schema,
      prompt,
      ...(tools && { tools }),
    });
  }
}

/**
 * Example implementation for reference
 */
@Injectable()
export class ExampleAIService extends BaseAIService {
  async processExample(input: string) {
    // Validate input
    this.validateInput(input);

    // Create response schema
    const responseSchema = z.object({
      originalInput: z.string(),
      processedOutput: z.string(),
      confidence: z.number(),
      metadata: z.object({
        processingTime: z.number(),
        modelUsed: z.string(),
      }),
    });

    // Create prompt
    const prompt = this.createPrompt(
      `Process this input and provide a structured response: ${input}`,
      'This is an example processing task',
      ['Input: "Hello" → Output: "Processed: Hello"'],
      ['Keep responses concise', 'Include confidence score']
    );

    // Generate with retry logic and logging
    return this.withRetry(async () => {
      return this.generateWithLogging(
        () => this.createStreamingResponse(responseSchema, prompt),
        'ExampleProcessing',
        { inputLength: input.length }
      );
    });
  }
}