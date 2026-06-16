import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  it('renders Prometheus metrics for recorded HTTP requests', () => {
    const service = new MetricsService();

    service.recordHttpRequest('get', '/api/health', 200, 12);
    service.recordHttpRequest('GET', '/api/health', 200, 8);
    service.recordHttpRequest('post', '/api/tasks', 201, 20);

    const metrics = service.renderPrometheusMetrics();

    expect(metrics).toContain('productivity_platform_uptime_seconds');
    expect(metrics).toContain('productivity_platform_http_requests_total{method="GET",route="/api/health",status_code="200"} 2');
    expect(metrics).toContain('productivity_platform_http_request_duration_ms_total{method="GET",route="/api/health",status_code="200"} 20');
    expect(metrics).toContain('productivity_platform_http_requests_total{method="POST",route="/api/tasks",status_code="201"} 1');
  });
});
