import { NotFoundException } from '@nestjs/common';
import { AppController } from './app.controller';

const createController = (enableMetrics = false) => {
  const appService = {
    getHello: jest.fn(() => 'ok'),
  };
  const metricsService = {
    renderPrometheusMetrics: jest.fn(() => 'metrics 1\n'),
  };
  const configService = {
    get: jest.fn((key: string) => (key === 'ENABLE_METRICS' ? enableMetrics : undefined)),
  };

  return {
    controller: new AppController(appService as any, metricsService as any, configService as any),
    metricsService,
  };
};

describe('AppController metrics', () => {
  it('hides metrics unless explicitly enabled', () => {
    const { controller } = createController(false);

    expect(() => controller.getMetrics()).toThrow(NotFoundException);
  });

  it('renders metrics when enabled', () => {
    const { controller, metricsService } = createController(true);

    expect(controller.getMetrics()).toBe('metrics 1\n');
    expect(metricsService.renderPrometheusMetrics).toHaveBeenCalled();
  });
});
