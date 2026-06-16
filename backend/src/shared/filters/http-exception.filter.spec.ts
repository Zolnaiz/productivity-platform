import { ArgumentsHost, BadRequestException, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

const createHost = (headers: Record<string, string> = {}) => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const request = {
    method: 'GET',
    url: '/api/test',
    headers,
  };
  const response = {
    status,
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
};

describe('HttpExceptionFilter', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('preserves HttpException messages for client errors', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = createHost({ 'x-request-id': 'request-1' });

    filter.catch(new BadRequestException('Invalid payload'), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Invalid payload',
        requestId: 'request-1',
      }),
    );
  });

  it('does not leak unexpected error messages to clients', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = createHost({ 'x-request-id': 'request-2' });

    filter.catch(new Error('database password leaked in stack'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
        requestId: 'request-2',
      }),
    );
  });
});
