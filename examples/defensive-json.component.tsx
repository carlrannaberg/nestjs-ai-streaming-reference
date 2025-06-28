// Defensive JSON streaming component (AI SDK v5)
import React, { useState, useEffect } from 'react';
import { useChat } from 'ai/react';
import { z } from 'zod';

// Schema for validation
const ResponseSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  items: z.array(z.string()).optional(),
  status: z.enum(['processing', 'complete']).optional(),
});

type ResponseType = z.infer<typeof ResponseSchema>;

export default function DefensiveJsonComponent() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  const [parsedData, setParsedData] = useState<ResponseType>({});
  const [parseError, setParseError] = useState<string | null>(null);

  // Defensive JSON parsing for v5 message structure
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage?.role === 'assistant') {
      // Extract text from message parts (v5 structure)
      const textContent = lastMessage.content
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('');
      
      try {
        // Attempt to parse JSON - will fail until stream is complete
        const parsed = JSON.parse(textContent);
        
        // Validate against schema
        const validation = ResponseSchema.safeParse(parsed);
        
        if (validation.success) {
          setParsedData(validation.data);
          setParseError(null);
        } else {
          console.warn('Schema validation failed:', validation.error);
        }
      } catch (error) {
        // Expected error during streaming - only show if not loading
        if (!isLoading) {
          setParseError('Invalid JSON structure');
        }
      }
    }
  }, [messages, isLoading]);

  // Reset state on new request
  useEffect(() => {
    if (isLoading) {
      setParsedData({});
      setParseError(null);
    }
  }, [isLoading]);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Defensive JSON Streaming</h2>
      
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Enter your request..."
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Streaming...' : 'Send'}
        </button>
      </form>

      {/* Status indicators */}
      <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
        Status: {isLoading ? 'Streaming...' : 'Ready'}
        {parseError && !isLoading && (
          <span style={{ color: 'red', marginLeft: '10px' }}>
            Error: {parseError}
          </span>
        )}
      </div>

      {/* Render partial data safely */}
      {(parsedData.title || parsedData.content || parsedData.items) && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          {parsedData.title && <h3>{parsedData.title}</h3>}
          
          {parsedData.content && <p>{parsedData.content}</p>}
          
          {parsedData.items && parsedData.items.length > 0 && (
            <ul>
              {parsedData.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
          
          {parsedData.status && (
            <small style={{ color: '#666' }}>
              Status: {parsedData.status}
            </small>
          )}
        </div>
      )}

      {/* Show loading placeholders */}
      {isLoading && !parsedData.title && !parsedData.content && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          border: '1px dashed #ccc',
          borderRadius: '4px',
          color: '#999'
        }}>
          <div>Loading title...</div>
          <div>Loading content...</div>
        </div>
      )}
    </div>
  );
}