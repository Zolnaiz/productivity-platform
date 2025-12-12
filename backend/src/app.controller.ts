import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('version')
  getVersion() {
    return {
      version: process.env.npm_package_version || '1.0.0',
      name: process.env.npm_package_name || 'productivity-platform',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}