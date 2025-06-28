// Simple NestJS controller for AI streaming (AI SDK v5)
import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { SimpleStreamService } from './simple-stream.service';

@Controller('api/stream')
export class SimpleStreamController {
  constructor(private readonly streamService: SimpleStreamService) {}

  @Post()
  async stream(@Body() body: { input: string }, @Res() res: Response) {
    const result = await this.streamService.generateStream(body.input);
    
    // Essential streaming headers for v5
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    
    // Use v5 streaming method
    result.pipeTextStreamToResponse(res);
  }
}