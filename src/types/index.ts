// src/types/index.ts

import * as grpc from '@grpc/grpc-js';

export type SupportedServerType = 'grpc' | 'http' | 'socket';

export interface UniversalEndpointConfig {
  serverType: SupportedServerType;
  
  host: string;         // For HTTP: base URL (e.g. http://localhost:8080)
                        // For gRPC/socket: host or host:port (port can be overridden)
  port?: number;        // Optional, to override/add port for gRPC/socket clients

  /** gRPC specifics */
  serviceName?: string; // e.g. 'user.UserService' (package.Service)
  methodName?: string;  // RPC or HTTP verb (for HTTP fallback)
  protoFile?: string;   // Path to proto for gRPC

  /** HTTP specifics */
  path?: string;        // HTTP relative path if host is base URL (e.g. '/api/signup')

  /** Socket.IO specifics */
  event?: string;       // Event to emit on Socket.IO client
}

export interface UniversalClientConfig {
  endpoints: Record<string, UniversalEndpointConfig>;
}

export interface UniversalClientCallOptions {
  /** Timeout in milliseconds */
  timeoutMs?: number;

  /** Extra metadata */
  meta?: Record<string, string>;
}

export type MiddlewareContext = {
  endpointKey: string;
  serverType: SupportedServerType;
  endpoint: UniversalEndpointConfig;
  payload: any;

  httpOptions?: { headers: Record<string, string> };
  grpcMetadata?: grpc.Metadata;
  socketAuth?: any;
};

export type UniversalClientMiddleware = (ctx: MiddlewareContext) => Promise<void> | void;

export interface UniversalClient {
  call<T = any>(
    endpointKey: string,
    payload?: any,
    options?: UniversalClientCallOptions
  ): Promise<T>;

  use(middleware: UniversalClientMiddleware): void;

  close(): void;
}