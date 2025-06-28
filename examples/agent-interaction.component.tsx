// examples/agent-interaction.component.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button,
  Alert,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Stop as StopIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import TextareaAutosize from 'react-textarea-autosize';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';

// Types
interface AgentInteractionProps {
  title: string;
  description?: string;
  placeholder: string;
  endpoint: string;
  schema: z.ZodSchema<any>;
  renderResult: (result: any, isStreaming: boolean) => React.ReactNode;
  examples?: Array<{
    title: string;
    content: string;
  }>;
  maxInputLength?: number;
  enableCopy?: boolean;
  enableStop?: boolean;
  customValidation?: (input: string) => string | null;
}

interface StreamMetrics {
  startTime: Date | null;
  endTime: Date | null;
  bytesReceived: number;
  chunksReceived: number;
}

/**
 * Universal Agent Interaction Component
 * 
 * Features:
 * - Real-time streaming with progress indicators
 * - Input validation and character limits
 * - Copy to clipboard functionality
 * - Stream control (stop/restart)
 * - Example templates
 * - Performance metrics
 * - Error handling with retry
 * - Keyboard shortcuts
 */
export default function AgentInteraction({
  title,
  description,
  placeholder,
  endpoint,
  schema,
  renderResult,
  examples = [],
  maxInputLength = 5000,
  enableCopy = true,
  enableStop = true,
  customValidation,
}: AgentInteractionProps) {
  // State management
  const [input, setInput] = useState('');
  const [metrics, setMetrics] = useState<StreamMetrics>({
    startTime: null,
    endTime: null,
    bytesReceived: 0,
    chunksReceived: 0,
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(false);

  // AI SDK hook
  const { object, submit, isLoading, error, stop } = useObject({
    api: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/${endpoint}`,
    schema,
    onFinish: () => {
      setMetrics(prev => ({ ...prev, endTime: new Date() }));
    },
  });

  // Validation logic
  const validateInput = useCallback((value: string) => {
    if (!value.trim()) {
      return 'Input cannot be empty';
    }
    
    if (value.length > maxInputLength) {
      return `Input too long. Maximum ${maxInputLength} characters allowed.`;
    }
    
    // Custom validation if provided
    if (customValidation) {
      return customValidation(value);
    }
    
    return null;
  }, [maxInputLength, customValidation]);

  // Handle input changes with validation
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    const error = validateInput(value);
    setValidationError(error);
  }, [validateInput]);

  // Submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedInput = input.trim();
    const error = validateInput(trimmedInput);
    
    if (error) {
      setValidationError(error);
      return;
    }
    
    setValidationError(null);
    setMetrics({
      startTime: new Date(),
      endTime: null,
      bytesReceived: 0,
      chunksReceived: 0,
    });
    
    try {
      await submit({ input: trimmedInput });
    } catch (err) {
      console.error('Submit error:', err);
    }
  }, [input, validateInput, submit]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
    
    if (e.key === 'Escape' && isLoading && enableStop) {
      stop();
    }
  }, [handleSubmit, isLoading, enableStop, stop]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (object) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(object, null, 2));
        // Could add a toast notification here
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  }, [object]);

  // Load example
  const loadExample = useCallback((example: { content: string }) => {
    setInput(example.content);
    setValidationError(null);
    setShowExamples(false);
  }, []);

  // Calculate metrics
  const getElapsedTime = useCallback(() => {
    if (!metrics.startTime) return '';
    const end = metrics.endTime || new Date();
    const elapsed = Math.floor((end.getTime() - metrics.startTime.getTime()) / 1000);
    return `${elapsed}s`;
  }, [metrics]);

  const getCharacterProgress = () => {
    return (input.length / maxInputLength) * 100;
  };

  // Monitor streaming progress (if needed)
  useEffect(() => {
    if (isLoading && object) {
      setMetrics(prev => ({
        ...prev,
        chunksReceived: prev.chunksReceived + 1,
        bytesReceived: prev.bytesReceived + JSON.stringify(object).length,
      }));
    }
  }, [object, isLoading]);

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
      {/* Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {description}
            </Typography>
          )}
          
          {/* Examples section */}
          {examples.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowExamples(!showExamples)}
                sx={{ mb: showExamples ? 1 : 0 }}
              >
                {showExamples ? 'Hide Examples' : 'Show Examples'}
              </Button>
              
              {showExamples && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {examples.map((example, index) => (
                    <Chip
                      key={index}
                      label={example.title}
                      variant="outlined"
                      clickable
                      onClick={() => loadExample(example)}
                    />
                  ))}
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Input Section */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <TextareaAutosize
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`${placeholder}${!isLoading ? ' (Cmd/Ctrl+Enter to submit, Esc to stop)' : ''}`}
              disabled={isLoading}
              style={{
                width: '100%',
                minHeight: '120px',
                maxHeight: '300px',
                padding: '16px',
                border: validationError ? '2px solid #f44336' : '1px solid #ddd',
                borderRadius: '8px',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none',
                backgroundColor: isLoading ? '#f5f5f5' : 'white',
              }}
            />
            
            {/* Character counter */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(getCharacterProgress(), 100)}
                  color={getCharacterProgress() > 90 ? 'warning' : 'primary'}
                  sx={{ height: 4, borderRadius: 2 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {input.length}/{maxInputLength} characters
                </Typography>
              </Box>
            </Box>
            
            {/* Validation error */}
            {validationError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {validationError}
              </Alert>
            )}
            
            {/* Controls */}
            <Box sx={{ 
              mt: 2, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1
            }}>
              <Button
                type="submit"
                variant="contained"
                disabled={!input.trim() || isLoading || !!validationError}
                sx={{ minWidth: 120 }}
              >
                {isLoading ? 'Processing...' : 'Submit'}
              </Button>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Streaming controls */}
                {isLoading && (
                  <>
                    <Chip 
                      label={`${getElapsedTime()} • ${metrics.chunksReceived} chunks`} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                    />
                    {enableStop && (
                      <Tooltip title="Stop streaming (Esc)">
                        <IconButton size="small" onClick={stop}>
                          <StopIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </>
                )}
                
                {/* Result controls */}
                {object && !isLoading && (
                  <>
                    {enableCopy && (
                      <Tooltip title="Copy result">
                        <IconButton size="small" onClick={handleCopy}>
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Clear and restart">
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setInput('');
                          setValidationError(null);
                        }}
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>Error:</strong> {error.message}
          </Typography>
          {error.cause && (
            <Typography variant="caption" component="div" sx={{ mt: 0.5, opacity: 0.8 }}>
              {String(error.cause)}
            </Typography>
          )}
        </Alert>
      )}

      {/* Results Display */}
      {object && (
        <Box sx={{ mt: 2 }}>
          {renderResult(object, isLoading)}
          
          {/* Performance metrics */}
          {!isLoading && metrics.startTime && metrics.endTime && (
            <Card variant="outlined" sx={{ mt: 2, bgcolor: 'grey.50' }}>
              <CardContent sx={{ py: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Completed in {getElapsedTime()} • {metrics.chunksReceived} chunks • {metrics.bytesReceived} bytes
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
}

// Example usage with type safety
export const SequentialProcessingExample = () => {
  const schema = z.object({
    originalContent: z.string().optional(),
    evaluation: z.object({
      score: z.number(),
      feedback: z.string(),
    }).optional(),
    improvedContent: z.string().optional(),
    finalScore: z.number().optional(),
  });

  return (
    <AgentInteraction
      title="Sequential Processing"
      description="Generate marketing copy, evaluate quality, and improve if needed"
      placeholder="Describe your product or service for marketing copy generation..."
      endpoint="sequential-processing"
      schema={schema}
      examples={[
        {
          title: "SaaS Product",
          content: "AI-powered project management tool for remote teams"
        },
        {
          title: "E-commerce",
          content: "Sustainable bamboo kitchenware set for eco-conscious home cooks"
        },
        {
          title: "Mobile App",
          content: "Meditation app with personalized breathing exercises and progress tracking"
        }
      ]}
      renderResult={(result, isStreaming) => (
        <Card>
          <CardContent>
            <Typography variant="h6">Results</Typography>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
      customValidation={(input) => {
        if (input.length < 10) {
          return "Please provide a more detailed description (at least 10 characters)";
        }
        return null;
      }}
    />
  );
};