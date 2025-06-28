// Simple React component for AI streaming
import React, { useState } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';

// Define response schema
const streamSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(['processing', 'complete']).optional(),
});

export default function SimpleStreamComponent() {
  const [input, setInput] = useState('');
  
  const { object, submit, isLoading, error } = useObject({
    api: 'http://localhost:3001/api/stream',
    schema: streamSchema,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await submit({ input: input.trim() });
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>AI Streaming Example</h2>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your request..."
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? 'Streaming...' : 'Send'}
        </button>
      </form>
      
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          Error: {error.message}
        </div>
      )}
      
      {object && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc' }}>
          {object.title && <h3>{object.title}</h3>}
          {object.content && <p>{object.content}</p>}
          {object.status && (
            <small style={{ color: '#666' }}>Status: {object.status}</small>
          )}
        </div>
      )}
    </div>
  );
}