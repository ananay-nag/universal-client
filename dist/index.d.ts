import * as grpc from '@grpc/grpc-js';
import { Socket } from 'socket.io-client';

type SupportedServerType = 'grpc' | 'http' | 'socket';
interface UniversalEndpointConfig {
    serverType: SupportedServerType;
    host: string;
    port?: number;
    /** gRPC specifics */
    serviceName?: string;
    methodName?: string;
    protoFile?: string;
    /** HTTP specifics */
    path?: string;
    /** Socket.IO specifics */
    event?: string;
}
interface UniversalClientConfig {
    endpoints: Record<string, UniversalEndpointConfig>;
}
interface UniversalClientCallOptions {
    /** Timeout in milliseconds */
    timeoutMs?: number;
    /** Extra metadata */
    meta?: Record<string, string>;
}
type MiddlewareContext = {
    endpointKey: string;
    serverType: SupportedServerType;
    endpoint: UniversalEndpointConfig;
    payload: any;
    httpOptions?: {
        headers: Record<string, string>;
    };
    grpcMetadata?: grpc.Metadata;
    socketAuth?: any;
};
type UniversalClientMiddleware = (ctx: MiddlewareContext) => Promise<void> | void;

/**
 * Returns cached or new gRPC client for given protoFile, service and address.
 */
declare function getGrpcClient(protoFile: string, packageName: string, serviceName: string, address: string): any;
/**
 * Calls a unary gRPC method with optional metadata and deadline.
 */
declare function callGrpc(client: any, methodName: string, params: any, timeoutMs?: number, metadata?: grpc.Metadata): Promise<any>;

declare function callHttp(url: string, method: string, data: any, timeoutMs?: number, headers?: Record<string, string>): Promise<any>;

/**
 * Returns a persistent Socket.IO client for a given server URL.
 * Auth object is passed for handshake authentication.
 */
declare function getSocket(url: string, auth?: any): Socket;
/**
 * Calls a socket.io event and expects callback response.
 */
declare function callSocket(socket: Socket, event: string, payload: any, timeoutMs?: number): Promise<any>;

declare class UniversalClient {
    private config;
    private middlewares;
    constructor(config: UniversalClientConfig);
    /**
     * Register a middleware/plugin to modify context before each call.
     */
    use(middleware: UniversalClientMiddleware): void;
    /**
     * Executes all registered middlewares sequentially.
     */
    private runMiddlewares;
    /**
     * Main method to call a configured endpoint with given data.
     */
    call<T = any>(key: string, payload: any, options?: UniversalClientCallOptions): Promise<T>;
}

export { type MiddlewareContext, type SupportedServerType, UniversalClient, type UniversalClientCallOptions, type UniversalClientConfig, type UniversalClientMiddleware, type UniversalEndpointConfig, callGrpc, callHttp, callSocket, getGrpcClient, getSocket };
