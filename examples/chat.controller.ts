// NestJS chat controller using AI SDK v5 patterns
import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Controller('api/chat')
export class ChatController {
  private readonly model = openai('gpt-4o-mini');

  @Post()
  async chat(@Body() body: { messages: ChatMessage[] }, @Res() res: Response) {
    const { messages } = body;

    const result = streamText({
      model: this.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      system: 'You are a helpful assistant. Always respond in JSON format with title, content, and status fields.',
    });

    // Use v5 UI message stream response
    return result.toDataStreamResponse();
  }
}