import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Productivity Platform API is running!';
  }

  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'productivity-platform',
    };
  }
}