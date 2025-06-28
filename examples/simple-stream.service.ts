// Simple NestJS service for AI streaming
import { Injectable } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamObject } from 'ai';
import { z } from 'zod';

@Injectable()
export class SimpleStreamService {
  private readonly google = createGoogleGenerativeAI();
  private readonly model = this.google('models/gemini-1.5-flash');

  async generateStream(input: string) {
    // Define response schema
    const schema = z.object({
      title: z.string().optional(),
      content: z.string().optional(),
      status: z.enum(['processing', 'complete']).optional(),
    });

    return streamObject({
      model: this.model,
      schema,
      prompt: `Generate a helpful response for: ${input}`,
    });
  }
}