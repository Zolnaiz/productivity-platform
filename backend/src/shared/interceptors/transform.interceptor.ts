import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { classToPlain } from 'class-transformer';

export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const now = Date.now();
    
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const contentType = response.getHeader?.('content-type');

        if (typeof contentType === 'string' && contentType.toLowerCase().startsWith('text/plain')) {
          return data as Response<T>;
        }

        // Transform data using class-transformer
        const transformedData = data && typeof data === 'object' 
          ? classToPlain(data) 
          : data;

        return {
          success: statusCode >= 200 && statusCode < 300,
          statusCode,
          data: transformedData,
          timestamp: new Date().toISOString(),
          duration: Date.now() - now,
        };
      }),
    );
  }
}
