# NestJS + AI SDK + React Streaming Reference Implementation

A comprehensive reference guide for building real-time AI agent applications using NestJS backend with Vercel AI SDK and React frontend. This documentation serves as a template for implementing streaming AI responses in production applications.

## Architecture Overview

```
┌─────────────────────┐    HTTP POST     ┌─────────────────────┐
│   React Frontend    │ ───────────────► │   NestJS Backend    │
│                     │                  │                     │
│  - useObject hook   │                  │  - AI SDK streaming │
│  - Material-UI      │ ◄─────────────── │  - Google Gemini    │
│  - Auto-updating    │   Streaming JSON │  - Zod validation   │
└─────────────────────┘                  └─────────────────────┘
```

### Key Technologies

- **Backend**: NestJS, Vercel AI SDK, Google Gemini 2.5, Zod
- **Frontend**: React, Material-UI, Vercel AI SDK React hooks
- **Architecture**: npm workspaces monorepo
- **Streaming**: Server-sent events with structured JSON objects

## Quick Start

### Prerequisites

```bash
npm install -g @nestjs/cli
```

### Project Setup

```bash
# Create monorepo structure
mkdir my-ai-app && cd my-ai-app
npm init -y

# Setup workspaces in package.json
{
  "workspaces": ["packages/api", "packages/webapp"]
}

# Create backend
mkdir -p packages/api
cd packages/api
nest new . --package-manager npm

# Create frontend  
cd ../webapp
npm create vite@latest . -- --template react-ts
```

### Environment Configuration

Create `packages/api/.env`:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
PORT=3001
```

## Backend Implementation Patterns

### 1. Core Streaming Controller Pattern

Every NestJS controller follows this pattern for AI streaming:

```typescript
// sequential-processing.controller.ts
import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('sequential-processing')
export class SequentialProcessingController {
  constructor(private readonly service: SequentialProcessingService) {}

  @Post()
  async generateContent(@Body() body: { input: string }, @Res() res: Response) {
    const result = await this.service.generateContent(body.input);
    
    // Standard streaming headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Pipe AI SDK stream to HTTP response
    result.pipeTextStreamToResponse(res);
  }
}
```

### 2. AI SDK Service Integration

Standard service pattern with Google Gemini:

```typescript
// sequential-processing.service.ts
import { Injectable } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, generateObject, streamObject } from 'ai';
import { z } from 'zod';

@Injectable()
export class SequentialProcessingService {
  private readonly google = createGoogleGenerativeAI();
  
  // Model selection based on complexity
  private readonly complexModel = this.google('models/gemini-2.5-pro-preview-06-05');
  private readonly fastModel = this.google('models/gemini-2.5-flash-preview-05-20');

  async generateContent(input: string) {
    // Step 1: Generate initial content
    const initialContent = await generateText({
      model: this.complexModel,
      prompt: `Generate marketing copy for: ${input}`,
    });

    // Step 2: Evaluate quality
    const evaluation = await generateObject({
      model: this.fastModel,
      schema: z.object({
        score: z.number().min(1).max(10),
        feedback: z.string(),
      }),
      prompt: `Evaluate this marketing copy: ${initialContent.text}`,
    });

    // Step 3: Stream final result with conditional improvement
    const shouldImprove = evaluation.object.score < 7;
    
    return streamObject({
      model: this.complexModel,
      schema: z.object({
        originalContent: z.string(),
        evaluation: z.object({
          score: z.number(),
          feedback: z.string(),
        }),
        improvedContent: z.string().optional(),
        finalScore: z.number().optional(),
      }),
      prompt: shouldImprove 
        ? `Improve this content based on feedback: ${initialContent.text}\nFeedback: ${evaluation.object.feedback}`
        : `Return the original content as final`,
    });
  }
}
```

### 3. Module Configuration

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { SequentialProcessingModule } from './sequential-processing/sequential-processing.module';

@Module({
  imports: [SequentialProcessingModule],
})
export class AppModule {}
```

```typescript
// sequential-processing.module.ts
import { Module } from '@nestjs/common';
import { SequentialProcessingController } from './sequential-processing.controller';
import { SequentialProcessingService } from './sequential-processing.service';

@Module({
  controllers: [SequentialProcessingController],
  providers: [SequentialProcessingService],
})
export class SequentialProcessingModule {}
```

### 4. CORS Configuration

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors();
  
  await app.listen(3001);
}
bootstrap();
```

## Frontend Implementation Patterns

### 1. Core Streaming Hook Usage

React component with `useObject` hook:

```typescript
// AgentInteraction.tsx
import React, { useState } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';

export default function AgentInteraction() {
  const [input, setInput] = useState('');
  
  const { object, submit, isLoading, error } = useObject({
    api: 'http://localhost:3001/sequential-processing',
    schema: z.any(), // Generic schema for flexible response handling
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await submit({ input: input.trim() });
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your request..."
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            handleSubmit(e);
          }
        }}
      />
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Submit'}
      </button>
      
      {error && <div className="error">Error: {error.message}</div>}
      
      {object && <ResultDisplay result={object} />}
    </form>
  );
}
```

### 2. Real-time Result Display

Component that updates as streaming data arrives:

```typescript
// ResultDisplay.tsx
import React from 'react';
import { Card, Typography, Chip, CircularProgress } from '@mui/material';

interface ResultDisplayProps {
  result: any; // Typed based on your Zod schema
}

export default function ResultDisplay({ result }: ResultDisplayProps) {
  return (
    <Card sx={{ p: 2, mt: 2 }}>
      {/* Original Content */}
      {result.originalContent && (
        <div>
          <Typography variant="h6">Original Content</Typography>
          <Typography>{result.originalContent}</Typography>
        </div>
      )}
      
      {/* Evaluation */}
      {result.evaluation && (
        <div>
          <Typography variant="h6">Evaluation</Typography>
          <Chip 
            label={`Score: ${result.evaluation.score}/10`}
            color={result.evaluation.score >= 7 ? 'success' : 'warning'}
          />
          <Typography>{result.evaluation.feedback}</Typography>
        </div>
      )}
      
      {/* Improved Content (streaming) */}
      {result.improvedContent && (
        <div>
          <Typography variant="h6">Improved Content</Typography>
          <Typography>{result.improvedContent}</Typography>
        </div>
      )}
      
      {/* Loading state for incomplete streams */}
      {!result.finalScore && result.evaluation?.score < 7 && (
        <CircularProgress size={20} />
      )}
    </Card>
  );
}
```

## Advanced Patterns

### 1. Parallel Processing

Execute multiple AI operations concurrently:

```typescript
async generateCodeReview(code: string) {
  // Run three reviews in parallel
  const [securityReview, performanceReview, maintainabilityReview] = 
    await Promise.all([
      generateObject({
        model: this.fastModel,
        schema: securitySchema,
        prompt: `Security review: ${code}`,
      }),
      generateObject({
        model: this.fastModel,  
        schema: performanceSchema,
        prompt: `Performance review: ${code}`,
      }),
      generateObject({
        model: this.fastModel,
        schema: maintainabilitySchema,
        prompt: `Maintainability review: ${code}`,
      }),
    ]);

  // Stream combined results
  return streamObject({
    model: this.complexModel,
    schema: combinedReviewSchema,
    prompt: `Combine reviews: ${JSON.stringify({
      security: securityReview.object,
      performance: performanceReview.object,
      maintainability: maintainabilityReview.object,
    })}`,
  });
}
```

### 2. Routing Pattern

Dynamic model selection based on query classification:

```typescript
async handleQuery(query: string) {
  // Classify query complexity
  const classification = await generateObject({
    model: this.fastModel,
    schema: z.object({
      complexity: z.enum(['simple', 'moderate', 'complex']),
      category: z.string(),
    }),
    prompt: `Classify this query: ${query}`,
  });

  // Select appropriate model and specialist
  const model = classification.object.complexity === 'complex' 
    ? this.complexModel 
    : this.fastModel;

  const specialist = this.getSpecialist(classification.object.category);

  return streamObject({
    model,
    schema: responseSchema,
    prompt: `${specialist} respond to: ${query}`,
  });
}
```

### 3. Tool Usage Pattern

AI with function calling capabilities:

```typescript
import { tool } from 'ai';
import { evaluate } from 'mathjs';

async solveMathProblem(problem: string) {
  return streamObject({
    model: this.complexModel,
    schema: mathSolutionSchema,
    tools: {
      calculate: tool({
        description: 'Perform mathematical calculations',
        parameters: z.object({
          expression: z.string(),
        }),
        execute: async ({ expression }) => {
          try {
            const result = evaluate(expression);
            return { result: result.toString() };
          } catch (error) {
            return { error: error.message };
          }
        },
      }),
    },
    prompt: `Solve this math problem step by step: ${problem}`,
  });
}
```

## Testing Patterns

### Unit Tests

```typescript
// sequential-processing.service.spec.ts
import { Test } from '@nestjs/testing';
import { SequentialProcessingService } from './sequential-processing.service';

// Mock AI SDK
jest.mock('ai', () => ({
  generateText: jest.fn(),
  generateObject: jest.fn(),
  streamObject: jest.fn(),
}));

describe('SequentialProcessingService', () => {
  let service: SequentialProcessingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [SequentialProcessingService],
    }).compile();

    service = module.get<SequentialProcessingService>(SequentialProcessingService);
  });

  it('should improve content when score is low', async () => {
    // Mock responses
    (generateText as jest.Mock).mockResolvedValue({
      text: 'Initial content',
    });
    
    (generateObject as jest.Mock).mockResolvedValue({
      object: { score: 5, feedback: 'Needs improvement' },
    });

    const mockStreamObject = { pipeTextStreamToResponse: jest.fn() };
    (streamObject as jest.Mock).mockReturnValue(mockStreamObject);

    const result = await service.generateContent('test input');
    
    expect(streamObject).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('Improve this content'),
      })
    );
  });
});
```

### E2E Tests

```typescript
// sequential-processing.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Sequential Processing (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/sequential-processing (POST)', () => {
    return request(app.getHttpServer())
      .post('/sequential-processing')
      .send({ input: 'Test product' })
      .expect(200)
      .expect((res) => {
        expect(res.headers['content-type']).toBe('application/json');
        expect(res.headers['cache-control']).toBe('no-cache');
      });
  });
});
```

## Development Workflow

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"npm run start:dev --workspace=api\" \"npm run dev --workspace=webapp\"",
    "build": "npm run build --workspaces",
    "lint": "npm run lint --workspaces",
    "test": "npm run test --workspace=api",
    "test:e2e": "npm run test:e2e --workspace=api"
  }
}
```

### Development Commands

```bash
# Start both backend and frontend
npm run dev

# Run linting across all packages
npm run lint

# Run tests
npm run test
npm run test:e2e

# Build for production
npm run build
```

## Best Practices

### 1. Error Handling

```typescript
// Service level
try {
  const result = await generateObject({...});
  return result;
} catch (error) {
  console.error('AI generation failed:', error);
  throw new Error('Failed to generate content');
}

// Frontend level
{error && (
  <Alert severity="error">
    {error.message || 'An error occurred'}
  </Alert>
)}
```

### 2. Type Safety

Always use Zod schemas for AI responses:

```typescript
const responseSchema = z.object({
  content: z.string(),
  metadata: z.object({
    confidence: z.number(),
    tokens: z.number(),
  }),
});
```

### 3. Performance Optimization

- Use appropriate model sizes (Flash for simple tasks, Pro for complex)
- Implement request debouncing in frontend
- Cache AI responses when appropriate
- Stream partial results for better UX

### 4. Security

- Never expose API keys in frontend
- Validate all inputs with Zod
- Implement rate limiting
- Sanitize AI-generated content before display

## Deployment Considerations

### Environment Variables

```env
# Production
NODE_ENV=production
GOOGLE_GENERATIVE_AI_API_KEY=prod_key
PORT=3001

# CORS origins for production
CORS_ORIGINS=https://yourdomain.com
```

### Docker Setup

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

### Monitoring

- Log AI token usage for cost tracking
- Monitor streaming connection health
- Track error rates by pattern type
- Measure response times for different model sizes

## Contributing

This reference implementation follows established patterns from production AI applications. When extending:

1. Follow the established controller/service patterns
2. Add comprehensive tests for new patterns
3. Update documentation with new examples
4. Ensure type safety with Zod schemas

## License

MIT License - see LICENSE file for details.