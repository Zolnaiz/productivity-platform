import { Controller, Get, Header, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { MetricsService } from './shared/metrics/metrics.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly metricsService: MetricsService,
    private readonly configService: ConfigService,
  ) {}

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

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getMetrics() {
    if (this.configService.get('ENABLE_METRICS') !== true) {
      throw new NotFoundException('Metrics endpoint is disabled');
    }

    return this.metricsService.renderPrometheusMetrics();
  }
}
