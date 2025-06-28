# NestJS + AI SDK + React Streaming Reference

Complete reference implementation for streaming AI responses between NestJS backend and React frontend using Vercel AI SDK.

## Architecture

```
┌─────────────────────┐    HTTP POST     ┌─────────────────────┐
│   React Frontend    │ ───────────────► │   NestJS Backend    │
│                     │                  │                     │
│  - useObject hook   │                  │  - AI SDK streaming │
│  - Defensive JSON   │ ◄─────────────── │  - Google Gemini    │
│  - Error handling   │   Streaming JSON │  - Zod validation   │
└─────────────────────┘                  └─────────────────────┘
```

**Stack**: NestJS + Vercel AI SDK + React + Google Gemini + Zod

## Quick Start

```bash
# Install dependencies
npm install @ai-sdk/google ai zod

# Environment setup
echo "GOOGLE_GENERATIVE_AI_API_KEY=your_key" > .env
```

## Backend Implementation

### Core Streaming Controller

```typescript
import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('api/stream')
export class StreamController {
  constructor(private readonly service: StreamService) {}

  @Post()
  async stream(@Body() body: { input: string }, @Res() res: Response) {
    const result = await this.service.generateStream(body.input);
    
    // Essential streaming headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Pipe AI SDK stream to response
    result.pipeTextStreamToResponse(res);
  }
}
```

### Service with AI SDK

```typescript
import { Injectable } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamObject } from 'ai';
import { z } from 'zod';

@Injectable()
export class StreamService {
  private readonly google = createGoogleGenerativeAI();
  private readonly model = this.google('models/gemini-1.5-flash');

  async generateStream(input: string) {
    return streamObject({
      model: this.model,
      schema: z.object({
        title: z.string().optional(),
        content: z.string().optional(),
        status: z.enum(['processing', 'complete']).optional(),
      }),
      prompt: `Generate content for: ${input}`,
    });
  }
}
```

### Module Setup

```typescript
// stream.module.ts
import { Module } from '@nestjs/common';
import { StreamController } from './stream.controller';
import { StreamService } from './stream.service';

@Module({
  controllers: [StreamController],
  providers: [StreamService],
})
export class StreamModule {}

// app.module.ts
import { Module } from '@nestjs/common';
import { StreamModule } from './stream/stream.module';

@Module({
  imports: [StreamModule],
})
export class AppModule {}

// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3001);
}
bootstrap();
```

## Frontend Implementation

### React Component with Streaming

```typescript
import React, { useState } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';

const schema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(['processing', 'complete']).optional(),
});

export default function StreamingComponent() {
  const [input, setInput] = useState('');
  
  const { object, submit, isLoading, error } = useObject({
    api: 'http://localhost:3001/api/stream',
    schema,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await submit({ input: input.trim() });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your request..."
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Streaming...' : 'Send'}
        </button>
      </form>
      
      {error && <div>Error: {error.message}</div>}
      
      {object && (
        <div>
          {object.title && <h2>{object.title}</h2>}
          {object.content && <p>{object.content}</p>}
          {object.status && <span>Status: {object.status}</span>}
        </div>
      )}
    </div>
  );
}
```


## Defensive JSON Streaming

### The Challenge

When streaming JSON, the frontend receives incomplete chunks that cannot be parsed until complete. Defensive programming is essential.

### Frontend Strategy

```typescript
import { useChat } from 'ai/react';
import { useState, useEffect } from 'react';
import { z } from 'zod';

const StreamingSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(['processing', 'complete']).optional(),
});

export default function DefensiveStreaming() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: 'http://localhost:3001/api/stream',
  });

  const [parsedData, setParsedData] = useState({});
  const [parseError, setParseError] = useState(null);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage?.role === 'assistant') {
      const content = lastMessage.content;
      
      try {
        // Attempt to parse JSON - will fail until stream is complete
        const parsed = JSON.parse(content);
        
        // Validate with schema
        const validation = StreamingSchema.safeParse(parsed);
        
        if (validation.success) {
          setParsedData(validation.data);
          setParseError(null);
        }
      } catch (error) {
        // Expected error during streaming - ignore
        if (!isLoading) {
          setParseError('Invalid JSON structure');
        }
      }
    }
  }, [messages, isLoading]);

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Streaming...' : 'Send'}
        </button>
      </form>

      {parseError && !isLoading && (
        <div>Error: {parseError}</div>
      )}

      {/* Render partial data as it arrives */}
      <div>
        {parsedData.title && <h2>{parsedData.title}</h2>}
        {parsedData.content && <p>{parsedData.content}</p>}
        {parsedData.status && <span>Status: {parsedData.status}</span>}
      </div>
    </div>
  );
}
```

## Testing

### Service Tests

```typescript
import { Test } from '@nestjs/testing';
import { StreamService } from './stream.service';

jest.mock('ai', () => ({
  streamObject: jest.fn(),
}));

describe('StreamService', () => {
  let service: StreamService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [StreamService],
    }).compile();

    service = module.get<StreamService>(StreamService);
  });

  it('should create stream object', async () => {
    const mockStream = { pipeTextStreamToResponse: jest.fn() };
    (streamObject as jest.Mock).mockReturnValue(mockStream);

    const result = await service.generateStream('test input');
    
    expect(streamObject).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('test input'),
      })
    );
  });
});
```

### E2E Tests

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Streaming (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors();
    await app.init();
  });

  it('should stream JSON response', () => {
    return request(app.getHttpServer())
      .post('/api/stream')
      .send({ input: 'Test' })
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect('Cache-Control', 'no-cache');
  });
});
```

## Best Practices

### Error Handling

```typescript
// Backend
try {
  const result = await this.service.generateStream(input);
  result.pipeTextStreamToResponse(res);
} catch (error) {
  console.error('Streaming error:', error);
  res.status(500).json({ error: 'Streaming failed' });
}

// Frontend
{error && (
  <div style={{ color: 'red' }}>
    Error: {error.message || 'Something went wrong'}
  </div>
)}
```

### Performance

- Use appropriate model sizes (Flash for speed, Pro for quality)
- Implement request debouncing in frontend
- Set reasonable timeouts for streaming
- Cache responses when appropriate

### Security

- Never expose API keys in frontend code
- Validate all inputs with Zod schemas
- Implement rate limiting on endpoints
- Sanitize AI-generated content before display


## Key Concepts

### Defensive JSON Parsing
- JSON parsing **will fail** during streaming - this is expected
- Only show errors when streaming is complete
- Use Zod schemas for validation and type safety
- Render partial data as it arrives

### Stream Headers
- `Content-Type: application/json` for JSON streams
- `Cache-Control: no-cache` prevents caching
- `Connection: keep-alive` maintains connection

### Error Recovery
- Implement retry mechanisms for failed requests
- Provide clear error messages to users
- Clean up state on component unmount

---

**Complete reference for streaming AI responses between NestJS and React using Vercel AI SDK**