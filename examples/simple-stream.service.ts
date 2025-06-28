// Simple NestJS service for AI streaming (AI SDK v5)
import { Injectable } from '@nestjs/common';
import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { z } from 'zod';

@Injectable()
export class SimpleStreamService {
  private readonly model = openai('gpt-4o-mini');

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