// src/index.ts

import { UniversalClientConfig, UniversalClientCallOptions, MiddlewareContext, UniversalClientMiddleware, SupportedServerType, UniversalEndpointConfig } from './types';
import { getGrpcClient, callGrpc } from './protocols/grpcClient';
import { callHttp } from './protocols/httpClient';
import { getSocket, callSocket } from './protocols/socketClient';
import * as grpc from '@grpc/grpc-js';

class UniversalClient {
  private middlewares: UniversalClientMiddleware[] = [];

  constructor(private config: UniversalClientConfig) {}

  /**
   * Register a middleware/plugin to modify context before each call.
   */
  use(middleware: UniversalClientMiddleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Executes all registered middlewares sequentially.
   */
  private async runMiddlewares(ctx: MiddlewareContext) {
    for (const mw of this.middlewares) {
      await mw(ctx);
    }
  }

  /**
   * Main method to call a configured endpoint with given data.
   */
  async call<T = any>(
    key: string,
    payload: any,
    options: UniversalClientCallOptions = {}
  ): Promise<T> {
    const endpoint : UniversalEndpointConfig = this.config.endpoints[key];
    if (!endpoint) throw new Error(`No configuration found for endpoint key: "${key}"`);

    // Initialize middleware context
    const ctx: MiddlewareContext = {
      endpointKey: key,
      serverType: endpoint.serverType as SupportedServerType,
      endpoint,
      payload
    };

    await this.runMiddlewares(ctx);

    switch (endpoint.serverType as SupportedServerType) {
      case 'http': {
        const url = endpoint.path
          ? `${endpoint.host.replace(/\/$/, '')}${endpoint.path}`
          : endpoint.host;
        const method = endpoint.methodName || 'POST';
        const headers = ctx.httpOptions?.headers || {};
        return callHttp(url, method, ctx.payload, options.timeoutMs, headers);
      }
      case 'grpc': {
        const address = endpoint.port ? `${endpoint.host}:${endpoint.port}` : endpoint.host;
        const split = (endpoint.serviceName || '').split('.');
        if (split.length < 2) throw new Error('Invalid gRPC serviceName config. Expected "package.Service"');
        const [packageName, serviceName] = [split[0], split[1]];
        if (!endpoint.protoFile) throw new Error('gRPC endpoint missing protoFile');
        const client = getGrpcClient(endpoint.protoFile, packageName, serviceName, address);
        return callGrpc(client, endpoint.methodName!, ctx.payload, options.timeoutMs, ctx.grpcMetadata);
      }
      case 'socket': {
        const url = endpoint.port ? `${endpoint.host}:${endpoint.port}` : endpoint.host;
        const socket = getSocket(url, ctx.socketAuth);
        return callSocket(socket, endpoint.event!, ctx.payload, options.timeoutMs);
      }
      default: {
        throw new Error(`Unsupported protocol: ${endpoint.serverType}`);
      }
    }
  }
}
export { UniversalClient, UniversalClientConfig, UniversalEndpointConfig, UniversalClientCallOptions, MiddlewareContext, UniversalClientMiddleware, SupportedServerType };
export * from './types'; // Re-export types for convenience
export * from './protocols/grpcClient';
export * from './protocols/httpClient';
export * from './protocols/socketClient';