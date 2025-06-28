# NestJS Backend Streaming Patterns

Comprehensive guide to implementing AI streaming patterns in NestJS applications using the Vercel AI SDK.

## Table of Contents

1. [Core Streaming Architecture](#core-streaming-architecture)
2. [Six Agent Patterns](#six-agent-patterns)
3. [Service Implementation Examples](#service-implementation-examples)
4. [Testing Strategies](#testing-strategies)
5. [Performance Optimization](#performance-optimization)

## Core Streaming Architecture

### HTTP Streaming Setup

Every streaming endpoint follows this controller pattern:

```typescript
@Controller('pattern-name')
export class PatternController {
  constructor(private readonly service: PatternService) {}

  @Post()
  async handleRequest(@Body() body: RequestDto, @Res() res: Response) {
    // Get streaming result from service
    const result = await this.service.processRequest(body);
    
    // Set required headers for streaming
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Pipe AI SDK stream directly to HTTP response
    result.pipeTextStreamToResponse(res);
  }
}
```

### AI SDK Integration

Standard service setup with Google Gemini:

```typescript
import { Injectable } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, generateObject, streamObject } from 'ai';
import { z } from 'zod';

@Injectable()
export class BaseAIService {
  protected readonly google = createGoogleGenerativeAI();
  
  // Model selection strategy
  protected readonly models = {
    complex: this.google('models/gemini-2.5-pro-preview-06-05'),
    fast: this.google('models/gemini-2.5-flash-preview-05-20'),
  };

  protected async generateWithLogging<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    console.log(`[${context}] Starting AI operation`);
    const startTime = Date.now();
    
    try {
      const result = await operation();
      console.log(`[${context}] Completed in ${Date.now() - startTime}ms`);
      return result;
    } catch (error) {
      console.error(`[${context}] Failed:`, error);
      throw error;
    }
  }
}
```

## Six Agent Patterns

### 1. Sequential Processing Pattern

**Use Case**: Generate content → evaluate quality → improve if needed

```typescript
@Injectable()
export class SequentialProcessingService extends BaseAIService {
  async generateMarketingCopy(input: string) {
    console.log('[SequentialProcessing] Starting marketing copy generation for:', input);

    // Step 1: Generate initial content
    const initialResult = await this.generateWithLogging(
      () => generateText({
        model: this.models.complex,
        prompt: `Create compelling marketing copy for: ${input}. Focus on benefits and emotional appeal.`,
      }),
      'InitialGeneration'
    );

    // Step 2: Evaluate quality
    const evaluation = await this.generateWithLogging(
      () => generateObject({
        model: this.models.fast,
        schema: z.object({
          score: z.number().min(1).max(10),
          feedback: z.string(),
          improvements: z.array(z.string()),
        }),
        prompt: `Evaluate this marketing copy on a scale of 1-10:
        
        ${initialResult.text}
        
        Consider: clarity, persuasiveness, emotional appeal, and call-to-action strength.`,
      }),
      'QualityEvaluation'
    );

    // Step 3: Stream final result with conditional improvement
    const shouldImprove = evaluation.object.score < 7;

    return streamObject({
      model: this.models.complex,
      schema: z.object({
        originalContent: z.string(),
        evaluation: z.object({
          score: z.number(),
          feedback: z.string(),
          improvements: z.array(z.string()),
        }),
        improvedContent: z.string().optional(),
        finalScore: z.number().optional(),
        processingSteps: z.array(z.string()),
      }),
      prompt: shouldImprove 
        ? `Based on the evaluation feedback, improve this marketing copy:
        
        Original: ${initialResult.text}
        Score: ${evaluation.object.score}/10
        Feedback: ${evaluation.object.feedback}
        Specific improvements needed: ${evaluation.object.improvements.join(', ')}
        
        Provide the improved version and a new quality score.`
        : `Package the original content as the final result:
        
        Content: ${initialResult.text}
        Score: ${evaluation.object.score}/10`,
    });
  }
}
```

### 2. Routing Pattern

**Use Case**: Classify queries → route to specialized models/prompts

```typescript
@Injectable()
export class RoutingService extends BaseAIService {
  private readonly specialists = {
    technical: 'You are a senior software engineer with expertise in system architecture.',
    marketing: 'You are a marketing specialist focused on customer acquisition.',
    support: 'You are a customer support specialist focused on problem resolution.',
  };

  async handleCustomerQuery(query: string) {
    console.log('[Routing] Processing customer query:', query);

    // Step 1: Classify the query
    const classification = await this.generateWithLogging(
      () => generateObject({
        model: this.models.fast,
        schema: z.object({
          category: z.enum(['technical', 'marketing', 'support', 'general']),
          complexity: z.enum(['simple', 'moderate', 'complex']),
          urgency: z.enum(['low', 'medium', 'high']),
          requiredExpertise: z.array(z.string()),
        }),
        prompt: `Classify this customer query:
        
        "${query}"
        
        Determine the category, complexity level, urgency, and required expertise.`,
      }),
      'QueryClassification'
    );

    // Step 2: Select appropriate model and specialist
    const selectedModel = classification.object.complexity === 'complex' 
      ? this.models.complex 
      : this.models.fast;

    const specialist = this.specialists[classification.object.category] || 
      'You are a helpful assistant.';

    // Step 3: Stream specialized response
    return streamObject({
      model: selectedModel,
      schema: z.object({
        classification: z.object({
          category: z.string(),
          complexity: z.string(),
          urgency: z.string(),
          requiredExpertise: z.array(z.string()),
        }),
        response: z.string(),
        nextSteps: z.array(z.string()),
        estimatedResolutionTime: z.string(),
      }),
      prompt: `${specialist}
      
      Customer Query: "${query}"
      
      Classification: ${JSON.stringify(classification.object)}
      
      Provide a comprehensive response with next steps and estimated resolution time.`,
    });
  }
}
```

### 3. Parallel Processing Pattern

**Use Case**: Run multiple AI operations simultaneously

```typescript
@Injectable()
export class ParallelProcessingService extends BaseAIService {
  async reviewCode(code: string) {
    console.log('[ParallelProcessing] Starting multi-aspect code review');

    // Define review schemas
    const securitySchema = z.object({
      score: z.number().min(1).max(10),
      vulnerabilities: z.array(z.object({
        type: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        description: z.string(),
        line: z.number().optional(),
      })),
      recommendations: z.array(z.string()),
    });

    const performanceSchema = z.object({
      score: z.number().min(1).max(10),
      issues: z.array(z.object({
        type: z.string(),
        impact: z.enum(['low', 'medium', 'high']),
        description: z.string(),
        suggestion: z.string(),
      })),
      optimizations: z.array(z.string()),
    });

    const maintainabilitySchema = z.object({
      score: z.number().min(1).max(10),
      codeSmells: z.array(z.string()),
      suggestions: z.array(z.string()),
      complexity: z.enum(['low', 'medium', 'high']),
    });

    // Run all reviews in parallel
    const [securityReview, performanceReview, maintainabilityReview] = 
      await Promise.all([
        this.generateWithLogging(
          () => generateObject({
            model: this.models.fast,
            schema: securitySchema,
            prompt: `Perform a security review of this code:\n\n${code}`,
          }),
          'SecurityReview'
        ),
        this.generateWithLogging(
          () => generateObject({
            model: this.models.fast,
            schema: performanceSchema,
            prompt: `Perform a performance review of this code:\n\n${code}`,
          }),
          'PerformanceReview'
        ),
        this.generateWithLogging(
          () => generateObject({
            model: this.models.fast,
            schema: maintainabilitySchema,
            prompt: `Perform a maintainability review of this code:\n\n${code}`,
          }),
          'MaintainabilityReview'
        ),
      ]);

    // Stream combined analysis
    return streamObject({
      model: this.models.complex,
      schema: z.object({
        security: securitySchema,
        performance: performanceSchema,
        maintainability: maintainabilitySchema,
        overallScore: z.number(),
        summary: z.string(),
        prioritizedActions: z.array(z.object({
          action: z.string(),
          priority: z.enum(['low', 'medium', 'high', 'critical']),
          effort: z.enum(['low', 'medium', 'high']),
        })),
      }),
      prompt: `Analyze these three code review results and provide a comprehensive summary:
      
      Security Review: ${JSON.stringify(securityReview.object)}
      Performance Review: ${JSON.stringify(performanceReview.object)}
      Maintainability Review: ${JSON.stringify(maintainabilityReview.object)}
      
      Calculate an overall score and prioritize actions by importance and effort.`,
    });
  }
}
```

### 4. Orchestrator-Worker Pattern

**Use Case**: Break down complex tasks into manageable steps

```typescript
@Injectable()
export class OrchestratorWorkerService extends BaseAIService {
  async implementFeature(featureDescription: string) {
    console.log('[OrchestratorWorker] Planning feature implementation:', featureDescription);

    // Step 1: Create implementation plan
    const plan = await this.generateWithLogging(
      () => generateObject({
        model: this.models.complex,
        schema: z.object({
          tasks: z.array(z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            dependencies: z.array(z.string()),
            estimatedHours: z.number(),
            priority: z.enum(['low', 'medium', 'high']),
            type: z.enum(['backend', 'frontend', 'database', 'testing', 'documentation']),
          })),
          timeline: z.string(),
          risks: z.array(z.string()),
        }),
        prompt: `Create a detailed implementation plan for: ${featureDescription}
        
        Break down into specific, actionable tasks with dependencies and estimates.`,
      }),
      'FeaturePlanning'
    );

    // Step 2: Execute tasks (simulated - in real app, these would be actual implementations)
    const taskResults = await Promise.all(
      plan.object.tasks.map(async (task, index) => {
        // Simulate task execution with delay
        await new Promise(resolve => setTimeout(resolve, 100 * (index + 1)));
        
        return this.generateWithLogging(
          () => generateObject({
            model: this.models.fast,
            schema: z.object({
              taskId: z.string(),
              status: z.enum(['completed', 'in_progress', 'blocked']),
              output: z.string(),
              nextSteps: z.array(z.string()),
              blockers: z.array(z.string()),
            }),
            prompt: `Execute this task: ${task.title} - ${task.description}
            
            Provide implementation details and any blockers encountered.`,
          }),
          `TaskExecution-${task.id}`
        );
      })
    );

    // Step 3: Stream orchestration results
    return streamObject({
      model: this.models.complex,
      schema: z.object({
        plan: z.object({
          tasks: z.array(z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            dependencies: z.array(z.string()),
            estimatedHours: z.number(),
            priority: z.string(),
            type: z.string(),
          })),
          timeline: z.string(),
          risks: z.array(z.string()),
        }),
        execution: z.object({
          completedTasks: z.number(),
          totalTasks: z.number(),
          blockers: z.array(z.string()),
          nextMilestone: z.string(),
        }),
        taskResults: z.array(z.object({
          taskId: z.string(),
          status: z.string(),
          output: z.string(),
          nextSteps: z.array(z.string()),
          blockers: z.array(z.string()),
        })),
        summary: z.string(),
      }),
      prompt: `Summarize the feature implementation progress:
      
      Original Plan: ${JSON.stringify(plan.object)}
      Task Results: ${JSON.stringify(taskResults.map(r => r.object))}
      
      Provide a comprehensive status update and next steps.`,
    });
  }
}
```

### 5. Evaluator-Optimizer Pattern

**Use Case**: Iterative improvement with quality assessment

```typescript
@Injectable()
export class EvaluatorOptimizerService extends BaseAIService {
  async optimizeTranslation(text: string, targetLanguage: string, domain: string) {
    console.log(`[EvaluatorOptimizer] Optimizing translation to ${targetLanguage} for ${domain} domain`);

    let currentTranslation = '';
    let iteration = 0;
    const maxIterations = 3;
    const targetScore = 8.5;

    // Initial translation
    const initialTranslation = await this.generateWithLogging(
      () => generateText({
        model: this.models.complex,
        prompt: `Translate this text to ${targetLanguage} for ${domain} context: ${text}`,
      }),
      'InitialTranslation'
    );

    currentTranslation = initialTranslation.text;

    // Iterative optimization loop
    const iterations = [];
    
    while (iteration < maxIterations) {
      // Evaluate current translation
      const evaluation = await this.generateWithLogging(
        () => generateObject({
          model: this.models.fast,
          schema: z.object({
            score: z.number().min(1).max(10),
            accuracy: z.number().min(1).max(10),
            naturalness: z.number().min(1).max(10),
            domainAppropriate: z.number().min(1).max(10),
            feedback: z.string(),
            specificIssues: z.array(z.string()),
          }),
          prompt: `Evaluate this ${targetLanguage} translation for ${domain} domain:
          
          Original: ${text}
          Translation: ${currentTranslation}
          
          Rate accuracy, naturalness, and domain appropriateness.`,
        }),
        `Evaluation-${iteration + 1}`
      );

      iterations.push({
        iteration: iteration + 1,
        translation: currentTranslation,
        evaluation: evaluation.object,
      });

      // Stop if target score reached or max iterations
      if (evaluation.object.score >= targetScore || iteration >= maxIterations - 1) {
        break;
      }

      // Improve translation based on feedback
      const improvedTranslation = await this.generateWithLogging(
        () => generateText({
          model: this.models.complex,
          prompt: `Improve this ${targetLanguage} translation based on feedback:
          
          Original text: ${text}
          Current translation: ${currentTranslation}
          Score: ${evaluation.object.score}/10
          Issues: ${evaluation.object.specificIssues.join(', ')}
          Feedback: ${evaluation.object.feedback}
          
          Domain: ${domain}
          
          Provide an improved translation that addresses these issues.`,
        }),
        `Improvement-${iteration + 1}`
      );

      currentTranslation = improvedTranslation.text;
      iteration++;
    }

    // Stream final optimized result
    return streamObject({
      model: this.models.fast,
      schema: z.object({
        originalText: z.string(),
        targetLanguage: z.string(),
        domain: z.string(),
        finalTranslation: z.string(),
        iterations: z.array(z.object({
          iteration: z.number(),
          translation: z.string(),
          evaluation: z.object({
            score: z.number(),
            accuracy: z.number(),
            naturalness: z.number(),
            domainAppropriate: z.number(),
            feedback: z.string(),
            specificIssues: z.array(z.string()),
          }),
        })),
        improvementSummary: z.string(),
        finalScore: z.number(),
      }),
      prompt: `Summarize the translation optimization process:
      
      Original: ${text}
      Target Language: ${targetLanguage}
      Domain: ${domain}
      Final Translation: ${currentTranslation}
      Iterations: ${JSON.stringify(iterations)}
      
      Explain the improvements made through each iteration.`,
    });
  }
}
```

### 6. Multi-Step Tool Usage Pattern

**Use Case**: AI with function calling for complex problem solving

```typescript
import { tool } from 'ai';
import { evaluate } from 'mathjs';

@Injectable()
export class MultiStepToolUsageService extends BaseAIService {
  async solveMathProblem(problem: string) {
    console.log('[MultiStepToolUsage] Solving math problem:', problem);

    return streamObject({
      model: this.models.complex,
      schema: z.object({
        problem: z.string(),
        solution: z.string(),
        steps: z.array(z.object({
          step: z.number(),
          description: z.string(),
          calculation: z.string().optional(),
          result: z.string().optional(),
        })),
        finalAnswer: z.string(),
        verification: z.string(),
      }),
      tools: {
        calculate: tool({
          description: 'Perform mathematical calculations using mathjs',
          parameters: z.object({
            expression: z.string().describe('Mathematical expression to evaluate'),
          }),
          execute: async ({ expression }) => {
            try {
              console.log(`[Calculator] Evaluating: ${expression}`);
              const result = evaluate(expression);
              return { 
                result: result.toString(), 
                expression,
                success: true 
              };
            } catch (error) {
              console.error(`[Calculator] Error evaluating ${expression}:`, error);
              return { 
                error: error.message, 
                expression,
                success: false 
              };
            }
          },
        }),
        validateAnswer: tool({
          description: 'Validate a mathematical answer by substitution or alternative method',
          parameters: z.object({
            originalProblem: z.string(),
            proposedAnswer: z.string(),
            validationMethod: z.string(),
          }),
          execute: async ({ originalProblem, proposedAnswer, validationMethod }) => {
            // Simulate validation logic
            console.log(`[Validator] Validating answer ${proposedAnswer} for ${originalProblem}`);
            return {
              isValid: true,
              confidence: 0.95,
              method: validationMethod,
            };
          },
        }),
      },
      prompt: `Solve this math problem step by step: ${problem}

      Use the calculate tool for any mathematical operations.
      Show your work clearly with each step.
      Validate your final answer using the validateAnswer tool.
      
      Make sure to:
      1. Break down the problem into manageable steps
      2. Use the calculator for all numerical computations
      3. Explain your reasoning for each step
      4. Verify your final answer`,
    });
  }
}
```

## Testing Strategies

### Unit Testing with Mocks

```typescript
// Example unit test
describe('SequentialProcessingService', () => {
  let service: SequentialProcessingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [SequentialProcessingService],
    }).compile();

    service = module.get<SequentialProcessingService>(SequentialProcessingService);
  });

  it('should trigger improvement when score is below threshold', async () => {
    // Mock AI responses
    (generateText as jest.Mock).mockResolvedValue({
      text: 'Original marketing copy',
    });
    
    (generateObject as jest.Mock).mockResolvedValue({
      object: { 
        score: 5, 
        feedback: 'Needs more emotional appeal',
        improvements: ['Add benefits', 'Stronger CTA']
      },
    });

    const mockStreamObject = { pipeTextStreamToResponse: jest.fn() };
    (streamObject as jest.Mock).mockReturnValue(mockStreamObject);

    await service.generateMarketingCopy('test product');
    
    expect(streamObject).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('improve this marketing copy'),
      })
    );
  });
});
```

### E2E Testing

```typescript
describe('Streaming Endpoints (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors();
    await app.init();
  });

  it('should stream sequential processing results', (done) => {
    const chunks: string[] = [];
    
    request(app.getHttpServer())
      .post('/sequential-processing')
      .send({ input: 'Test product' })
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect('Cache-Control', 'no-cache')
      .parse((res, callback) => {
        res.on('data', (chunk) => {
          chunks.push(chunk.toString());
        });
        res.on('end', () => {
          // Verify streaming chunks contain expected data
          const fullResponse = chunks.join('');
          expect(fullResponse).toContain('originalContent');
          expect(fullResponse).toContain('evaluation');
          callback(null, fullResponse);
          done();
        });
      })
      .end();
  });
});
```

## Performance Optimization

### Model Selection Strategy

```typescript
class ModelSelector {
  selectModel(complexity: 'simple' | 'moderate' | 'complex', priority: 'speed' | 'quality') {
    if (priority === 'speed' && complexity === 'simple') {
      return this.models.fast;
    }
    
    if (complexity === 'complex' || priority === 'quality') {
      return this.models.complex;
    }
    
    return this.models.fast;
  }
}
```

### Caching Implementation

```typescript
@Injectable()
export class CachedAIService extends BaseAIService {
  private cache = new Map<string, any>();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  async generateWithCache<T>(key: string, generator: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value;
    }

    const result = await generator();
    this.cache.set(key, { value: result, timestamp: Date.now() });
    return result;
  }
}
```

### Rate Limiting

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10, // 10 requests per minute
    }),
  ],
})
export class AppModule {}

@UseGuards(ThrottlerGuard)
@Controller('ai-endpoint')
export class AIController {
  // Protected endpoints
}
```

## Monitoring and Logging

### Token Usage Tracking

```typescript
@Injectable()
export class TokenTracker {
  private usage = new Map<string, number>();

  trackTokens(endpoint: string, tokens: number) {
    const current = this.usage.get(endpoint) || 0;
    this.usage.set(endpoint, current + tokens);
    
    console.log(`[TokenUsage] ${endpoint}: +${tokens} (total: ${current + tokens})`);
  }

  getUsage() {
    return Object.fromEntries(this.usage);
  }
}
```

### Error Handling

```typescript
@Catch()
export class AIExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    console.error('[AI Error]', {
      endpoint: request.url,
      error: exception.message,
      timestamp: new Date().toISOString(),
    });

    response.status(500).json({
      error: 'AI service temporarily unavailable',
      timestamp: new Date().toISOString(),
    });
  }
}
```

This comprehensive backend documentation provides the foundation for implementing robust AI streaming applications with NestJS and the Vercel AI SDK.