# React Frontend Streaming Patterns

Comprehensive guide to implementing AI streaming consumption patterns in React applications using the Vercel AI SDK.

## Table of Contents

1. [Core Streaming Hooks](#core-streaming-hooks)
2. [UI Component Patterns](#ui-component-patterns)
3. [Real-time Display Components](#real-time-display-components)
4. [Error Handling & Loading States](#error-handling--loading-states)
5. [Performance Optimization](#performance-optimization)

## Core Streaming Hooks

### Basic useObject Hook Implementation

The foundation of AI streaming in React:

```typescript
// hooks/useAIStream.ts
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';

export function useAIStream<T>(
  endpoint: string, 
  schema: z.ZodSchema<T>,
  options?: {
    onStart?: () => void;
    onComplete?: (result: T) => void;
    onError?: (error: Error) => void;
  }
) {
  const { object, submit, isLoading, error, stop } = useObject({
    api: `http://localhost:3001/${endpoint}`,
    schema,
    onFinish: (result) => {
      options?.onComplete?.(result);
    },
  });

  const handleSubmit = async (input: any) => {
    try {
      options?.onStart?.();
      await submit(input);
    } catch (err) {
      options?.onError?.(err as Error);
    }
  };

  return {
    data: object,
    submit: handleSubmit,
    isLoading,
    error,
    stop,
  };
}
```

### Agent Interaction Component

Universal component for AI interactions:

```typescript
// components/AgentInteraction.tsx
import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import TextareaAutosize from 'react-textarea-autosize';
import { useAIStream } from '../hooks/useAIStream';
import { z } from 'zod';

interface AgentInteractionProps {
  title: string;
  placeholder: string;
  endpoint: string;
  schema: z.ZodSchema<any>;
  renderResult: (result: any) => React.ReactNode;
}

export default function AgentInteraction({
  title,
  placeholder,
  endpoint,
  schema,
  renderResult,
}: AgentInteractionProps) {
  const [input, setInput] = useState('');
  const [submissionTime, setSubmissionTime] = useState<Date | null>(null);

  const { data, submit, isLoading, error, stop } = useAIStream(
    endpoint,
    schema,
    {
      onStart: () => setSubmissionTime(new Date()),
      onComplete: () => console.log('Stream completed'),
      onError: (err) => console.error('Stream error:', err),
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    await submit({ input: input.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const getElapsedTime = () => {
    if (!submissionTime) return '';
    const elapsed = Math.floor((Date.now() - submissionTime.getTime()) / 1000);
    return `${elapsed}s`;
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <TextareaAutosize
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`${placeholder}${!isLoading ? ' (Cmd/Ctrl+Enter to submit)' : ''}`}
              disabled={isLoading}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={!input.trim() || isLoading}
                sx={{ minWidth: 100 }}
              >
                {isLoading ? <CircularProgress size={20} /> : 'Submit'}
              </Button>
              
              {isLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={`Processing... ${getElapsedTime()}`} size="small" />
                  <Button size="small" onClick={stop}>Stop</Button>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error.message}
        </Alert>
      )}

      {data && (
        <Box sx={{ mt: 2 }}>
          {renderResult(data)}
        </Box>
      )}
    </Box>
  );
}
```

## UI Component Patterns

### Sequential Processing Display

Component for sequential AI operations:

```typescript
// components/displays/SequentialProcessingDisplay.tsx
import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Alert
} from '@mui/material';

interface SequentialResult {
  originalContent?: string;
  evaluation?: {
    score: number;
    feedback: string;
    improvements: string[];
  };
  improvedContent?: string;
  finalScore?: number;
  processingSteps?: string[];
}

export default function SequentialProcessingDisplay({ result }: { result: SequentialResult }) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'success';
    if (score >= 6) return 'warning';
    return 'error';
  };

  const getCurrentStep = () => {
    if (!result.originalContent) return 0;
    if (!result.evaluation) return 1;
    if (!result.improvedContent && result.evaluation?.score < 7) return 2;
    return 3;
  };

  const steps = [
    'Generating Content',
    'Evaluating Quality', 
    'Improving Content',
    'Complete'
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Sequential Processing Results
        </Typography>

        {/* Progress Stepper */}
        <Stepper activeStep={getCurrentStep()} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Original Content */}
        {result.originalContent && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Original Content
            </Typography>
            <Card variant="outlined">
              <CardContent>
                <Typography>{result.originalContent}</Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Evaluation */}
        {result.evaluation && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Quality Evaluation
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Chip
                label={`Score: ${result.evaluation.score}/10`}
                color={getScoreColor(result.evaluation.score)}
              />
              {result.evaluation.score < 7 && (
                <Chip label="Improvement Needed" color="warning" variant="outlined" />
              )}
            </Box>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Feedback:</strong> {result.evaluation.feedback}
            </Typography>
            
            {result.evaluation.improvements.length > 0 && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Suggested Improvements:</strong>
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {result.evaluation.improvements.map((improvement, index) => (
                    <Chip key={index} label={improvement} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Improved Content */}
        {result.evaluation?.score < 7 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Improved Content
            </Typography>
            {result.improvedContent ? (
              <Card variant="outlined" sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                <CardContent>
                  <Typography>{result.improvedContent}</Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress sx={{ flexGrow: 1 }} />
                <Typography variant="body2">Improving content...</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Final Score */}
        {result.finalScore && (
          <Alert 
            severity={result.finalScore >= 8 ? 'success' : 'info'}
            sx={{ mt: 2 }}
          >
            <Typography>
              <strong>Final Score: {result.finalScore}/10</strong>
              {result.finalScore >= 8 
                ? ' - Excellent quality achieved!' 
                : ' - Good improvement made!'}
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
```

### Parallel Processing Display

Component for parallel AI operations:

```typescript
// components/displays/ParallelProcessingDisplay.tsx
import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  Grid,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Build as BuildIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

interface ParallelResult {
  security?: {
    score: number;
    vulnerabilities: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
    }>;
    recommendations: string[];
  };
  performance?: {
    score: number;
    issues: Array<{
      type: string;
      impact: 'low' | 'medium' | 'high';
      description: string;
      suggestion: string;
    }>;
    optimizations: string[];
  };
  maintainability?: {
    score: number;
    codeSmells: string[];
    suggestions: string[];
    complexity: 'low' | 'medium' | 'high';
  };
  overallScore?: number;
  summary?: string;
  prioritizedActions?: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    effort: 'low' | 'medium' | 'high';
  }>;
}

export default function ParallelProcessingDisplay({ result }: { result: ParallelResult }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'success';
    if (score >= 6) return 'warning';
    return 'error';
  };

  const ReviewSection = ({ 
    title, 
    icon, 
    data, 
    isLoading 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    data?: any;
    isLoading: boolean;
  }) => (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>

        {isLoading ? (
          <Box>
            <LinearProgress sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Analyzing...
            </Typography>
          </Box>
        ) : data ? (
          <Box>
            <Chip
              label={`Score: ${data.score}/10`}
              color={getScoreColor(data.score)}
              sx={{ mb: 2 }}
            />
            
            {/* Security-specific content */}
            {data.vulnerabilities && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Vulnerabilities ({data.vulnerabilities.length})
                </Typography>
                {data.vulnerabilities.length > 0 ? (
                  <List dense>
                    {data.vulnerabilities.map((vuln: any, index: number) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <WarningIcon color={getSeverityColor(vuln.severity) as any} />
                        </ListItemIcon>
                        <ListItemText
                          primary={vuln.type}
                          secondary={vuln.description}
                        />
                        <Chip
                          label={vuln.severity}
                          color={getSeverityColor(vuln.severity) as any}
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="success.main">
                    No vulnerabilities found
                  </Typography>
                )}
              </Box>
            )}

            {/* Performance-specific content */}
            {data.issues && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Performance Issues ({data.issues.length})
                </Typography>
                {data.issues.length > 0 ? (
                  <List dense>
                    {data.issues.map((issue: any, index: number) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={issue.type}
                          secondary={`${issue.description} - ${issue.suggestion}`}
                        />
                        <Chip
                          label={issue.impact}
                          color={getSeverityColor(issue.impact) as any}
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="success.main">
                    No performance issues found
                  </Typography>
                )}
              </Box>
            )}

            {/* Maintainability-specific content */}
            {data.codeSmells && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Code Smells ({data.codeSmells.length})
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Complexity: 
                  <Chip 
                    label={data.complexity} 
                    color={getSeverityColor(data.complexity) as any}
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                </Typography>
                {data.codeSmells.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {data.codeSmells.map((smell: string, index: number) => (
                      <Chip key={index} label={smell} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* Recommendations/Suggestions */}
            {(data.recommendations || data.optimizations || data.suggestions) && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Recommendations
                </Typography>
                <List dense>
                  {(data.recommendations || data.optimizations || data.suggestions || [])
                    .map((item: string, index: number) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );

  const hasAllReviews = result.security && result.performance && result.maintainability;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Code Review Results
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <ReviewSection
            title="Security"
            icon={<SecurityIcon />}
            data={result.security}
            isLoading={!result.security}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ReviewSection
            title="Performance"
            icon={<SpeedIcon />}
            data={result.performance}
            isLoading={!result.performance}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ReviewSection
            title="Maintainability"
            icon={<BuildIcon />}
            data={result.maintainability}
            isLoading={!result.maintainability}
          />
        </Grid>
      </Grid>

      {/* Overall Summary */}
      {hasAllReviews && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Overall Analysis
            </Typography>
            
            {result.overallScore && (
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={`Overall Score: ${result.overallScore}/10`}
                  color={getScoreColor(result.overallScore)}
                  size="large"
                />
              </Box>
            )}

            {result.summary && (
              <Typography variant="body1" sx={{ mb: 2 }}>
                {result.summary}
              </Typography>
            )}

            {result.prioritizedActions && result.prioritizedActions.length > 0 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Prioritized Actions
                </Typography>
                <List>
                  {result.prioritizedActions.map((action, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={action.action}
                        secondary={`Effort: ${action.effort}`}
                      />
                      <Chip
                        label={action.priority}
                        color={getSeverityColor(action.priority) as any}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
```

### Routing Display Component

Component for query routing results:

```typescript
// components/displays/RoutingDisplay.tsx
import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  Alert,
  List,
  ListItem,
  ListItemText,
  Avatar
} from '@mui/material';
import { 
  Support as SupportIcon,
  Code as TechnicalIcon,
  Campaign as MarketingIcon,
  Help as GeneralIcon
} from '@mui/icons-material';

interface RoutingResult {
  classification?: {
    category: string;
    complexity: string;
    urgency: string;
    requiredExpertise: string[];
  };
  response?: string;
  nextSteps?: string[];
  estimatedResolutionTime?: string;
}

export default function RoutingDisplay({ result }: { result: RoutingResult }) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <TechnicalIcon />;
      case 'marketing': return <MarketingIcon />;
      case 'support': return <SupportIcon />;
      default: return <GeneralIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'primary';
      case 'marketing': return 'secondary';
      case 'support': return 'success';
      default: return 'default';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Query Routing Results
      </Typography>

      {/* Classification */}
      {result.classification && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Query Classification
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip
                avatar={<Avatar>{getCategoryIcon(result.classification.category)}</Avatar>}
                label={`Category: ${result.classification.category}`}
                color={getCategoryColor(result.classification.category) as any}
              />
              <Chip
                label={`Complexity: ${result.classification.complexity}`}
                variant="outlined"
              />
              <Chip
                label={`Urgency: ${result.classification.urgency}`}
                color={getUrgencyColor(result.classification.urgency) as any}
              />
            </Box>

            {result.classification.requiredExpertise.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Required Expertise:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {result.classification.requiredExpertise.map((expertise, index) => (
                    <Chip key={index} label={expertise} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Response */}
      {result.response && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Specialized Response
            </Typography>
            <Typography variant="body1">
              {result.response}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Next Steps and Resolution Time */}
      {(result.nextSteps || result.estimatedResolutionTime) && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Action Plan
            </Typography>
            
            {result.estimatedResolutionTime && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography>
                  <strong>Estimated Resolution Time:</strong> {result.estimatedResolutionTime}
                </Typography>
              </Alert>
            )}

            {result.nextSteps && result.nextSteps.length > 0 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Next Steps:
                </Typography>
                <List>
                  {result.nextSteps.map((step, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${index + 1}. ${step}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
```

## Error Handling & Loading States

### Error Boundary Component

```typescript
// components/ErrorBoundary.tsx
import React from 'react';
import { Alert, Button, Box } from '@mui/material';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AI Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => this.setState({ hasError: false })}
            >
              Retry
            </Button>
          }
        >
          Something went wrong with the AI component. 
          {this.state.error?.message && (
            <Box component="span" sx={{ display: 'block', mt: 1, fontSize: '0.875em' }}>
              {this.state.error.message}
            </Box>
          )}
        </Alert>
      );
    }

    return this.props.children;
  }
}
```

### Loading States Component

```typescript
// components/LoadingStates.tsx
import React from 'react';
import { 
  Box, 
  CircularProgress, 
  LinearProgress, 
  Typography,
  Skeleton 
} from '@mui/material';

export const StreamingLoader = ({ message = 'Processing...' }: { message?: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
    <CircularProgress size={20} />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

export const ContentSkeleton = () => (
  <Box sx={{ p: 2 }}>
    <Skeleton variant="text" width="60%" height={40} />
    <Skeleton variant="rectangular" width="100%" height={100} sx={{ my: 2 }} />
    <Skeleton variant="text" width="80%" />
    <Skeleton variant="text" width="40%" />
  </Box>
);

export const ProgressiveLoader = ({ 
  stage, 
  stages 
}: { 
  stage: number; 
  stages: string[] 
}) => (
  <Box sx={{ width: '100%', p: 2 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
      <Typography variant="body2">
        {stages[stage] || 'Processing...'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {stage + 1}/{stages.length}
      </Typography>
    </Box>
    <LinearProgress 
      variant="determinate" 
      value={(stage / Math.max(stages.length - 1, 1)) * 100} 
    />
  </Box>
);
```

## Performance Optimization

### Memoized Result Display

```typescript
// components/optimized/MemoizedResultDisplay.tsx
import React, { useMemo } from 'react';

interface MemoizedResultDisplayProps {
  result: any;
  displayComponent: React.ComponentType<{ result: any }>;
}

export const MemoizedResultDisplay = React.memo<MemoizedResultDisplayProps>(
  ({ result, displayComponent: DisplayComponent }) => {
    const memoizedResult = useMemo(() => {
      // Deep clone to prevent mutation issues
      return JSON.parse(JSON.stringify(result));
    }, [result]);

    return <DisplayComponent result={memoizedResult} />;
  }
);
```

### Debounced Input Hook

```typescript
// hooks/useDebounced.ts
import { useState, useEffect } from 'react';

export function useDebounced<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage in components
export function useDebouncedAIStream(endpoint: string, schema: z.ZodSchema<any>) {
  const [input, setInput] = useState('');
  const debouncedInput = useDebounced(input, 500);
  
  const { data, submit, isLoading } = useAIStream(endpoint, schema);

  useEffect(() => {
    if (debouncedInput.trim()) {
      submit({ input: debouncedInput.trim() });
    }
  }, [debouncedInput, submit]);

  return { input, setInput, data, isLoading };
}
```

### Virtual Scrolling for Large Results

```typescript
// components/VirtualizedResultList.tsx
import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { ListItem, ListItemText, Paper } from '@mui/material';

interface VirtualizedResultListProps {
  results: any[];
  height: number;
  itemHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
}

export default function VirtualizedResultList({
  results,
  height,
  itemHeight,
  renderItem,
}: VirtualizedResultListProps) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <Paper sx={{ m: 0.5, p: 1 }}>
        {renderItem(results[index], index)}
      </Paper>
    </div>
  );

  return (
    <List
      height={height}
      itemCount={results.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

## Advanced Patterns

### Multi-Pattern Router Component

```typescript
// components/MultiPatternRouter.tsx
import React, { useState } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography 
} from '@mui/material';
import AgentInteraction from './AgentInteraction';
import SequentialProcessingDisplay from './displays/SequentialProcessingDisplay';
import ParallelProcessingDisplay from './displays/ParallelProcessingDisplay';
import RoutingDisplay from './displays/RoutingDisplay';
import { z } from 'zod';

const patterns = [
  {
    id: 'sequential',
    title: 'Sequential Processing',
    endpoint: 'sequential-processing',
    placeholder: 'Describe a product for marketing copy generation...',
    schema: z.any(),
    display: SequentialProcessingDisplay,
  },
  {
    id: 'parallel',
    title: 'Parallel Processing', 
    endpoint: 'parallel-processing',
    placeholder: 'Paste code for multi-aspect review...',
    schema: z.any(),
    display: ParallelProcessingDisplay,
  },
  {
    id: 'routing',
    title: 'Query Routing',
    endpoint: 'routing',
    placeholder: 'Enter a customer query...',
    schema: z.any(),
    display: RoutingDisplay,
  },
  // Add other patterns...
];

export default function MultiPatternRouter() {
  const [selectedPattern, setSelectedPattern] = useState(0);

  const currentPattern = patterns[selectedPattern];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={selectedPattern} 
          onChange={(_, newValue) => setSelectedPattern(newValue)}
        >
          {patterns.map((pattern, index) => (
            <Tab key={pattern.id} label={pattern.title} />
          ))}
        </Tabs>
      </Box>

      <AgentInteraction
        title={currentPattern.title}
        placeholder={currentPattern.placeholder}
        endpoint={currentPattern.endpoint}
        schema={currentPattern.schema}
        renderResult={(result) => (
          <currentPattern.display result={result} />
        )}
      />
    </Box>
  );
}
```

### WebSocket Integration (Alternative to HTTP streaming)

```typescript
// hooks/useWebSocketStream.ts
import { useState, useEffect, useRef } from 'react';

export function useWebSocketStream<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(url);
    
    ws.current.onopen = () => {
      setIsConnected(true);
      setError(null);
    };
    
    ws.current.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setData(parsedData);
      } catch (err) {
        setError(new Error('Failed to parse WebSocket message'));
      }
    };
    
    ws.current.onerror = () => {
      setError(new Error('WebSocket connection error'));
    };
    
    ws.current.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.current?.close();
    };
  }, [url]);

  const send = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { data, isConnected, error, send };
}
```

This comprehensive frontend documentation provides the foundation for building robust React applications that consume AI streaming data with excellent user experience and performance.