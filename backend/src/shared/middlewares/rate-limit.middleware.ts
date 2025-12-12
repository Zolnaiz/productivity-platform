import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface ClientRequest {
  count: number;
  firstRequestTime: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly clients = new Map<string, ClientRequest>();
  private readonly config: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 минут
    maxRequests: 100, // Хугацаанд хийх дээд хэмжээ
  };

  use(request: Request, response: Response, next: NextFunction): void {
    const clientIp = request.ip || request.connection.remoteAddress || 'unknown';
    const now = Date.now();

    if (!this.clients.has(clientIp)) {
      this.clients.set(clientIp, {
        count: 1,
        firstRequestTime: now,
      });
    } else {
      const client = this.clients.get(clientIp)!;
      
      // Хэрэв хугацаа дууссан бол цэвэрлэх
      if (now - client.firstRequestTime > this.config.windowMs) {
        client.count = 1;
        client.firstRequestTime = now;
      } else {
        client.count++;
      }

      // Хэт их хүсэлт шалгах
      if (client.count > this.config.maxRequests) {
        const retryAfter = Math.ceil((this.config.windowMs - (now - client.firstRequestTime)) / 1000);
        
        response.setHeader('Retry-After', retryAfter);
        throw new HttpException(
          'Хэт олон хүсэлт илгээсэн байна. Дахин оролдохын тулд хүлээнэ үү.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // Холбоо дээр хязгаарын мэдээлэл нэмэх
    response.setHeader('X-RateLimit-Limit', this.config.maxRequests);
    response.setHeader('X-RateLimit-Remaining', this.config.maxRequests - this.clients.get(clientIp)!.count);
    response.setHeader('X-RateLimit-Reset', Math.ceil((this.clients.get(clientIp)!.firstRequestTime + this.config.windowMs) / 1000));

    // Хуучин мэдээллийг цэвэрлэх
    this.cleanup();

    next();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [ip, client] of this.clients.entries()) {
      if (now - client.firstRequestTime > this.config.windowMs * 2) {
        this.clients.delete(ip);
      }
    }
  }
}