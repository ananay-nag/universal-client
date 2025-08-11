import * as grpc from 'grpc-web';
import { Socket } from 'socket.io-client';

declare const packageName = "universal-client";
declare const SupportedServerTypes: {
    readonly GRPC: "grpc";
    readonly HTTP: "http";
    readonly SOCKETIO: "socketio";
    readonly KAFKA: "kafka";
    readonly NATS: "nats";
    readonly AMQP: "amqp";
    readonly MQTT: "mqtt";
    readonly WEBSOCKET: "websocket";
    readonly GRPCWEB: "grpcweb";
};
type SupportedServerType = typeof SupportedServerTypes[keyof typeof SupportedServerTypes];
type KafkaMode = 'producer' | 'consumer';
type NatsMode = 'publish' | 'request' | 'subscribe' | 'unsubscribe';
type allowedSubOptKeys = 'queue' | 'callback' | 'max' | 'timeout';
interface EndpointConfig {
    serverType: SupportedServerType;
    host: string;
    port?: number;
    /** For gRPC */
    serviceName?: string;
    methodName?: string;
    protoFile?: string;
    packageName?: string;
    /**For grpcWeb */
    createClient?: (address: string) => grpc.GrpcWebClientBase;
    /** For HTTP */
    path?: string;
    event?: string;
    eventHandler?: (socket: Socket) => void;
    /** For Kafka, NATS, etc. */
    topic?: string;
    clientId?: string;
    groupId?: string;
    mode?: KafkaMode | NatsMode;
    messageHandler?: (payload: any) => void;
    options?: {
        allowedSubOptKeys?: allowedSubOptKeys[];
        subject?: string;
        timeoutMs?: number;
        allowAutoTopicCreation?: boolean;
        retry?: {
            retries?: number;
            initialRetryTime?: number;
            factor?: number;
            maxRetryTime?: number;
        };
        kafkaOptions?: any;
        [key: string]: any;
    };
    discoveryName?: string;
    pool?: {
        min?: number;
        max?: number;
    };
    customPluginName?: string;
}
interface UniversalClientConfig {
    endpoints: Record<string, EndpointConfig>;
}
interface CallContext {
    endpointKey: string;
    serverType: SupportedServerType;
    endpointDef: EndpointConfig;
    payload: any;
    meta?: Record<string, any>;
    serverTypeCtx?: Record<string, any>;
}
interface ServerTypeClient {
    serverType: SupportedServerType;
    createClient(address: string, options?: any): Promise<any>;
    call(client: any, ctx: CallContext): Promise<any>;
    close?(client?: any): Promise<void>;
}
interface MiddlewarePlugin {
    name: string;
    beforeCall?(ctx: CallContext): Promise<void> | void;
    afterCall?(ctx: CallContext, result: any): Promise<void> | void;
}
interface DiscoveryPlugin {
    name: string;
    resolve(name: string): Promise<{
        addresses: string[];
    }>;
}
interface IPluginManager {
    registerServerTypePlugin(plugin: ServerTypeClient): void;
    registerMiddlewarePlugin(plugin: MiddlewarePlugin): void;
    registerDiscoveryPlugin(plugin: DiscoveryPlugin): void;
    getServerTypePlugin(serverType: SupportedServerType): ServerTypeClient | undefined;
    getMiddlewarePlugins(): MiddlewarePlugin[];
    getDiscoveryPlugins(): DiscoveryPlugin[];
}

declare class UniversalClient {
    private config;
    private pluginManager;
    constructor(config: UniversalClientConfig);
    private registerBuiltInPlugins;
    /**
     * Register a user-defined custom serverType plugin.
     */
    useServerType(serverType: SupportedServerType, plugin: ServerTypeClient): void;
    /**
     * Register user-defined middleware.
     */
    useMiddleware(middleware: MiddlewarePlugin): void;
    /**
     * Main call function. Uses config to resolve which plugin to call.
     * @param endpointKey endpoint key as defined in config
     * @param payload data to send
     * @param options optional call level overrides including timeout
     */
    call<T = any>(endpointKey: string, payload: any, options?: {
        timeoutMs?: number;
        meta?: Record<string, any>;
    }): Promise<T>;
    /**
     * Gracefully close all open clients that support close()
     */
    close(): Promise<void>;
    /**
     * Get a specific client instance for an endpoint.
     * This is useful for direct access to the client without making a call.
     * @param endpointKey {string} - The key for the endpoint in the config.
     * @returns {any} - The client instance for the specified endpoint.
     */
    getClient(endpointKey: string): any;
    /**
     *  Constructs the address string for a given endpoint.
     *  This is used to create a unique identifier for the client cache.
     * @example
     * const address = this.createAddress({
     *   serverType: 'http',
     *   host: 'localhost',
     *   port: 3000,
     * });
     * // address will be 'localhost:3000'
     * @param endPoint {EndpointConfig} - The endpoint configuration object.
     * @returns {string} - The constructed address string.
     */
    private createAddress;
    /**
     *
     * @param endpointKey {SupportedServerType} - The key for the endpoint in the config.
     * @param endpoint {EndpointConfig} - The endpoint configuration object.
     * @returns {string} - The cache address string.
     * @throws {Error} - If the endpointKey or endpoint is invalid.
     */
    private createCacheAddress;
}

declare const staticDiscovery: DiscoveryPlugin;

/**
 * Manages all serverType plugins, discovery, and middleware registrations.
 * This allows the UniversalClient to dynamically use different protocols like gRPC, AMQP, etc.
 * It also supports discovery plugins for dynamic endpoint resolution.
 * Middleware plugins can be used to intercept calls for logging, authentication, etc.
 */
declare class PluginManager {
    private ServerTypeClients;
    private discoveryPlugin?;
    private middlewares;
    /**
     * Registers a serverType plugin.
     * This allows the UniversalClient to use different protocols like gRPC, AMQP,
     * @param serverType {SupportedServerType} - The server type to register the plugin for.
     * @param plugin {ServerTypeClient} - The plugin to register.
     * @throws {Error} - If the server type is already registered.
     */
    useServerType(serverType: SupportedServerType, plugin: ServerTypeClient): void;
    /**
     * Retrieves a serverType plugin by its type.
     * This is used to get the appropriate plugin for making calls to a specific server type.
     * @param serverType {SupportedServerType} - The server type to retrieve the plugin for.
     * @returns {ServerTypeClient | undefined} - The plugin for the specified server type, or undefined if not found.
     * @throws {Error} - If the server type is not registered.
     */
    getServerType(serverType: SupportedServerType): ServerTypeClient | undefined;
    /**
     *
     * @param plugin {DiscoveryPlugin} - The discovery plugin to register.
     * @throws {Error} - If a discovery plugin is already registered.
     */
    useDiscovery(plugin: DiscoveryPlugin): void;
    /**
     *
     * @returns {DiscoveryPlugin | undefined} - The registered discovery plugin, or undefined if not registered.
     * @throws {Error} - If no discovery plugin is registered.
     */
    getDiscovery(): DiscoveryPlugin | undefined;
    /**
     *
     * @param plugin {MiddlewarePlugin} - The middleware plugin to register.
     * @throws {Error} - If a middleware plugin is already registered.
     */
    useMiddleware(plugin: MiddlewarePlugin): void;
    /**
     * Retrieves all registered middleware plugins.
     * This is used to apply middleware logic before and after calls.
     * @example
     * const middlewares = pluginManager.getMiddlewares();
     * middlewares.forEach(middleware => {
     *   // Apply middleware logic
     * });
     * @returns {MiddlewarePlugin[]} - An array of registered middleware plugins.
     */
    getMiddlewares(): MiddlewarePlugin[];
}

declare function AuthJwtPlugin(getToken: () => string): MiddlewarePlugin;

export { AuthJwtPlugin, type CallContext, type DiscoveryPlugin, type EndpointConfig, type IPluginManager, type MiddlewarePlugin, PluginManager, type ServerTypeClient, type SupportedServerType, SupportedServerTypes, UniversalClient, type UniversalClientConfig, packageName, staticDiscovery };
