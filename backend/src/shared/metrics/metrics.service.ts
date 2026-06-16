import { Injectable } from '@nestjs/common';

type RequestMetricKey = `${string}|${string}|${number}`;

interface RequestMetric {
  method: string;
  route: string;
  statusCode: number;
  count: number;
  durationMsTotal: number;
}

const escapeLabel = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');

@Injectable()
export class MetricsService {
  private readonly startedAt = Date.now();
  private readonly requestMetrics = new Map<RequestMetricKey, RequestMetric>();

  recordHttpRequest(method: string, route: string, statusCode: number, durationMs: number) {
    const normalizedMethod = method.toUpperCase();
    const normalizedRoute = route || 'unknown';
    const key: RequestMetricKey = `${normalizedMethod}|${normalizedRoute}|${statusCode}`;
    const existing = this.requestMetrics.get(key);

    if (existing) {
      existing.count += 1;
      existing.durationMsTotal += durationMs;
      return;
    }

    this.requestMetrics.set(key, {
      method: normalizedMethod,
      route: normalizedRoute,
      statusCode,
      count: 1,
      durationMsTotal: durationMs,
    });
  }

  renderPrometheusMetrics() {
    const lines = [
      '# HELP productivity_platform_uptime_seconds Process uptime in seconds.',
      '# TYPE productivity_platform_uptime_seconds gauge',
      `productivity_platform_uptime_seconds ${Math.floor((Date.now() - this.startedAt) / 1000)}`,
      '# HELP productivity_platform_http_requests_total Total HTTP requests by method, route, and status code.',
      '# TYPE productivity_platform_http_requests_total counter',
    ];

    for (const metric of this.requestMetrics.values()) {
      const labels = `method="${escapeLabel(metric.method)}",route="${escapeLabel(metric.route)}",status_code="${metric.statusCode}"`;
      lines.push(`productivity_platform_http_requests_total{${labels}} ${metric.count}`);
    }

    lines.push(
      '# HELP productivity_platform_http_request_duration_ms_total Total HTTP request duration in milliseconds by method, route, and status code.',
      '# TYPE productivity_platform_http_request_duration_ms_total counter',
    );

    for (const metric of this.requestMetrics.values()) {
      const labels = `method="${escapeLabel(metric.method)}",route="${escapeLabel(metric.route)}",status_code="${metric.statusCode}"`;
      lines.push(`productivity_platform_http_request_duration_ms_total{${labels}} ${Math.round(metric.durationMsTotal)}`);
    }

    return `${lines.join('\n')}\n`;
  }
}
